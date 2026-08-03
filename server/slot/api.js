'use strict';

// ---------------------------------------------------------------------------
// HTTP API for QUANTUM SPIN.
//
// Spins are discrete request/response transactions, so — per the brief — they
// travel over HTTP, not websockets. (Websockets are reserved for pushing the
// live progressive-jackpot ticker to every client; see server.js.) Every
// endpoint is server-authoritative: the client sends intent (a stake, a seed
// choice) and receives a fully-resolved, provably-fair result.
//
// Mounted from server.js BEFORE Next.js gets the request. Returns true when it
// handled the request so the custom server can stop.
//
//   POST /api/slot/session      { rtp?, layout? }            → create session
//   GET  /api/slot/state?sid=   →                             session snapshot
//   POST /api/slot/spin         { sid, lineBet, turbo? }     → resolved spin
//   POST /api/slot/buy-feature  { sid, lineBet }             → enter free spins
//   POST /api/slot/client-seed  { sid, clientSeed }          → set client seed
//   POST /api/slot/rotate-seed  { sid, clientSeed? }         → reveal + rotate
//   GET  /api/slot/verify?sid=&serverSeed=&clientSeed=&nonce= → recompute round
//   GET  /api/slot/jackpots     →                             live pool snapshot
// ---------------------------------------------------------------------------

const { URL } = require('url');
const { createSession, getSession } = require('./session');
const { pools } = require('./pools');

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) req.destroy(); // basic body-size guard
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Returns true if the request was a slot API call (and was handled).
async function handleSlotApi(req, res) {
  if (!req.url || !req.url.startsWith('/api/slot/')) return false;
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace('/api/slot/', '');

  try {
    if (req.method === 'POST' && path === 'session') {
      const body = await readJson(req);
      const s = createSession({
        rtp: sanitizeBand(body.rtp),
        layout: sanitizeLayout(body.layout),
      });
      return send(res, 200, { ok: true, state: s.publicState() });
    }

    if (req.method === 'GET' && path === 'state') {
      const s = requireSession(url, res);
      if (!s) return true;
      return send(res, 200, { ok: true, state: s.publicState() });
    }

    if (req.method === 'GET' && path === 'jackpots') {
      return send(res, 200, { ok: true, jackpots: pools.snapshot() });
    }

    if (req.method === 'POST' && path === 'spin') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const out = s.spin(Number(body.lineBet), !!body.turbo);
      return send(res, 200, { ok: true, ...out });
    }

    if (req.method === 'POST' && path === 'buy-feature') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const out = s.buyFeature(Number(body.lineBet));
      return send(res, 200, { ok: true, ...out });
    }

    if (req.method === 'POST' && path === 'credit') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const out = s.credit(body.amount ?? 1000);
      return send(res, 200, { ok: true, ...out, state: s.publicState() });
    }

    if (req.method === 'POST' && path === 'daily') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const out = s.claimDaily();
      return send(res, 200, { ok: true, ...out, state: s.publicState() });
    }

    if (req.method === 'POST' && path === 'client-seed') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const clientSeed = s.setClientSeed(body.clientSeed);
      return send(res, 200, { ok: true, clientSeed, state: s.publicState() });
    }

    if (req.method === 'POST' && path === 'rotate-seed') {
      const body = await readJson(req);
      const s = getSession(body.sid);
      if (!s) return send(res, 404, { ok: false, error: 'NO_SESSION' });
      const out = s.rotateSeed(body.clientSeed);
      return send(res, 200, { ok: true, ...out, state: s.publicState() });
    }

    if (req.method === 'GET' && path === 'verify') {
      const s = requireSession(url, res);
      if (!s) return true;
      const serverSeed = url.searchParams.get('serverSeed') || '';
      const clientSeed = url.searchParams.get('clientSeed') || '';
      const nonce = parseInt(url.searchParams.get('nonce') || '0', 10);
      const expectedHash = url.searchParams.get('hash') || '';
      const lineBet = parseFloat(url.searchParams.get('lineBet') || '0.1');
      const isFree = url.searchParams.get('isFree') === '1';
      const out = s.verify(serverSeed, clientSeed, nonce, expectedHash, lineBet, isFree);
      return send(res, 200, { ok: true, ...out });
    }

    return send(res, 404, { ok: false, error: 'UNKNOWN_ENDPOINT' });
  } catch (err) {
    const code = err && err.code ? err.code : 'SERVER_ERROR';
    const status = code === 'INSUFFICIENT_FUNDS' || code === 'FEATURE_ACTIVE' ? 400 : 500;
    return send(res, status, { ok: false, error: code });
  }
}

function requireSession(url, res) {
  const sid = url.searchParams.get('sid');
  const s = getSession(sid);
  if (!s) {
    send(res, 404, { ok: false, error: 'NO_SESSION' });
    return null;
  }
  return s;
}

function sanitizeBand(b) {
  return ['92', '94', '96', '97'].includes(String(b)) ? String(b) : '96';
}
function sanitizeLayout(l) {
  return ['5x3', '5x4', '6x5'].includes(String(l)) ? String(l) : '5x3';
}

module.exports = { handleSlotApi };
