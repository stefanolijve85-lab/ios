import { Router } from 'express';
import { getStore } from '../db/index.js';
import { getConfig } from '../game/config.js';
import { computeRound, deriveBreakProbabilities, sha256, resolveStep, type Side } from '../game/provablyFair.js';

export const socialRouter = Router();

/** Leaderboards & recent activity (public). */
socialRouter.get('/leaderboards', async (_req, res) => {
  const store = getStore();
  const [topWins, topMultipliers, recent] = await Promise.all([
    store.topWinsToday(10),
    store.topMultipliersToday(10),
    store.recentRounds(15),
  ]);
  res.json({
    topWins: topWins.map(slim),
    topMultipliers: topMultipliers.map(slim),
    recent: recent.map(slim),
  });
});

function slim(r: any) {
  return {
    username: r.username,
    bet: r.bet,
    multiplier: r.multiplier,
    payout: r.payout,
    status: r.status,
    createdAt: r.createdAt,
  };
}

/**
 * Provably-fair verification endpoint. Given a completed round's id (or raw
 * seeds), recompute the entire layout server-side so the player can compare.
 * The same computation also runs in the browser — this endpoint is a
 * convenience/cross-check, not a trust anchor.
 */
socialRouter.get('/verify/:roundId', async (req, res) => {
  const store = getStore();
  const round = await store.getRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: 'Round not found' });
  const cfg = getConfig();
  const layout = computeRound(round.serverSeed, round.clientSeed, round.nonce, {
    multipliers: cfg.multipliers,
    houseEdge: cfg.houseEdge,
  });
  res.json({
    round: {
      id: round.id,
      bet: round.bet,
      multiplier: round.multiplier,
      payout: round.payout,
      status: round.status,
      rowsCleared: round.rowsCleared,
    },
    proof: {
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      hashMatches: sha256(round.serverSeed) === round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    },
    layout,
  });
});

/**
 * Stateless verifier: recompute a layout from raw inputs. Lets a player verify
 * with seeds copied from anywhere, not just rounds stored on this server.
 */
socialRouter.post('/verify', (req, res) => {
  const { serverSeed, clientSeed, nonce, multipliers, houseEdge } = req.body ?? {};
  if (typeof serverSeed !== 'string' || typeof clientSeed !== 'string' || !Number.isInteger(nonce)) {
    return res.status(400).json({ error: 'serverSeed, clientSeed and integer nonce are required' });
  }
  const cfg = getConfig();
  const mults = Array.isArray(multipliers) && multipliers.length ? multipliers : cfg.multipliers;
  const edge = typeof houseEdge === 'number' ? houseEdge : cfg.houseEdge;
  const layout = computeRound(serverSeed, clientSeed, nonce, { multipliers: mults, houseEdge: edge });
  res.json({
    serverSeedHash: sha256(serverSeed),
    breakProbabilities: deriveBreakProbabilities(mults, edge),
    layout,
  });
});

/** Simulate one round's outcome for a given list of picks (verification aid). */
socialRouter.post('/simulate', (req, res) => {
  const { serverSeed, clientSeed, nonce, picks } = req.body ?? {};
  if (typeof serverSeed !== 'string' || typeof clientSeed !== 'string' || !Number.isInteger(nonce) || !Array.isArray(picks)) {
    return res.status(400).json({ error: 'serverSeed, clientSeed, nonce and picks[] are required' });
  }
  const cfg = getConfig();
  const layout = computeRound(serverSeed, clientSeed, nonce, { multipliers: cfg.multipliers, houseEdge: cfg.houseEdge });
  let alive = true;
  let cleared = 0;
  for (let i = 0; i < picks.length && i < layout.length && alive; i++) {
    const safe = resolveStep(layout[i], picks[i] as Side).safe;
    if (safe) cleared += 1;
    else alive = false;
  }
  res.json({ alive, rowsCleared: cleared, multiplier: cleared ? cfg.multipliers[cleared - 1] : 0 });
});
