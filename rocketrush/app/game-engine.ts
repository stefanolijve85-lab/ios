// @ts-nocheck
/* Liftoff X game engine.
   - NET mode: connects to the authoritative game server (server/game-server.mjs)
     so all players share one round clock. The server owns crash points + balances.
   - LOCAL mode: if the server can't be reached (offline / file://), it runs the
     same loop as a client-side simulation so the game is ALWAYS playable.
   Client-side only: call startGame() inside a useEffect. Returns a teardown fn. */
import { io } from 'socket.io-client';
import { supabase, ACCOUNTS_ENABLED } from './lib/supabase';

export function startGame(): () => void {
  'use strict';
  let ENGINE_ALIVE = true;
  const _ints: number[] = [];
  const _int = (f: any, m: number) => { const id = window.setInterval(f, m); _ints.push(id); return id; };
  const NET = { sock: null, port: 3001, token: null, connected: false };
  let authMode = 'login';   // account modal: 'login' | 'register'

/* ============================================================
   Liftoff X — single-file playable demo
   Game loop, provably-fair engine, simulated multiplayer.
   In production: this client-side loop is driven by the
   NestJS game server over Socket.io (see /docs).
   ============================================================ */



/* ---------- tiny helpers ---------- */
const $ = id => document.getElementById(id);
const rnd = (a,b) => a + Math.random()*(b-a);
const fmt = n => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

/* ============================================================
   PROVABLY FAIR ENGINE (Web Crypto, identical to server)
   crash = floor( (100*E - h) / (E - h) ) / 100, capped.
   We derive h from HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`).
   2% house edge implemented via the instant-crash probability.
   ============================================================ */
const HOUSE_EDGE = 0.02;
const enc = new TextEncoder();

/* ---- crypto.subtle is ONLY available on https or localhost. On an iPhone
   hitting http://192.168.x.x:3000 over the LAN it is undefined, so we ship a
   tiny pure-JS SHA-256 + HMAC fallback. Output is byte-identical to WebCrypto
   and to node's crypto, so provably-fair verification still passes. ---- */
const _K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
const _rotr = (n,x) => (x>>>n)|(x<<(32-n));
function _sha256bytes(bytes){
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  const l=bytes.length, msg=bytes.slice(); msg.push(0x80);
  while(msg.length%64!==56) msg.push(0);
  const bits=l*8;
  for(let i=7;i>=0;i--) msg.push((Math.floor(bits/Math.pow(2,8*i)))&0xff);
  const w=new Array(64);
  for(let i=0;i<msg.length;i+=64){
    for(let t=0;t<16;t++) w[t]=((msg[i+4*t]<<24)|(msg[i+4*t+1]<<16)|(msg[i+4*t+2]<<8)|msg[i+4*t+3])|0;
    for(let t=16;t<64;t++){
      const s0=_rotr(7,w[t-15])^_rotr(18,w[t-15])^(w[t-15]>>>3);
      const s1=_rotr(17,w[t-2])^_rotr(19,w[t-2])^(w[t-2]>>>10);
      w[t]=(w[t-16]+s0+w[t-7]+s1)|0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for(let t=0;t<64;t++){
      const S1=_rotr(6,e)^_rotr(11,e)^_rotr(25,e);
      const ch=(e&f)^((~e)&g);
      const t1=(h+S1+ch+_K[t]+w[t])|0;
      const S0=_rotr(2,a)^_rotr(13,a)^_rotr(22,a);
      const maj=(a&b)^(a&c)^(b&c);
      const t2=(S0+maj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+h)|0;
  }
  const hx=x=>((x>>>0).toString(16).padStart(8,'0'));
  return hx(h0)+hx(h1)+hx(h2)+hx(h3)+hx(h4)+hx(h5)+hx(h6)+hx(h7);
}
const _hexToBytes = hex => { const o=[]; for(let i=0;i<hex.length;i+=2) o.push(parseInt(hex.substr(i,2),16)); return o; };
function _jsSha256Hex(str){ return _sha256bytes(Array.from(enc.encode(str))); }
function _jsHmacHex(keyStr,msgStr){
  let key=Array.from(enc.encode(keyStr));
  if(key.length>64) key=_hexToBytes(_sha256bytes(key));
  const k=new Array(64).fill(0); for(let i=0;i<key.length;i++) k[i]=key[i];
  const ipad=k.map(b=>b^0x36), opad=k.map(b=>b^0x5c);
  const inner=_sha256bytes(ipad.concat(Array.from(enc.encode(msgStr))));
  return _sha256bytes(opad.concat(_hexToBytes(inner)));
}
const HAS_SUBTLE = typeof crypto !== 'undefined' && !!(crypto.subtle);

async function sha256Hex(str){
  if(HAS_SUBTLE){
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  return _jsSha256Hex(str);
}
async function hmacHex(key, msg){
  if(HAS_SUBTLE){
    const k = await crypto.subtle.importKey('raw', enc.encode(key), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
    return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  return _jsHmacHex(key, msg);
}
function randSeed(){
  const a = new Uint8Array(16);
  if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a);
  else for(let i=0;i<16;i++) a[i]=Math.floor(Math.random()*256);
  return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Deterministic crash point from an HMAC hex digest.
function crashFromHmac(hex, cap){
  // Instant-crash slice => the house edge.
  const hInt = parseInt(hex.slice(0,8),16);
  if (hInt % Math.round(1/HOUSE_EDGE) === 0) return 1.00;
  // Uniform 52-bit float in [0,1)
  const h = parseInt(hex.slice(0,13),16);
  const e = Math.pow(2,52);
  let result = Math.max(1.00, Math.floor((100*e - h) / (e - h)) / 100);
  const c = cap==null ? (S.maxMult||0) : cap;        // operator max-win cap (0 = uncapped)
  if(c && c>1 && result>c) result = c;               // applied AFTER the fair value → still verifies
  return result;
}

/* ============================================================
   STATE
   ============================================================ */
const S = {
  balance: 1000.00,
  slots: [   // two independent bets per round (Aviator-style)
    { bet:1, auto:0, placed:false, amount:0, cashedOut:false, won:0, queued:false, curBet:null },
    { bet:1, auto:0, placed:false, amount:0, cashedOut:false, won:0, queued:false, curBet:null },
  ],
  mode: 'local',        // 'local' (simulation) | 'net' (authoritative server)
  rounds: [],           // recent completed rounds {nonce,crash,serverSeed,clientSeed,hmac}
  myBets: [],           // player outcomes {nonce,amount,won,mult,payout,profit}
  stats: { played:0, wins:0, wagered:0, returned:0, best:0, bestWin:0, streak:0, bestStreak:0 },
  account: null,        // {id,email,username} when logged in, else null (guest)
  transactions: [],     // demo-wallet transactions {type,amount,balanceAfter,ts}
  selfPid: null,        // this player's public profile id
  leaderboard: { winToday:[], multToday:[], winAll:[], multAll:[] },
  lbWhen: 'today',      // leaderboard tab
  phase: 'idle',        // betting | running | crashed
  mult: 1.00,
  crashAt: 0,
  startTs: 0,
  roundStart: 0,
  nonce: 1,
  serverSeed: randSeed(),
  serverSeedHash: '',
  clientSeed: randSeed().slice(0,12),
  prevServerSeed: '—',
  lastRound: null,      // {nonce, serverSeed, clientSeed, hmac, crash}
  history: [],
  sound: true,
  maxMult: 0,           // operator max-win cap (0 = uncapped); server sends the active value
  entered: false,       // gate: no game audio until the user taps LET'S GO at a fresh round boundary
  vol: { music:0.7, fx:0.85, voice:0.95 },   // per-bus mix (Music / FX / Sounds sliders)
  voicedNonce: -1,      // last round whose countdown audio we played (no replays on reconnect)
  cdAudio: null,        // current countdown clip node (so we can stop it)
  lowBw: false,
  bots: [],
  lang: 'en',
};

/* i18n — minimal, enough to prove localization is wired */
const I18N = {
  en:{place:'PLACE BET',cashout:'CASH OUT',waiting:'WAITING…',cancel:'CANCEL',queued:'BET QUEUED',crashed:'CRASHED',flew:'FLEW AWAY',launching:'LAUNCHING',rising:'RISING'},
  nl:{place:'INZET PLAATSEN',cashout:'UITBETALEN',waiting:'WACHTEN…',cancel:'ANNULEER',queued:'INZET IN WACHTRIJ',crashed:'GECRASHT',flew:'WEGGEVLOGEN',launching:'LANCEREN',rising:'STIJGT'},
  de:{place:'EINSATZ',cashout:'AUSZAHLEN',waiting:'WARTEN…',cancel:'ABBRECHEN',queued:'EINSATZ IN WARTESCHLANGE',crashed:'ABGESTÜRZT',flew:'WEGGEFLOGEN',launching:'START',rising:'STEIGT'},
  es:{place:'APOSTAR',cashout:'RETIRAR',waiting:'ESPERANDO…',cancel:'CANCELAR',queued:'APUESTA EN COLA',crashed:'EXPLOTÓ',flew:'VOLÓ',launching:'DESPEGUE',rising:'SUBIENDO'},
  pt:{place:'APOSTAR',cashout:'SACAR',waiting:'AGUARDANDO…',cancel:'CANCELAR',queued:'APOSTA NA FILA',crashed:'EXPLODIU',flew:'VOOU',launching:'LANÇANDO',rising:'SUBINDO'},
  tr:{place:'BAHİS YAP',cashout:'PARA ÇEK',waiting:'BEKLENİYOR…',cancel:'İPTAL',queued:'BAHİS SIRADA',crashed:'PATLADI',flew:'UÇTU',launching:'KALKIŞ',rising:'YÜKSELİYOR'},
};
const T = k => (I18N[S.lang]||I18N.en)[k] || I18N.en[k];

/* ============================================================
   SOUND (WebAudio, no assets)
   ============================================================ */
let actx;
function ac(){ try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); if(actx.state!=='running' && actx.resume) actx.resume(); return actx; }catch(e){ return null; } }
// Three mix buses so the player can balance the sound from Settings:
//   voice = the spoken/radio countdown  ·  music = the continuous flight bed
//   (thrust alarm + engine rumble)  ·  fx ("Soundeffects") = the punchy
//   one-shots (crash, cash-out, bet).
// Every sound routes through its bus → the slider sets that bus's gain live.
let _bus=null;
function buses(){
  const a=ac(); if(!a) return null;
  if(_bus && _bus.a===a) return _bus;
  const mk=()=>{ const g=a.createGain(); g.connect(a.destination); return g; };
  _bus={ a, music:mk(), fx:mk(), voice:mk() };
  applyVolumes();
  return _bus;
}
function busFor(cat){ const b=buses(); if(!b) return null; return b[cat]||b.fx; }
function applyVolumes(){
  if(!_bus) return; const v=S.vol||{}, on=S.sound?1:0;
  try{
    _bus.music.gain.value = on*(v.music==null?0.7:v.music);
    _bus.fx.gain.value    = on*(v.fx==null?0.85:v.fx);
    _bus.voice.gain.value = on*(v.voice==null?0.95:v.voice);
  }catch(e){}
}
function beep(freq, dur, type='sine', vol=.08, cat='fx'){
  if(!S.sound||!S.entered) return;
  try{
    const a=ac(); if(!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type=type; o.frequency.value=freq; o.connect(g); g.connect(busFor(cat)||a.destination);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime+dur);
    o.start(); o.stop(a.currentTime+dur);
  }catch(e){}
}
function noiseBuffer(a, dur, shape){
  const n=Math.floor(a.sampleRate*dur), buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++){ d[i]=(Math.random()*2-1)*(shape?shape(i/n):1); }
  return buf;
}
/* ---- optional real audio assets: drop files in public/sounds/ and they're used
   automatically; otherwise we fall back to synth + speech (see public/sounds/README). ---- */
const SND = { explosion:'/sounds/explosion.mp3', engine:'/sounds/engine.mp3',
  thrust:'/sounds/thrust.mp3',                 // thrust-alarm bed, plays every flight
  music:'/sounds/music.mp3',                   // optional looping background music (Music bus)
  jackpot:'/sounds/jackpot.mp3',               // optional big-win celebration clip (> €100k)
  bigwin:'/sounds/bigwin.mp3',                  // optional spoken "Master Multiplier" cheer
  countdown:'/sounds/countdown.mp3',           // one clip: "3, 2, 1, liftoff"
  '3':'/sounds/3.mp3', '2':'/sounds/2.mp3', '1':'/sounds/1.mp3',   // OR per-number clips
  liftoff:'/sounds/liftoff.mp3', cash:'/sounds/cashout.mp3' };
const _buf = {};
// per-file gains so all three sounds play at the SAME loudness (RMS-matched:
// countdown 0.25, engine 0.25, explosion 0.40 → target ≈ 0.14 RMS).
const VOL = { countdown:0.56, engine:0.56, explosion:0.35, thrust:0.8 };
async function loadSounds(){
  const a=ac(); if(!a) return;
  await Promise.all(Object.entries(SND).map(async ([k,url])=>{
    try{ const r=await fetch(url); if(!r.ok) return; const ab=await r.arrayBuffer(); _buf[k]=await a.decodeAudioData(ab); }catch(e){}
  }));
}
function hasSnd(k){ return !!_buf[k]; }
function playSnd(k, opt){
  if(!S.sound||!S.entered) return null; opt=opt||{};
  try{ const a=ac(), b=_buf[k]; if(!a||!b) return null; const src=a.createBufferSource(); src.buffer=b; src.loop=!!opt.loop; const g=a.createGain(); g.gain.value=opt.vol==null?1:opt.vol; src.connect(g); g.connect(busFor(opt.cat||'fx')||a.destination); src.start(); return {src,g,a}; }catch(e){ return null; }
}
// NASA mission-control radio treatment over the spoken countdown: a Quindar intro
// beep, a low static/comms hiss bed, and a band-passed + slightly distorted parallel
// copy of the voice for that "over the radio" texture. Returns {src} so it can be
// stopped exactly like a normal clip (killCdClip / stopCountdownAudio).
function _radioCurve(){ const n=1024, c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i/n*2-1; c[i]=Math.tanh(x*2.4); } return c; }
function _quindar(a, when, vol){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=2525; g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when+0.012); g.gain.setValueAtTime(vol, when+0.15); g.gain.exponentialRampToValueAtTime(0.0001, when+0.20); o.connect(g); g.connect(busFor('voice')||a.destination); o.start(when); o.stop(when+0.22); }
function playCountdownRadio(){
  if(!S.sound||!S.entered) return null;
  try{
    const a=ac(), b=_buf['countdown']; if(!a||!b) return playSnd('countdown',{vol:VOL.countdown});
    const t=a.currentTime, dur=Math.min(b.duration, 6.0);
    const out=a.createGain(); out.gain.value=VOL.countdown; out.connect(busFor('voice')||a.destination);
    // voice: mostly clear (dry) + a parallel radio-EQ'd, slightly gritty copy
    const src=a.createBufferSource(); src.buffer=b;
    const dry=a.createGain(); dry.gain.value=0.85; src.connect(dry); dry.connect(out);
    const hp=a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=520;
    const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1700; bp.Q.value=0.9;
    const ws=a.createWaveShaper(); ws.curve=_radioCurve();
    const wet=a.createGain(); wet.gain.value=0.5;
    src.connect(hp); hp.connect(bp); bp.connect(ws); ws.connect(wet); wet.connect(out);
    src.start();
    // static/comms hiss bed under the voice (fades in/out)
    const noise=a.createBufferSource(); noise.buffer=noiseBuffer(a, dur);
    const nbp=a.createBiquadFilter(); nbp.type='bandpass'; nbp.frequency.value=2400; nbp.Q.value=0.5;
    const ng=a.createGain();
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.045, t+0.12);
    ng.gain.setValueAtTime(0.045, t+dur-0.35); ng.gain.linearRampToValueAtTime(0.0001, t+dur);
    noise.connect(nbp); nbp.connect(ng); ng.connect(busFor('voice')||a.destination); noise.start();
    // Quindar beeps: one to "open the channel" at the start, one just before liftoff
    // (placed relative to the clip length so it works for both the 3-2-1 and 5-4-3-2-1 clips)
    _quindar(a, t+0.02, 0.10);
    _quindar(a, t+Math.max(0.5, dur-1.15), 0.10);
    return { src, g: out, a };
  }catch(e){ return playSnd('countdown',{vol:VOL.countdown}); }
}
// pick a real ENGLISH voice (the device default may be your phone's language, e.g. Dutch)
let enVoice=null;
function pickVoice(){ try{ const vs=(window.speechSynthesis&&window.speechSynthesis.getVoices())||[]; enVoice = vs.find(v=>/en[-_]US/i.test(v.lang)) || vs.find(v=>/^en([-_]|$)/i.test(v.lang)) || null; }catch(e){} }
try{ if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged=pickVoice; pickVoice(); }catch(e){}
// realistic "blew up" boom: sharp transient + filtered noise tail + sub-bass drop
function explosion(){
  if(!S.sound||!S.entered) return;
  if(hasSnd('explosion')){ playSnd('explosion',{vol:VOL.explosion,cat:'fx'}); return; }   // prefer real audio if provided
  try{
    const a=ac(); if(!a) return; const t=a.currentTime; const dest=busFor('fx')||a.destination;
    const dur=0.95;
    const src=a.createBufferSource(); src.buffer=noiseBuffer(a,dur,x=>Math.pow(1-x,1.7));
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(2600,t); lp.frequency.exponentialRampToValueAtTime(80,t+dur);
    const g=a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.9,t+0.015); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.connect(lp); lp.connect(g); g.connect(dest); src.start();
    // sub-bass drop (the chest-thump)
    const o=a.createOscillator(), og=a.createGain(); o.type='sine';
    o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(32,t+0.55);
    og.gain.setValueAtTime(0.6,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.65);
    o.connect(og); og.connect(dest); o.start(); o.stop(t+0.7);
    // crackle
    const c=a.createBufferSource(); c.buffer=noiseBuffer(a,0.25,x=>Math.pow(1-x,3)*(Math.random()<.3?1:0));
    const cg=a.createGain(); cg.gain.value=0.35; c.connect(cg); cg.connect(dest); c.start(t+0.04);
  }catch(e){ beep(110,.4,'sawtooth',.12); }
}
// looping rocket-engine rumble while in flight
let engineNodes=null;
function startEngine(){
  if(!S.sound||!S.entered) return; stopEngine();
  // quiet + STATIC: loop only the steady tail of the engine clip (skip the
  // build-up) so the sound never changes during a round and can't leak timing.
  if(hasSnd('engine')){
    try{
      const a=ac(), b=_buf['engine']; if(!a||!b) throw 0;
      const L=Math.min(4, b.duration*0.35), R=Math.max(L+1, b.duration-0.8);
      const src=a.createBufferSource(); src.buffer=b; src.loop=true; src.loopStart=L; src.loopEnd=R;
      const g=a.createGain(); g.gain.value=0.0001; g.gain.setTargetAtTime(VOL.engine, a.currentTime, 0.12);
      src.connect(g); g.connect(busFor('music')||a.destination); src.start(0, L);
      engineNodes={src,g,a}; return;
    }catch(e){}
  }
  try{ // synth fallback: constant low rumble
    const a=ac(); if(!a) return;
    const src=a.createBufferSource(); src.buffer=noiseBuffer(a,1.2); src.loop=true;
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=300;
    const g=a.createGain(); g.gain.value=0.045;
    src.connect(lp); lp.connect(g); g.connect(busFor('music')||a.destination); src.start();
    engineNodes={src,g,a};
  }catch(e){}
}
function stopEngine(){
  if(!engineNodes) return;
  try{ const {src,g,a}=engineNodes; g.gain.setTargetAtTime(0,a.currentTime,0.05); setTimeout(()=>{ try{src.stop();}catch(e){} },220); }catch(e){}
  engineNodes=null;
}
// thrust-alarm bed: plays on every launch and loops through the flight. It's the
// continuous flight "soundtrack", so it rides the MUSIC bus (alongside the engine
// rumble); the Soundeffects bus is the punchy one-shots (crash/cash-out/bet).
let thrustNodes=null;
function startThrust(){
  if(!S.sound||!S.entered || !hasSnd('thrust')) return; stopThrust();
  try{
    const a=ac(), b=_buf['thrust']; if(!a||!b) return;
    const src=a.createBufferSource(); src.buffer=b; src.loop=true;
    const g=a.createGain(); g.gain.value=0.0001; g.gain.setTargetAtTime(VOL.thrust, a.currentTime, 0.08);
    src.connect(g); g.connect(busFor('music')||a.destination); src.start();
    thrustNodes={src,g,a};
  }catch(e){}
}
function stopThrust(){
  if(!thrustNodes) return;
  try{ const {src,g,a}=thrustNodes; g.gain.setTargetAtTime(0,a.currentTime,0.06); setTimeout(()=>{ try{src.stop();}catch(e){} },260); }catch(e){}
  thrustNodes=null;
}
// optional looping background music (drop /sounds/music.mp3) — plays through the flight
// on the Music bus, stopped at crash.
let musicNodes=null;
function startMusic(){
  if(!S.sound||!S.entered || !hasSnd('music')) return; stopMusic();
  try{
    const a=ac(), b=_buf['music']; if(!a||!b) return;
    const src=a.createBufferSource(); src.buffer=b; src.loop=true;
    const g=a.createGain(); g.gain.value=0.0001; g.gain.setTargetAtTime(0.6, a.currentTime, 0.1);
    src.connect(g); g.connect(busFor('music')||a.destination); src.start();
    musicNodes={src,g,a};
  }catch(e){}
}
function stopMusic(){
  if(!musicNodes) return;
  try{ const {src,g,a}=musicNodes; g.gain.setTargetAtTime(0,a.currentTime,0.08); setTimeout(()=>{ try{src.stop();}catch(e){} },320); }catch(e){}
  musicNodes=null;
}
// spoken countdown ("3, 2, 1, Liftoff!")
function say(text){
  if(!S.sound||!S.entered) return;
  try{
    const sy=window.speechSynthesis; if(!sy) return;
    const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; if(enVoice) u.voice=enVoice; u.rate=1.0; u.pitch=1; u.volume=Math.max(0,Math.min(1,(S.vol&&S.vol.voice!=null)?S.vol.voice:0.95));
    sy.cancel(); sy.speak(u);
  }catch(e){}
}
const sfx = {
  tick:  ()=>beep(880,.05,'square',.03),
  bet:   ()=>beep(440,.12,'triangle',.07),
  cash:  ()=>{ if(hasSnd('cash')){ playSnd('cash'); return; } beep(660,.1,'sine',.09); setTimeout(()=>beep(990,.18,'sine',.09),90); },
  crash: ()=>explosion(),
  launch:()=>{
    if(hasSnd('liftoff')) playSnd('liftoff');                          // separate liftoff clip
    else if(!hasSnd('countdown')) { beep(140,.6,'sawtooth',.09); say('Liftoff!'); }  // combined clip already says it
    startEngine(); startThrust(); startMusic();
  },
  count: (n)=>{
    if(hasSnd('countdown')){ if(n===3) playSnd('countdown'); return; }  // one combined clip, fired at "3"
    if(hasSnd(String(n))){ playSnd(String(n),{cat:'voice'}); return; }   // per-number clips
    beep(520+(3-n)*120,.16,'square',.07,'voice'); say(String(n));       // synth + English TTS
  },
  jackpot: ()=>jackpotSound(),   // big-win celebration: triumphant chord + cheer + siren
};
// big-win celebration sound (synth): an ascending fanfare chord, an applause/cheer
// noise bed, a short two-tone siren sweep, and a spoken cheer. Routed to the FX bus.
function jackpotSound(){
  if(!S.sound||!S.entered) return;
  // celebration sting (real clip preferred, else synth fanfare + applause + siren)
  if(hasSnd('jackpot')){ playSnd('jackpot',{cat:'fx',vol:0.9}); }
  else try{
    const a=ac(); if(a){ const t=a.currentTime, dest=busFor('fx')||a.destination;
      // 1) triumphant ascending arpeggio (C E G C')
      [523.25,659.25,783.99,1046.5].forEach((fr,i)=>{
        const o=a.createOscillator(), g=a.createGain(); o.type='triangle'; o.frequency.value=fr;
        const ts=t+i*0.10; g.gain.setValueAtTime(0.0001,ts); g.gain.exponentialRampToValueAtTime(0.18,ts+0.03); g.gain.exponentialRampToValueAtTime(0.0001,ts+0.55);
        o.connect(g); g.connect(dest); o.start(ts); o.stop(ts+0.6);
      });
      // 2) applause / cheer bed — filtered noise with a few swelling bumps
      const noise=a.createBufferSource(); noise.buffer=noiseBuffer(a,1.8,x=>1);
      const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1500; bp.Q.value=0.6;
      const ng=a.createGain(); ng.gain.setValueAtTime(0.0001,t);
      for(let k=0;k<6;k++){ const tk=t+0.15+k*0.26; ng.gain.linearRampToValueAtTime(0.05+Math.random()*0.03,tk); ng.gain.linearRampToValueAtTime(0.025,tk+0.13); }
      ng.gain.linearRampToValueAtTime(0.0001,t+1.8);
      noise.connect(bp); bp.connect(ng); ng.connect(dest); noise.start();
      // 3) short two-tone celebration siren
      const so=a.createOscillator(), sg=a.createGain(); so.type='sine';
      so.frequency.setValueAtTime(740,t); so.frequency.setValueAtTime(980,t+0.18); so.frequency.setValueAtTime(740,t+0.36); so.frequency.setValueAtTime(980,t+0.54);
      sg.gain.setValueAtTime(0.0001,t); sg.gain.exponentialRampToValueAtTime(0.07,t+0.05); sg.gain.setValueAtTime(0.07,t+0.66); sg.gain.exponentialRampToValueAtTime(0.0001,t+0.85);
      so.connect(sg); sg.connect(dest); so.start(t); so.stop(t+0.9);
    }
  }catch(e){}
  // spoken "Master Multiplier" cheer (real clip preferred, else TTS)
  if(hasSnd('bigwin')) playSnd('bigwin',{cat:'voice',vol:0.95});
  else say('Master Multiplier!');
}

/* ============================================================
   SIMULATED MULTIPLAYER (bots) — no backend needed for demo
   ============================================================ */
const NAMES = ['Nova','Orbit','Zenith','Comet','Vega','Astra','Pulsar','Quasar','Lyra','Titan','Apollo','Luna','Helio','Cosmo','Stellar','Falcon','Drift','Echo','Onyx','Mika','Rin','Kai','Juno','Atlas','Sol','Iris','Nyx','Rex','Zara','Milo'];
const COLORS = ['#FF8A00','#9B5CF6','#22C55E','#38BDF8','#F43F5E','#EAB308','#EC4899','#14B8A6'];
const CHATTER = ['gg 🚀','cashed at last sec 😮‍💨','to the moon!','rip my bet','easy 2x','who else holding?','that was brutal','provably fair ftw','nice round','my heart can’t take this 😂','10x incoming i feel it','cashed early again ugh','lfg 🔥','red wall incoming','green day today'];

function makeBots(n){
  const out=[];
  for(let i=0;i<n;i++){
    out.push({ name: NAMES[i%NAMES.length] + (i>=NAMES.length? (Math.floor(i/NAMES.length)+1):''),
               color: COLORS[i%COLORS.length],
               bet: Math.round(rnd(20,800)/10)*10,
               target: rnd(1.2,7), active:false, done:false });
  }
  return out;
}

/* ============================================================
   STARFIELD + ROCKET CANVAS
   ============================================================ */
const cvs = $('sky'), ctx = cvs.getContext('2d');
let W=0,H=0,DPR=1, stars=[], particles=[];
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  const r = cvs.getBoundingClientRect();
  W=r.width; H=r.height;
  cvs.width=W*DPR; cvs.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  const count = S.lowBw? 46 : 150;
  stars = Array.from({length:count}, ()=>{
    const bright = Math.random()<0.12;
    return { x:Math.random()*W, y:Math.random()*H, z:Math.random()*.8+.2,
      r:(bright?1.5:0.95)*(Math.random()*1.0+.4), tw:Math.random()*7, tws:rnd(0.5,1.7),
      bright, blu:Math.random()<0.4 };
  });
}
window.addEventListener('resize', resize);

function rocketPos(t){ // t in seconds; point on the flight curve in canvas space
  // Asymptotic climb: the rocket keeps creeping toward the moon and slows the
  // higher it gets, so even a long round stays ONE smooth motion — it never hits
  // the end of the path and snaps direction near the moon.
  const prog = 1 - 1/(1 + t/7);      // 0 → ~1 (never quite reaches), eases as it climbs
  const ey = Math.pow(prog, 0.72);   // vertical leads → shoots almost straight up first
  const ex = Math.pow(prog, 2.2);    // horizontal lags hard → stays vertical, then a natural gravity-turn curve to the moon
  const x = 0.12*W + ex * 0.72*W;    // → ~0.84W, near the moon (top-right)
  const y = 0.86*H - ey * 0.66*H;    // → ~0.20H
  return {x,y};
}

let shakeT=0;
function draw(ts){ if(!ENGINE_ALIVE) return;
  ctx.clearRect(0,0,W,H);

  // stars (parallax drift; twinkle; turn into speed streaks when flying fast)
  // The rocket climbs up-and-right, so the starfield drifts the opposite way:
  // straight down at rest, then streaming diagonally down-left as it gains speed.
  const now = performance.now();
  const speed = S.phase==='running' ? Math.min(S.mult*0.45, 9) : 0.3;
  const streak = S.phase==='running' && speed>2.4;   // motion-blur speed sensation
  const diag = Math.max(0, Math.min((speed-1.4)/6, 1)) * 0.8;  // 0 → straight down, ramps to down-left
  const dirX = -diag, dirY = 1;                                // motion direction (down-left)
  const dlen = Math.hypot(dirX, dirY), uX = dirX/dlen, uY = dirY/dlen;
  for(const s of stars){
    s.y += s.z*speed*uY;
    s.x += s.z*speed*uX;
    // wrap on all edges: re-enter from the opposite side they exit
    if(s.y>H){ s.y=0; s.x=Math.random()*W; }
    if(s.x<0){ s.x=W; s.y=Math.random()*H; }
    else if(s.x>W){ s.x=0; s.y=Math.random()*H; }
    const tw = 0.55 + 0.45*Math.sin(now*0.001*s.tws + s.tw);
    ctx.globalAlpha = s.z*0.9*tw;
    ctx.fillStyle = s.blu ? '#cfe0ff' : '#ffffff';
    if(streak){
      const len = Math.min(s.z*speed*2.2, 28);   // trail points back, opposite the motion
      ctx.lineWidth = s.r; ctx.lineCap='round'; ctx.strokeStyle = s.blu ? '#cfe0ff' : '#ffffff';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - uX*len, s.y - uY*len); ctx.stroke();
    }
    else { ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill(); }
  }
  // additive bloom on the brightest stars
  ctx.globalCompositeOperation='lighter';
  for(const s of stars){ if(!s.bright) continue;
    const tw = 0.5 + 0.5*Math.sin(now*0.001*s.tws + s.tw);
    ctx.globalAlpha = s.z*0.45*tw;
    ctx.fillStyle = s.blu ? 'rgba(150,190,255,.9)' : 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r*2.4,0,7); ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;

  // BETTING: the rocket sits on the pad at bottom-left, engine warming up,
  // smoke building — so during the countdown you watch it start up before it flies.
  if(S.phase==='betting'){
    const pad = rocketPos(0);
    const heat = S.cdMs ? Math.min(1, Math.max(0, 1-(S.cdEndTs-performance.now())/S.cdMs)) : 0;
    // launch smoke building under the rocket (thicker as the count nears zero)
    if(!S.lowBw && Math.random() < 0.25 + heat*0.6){
      particles.push({ x:pad.x+rnd(-7,7), y:pad.y+rnd(8,16), vx:rnd(-.7,.7), vy:rnd(.1,1.1)-heat*0.4,
        life:1, c:'rgba(150,150,160,1)', r:(3+heat*5), grav:-0.02, fade:0.02, smoke:true });
    }
    const vib = heat*rnd(-1.6,1.6);   // the launch-pad shudder as thrust builds
    drawRocket(pad.x+vib, pad.y - heat*2, 0, heat);
  }

  if(S.phase==='running' || S.phase==='crashed'){
    const t = (performance.now()-S.startTs)/1000;
    const tt = S.phase==='crashed' ? S.crashTime : t;
    const p = rocketPos(tt);

    // shake on crash
    let ox=0,oy=0;
    if(S.phase==='crashed' && shakeT>0){ ox=rnd(-6,6); oy=rnd(-6,6); shakeT-=16; }

    ctx.save(); ctx.translate(ox,oy);
    const crashed = S.phase==='crashed';
    // A single trail line that starts on the ground behind the rocket and follows it
    // up. Shows ONLY while flying — on crash it vanishes, leaving just the explosion.
    // No filled area / horizontal base line anymore.
    if(!crashed){
      const steps=S.lowBw?22:36; const pts=[{x:0.12*W,y:0.86*H}];
      for(let i=1;i<=steps;i++) pts.push(rocketPos(tt*i/steps));
      const SCt = rocketScale();
      const trace=()=>{ ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); };
      const lg=(...st)=>{ const g=ctx.createLinearGradient(0.12*W,0.86*H,p.x,p.y); st.forEach(s=>g.addColorStop(s[0],s[1])); return g; };
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.globalCompositeOperation='lighter';   // additive → glow / light bloom
      // wide soft bloom
      trace(); ctx.strokeStyle=lg([0,'rgba(255,80,20,0)'],[.6,'rgba(255,120,20,.10)'],[1,'rgba(255,180,60,.22)']); ctx.lineWidth=12*SCt; ctx.stroke();
      // mid orange→yellow body
      trace(); ctx.strokeStyle=lg([0,'rgba(255,120,0,0)'],[.55,'rgba(255,150,30,.5)'],[1,'rgba(255,210,90,.8)']); ctx.lineWidth=5*SCt; ctx.stroke();
      // hot near-white core at the tip
      trace(); ctx.strokeStyle=lg([0,'rgba(255,180,60,0)'],[.7,'rgba(255,232,150,.7)'],[1,'rgba(255,255,235,1)']); ctx.lineWidth=2*SCt; ctx.stroke();
      ctx.globalCompositeOperation='source-over';
    }

    // rocket sits exactly ON the path (no up/down bob) so the trail + flame stay
    // attached to the nozzle instead of drifting beside it.
    const ry = p.y;
    // Point the nose along the CURVE's tangent at the rocket (centred difference) so
    // the body sits ON the path and the fire tail trails straight out the back —
    // a forward-only look-ahead over-rotated the nose on the bend. The window grows
    // with time so there's still motion near the moon; keep the last angle if tiny.
    const h = 0.08 + tt*0.02;
    const a1 = rocketPos(tt+h), a2 = rocketPos(Math.max(0, tt-h));
    let dx=a1.x-a2.x, dy=a1.y-a2.y, ang;
    if(Math.hypot(dx,dy) < 0.3){ ang = (S.lastAng!=null? S.lastAng : 0); }
    else { ang = Math.atan2(dy,dx) + Math.PI/2; S.lastAng = ang; }   // nose follows the curve (starts vertical, tips right)
    // As the flight goes long the gravity-turn tangent flattens out and the nose ends
    // up pointing sideways. Bias it back UP toward the moon — gently early, more as the
    // multiplier climbs — so the nose keeps aiming at the moon (top-right).
    // bias the NOSE up toward the moon (purely visual — the flame follows the real trail,
    // drawn separately in drawCurvedFlame, so it no longer matters how far the nose turns).
    if(S.phase==='running'){
      const moonX=0.87*W, moonY=0.12*H;
      const angMoon = Math.atan2(moonY-ry, moonX-p.x) + Math.PI/2;
      const wM = Math.min(0.8, Math.max(0,(S.mult-1.3)/15));   // ~0 below 1.3x → up to 0.8, aims harder at the moon
      let d = angMoon - ang; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
      ang = ang + d*wM; S.lastAng = ang;
    }
    if(S.phase==='running'){
      if(!S.lowBw){
        const boosting = S.mult>=1.66;                 // extra thrusters → denser exhaust
        const n = (Math.random()<.85?2:1) + (boosting?2:0);
        for(let k=0;k<n;k++) particles.push({x:p.x+rnd(-2,2),y:ry+rnd(0,3), vx:rnd(-.8,.8)-1.2, vy:rnd(-.4,.6)+(boosting?2.2:1.7),
          life:1, fade:rnd(.05,.085), r:rnd(1.3,boosting?3.6:3.0), glow:true,
          c: Math.random()<.45?'#FFE08A':(Math.random()<.6?'#FF8A00':'#FF5A2A')});
      }
      const boost = Math.max(0, Math.min(1, (S.mult-1.66)/0.54));
      if(!crashed) drawCurvedFlame(tt, boost);   // thick flame that hugs the trail curve, UNDER the body
      drawRocket(p.x, ry, ang);
    } else {
      drawBoom(p.x, p.y);
    }
    ctx.restore();
  }

  // particles
  for(let i=particles.length-1;i>=0;i--){
    const pt=particles[i];
    pt.vy += (pt.grav!=null?pt.grav:0); pt.vx*=0.99;
    pt.x+=pt.vx; pt.y+=pt.vy; pt.life-=(pt.fade!=null?pt.fade:.04);
    if(pt.life<=0){ particles.splice(i,1); continue; }
    if(pt.smoke){ ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=pt.life*0.42; ctx.fillStyle=pt.c; ctx.beginPath(); ctx.arc(pt.x,pt.y,(pt.r||4)*(1.7-pt.life),0,7); ctx.fill(); }
    else { ctx.globalCompositeOperation = pt.glow?'lighter':'source-over'; ctx.globalAlpha=pt.life; ctx.fillStyle=pt.c; ctx.beginPath(); ctx.arc(pt.x,pt.y,(pt.r?pt.r*pt.life+0.4:2.4*pt.life+.6),0,7); ctx.fill(); }
  }
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;
  requestAnimationFrame(draw);
}

// Optional artwork: drop public/rocket.png (rocket BODY only, nose UP, no flame)
// and the game renders it instead of the built-in vector rocket. The exhaust flame
// is always drawn by the engine (animated, anchored to the nozzle).
let ROCKET_IMG=null, rocketReady=false;
function loadArt(){
  try{ const im=new Image(); im.onload=()=>{ if(im.naturalWidth>0){ ROCKET_IMG=im; rocketReady=true; } }; im.onerror=()=>{}; im.src='/rocket.png'; }catch(e){}
}

// THICK FLAME — a tapered bright plume that follows the ACTUAL trail curve right behind the
// rocket, so the thin tail always runs straight down its middle at EVERY multiplier. A
// straight plume can't track the path early in the flight, when it bends hard behind the
// rocket; sampling the real curve fixes that.
function drawCurvedFlame(tt, boost){
  const SCt = rocketScale();
  const flick = 0.92 + 0.16*Math.sin(performance.now()/26);   // subtle live length flicker
  const target = (20 + 9*boost) * SCt * flick;                // flame length in px
  const pts=[rocketPos(tt)], dist=[0];
  let prev=pts[0], acc=0, bt=tt; const dt=Math.max(0.012, tt*0.01);
  while(bt>0 && acc<target && pts.length<64){
    bt=Math.max(0, bt-dt); const q=rocketPos(bt);
    acc += Math.hypot(q.x-prev.x, q.y-prev.y); pts.push(q); dist.push(acc); prev=q;
    if(bt<=0) break;
  }
  if(pts.length<2) return;
  const L=acc||1, baseHW=(4.6 + 1.5*boost) * SCt;
  const ribbon=(wmul, style)=>{
    ctx.beginPath();
    const edge=(sgn)=>{
      for(let i=0;i<pts.length;i++){
        const u=Math.min(1, dist[i]/L), hw=baseHW*wmul*Math.pow(1-u, 0.75);
        const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)];
        let dx=b.x-a.x, dy=b.y-a.y; const m=Math.hypot(dx,dy)||1; dx/=m; dy/=m;   // tangent
        const x=pts[i].x - dy*hw*sgn, yy=pts[i].y + dx*hw*sgn;                     // perpendicular offset
        if(i===0 && sgn>0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
      }
    };
    edge(1);                                  // one side, nozzle → tail
    for(let i=pts.length-1;i>=0;i--){         // other side, tail → nozzle
      const u=Math.min(1, dist[i]/L), hw=baseHW*wmul*Math.pow(1-u, 0.75);
      const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)];
      let dx=b.x-a.x, dy=b.y-a.y; const m=Math.hypot(dx,dy)||1; dx/=m; dy/=m;
      ctx.lineTo(pts[i].x + dy*hw, pts[i].y - dx*hw);
    }
    ctx.closePath(); ctx.fillStyle=style; ctx.fill();
  };
  const grad=(...st)=>{ const g=ctx.createLinearGradient(pts[0].x,pts[0].y, pts[pts.length-1].x,pts[pts.length-1].y); st.forEach(s=>g.addColorStop(s[0],s[1])); return g; };
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineJoin='round';
  ribbon(1.00, grad([0,'rgba(255,150,40,.5)'],[.5,'rgba(255,125,35,.3)'],[1,'rgba(255,80,40,0)']));    // soft outer bloom
  ribbon(0.60, grad([0,'rgba(255,205,105,.95)'],[.45,'rgba(255,160,55,.78)'],[1,'rgba(255,90,40,0)'])); // mid orange body
  ribbon(0.26, grad([0,'rgba(255,255,235,1)'],[.5,'rgba(255,234,150,.85)'],[1,'rgba(255,170,70,0)']));  // white-hot core
  ctx.restore(); ctx.globalCompositeOperation='source-over';
}

function rocketScale(){ return Math.max(1.7, Math.min(W/175, 3.0)); }
function drawRocket(x,y,ang,heat){
  const SC = rocketScale();
  ctx.save(); ctx.translate(x,y); ctx.scale(SC,SC); ctx.rotate(ang!=null?ang:Math.PI/4); // nose points along travel (toward the moon)
  const flick = Math.sin(performance.now()/28)*4;
  // EXTRA THRUSTERS: at ~1.66x (where the music kicks in) the engines fire harder —
  // a longer, brighter main plume + two angled side-thruster jets. Eases in 1.66→2.2x.
  const boost = (heat==null && S.phase==='running') ? Math.max(0, Math.min(1, (S.mult-1.66)/0.54)) : 0;
  let f = (heat==null) ? (14+flick) : (1.5 + heat*20 + flick*Math.max(.2,heat));
  f *= 1 + 0.55*boost;
  const gi = (heat==null?1:heat) * (1 + 0.5*boost);   // glow intensity (warming up on the pad → full in flight)

  // ENGINE GLOW + FLAME — additive bloom. A PROPER exhaust: WIDE & bright right at
  // the nozzle, then tapering smoothly to a transparent tip (the tail). Anchored to
  // the nozzle (lower for the artwork rocket, higher for the vector one).
  const ny = rocketReady ? 14.5 : 8;
  ctx.globalCompositeOperation='lighter';
  // nozzle bloom — the bright burst right at the engine (always)
  let eg = ctx.createRadialGradient(0,ny,0, 0,ny, 10*gi+3);
  eg.addColorStop(0,`rgba(255,230,150,${.95*gi})`); eg.addColorStop(.4,`rgba(255,140,40,${.55*gi})`); eg.addColorStop(1,'rgba(255,80,40,0)');
  ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(0,ny,10*gi+3,0,7); ctx.fill();
  // On the PAD the rocket stands vertical, so a simple straight plume is correct. In FLIGHT
  // the thick flame is drawn by drawCurvedFlame() so it follows the curved trail (the tail
  // always runs down its middle); here we only keep the nozzle bloom + side-thruster jets.
  if(heat!=null){
    let fl = ctx.createLinearGradient(0,ny-1,0,ny+1+f);   // outer plume: wide at nozzle → point
    fl.addColorStop(0,'rgba(255,242,185,.95)'); fl.addColorStop(.3,'rgba(255,175,55,.92)'); fl.addColorStop(.65,'rgba(255,110,40,.55)'); fl.addColorStop(1,'rgba(255,70,60,0)');
    ctx.fillStyle=fl; ctx.beginPath(); ctx.moveTo(-4.4,ny); ctx.quadraticCurveTo(0,ny+1+f,4.4,ny); ctx.closePath(); ctx.fill();
    let fc = ctx.createLinearGradient(0,ny-1,0,ny+f*0.62);   // inner white-hot core
    fc.addColorStop(0,'rgba(255,255,255,.95)'); fc.addColorStop(.5,'rgba(255,235,170,.8)'); fc.addColorStop(1,'rgba(255,180,80,0)');
    ctx.fillStyle=fc; ctx.beginPath(); ctx.moveTo(-2.1,ny); ctx.quadraticCurveTo(0,ny+f*0.62,2.1,ny); ctx.closePath(); ctx.fill();
  }
  // side-thruster jets — two short angled plumes from the base corners when boosting
  if(boost>0){
    const sl = (5 + flick*0.4) * boost;   // side-jet length
    for(const sx of [-1,1]){
      ctx.save(); ctx.translate(sx*3.4, ny-2.5); ctx.rotate(sx*0.42);   // splay outward
      let sg = ctx.createLinearGradient(0,0,0,sl+1.5);
      sg.addColorStop(0,`rgba(255,245,200,${.9*boost})`); sg.addColorStop(.55,`rgba(255,150,45,${.6*boost})`); sg.addColorStop(1,'rgba(255,80,50,0)');
      ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(-1.7,0); ctx.quadraticCurveTo(0,sl+1.5,1.7,0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalCompositeOperation='source-over';

  // Use the artwork PNG if provided — pixel-perfect to the reference; the animated
  // flame above stays. Otherwise fall through to the built-in vector rocket.
  if(rocketReady){
    const iw=ROCKET_IMG.naturalWidth||1, ih=ROCKET_IMG.naturalHeight||1, H0=34, W0=H0*iw/ih;
    ctx.drawImage(ROCKET_IMG, -W0/2, -19, W0, H0);   // centred ~y -2 (nose -19, base ~+15)
    ctx.restore(); return;
  }

  // BODY — clean brushed-metal tube (white/silver, like the reference)
  ctx.shadowColor='rgba(255,150,40,.3)'; ctx.shadowBlur=11;
  let body = ctx.createLinearGradient(-7,0,7,0);
  body.addColorStop(0,'#a7b2c4'); body.addColorStop(.26,'#ffffff'); body.addColorStop(.5,'#e2e8f2'); body.addColorStop(.72,'#a6b1c2'); body.addColorStop(1,'#79839a');
  ctx.fillStyle=body;
  ctx.beginPath(); ctx.moveTo(0,-15); ctx.quadraticCurveTo(8,-4,7,9); ctx.lineTo(-7,9); ctx.quadraticCurveTo(-8,-4,0,-15); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0;
  // specular metallic sheen
  ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.0;
  ctx.beginPath(); ctx.moveTo(-2.8,-11); ctx.quadraticCurveTo(-3.6,-2,-2.8,7); ctx.stroke();
  ctx.globalCompositeOperation='source-over';
  // NOSE CONE — pointed, red→orange (matches the reference)
  let nose = ctx.createLinearGradient(-4,-18,4,-6);
  nose.addColorStop(0,'#FFB36A'); nose.addColorStop(.4,'#FF6A2A'); nose.addColorStop(1,'#B5241E');
  ctx.fillStyle=nose;
  ctx.beginPath(); ctx.moveTo(0,-18.5); ctx.quadraticCurveTo(5.6,-9,4.4,-5.2); ctx.lineTo(-4.4,-5.2); ctx.quadraticCurveTo(-5.6,-9,0,-18.5); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,220,180,.6)'; ctx.lineWidth=.9;
  ctx.beginPath(); ctx.moveTo(-1.4,-16); ctx.quadraticCurveTo(-2.4,-10,-2.2,-6); ctx.stroke();
  ctx.globalCompositeOperation='source-over';
  // body seam shadow (cylinder roundness)
  ctx.strokeStyle='rgba(66,76,96,.4)'; ctx.lineWidth=0.7;
  ctx.beginPath(); ctx.moveTo(3.9,-5); ctx.quadraticCurveTo(4.7,1,3.4,8.5); ctx.stroke();
  // WINDOW — dark navy porthole with a steel rim + bright highlight
  ctx.fillStyle='#cdd6e6'; ctx.beginPath(); ctx.arc(0,-2,4.0,0,7); ctx.fill();
  let glass = ctx.createRadialGradient(-1.3,-3.2,0.3, 0,-2,3.4);
  glass.addColorStop(0,'#9fc0ec'); glass.addColorStop(.45,'#3a5790'); glass.addColorStop(1,'#0e1730');
  ctx.fillStyle=glass; ctx.beginPath(); ctx.arc(0,-2,3.3,0,7); ctx.fill();
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(-1.2,-3.2,.85,0,7); ctx.fill();
  ctx.globalCompositeOperation='source-over';
  // FINS — swept red
  let fin = ctx.createLinearGradient(0,3,0,14); fin.addColorStop(0,'#FF8A6A'); fin.addColorStop(1,'#A82038');
  ctx.fillStyle=fin;
  ctx.beginPath(); ctx.moveTo(-6.6,3.5); ctx.lineTo(-14,13.5); ctx.lineTo(-6.6,9.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6.6,3.5); ctx.lineTo(14,13.5); ctx.lineTo(6.6,9.5); ctx.closePath(); ctx.fill();
  // engine nozzle — shaded steel
  let noz = ctx.createLinearGradient(0,9,0,12); noz.addColorStop(0,'#9aa3b5'); noz.addColorStop(1,'#565d6c');
  ctx.fillStyle=noz; ctx.beginPath(); ctx.moveTo(-3.6,9); ctx.lineTo(3.6,9); ctx.lineTo(2.8,12); ctx.lineTo(-2.8,12); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function spawnDebris(x,y){
  const SC=rocketScale();
  // glowing energy sparks (vaporization) — additive
  for(let i=0;i<(S.lowBw?22:36);i++){
    const a=Math.random()*7, sp=rnd(1.6,7.5)*Math.max(1,SC*0.5);
    particles.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 1.2, life:1, glow:true,
      c: Math.random()<.4?'#FFE38A':(Math.random()<.5?'#FF9A2A':'#FF5A4A'),
      r:(Math.random()<.3?2.4:1.3)*SC, grav:0.12, fade:0.02 });
  }
  // a few dark smoke puffs
  for(let i=0;i<6;i++){ const a=Math.random()*7, sp=rnd(.4,1.6); particles.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.4, life:1, c:'rgba(60,60,72,1)', r:5*SC, grav:-0.04, fade:0.012, smoke:true }); }
}
function drawBoom(x,y){
  const SC = rocketScale();
  const age = S.crashTs ? (performance.now()-S.crashTs)/1000 : 0;   // seconds since blow-up
  ctx.save(); ctx.translate(x,y);
  ctx.globalCompositeOperation='lighter';
  // 1) instant white energy flash
  if(age<0.18){ const a=Math.max(0,0.9-age*5), fr=(20+age*120)*SC;
    const g=ctx.createRadialGradient(0,0,0,0,0,fr);
    g.addColorStop(0,`rgba(255,255,255,${a})`); g.addColorStop(.5,`rgba(255,230,170,${a*0.6})`); g.addColorStop(1,'rgba(255,200,120,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,fr,0,7); ctx.fill(); }
  // 2) crisp double shockwave ring
  for(let k=0;k<2;k++){ const a0=k*0.06; if(age>a0 && age<0.6){ const ring=(8+(age-a0)*175)*SC;
    ctx.globalAlpha=Math.max(0,0.5-(age-a0)*1.0); ctx.strokeStyle=k?'#FFC489':'#FFE8C0'; ctx.lineWidth=(2.4-k)*SC;
    ctx.beginPath(); ctx.arc(0,0,ring,0,7); ctx.stroke(); ctx.globalAlpha=1; } }
  // 3) fireball: white-hot core → orange → red, expands then fades
  if(age<1.2){
    const fr=(13+age*44)*SC*(age<0.4?1:Math.max(0.2,1.4-age));
    const al=Math.max(0,1-age*0.9);
    const g=ctx.createRadialGradient(0,-age*6,0, 0,-age*6, Math.max(1,fr));
    g.addColorStop(0,`rgba(255,255,235,${al})`);
    g.addColorStop(.28,`rgba(255,190,70,${al})`);
    g.addColorStop(.6,`rgba(240,90,40,${al*0.85})`);
    g.addColorStop(.85,`rgba(120,40,30,${al*0.4})`);
    g.addColorStop(1,'rgba(40,20,20,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-age*6,fr,0,7); ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';
  ctx.restore();
}

/* ============================================================
   ROUND LIFECYCLE
   ============================================================ */
async function newServerSeed(){
  S.prevServerSeed = S.serverSeed;
  S.serverSeed = randSeed();
  S.serverSeedHash = await sha256Hex(S.serverSeed);
  $('fSeedHash').textContent = S.serverSeedHash;
  $('fSeedReveal').textContent = S.prevServerSeed;
  $('fNonce').textContent = S.nonce;
}

async function startBetting(){ if(!ENGINE_ALIVE) return;
  S.phase='betting'; S.mult=1.00; particles=[];
  S.slots.forEach(s=>{ s.placed=false; s.amount=0; s.cashedOut=false; s.won=0; });
  await newServerSeed();
  // compute crash point for THIS round now (provably fair, fixed before round)
  const hmac = await hmacHex(S.serverSeed, `${S.clientSeed}:${S.nonce}`);
  S.crashAt = crashFromHmac(hmac);
  S.thisHmac = hmac;

  // bots decide their targets
  S.bots.forEach(b=>{ b.active=Math.random()<.7; b.done=false; b.bet=Math.round(rnd(20,800)/10)*10; b.target=rnd(1.15,8); });

  // place any queued bets for this round
  S.slots.forEach((s,i)=>{ if(s.queued && S.balance>=s.bet){ s.queued=false; placeBet(i,true); } });

  // how many ride this round locally (a believable slice of the online population)
  S._riderBase=Math.floor((S._onlineVal||2800)*(0.4+Math.random()*0.22));
  setInRound(S._riderBase);

  showCountdown(6500, startRunning);   // matches the server BET_MS + the full countdown voice clip
  maybeRevealOnBetting();
  renderAction();
}

// Shared countdown UI. onDone is null in net mode (the server starts the round).
function killCdClip(){ if(S.cdAudio){ try{ S.cdAudio.src.stop(); }catch(e){} S.cdAudio=null; } }   // stop the countdown buffer (no speech)
function stopCountdownAudio(){ killCdClip(); try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){} }
function showCountdown(ms, onDone){
  stopCountdownAudio();   // never let a previous clip bleed into this countdown
  $('centerMain').style.display='none';
  $('countWrap').style.display='flex';
  S.cdEndTs=performance.now()+ms; S.cdMs=Math.max(1,ms);   // drives the rocket warming up on the pad (see draw)
  const total=Math.max(1,ms); let left=ms;
  // If the spoken clip is present, drive the on-screen number FROM the clip's word
  // timings so they match exactly. Tuned to the current countdown.mp3 (NASA voice):
  // 3→0.1s, 2→1.12s, 1→2.08s, LIFTOFF→3.28s (so liftoff lands at launch).
  const voiced = hasSnd('countdown') && ms>=3600;
  const cdur = (_buf['countdown'] && _buf['countdown'].duration) || 0;   // clip length (s)
  // A "full window" clip counts the whole way down (e.g. "5,4,3,2,1, we have liftoff").
  // We fire it at the start and let the numbers follow the clock, so they stay in sync.
  const fullCount = voiced && cdur >= 4.4;
  const fireAt = fullCount ? ms : 3280;   // full clip fires at the window start; short clip fires so liftoff lands at launch
  // Measured spoken-number onsets in countdown.mp3 (seconds from clip start):
  // 5→0.06, 4→1.16, 3→2.18, 2→3.18, 1→4.14, "liftoff"→~6.28. Drive the on-screen
  // number from these so each matches the voice exactly.
  const CD_NUMS=[[0.06,5],[1.16,4],[2.18,3],[3.18,2],[4.14,1]];
  // Announce the countdown audio ONLY ONCE per round — never again on a reconnect /
  // snapshot of the same round (that was causing the voice to replay mid-game).
  const announce = (S.voicedNonce !== S.nonce); if(announce) S.voicedNonce=S.nonce;
  let clipFired=false, fireLeft=ms;
  const fullNum=()=>{ const el=(fireLeft-left)/1000; let n=5; for(const [tt,nn] of CD_NUMS){ if(el>=tt) n=nn; } return n; };
  $('countNum').textContent = fullCount ? 5 : Math.max(0,Math.ceil(left/1000));
  $('countBar').style.transform='scaleX(1)';
  clearInterval(S.cdTimer);
  S.cdTimer=_int(()=>{
    left-=100;
    $('countBar').style.transform='scaleX('+Math.max(0,left/total)+')';
    if(voiced){
      if(left<=fireAt && !clipFired){ clipFired=true; fireLeft=left; if(announce) S.cdAudio=playCountdownRadio(); }
      // full clip: numbers follow the measured voice onsets; short 3-2-1 clip: tuned remap.
      const n = fullCount ? fullNum()
                          : (left>3180 ? Math.max(0,Math.ceil(left/1000)) : (left>2160?3:left>1200?2:1));
      if(String(n)!==$('countNum').textContent) $('countNum').textContent=String(n);
    } else {
      const sec=Math.max(0,Math.ceil(left/1000));
      if(sec!==+$('countNum').textContent && left>0){ $('countNum').textContent=sec; if(sec<=3 && sec>=1 && announce) sfx.count(sec); }
    }
    if(left<=0){ clearInterval(S.cdTimer); if(onDone) onDone(); }
  },100);
}

function startRunning(){
  S.phase='running';
  S.startTs=performance.now();
  $('countWrap').style.display='none';
  $('centerMain').style.display='block';
  $('status').textContent='';
  $('mult').classList.remove('crashed-tag');
  sfx.launch();
  setTimeout(killCdClip, 2700);   // let the spoken "LIFTOFF!" play out, then kill the clip so it can't linger/resume mid-round
  renderAction();
  tickRun();
}

function multAt(t){ // exponential growth; ~ reaches 2x at ~4.2s
  return Math.max(1, Math.pow(Math.E, 0.16*t));
}

function tickRun(){ if(!ENGINE_ALIVE) return;
  if(S.phase!=='running') return;
  const t=(performance.now()-S.startTs)/1000;
  S.mult = multAt(t);

  if(S.mode==='local'){
    // auto cashout FIRST (server handles this in net mode): any target the rocket
    // reached (auto < crash) must pay, even on the frame the rocket crashes.
    S.slots.forEach((s,i)=>{ if(s.placed && !s.cashedOut && s.auto>0 && s.auto<S.crashAt && S.mult>=s.auto) doCashout(i); });
    if(S.mult>=S.crashAt){
      S.mult=S.crashAt; S.crashTime=t;
      return crash();
    }
    // bots cash out (server sends winners in net mode)
    S.bots.forEach(b=>{
      if(b.active && !b.done && S.mult>=b.target && b.target<S.crashAt){
        b.done=true; addWinner(b.name,b.color,b.target,b.bet*b.target);
      }
    });
    // riders bail out as the multiplier climbs (Aviator-style "still in the round")
    const stillRiding=S.slots.filter(s=>s.placed && !s.cashedOut).length;
    setInRound(Math.floor((S._riderBase||0)*Math.min(1,Math.pow(Math.max(1,S.mult),-0.55)))+stillRiding);
  }

  // UI — colour + a glow whose intensity rises with the multiplier tier
  $('mult').textContent=S.mult.toFixed(2)+'x';
  const tier = S.mult<2? ['#ffffff','#ffffff',20] : S.mult<5? ['var(--primary)','#FF8A00',32] : S.mult<10? ['var(--secondary)','#9B5CF6',46] : ['var(--success)','#2BE07A',62];
  const mEl=$('mult'); mEl.style.color=tier[0];
  mEl.style.textShadow=`0 2px 16px rgba(0,0,0,.6), 0 0 ${tier[2]}px ${tier[1]}99`;
  // X-clock is gently coupled to the rocket's height: it dips DOWN as the rocket
  // climbs toward it (so the rocket flies over the top, never behind the text), then
  // once the rocket is ABOVE it the clock floats back UP a bit in its wake. Stays
  // razor-sharp — only a subtle bottom warp near the pass. (Wrapper only, never the
  // vw number itself → no font-collapse.)
  { const rp=rocketPos(t), mcy=0.46*H;
    const cl=x=>x<0?0:x>1?1:x, sm=x=>x*x*(3-2*x);
    const maxDown=Math.min(0.16*H,60), maxUp=Math.min(0.06*H,22);
    let off;
    if(rp.y>=mcy){ const k=cl((0.86*H-rp.y)/(0.86*H-mcy)); off=sm(k)*maxDown; }     // below → dip down (grows as it climbs)
    else { const a=cl((mcy-rp.y)/(0.28*H)); off=maxDown*(1-sm(a)) - maxUp*sm(a); }  // above → ease up and float a bit higher
    const nearCross=1-cl(Math.abs(rp.y-mcy)/(0.18*H));
    const cm=$('centerMain');
    cm.style.transformOrigin='50% 0%';   // anchor the TOP so the warp only tugs the bottom
    cm.style.transform=`translateY(calc(-4% + ${off.toFixed(1)}px)) scaleY(${(1+0.05*nearCross).toFixed(3)})`;
    cm.style.filter='';   // stays razor-sharp — no blur
  }
  // once you're fully cashed out, show the gains you'd be making by holding (the
  // FOMO ticker) — climbs until the rocket blows up, then the win pop-up shows.
  const cashed=S.slots.filter(s=>s.cashedOut), stillIn=S.slots.some(s=>s.placed && !s.cashedOut);
  if(cashed.length && !stillIn){
    const missed=cashed.reduce((t,s)=> t + Math.max(0, s.amount*S.mult - (s.won||0)), 0);
    $('status').textContent = missed>0 ? ('MISSED  €'+fmt(missed)) : '';
  } else { $('status').textContent=''; }
  S.slots.forEach((s,i)=>{ if(s.placed && !s.cashedOut) renderAction(i); });
  requestAnimationFrame(tickRun);
}

function crash(){
  S.phase='crashed'; shakeT=240;
  $('mult').textContent=S.crashAt.toFixed(2)+'x';
  $('mult').style.color=''; $('mult').style.textShadow='';   // clear running colour/glow so the red crash style shows
  { const cm=$('centerMain'); cm.style.transform=''; cm.style.filter=''; }   // reset the dodge/warp
  $('mult').classList.add('crashed-tag');
  $('status').textContent='ROCKET BLEW UP 💥';
  sfx.crash(); stopEngine(); stopThrust(); stopMusic(); stopCountdownAudio();
  S.crashTs=performance.now(); { const cp=rocketPos(S.crashTime); spawnDebris(cp.x, cp.y); }

  // bust any active un-cashed bets
  let lost=0; S.slots.forEach(s=>{ if(s.placed && !s.cashedOut){ s.placed=false; lost+=s.amount; } if(s.curBet) recordLossLocal(s); });
  if(lost>0) flashWon('−€'+fmt(lost), false);
  { const rw=roundWon(); if(rw>0) showRoundWin(rw); }   // one clear centered pop-up with this round's winnings

  // record provably-fair last round
  S.lastRound = { nonce:S.nonce, serverSeed:S.serverSeed, clientSeed:S.clientSeed, hmac:S.thisHmac, crash:S.crashAt };
  pushRound({ nonce:S.nonce, crash:S.crashAt, serverSeed:S.serverSeed, clientSeed:S.clientSeed, hmac:S.thisHmac, serverSeedHash:S.serverSeedHash });
  pushHistory(S.crashAt);
  S.nonce++;
  renderAction();
  sysChat(`Round #${S.nonce-1} crashed @ ${S.crashAt.toFixed(2)}x`);

  setTimeout(startBetting, 3200);
}

/* ============================================================
   BETTING ACTIONS
   ============================================================ */
function placeBet(i, silent){
  const sl=S.slots[i]; if(sl.placed || S.balance<sl.bet) return;
  if(S.mode==='net'){ NET.sock.emit('bet:place',{slot:i, amount:sl.bet, auto:sl.auto}); if(!silent) sfx.bet(); return; }
  S.balance-=sl.bet; sl.placed=true; sl.amount=sl.bet; sl.cashedOut=false;
  sl.curBet={ nonce:S.nonce, amount:sl.amount };
  updateBalance();
  if(!silent) sfx.bet();
  renderAction(i);
}
function doCashout(i){
  const sl=S.slots[i]; if(!sl.placed||sl.cashedOut) return;
  if(S.mode==='net'){ NET.sock.emit('cashout',{slot:i}); return; } // server confirms + pays
  sl.cashedOut=true; sl.placed=false;
  const win=sl.amount*S.mult; sl.won=win;
  S.balance+=win; updateBalance();
  sfx.cash();
  recordWinLocal(sl, S.mult, win);
  addWinner('You','#22C55E',S.mult,win,true);
  renderAction(i);   // win pop-up is shown once at round end (see crash)
}
function onAction(i){
  const sl=S.slots[i];
  if(sl.cashedOut && S.phase!=='betting') return;   // already won this round — leave the winnings showing
  if(S.phase==='betting'){
    if(sl.placed){ // cancel
      if(S.mode==='net'){ NET.sock.emit('bet:cancel',{slot:i}); }
      else { S.balance+=sl.amount; sl.placed=false; sl.curBet=null; updateBalance(); }
    } else placeBet(i);
    renderAction(i);
  } else if(S.phase==='running'){
    if(sl.placed && !sl.cashedOut) doCashout(i);
    else { sl.queued=!sl.queued; renderAction(i); }
  } else { sl.queued=!sl.queued; renderAction(i); }
}

function renderAction(i){
  if(i==null){ renderAction(0); renderAction(1); return; }
  const sl=S.slots[i], a=$('action'+i), m=$('actionMain'+i), sub=$('actionSub'+i);
  if(!a) return;
  a.className='action'; a.disabled=false;
  if(S.phase==='betting'){
    if(sl.placed){ a.classList.add('cancel'); m.textContent=T('cancel'); sub.textContent='€'+fmt(sl.amount)+' in'; }
    else { a.classList.add('bet'); m.textContent=T('place'); if(S.balance<sl.bet){ a.disabled=true; sub.textContent='low balance'; } else { sub.textContent='€'+fmt(sl.bet); } }
  } else if(sl.cashedOut){
    // won this round — keep the REAL profit (payout − stake) on the button until next round
    a.classList.add('won'); m.textContent='YOU WON'; sub.textContent='+€'+fmt(slotProfit(sl));
  } else if(S.phase==='running'){
    if(sl.placed){
      a.classList.add('cashout'); m.textContent=T('cashout'); sub.textContent='€'+fmt(sl.amount*S.mult);
    } else {
      a.classList.add(sl.queued?'cancel':'waiting'); m.textContent=sl.queued?T('queued'):T('place'); sub.textContent=sl.queued?'next round':'€'+fmt(sl.bet);
    }
  } else { // crashed
    a.classList.add(sl.queued?'cancel':'waiting'); m.textContent=sl.queued?T('queued'):T('waiting'); sub.textContent=sl.queued?'next round':'';
  }
}

/* ============================================================
   UI: winners, chat, history, balance
   ============================================================ */
function updateBalance(){ $('balance').textContent=fmt(S.balance); persist(); renderAction(); }   // re-render BOTH bet buttons so affordability (disabled) stays correct
function flashWon(text, good){
  const el=$('youWon'); el.textContent=text;
  el.style.color = good? 'var(--success)':'var(--danger)';
  el.style.background = good? 'rgba(34,197,94,.16)':'rgba(244,63,94,.16)';
  el.style.borderColor = good? 'rgba(34,197,94,.45)':'rgba(244,63,94,.45)';
  el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600);
}
// real combined profit for THIS round = BET 1 + BET 2 net winnings (payout − stake)
function slotProfit(s){ return (s.won||0) - (s.amount||0); }
function roundWon(){ return S.slots.reduce((t,s)=> t + (s.cashedOut ? slotProfit(s) : 0), 0); }
// ONE clear centered pop-up with the round's winnings, shown when the round ends.
function showRoundWin(amount){
  const el=$('winPop'); if(!el){ flashWon('+€'+fmt(amount), true); return; }
  const a=$('wpAmt'); const s='+€'+fmt(amount);
  if(a){ a.textContent=s;
    // auto-fit: shrink the number so even huge wins fit the box
    a.style.fontSize = (s.length<=10?42 : s.length<=13?36 : s.length<=16?29 : s.length<=19?24 : 20)+'px';
  }
  const jackpot = amount>=100000;                     // BIG win → bigger box, confetti, cheer
  el.classList.toggle('jackpot', jackpot);
  const tt=$('wpTitle'); if(tt) tt.textContent = jackpot ? 'MASTER MULTIPLIER' : 'YOUR TOTAL WIN';
  const cm=$('centerMain'); if(cm) cm.style.display='none';   // hide the crash number so the pop-up stands alone
  el.classList.add('show');
  if(jackpot){ fireConfetti(); sfx.jackpot(); }
  clearTimeout(S.wpTimer); S.wpTimer=setTimeout(()=>el.classList.remove('show'), jackpot?4200:2800);
}
// confetti burst that pops up and rains down over the screen (DOM, on top of everything)
function fireConfetti(){
  try{
    const layer=document.createElement('div'); layer.className='confetti-layer';
    document.body.appendChild(layer);
    const colors=['#FF8A00','#22C55E','#9B5CF6','#38BDF8','#F43F5E','#EAB308','#FFFFFF'];
    const Wn=window.innerWidth, Hn=window.innerHeight, cx=Wn/2, cy=Hn*0.42;
    const N=S.lowBw?44:130, pieces=[];
    for(let i=0;i<N;i++){
      const d=document.createElement('i'), w=(rnd(5,10)|0), h=(rnd(8,15)|0);
      d.style.width=w+'px'; d.style.height=h+'px'; d.style.background=colors[i%colors.length];
      layer.appendChild(d);
      pieces.push({el:d, x:cx, y:cy, vx:rnd(-11,11), vy:-rnd(7,17), rot:rnd(0,360), vr:rnd(-16,16)});
    }
    const start=performance.now(); let last=start;
    function step(now){
      const dt=Math.min(2.2,(now-last)/16.7); last=now; let alive=false;
      for(const p of pieces){
        p.vy+=0.34*dt; p.vx*=Math.pow(0.99,dt);
        p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
        p.el.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px) rotate('+p.rot.toFixed(0)+'deg)';
        if(p.y<Hn+50) alive=true;
      }
      if(alive && now-start<4500) requestAnimationFrame(step); else layer.remove();
    }
    requestAnimationFrame(step);
  }catch(e){}
}
// Live Activity feed (wins, big multipliers, joins). Rows are clickable → profile.
function addActivity(ev){
  const wrap=$('winners'); if(!wrap) return;
  const row=document.createElement('div'); row.className='winner';
  if(ev.pid){ row.dataset.pid=ev.pid; row.style.cursor='pointer'; row.onclick=()=>openProfile(ev.pid); }
  const initial=((ev.name||'?')[0]||'?').toUpperCase();
  const av=`<div class="av" style="background:${ev.color||'#FF8A00'}">${initial}</div>`;
  if(ev.type==='join'){
    row.innerHTML=`${av}<div class="nm">${ev.name}<small style="color:var(--muted)">joined 👋</small></div><div class="amt" style="color:var(--faint)">·</div>`;
  } else if(ev.type==='bigmult'){
    row.innerHTML=`${av}<div class="nm">${ev.name}<small style="color:var(--secondary)">hit ${(ev.mult||0).toFixed(2)}x</small></div><div class="amt" style="color:var(--secondary)">🚀</div>`;
  } else {
    row.innerHTML=`${av}<div class="nm">${ev.name}<small>@ ${(ev.mult||0).toFixed(2)}x</small></div><div class="amt tnum">€${fmt(ev.amount||0)}</div>`;
  }
  wrap.prepend(row);
  while(wrap.children.length>14) wrap.lastChild.remove();
}
// kept for existing call-sites (self cashout, local bots, seed)
function addWinner(name,color,mult,amt,you){ addActivity({ type:'win', pid: you?S.selfPid:undefined, name: you?'You':name, color: color||'#FF8A00', amount: amt, mult }); }
function multCls(v){ return v<2?'lo':v<5?'mid':v<10?'hi':'huge'; }
function crashColor(v){ return v<2?'#9aa3b2':v<5?'var(--primary)':v<10?'var(--secondary)':'var(--success)'; }
function renderPills(){
  const h=$('history'); h.innerHTML='';
  S.history.forEach(v=>{
    const p=document.createElement('span'); p.className='hp '+multCls(v); p.textContent=v.toFixed(2)+'x';
    h.appendChild(p);
  });
}
function pushHistory(m){
  S.history.unshift(m); if(S.history.length>18) S.history.pop();
  renderPills();
}
function pushRound(r){ S.rounds.unshift(r); if(S.rounds.length>50) S.rounds.pop(); }

/* ============================================================
   HISTORY & STATS (player outcomes, server-driven)
   ============================================================ */
// every placed bet resolves to exactly one record: a win (on cashout) or a
// loss (on crash). If a previous bet was somehow never resolved, settle it first.
// local-mode stats recording (net mode stats come from the server via 'profile')
function recordWinLocal(sl, mult, payout){
  if(!sl.curBet) return;
  const amount=sl.curBet.amount, profit=Math.round((payout-amount)*100)/100;
  S.myBets.unshift({ nonce:sl.curBet.nonce, amount, won:true, mult, payout, profit });
  if(S.myBets.length>100) S.myBets.pop();
  const s=S.stats; s.played++; s.wins++; s.wagered+=amount; s.returned+=payout;
  s.best=Math.max(s.best,mult); s.bestWin=Math.max(s.bestWin,profit);
  s.streak++; s.bestStreak=Math.max(s.bestStreak,s.streak);
  sl.curBet=null; persist(); refreshScreens();
}
function recordLossLocal(sl){
  if(!sl.curBet) return;
  const amount=sl.curBet.amount;
  S.myBets.unshift({ nonce:sl.curBet.nonce, amount, won:false, profit:-amount });
  if(S.myBets.length>100) S.myBets.pop();
  const s=S.stats; s.played++; s.wagered+=amount; s.streak=0;
  sl.curBet=null; persist(); refreshScreens();
}

function renderHistory(){
  const bb=$('histBets'); bb.innerHTML='';
  if(!S.myBets.length){ bb.innerHTML='<div class="empty">No bets yet — place your first bet 🚀</div>'; }
  else S.myBets.slice(0,50).forEach(b=>{
    const row=document.createElement('div'); row.className='bet-row';
    const res = b.won
      ? `<span class="res win">+€${fmt(b.profit)} @ ${b.mult.toFixed(2)}x</span>`
      : `<span class="res loss">−€${fmt(b.amount)}</span>`;
    row.innerHTML=`<span class="rno">#${b.nonce}</span><span class="mid">€${fmt(b.amount)} bet</span>${res}`;
    bb.appendChild(row);
  });

  const rr=$('histRounds'); rr.innerHTML='';
  if(!S.rounds.length){ rr.innerHTML='<div class="empty">Rounds will appear here as they complete.</div>'; }
  else S.rounds.slice(0,30).forEach(r=>{
    const row=document.createElement('div'); row.className='round-row';
    row.innerHTML=`<span class="rno">Round #${r.nonce}</span><span class="rc" style="color:${crashColor(r.crash)}">${r.crash.toFixed(2)}x</span>`;
    const v=document.createElement('button'); v.className='vbtn'; v.textContent='🛡️ Verify';
    if(r.hmac){ v.onclick=()=>openFairForRound(r); } else { v.disabled=true; }
    row.appendChild(v); rr.appendChild(row);
  });
}
function renderStats(){
  const s=S.stats;
  const profit=Math.round((s.returned-s.wagered)*100)/100;
  const winRate=s.played? Math.round(s.wins/s.played*100):0;
  const cards=[
    ['Total Win', '€'+fmt(s.returned), 'var(--success)'],
    ['Net Profit', (profit>=0?'+':'−')+'€'+fmt(Math.abs(profit)), profit>=0?'var(--success)':'var(--danger)'],
    ['Balance', '€'+fmt(S.balance), '#fff'],
    ['Win Rate', winRate+'%', '#fff'],
    ['Rounds Played', String(s.played), '#fff'],
    ['Total Wagered', '€'+fmt(s.wagered), '#fff'],
    ['Best Win', '+€'+fmt(s.bestWin), 'var(--success)'],
    ['Best Multiplier', s.best.toFixed(2)+'x', 'var(--secondary)'],
    ['Best Streak', s.bestStreak+'×', 'var(--primary)'],
  ];
  $('statGrid').innerHTML=cards.map(([l,v,c])=>`<div class="stat-card"><div class="v" style="color:${c}">${v}</div><div class="l">${l}</div></div>`).join('');
  renderTx($('statTx'));
}
function refreshScreens(){
  if($('screenHistory').classList.contains('show')) renderHistory();
  if($('screenStats').classList.contains('show')) renderStats();
}
function setNavActive(name){ document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active', x.dataset.nav===name)); }
function openScreen(name){
  closeScreens(false);
  if(name==='history'){ renderHistory(); $('screenHistory').classList.add('show'); }
  if(name==='stats'){ renderStats(); $('screenStats').classList.add('show'); }
  setNavActive(name);
}
function closeScreens(toGame){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  if(toGame!==false) setNavActive('game');
}
function openFairForRound(r){
  $('fSeedHash').textContent = r.serverSeedHash || '(revealed below)';
  $('fSeedReveal').textContent = r.serverSeed || '—';
  $('fClientSeed').value = r.clientSeed || S.clientSeed;
  $('fNonce').textContent = r.nonce;
  $('fHmac').textContent = r.hmac || '—';
  const computed = r.hmac ? crashFromHmac(r.hmac) : null;
  $('fComputed').textContent = computed!=null ? computed.toFixed(2)+'x' : '—';
  $('fActual').textContent = r.crash.toFixed(2)+'x';
  const ok = computed!=null && Math.abs(computed-r.crash)<0.001;
  $('fMatch').innerHTML = ok ? '<span style="color:#22C55E">✓ VERIFIED</span>' : '<span style="color:#F43F5E">✗ MISMATCH</span>';
  $('fairModal').classList.add('show');
}
function addChat(name,text,sys,pid){
  const c=$('chat'); const d=document.createElement('div'); d.className='msg'+(sys?' sys':'');
  d.innerHTML = pid ? `<b class="clk" data-pid="${pid}">${name}</b>${text}` : `<b>${name}</b>${text}`;
  if(pid){ const b=d.querySelector('b'); if(b) b.onclick=()=>openProfile(pid); }
  c.appendChild(d);
  while(c.children.length>60) c.firstChild.remove();
  c.scrollTop=c.scrollHeight;
}
function sysChat(t){ addChat('Liftoff X', t, true); }

/* ============================================================
   CONTROLS WIRING
   ============================================================ */
const betDisp = v => v%1===0 ? v.toLocaleString('en-US') : v.toFixed(2);
function setBet(i, v){ const s=S.slots[i]; const cap=Math.max(0.10, S.balance);
  s.bet=Math.max(0.10, Math.min(Math.round(v*100)/100, cap));   // €0.10 min, 2-decimal precision
  const el=$('betVal'+i); if(el && document.activeElement!==el) el.value = betDisp(s.bet);   // don't fight the user mid-typing
  renderAction(i); schedulePersist(); }
// live parse while the user types a custom amount (don't rewrite the field here)
function onBetType(i){ const el=$('betVal'+i); if(!el) return; const s=S.slots[i];
  const raw=parseFloat(String(el.value).replace(/[^0-9.]/g,''));
  if(!isNaN(raw)){ const cap=Math.max(0.10,S.balance); s.bet=Math.max(0.10, Math.min(Math.round(raw*100)/100, cap)); }
  renderAction(i); schedulePersist(); }
function setAuto(i, v){ const s=S.slots[i]; s.auto = v<=1? 0 : Math.min(v,1000); const el=$('autoVal'+i); if(el) el.textContent = s.auto===0? 'OFF' : s.auto.toFixed(2)+'x'; schedulePersist(); }

// click the amount to type your own stake
[0,1].forEach(i=>{ const el=$('betVal'+i); if(!el) return;
  el.addEventListener('focus', ()=>{ try{ el.select(); }catch(e){} });
  el.addEventListener('input', ()=>onBetType(i));
  el.addEventListener('blur',  ()=>setBet(i, S.slots[i].bet));        // normalise display on exit
  el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
});

document.querySelectorAll('[data-bet]').forEach(b=>{
  b.style.touchAction='manipulation';   // no 300ms tap delay / no scroll hijack
  const doStep=()=>{ const i=+(b.dataset.slot||0), s=S.slots[i], up=b.dataset.bet==='+';
    // step scales with the amount so big stakes are quick to dial in (up to €1M+)
    const step = s.bet<=1?0.10 : s.bet<=10?1 : s.bet<100?10 : s.bet<500?50 : s.bet<5000?500 : s.bet<50000?5000 : s.bet<500000?50000 : 100000;
    // snap onto the round grid of `step` so held repeats always land on clean amounts
    const st=Math.round(step*100), cur=Math.round(s.bet*100);
    const nc = up ? Math.floor(cur/st)*st + st : Math.ceil(cur/st)*st - st;
    setBet(i, nc/100);
  };
  // tap = one instant step; press-and-hold = auto-repeat that ACCELERATES (260ms → 40ms).
  // Pointer capture keeps the hold alive even if the finger drifts off the button, so it
  // never feels like it "drops" — and we react on pointerdown for zero-delay feedback.
  let to=null, iv=null, spd=260, held=false;
  const stop=()=>{ clearTimeout(to); clearTimeout(iv); to=iv=null; held=false; b.classList.remove('pressing'); };
  const repeat=()=>{ doStep(); spd=Math.max(40, spd*0.78); iv=setTimeout(repeat, spd); };
  b.addEventListener('pointerdown', e=>{ e.preventDefault();
    try{ b.setPointerCapture(e.pointerId); }catch(_){}
    const ae=document.activeElement; if(ae && ae.classList && ae.classList.contains('bet-input')) ae.blur();   // commit any typed value first
    if(held) return; held=true; b.classList.add('pressing'); doStep(); spd=260; clearTimeout(to); to=setTimeout(repeat, 320); });
  const end=e=>{ try{ b.releasePointerCapture(e.pointerId); }catch(_){} stop(); };
  ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev, end));
});
document.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{
  const i=+(b.dataset.slot||0), s=S.slots[i], up=b.dataset.auto==='+';
  if(s.auto===0){ setAuto(i, up?1.50:0); return; }   // first step out of OFF → 1.50x
  const step = s.auto<2?0.1:s.auto<10?0.5:1;
  let v = s.auto + (up?step:-step);
  if(v<=1.10 && !up) v=0;                              // stepping down past 1.1x → OFF
  setAuto(i, v);
});
document.querySelectorAll('.action[data-slot]').forEach(a=>a.onclick=()=>onAction(+a.dataset.slot));

// chat
function sendChat(){
  const i=$('chatInput'); const v=i.value.trim(); if(!v) return;
  addChat('You', v, false); i.value='';
}
$('chatSend').onclick=sendChat;
$('chatInput').addEventListener('keydown',e=>{ if(e.key==='Enter') sendChat(); });

// sound
function syncSound(){
  const b=$('btnSound'); if(b){ b.textContent=S.sound?'🔊':'🔇'; b.classList.toggle('off',!S.sound); }
  const sw=$('swSound'); if(sw) sw.classList.toggle('on',S.sound);
  const msw=$('menuSoundSw'); if(msw) msw.classList.toggle('on',S.sound);
  applyVolumes();
  if(!S.sound){ stopEngine(); stopThrust(); stopMusic(); }
  const row=$('volRows'); if(row) row.style.opacity=S.sound?'1':'.4';
  saveAudioPrefs();
}
// live mix control from the Music / FX / Sounds sliders
function setVol(cat, v){ S.vol[cat]=Math.max(0,Math.min(1,v)); applyVolumes(); saveAudioPrefs(); }
function saveAudioPrefs(){ try{ localStorage.setItem('rr_audio', JSON.stringify({ sound:S.sound, vol:S.vol })); }catch(e){} }
function loadAudioPrefs(){
  try{ const j=JSON.parse(localStorage.getItem('rr_audio')||'null');
    if(j){ if(typeof j.sound==='boolean') S.sound=j.sound; if(j.vol) S.vol=Object.assign(S.vol, j.vol); }
  }catch(e){}
}
// unlock WebAudio + speech on the first touch (required by iOS Safari). This stays
// PERSISTENT (not once) because iOS suspends/interrupts the AudioContext when the page
// is backgrounded, and it can only be resumed from a user gesture — so every tap
// re-arms the audio. Without this you'd have to refresh to get sound back.
let _spoke=false;
function unlockAudio(){ try{
  const a=ac(); if(a){
    if(a.state!=='running' && a.resume) a.resume();   // resume on each tap if iOS parked it
    // iOS WebAudio only truly unlocks when a buffer is STARTED inside a user gesture
    const b=a.createBuffer(1,1,22050), s=a.createBufferSource(); s.buffer=b; s.connect(a.destination); s.start(0);
  }
  if(!_spoke){ _spoke=true; const sy=window.speechSynthesis; if(sy){ const u=new SpeechSynthesisUtterance(' '); u.volume=0; sy.speak(u); } }
}catch(e){} }
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('touchend', unlockAudio);
// INTRO / SPLASH: tapping LET'S GO must ALWAYS drop you into a FRESH countdown that
// starts at 5. Net rounds run continuously, so instead of revealing on whatever phase is
// live (mid-flight, or a countdown already half-elapsed), we arm and wait for the NEXT
// betting phase, which the server always begins at the top of the countdown. While we wait
// the splash STAYS UP and the button counts down "GET READY… 5 / 4 / 3 / 2 / 1" in sync
// with the spoken audio, so you can see exactly how long until launch — then at lift-off we
// drop you straight into the game.
function revealGame(){ const el=$('intro'); if(el) el.classList.add('gone'); }
// While we wait on the splash for the next fresh round, the button shows a quiet
// "Get ready …" with just a spinning ring — NO numbers, because the wait until the next
// round can be a few seconds and a frozen number looks stuck. The spinner simply tells
// people they're waiting. The real countdown (5 … we have liftoff) and betting happen in
// the GAME the moment we reveal it, so the player can place a bet on that round.
function startReadyBadge(){
  const cta=$('introCta'); if(!cta) return;
  cta.classList.add('cta-ready');
  cta.innerHTML='Get ready <span class="rdy-ring"></span>';
}
function stopReadyBadge(){
  const cta=$('introCta'); if(cta){ cta.classList.remove('cta-ready'); cta.textContent="LET'S GO"; }
}
function maybeRevealOnBetting(){
  // first betting phase after LET'S GO: drop the splash NOW so the in-game countdown
  // (5 … "we have liftoff") plays in the game and the player can place a bet on this round.
  if(S.waitBet){ S.waitBet=false; S.entered=true; stopReadyBadge(); revealGame(); }
}
{ const gb=$('introGo'); if(gb){ const go=()=>{
      unlockAudio();                 // unlock WebAudio inside the user gesture so sound is ready
      if(S.waitBet) return;          // already armed — ignore extra taps
      S.waitBet=true;                // hold on the splash until the next fresh betting phase
      startReadyBadge();
    };
    gb.addEventListener('click', go); gb.addEventListener('touchend', e=>{ e.preventDefault(); go(); }, {passive:false}); }
}
// When the app is backgrounded / screen locks, stop & suspend audio so iOS can't
// RESUME a half-played countdown when you come back (esp. during a long round).
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){ stopCountdownAudio(); stopEngine(); stopThrust(); stopMusic(); try{ if(actx) actx.suspend(); }catch(e){} }
  else { try{ if(actx && actx.state!=='running' && actx.resume) actx.resume(); }catch(e){} }   // next tap re-arms it too
});

// settings opens from the dropdown menu (see menu-item wiring)
$('badgeFair').onclick=openFair;
{ const wc=$('wpClose'); if(wc) wc.onclick=()=>$('winPop').classList.remove('show'); }
{ const sp=$('stagePlayers'); if(sp) sp.onclick=openLeaderboard; }
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{ b.closest('.modal-bg').classList.remove('show'); });
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('show'); }));
$('swSound').onclick=()=>{ S.sound=!S.sound; syncSound(); };
// Music / FX / Sounds volume sliders
function syncVolUI(){
  [['volMusic','music'],['volFx','fx'],['volVoice','voice']].forEach(([id,cat])=>{
    const el=$(id); if(el){ const pct=Math.round((S.vol[cat]==null?0.8:S.vol[cat])*100); el.value=String(pct); const lab=$(id+'Val'); if(lab) lab.textContent=pct+'%'; }
  });
  const row=$('volRows'); if(row) row.style.opacity=S.sound?'1':'.4';
}
[['volMusic','music'],['volFx','fx'],['volVoice','voice']].forEach(([id,cat])=>{
  const el=$(id); if(el) el.addEventListener('input',function(){ setVol(cat, (+this.value||0)/100); const lab=$(id+'Val'); if(lab) lab.textContent=Math.round(+this.value)+'%'; });
});
$('swLow').onclick=function(){ S.lowBw=!S.lowBw; this.classList.toggle('on',S.lowBw); resize(); };
$('swReality').onclick=function(){ this.classList.toggle('on'); };
$('swSession').onclick=function(){ this.classList.toggle('on'); };
{ const rb=$('btnReset'); if(rb) rb.onclick=()=>{ resetProgress(); $('settingsModal').classList.remove('show'); }; }
{ const tb=$('btnTestCredit'); if(tb) tb.onclick=()=>{ testCredit(); $('settingsModal').classList.remove('show'); }; }
// account
{
  const ab=$('btnAccount'); if(ab) ab.onclick=()=>{ $('settingsModal').classList.remove('show'); openAccount(); };
  const bc=$('balanceChip'); if(bc) bc.onclick=openAccount;
  document.querySelectorAll('.atab').forEach(t=>t.onclick=()=>switchAuthTab(t.dataset.auth));
  const sub=$('auSubmit'); if(sub) sub.onclick=()=>{ authMode==='register'?doRegister():doLogin(); };
  const fg=$('auForgot'); if(fg) fg.onclick=doForgot;
  const lo=$('auLogout'); if(lo) lo.onclick=doLogout;
}
// social
{
  const lb=$('btnLeaderboard'); if(lb) lb.onclick=openLeaderboard;
  document.querySelectorAll('.lbtab').forEach(t=>t.onclick=()=>{ S.lbWhen=t.dataset.when; renderLeaderboard(); });
}

// language
$('lang').onchange=e=>{ S.lang=e.target.value; renderAction(); };

// dropdown menu under the ☰ (replaces the bottom nav — calmer, more space)
function closeMenu(){ const d=$('menuDropdown'), b=$('menuBackdrop'); if(d) d.classList.remove('show'); if(b) b.classList.remove('show'); }
function toggleMenu(){ const d=$('menuDropdown'), b=$('menuBackdrop'); if(!d) return; const open=!d.classList.contains('show'); d.classList.toggle('show',open); if(b) b.classList.toggle('show',open); }
{ const bm=$('btnMenu'); if(bm) bm.onclick=toggleMenu; const bk=$('menuBackdrop'); if(bk) bk.onclick=closeMenu; }
document.querySelectorAll('.menu-item').forEach(it=>it.onclick=()=>{
  const a=it.dataset.menu;
  if(a==='sound'){ S.sound=!S.sound; syncSound(); return; }   // toggle, keep menu open
  closeMenu();
  if(a==='account') openAccount();
  else if(a==='history') openScreen('history');
  else if(a==='stats') openScreen('stats');
  else if(a==='leaderboard') openLeaderboard();
  else if(a==='fair') openFair();
  else if(a==='settings') $('settingsModal').classList.add('show');
});
// back buttons on the full-screen tabs
document.querySelectorAll('[data-screen-close]').forEach(b=>b.onclick=()=>closeScreens());

/* ============================================================
   PROVABLY FAIR MODAL
   ============================================================ */
async function openFair(){
  $('fSeedHash').textContent=S.serverSeedHash;
  $('fSeedReveal').textContent=S.prevServerSeed;
  $('fClientSeed').value=S.clientSeed;
  $('fNonce').textContent=S.nonce;
  if(S.lastRound){
    const r=S.lastRound;
    $('fHmac').textContent=r.hmac;
    const computed=crashFromHmac(r.hmac);
    $('fComputed').textContent=computed.toFixed(2)+'x';
    $('fActual').textContent=r.crash.toFixed(2)+'x';
    const ok=Math.abs(computed-r.crash)<0.001;
    $('fMatch').innerHTML=ok?'<span style="color:#22C55E">✓ VERIFIED</span>':'<span style="color:#F43F5E">✗ MISMATCH</span>';
  }
  { const row=$('fMaxWinRow'), v=$('fMaxWin');   // show the operator cap when one is configured
    if(row && v){ if(S.maxMult && S.maxMult>1){ v.textContent=Math.round(S.maxMult).toLocaleString('en-US')+'x'; row.style.display=''; } else { row.style.display='none'; } } }
  $('fairModal').classList.add('show');
}
$('fClientSeed').addEventListener('change',e=>{ const v=e.target.value.trim(); if(v) S.clientSeed=v; });

/* ============================================================
   AMBIENT: online count + bot chatter
   ============================================================ */
function ambient(){
  // online count wobble (drives both the header count and the stage players pill)
  let base = 2800 + Math.floor(rnd(-120,120));
  _int(()=>{ base += Math.floor(rnd(-40,46)); base=Math.max(1800,base); setOnline(base); }, 2200);
  setOnline(base);
  // bot chat
  _int(()=>{
    if(Math.random()<.7){
      const n=NAMES[Math.floor(Math.random()*NAMES.length)];
      addChat(n, CHATTER[Math.floor(Math.random()*CHATTER.length)], false);
    }
  }, 3400);
}

/* ============================================================
   NETWORK: authoritative server, with graceful local fallback
   ============================================================ */
function setOnline(n){
  // header-only total online count
  const v=(typeof n==='number'? n : 0); S._onlineVal=v;
  const o=$('online'); if(o) o.textContent=v.toLocaleString('en-US');
}
// the stage pill shows how many players are STILL riding the current round
function setInRound(n){
  const sp=$('stagePlayers'); if(!sp) return;
  const v=Math.max(0,(typeof n==='number'? n : 0));
  const prev=S._riders==null? v : S._riders; S._riders=v;
  sp.textContent='👥 '+v.toLocaleString('en-US');
  if(v!==prev){                                    // pulse + up/down tint, Aviator-style, whenever it changes
    sp.classList.remove('bump','up','down'); void sp.offsetWidth;
    sp.classList.add('bump', v>prev?'up':'down');
    clearTimeout(S._ridersTmr); S._ridersTmr=setTimeout(()=>sp.classList.remove('up','down'), 600);
  }
}

function netBetting(d){
  S.phase='betting'; S.mult=1.00; particles=[];
  S.slots.forEach(s=>{ s.placed=false; s.amount=0; s.cashedOut=false; s.won=0; });
  S.nonce=d.nonce; S.serverSeedHash=d.serverSeedHash; S.prevServerSeed=d.prevServerSeed; if(d.clientSeed) S.clientSeed=d.clientSeed;
  $('fSeedHash').textContent=S.serverSeedHash||'—';
  $('fSeedReveal').textContent=S.prevServerSeed||'—';
  $('fNonce').textContent=S.nonce;
  S.slots.forEach((s,i)=>{ if(s.queued && S.balance>=s.bet){ s.queued=false; placeBet(i,true); } });
  showCountdown(d.startsInMs, null);   // the server triggers round:start
  maybeRevealOnBetting();
  renderAction();
}
function netStart(){
  S.phase='running'; S.startTs=performance.now();
  $('countWrap').style.display='none'; $('centerMain').style.display='block';
  $('status').textContent='';
  $('mult').classList.remove('crashed-tag');
  sfx.launch(); setTimeout(killCdClip, 2700); renderAction(); tickRun();
}
function netCrash(d){
  if(d.maxMult!=null) S.maxMult=d.maxMult;
  S.phase='crashed'; shakeT=240; S.crashAt=d.crashPoint; S.mult=d.crashPoint;
  S.crashTime=(performance.now()-S.startTs)/1000;
  $('mult').textContent=d.crashPoint.toFixed(2)+'x'; $('mult').style.color=''; $('mult').style.textShadow=''; $('mult').classList.add('crashed-tag');
  { const cm=$('centerMain'); cm.style.transform=''; cm.style.filter=''; }   // reset the dodge/warp
  $('status').textContent='ROCKET BLEW UP 💥'; sfx.crash(); stopEngine(); stopThrust(); stopMusic(); stopCountdownAudio();
  S.crashTs=performance.now(); { const cp=rocketPos(S.crashTime); spawnDebris(cp.x, cp.y); }
  let lost=0; S.slots.forEach(s=>{ if(s.placed && !s.cashedOut){ s.placed=false; lost+=s.amount; } s.curBet=null; });
  if(lost>0) flashWon('−€'+fmt(lost), false);
  { const rw=roundWon(); if(rw>0) showRoundWin(rw); }   // one clear centered pop-up with this round's winnings
  S.lastRound={ nonce:d.nonce, serverSeed:d.serverSeed, clientSeed:d.clientSeed||S.clientSeed, hmac:d.hmac, crash:d.crashPoint };
  pushRound({ nonce:d.nonce, crash:d.crashPoint, serverSeed:d.serverSeed, clientSeed:d.clientSeed||S.clientSeed, hmac:d.hmac });
  pushHistory(d.crashPoint);
  renderAction();
}
function bindNet(sock){
  sock.on('round:betting', d=>{ if(S.mode==='net') netBetting(d); });
  sock.on('round:start',  ()=>{ if(S.mode==='net') netStart(); });
  sock.on('round:crash',  d=>{ if(S.mode==='net') netCrash(d); });
  // In net mode the SERVER is authoritative for balance/stats/bets/tx and pushes
  // them via 'profile'. The client only reflects round UX (sound, flash, action).
  sock.on('bet:confirmed', d=>{ const sl=S.slots[d.slot]; if(sl){ sl.placed=true; sl.amount=d.amount; sl.cashedOut=false; } S.balance=d.balance; updateBalance(); renderAction(d.slot); });
  sock.on('bet:cancelled', d=>{ const sl=S.slots[d.slot]; if(sl) sl.placed=false; S.balance=d.balance; updateBalance(); renderAction(d.slot); });
  sock.on('bet:rejected',  d=>{ renderAction(d&&d.slot!=null?d.slot:0); });
  sock.on('cashout:confirmed', d=>{
    const sl=S.slots[d.slot]; if(sl){ sl.cashedOut=true; sl.placed=false; sl.won=d.payout; } S.balance=d.balance; updateBalance();
    sfx.cash(); addWinner('You','#22C55E',d.multiplier,d.payout,true);
    renderAction(d.slot);   // win pop-up is shown once at round end (see netCrash)
  });
  sock.on('chat',   d=>{ addChat(d.user, d.text, false, d.pid); });
  sock.on('players',d=>{ setOnline(d.count); });
  sock.on('round:players',d=>{ setInRound(d.count); });
  sock.on('welcome',d=>{ setOnline(d.online); S.selfPid=d.pid||null; if(d.maxMult!=null) S.maxMult=d.maxMult; });
  sock.on('profile',d=>{ applyProfile(d); });
  // social: live activity feed, leaderboard, public profiles
  sock.on('activity', ev=>{ addActivity(ev); });
  sock.on('activity:recent', d=>{ const w=$('winners'); if(w) w.innerHTML=''; (d.events||[]).slice().reverse().forEach(addActivity); });
  sock.on('leaderboard', d=>{ S.leaderboard=d; const sc=$('screenLeaderboard'); if(sc && sc.classList.contains('show')) renderLeaderboard(); });
  sock.on('profile:data', d=>{ renderProfile(d); });
  sock.on('history',d=>{
    S.rounds=(d.rounds||[]).map(r=>({ nonce:r.nonce, crash:r.crash, serverSeed:r.serverSeed, clientSeed:r.clientSeed, hmac:r.hmac }));
    if(S.rounds.length){ S.history=S.rounds.slice(0,18).map(r=>r.crash); renderPills(); }
    refreshScreens();
  });
}
function startLocal(){
  if(S.mode==='net') return;
  S.mode='local';
  sysChat('Offline mode — playing a local simulation. Start the game server for live multiplayer.');
  ambient();
  startBetting();
}
function applyProfile(d){
  S.account = d.account || null;
  if(typeof d.balance==='number'){ S.balance=d.balance; updateBalance(); }
  if(d.stats) S.stats=d.stats;
  if(Array.isArray(d.bets)) S.myBets=d.bets;
  if(Array.isArray(d.tx)) S.transactions=d.tx;
  updateAccountUI(); refreshScreens();
}
function connectNet(){
  let settled=false;
  try{
    // Same-origin: the game runs on the same host/port as this page (single origin),
    // so this works on localhost, LAN (iPhone) and a public HTTPS host alike.
    const url = (typeof location!=='undefined' && location.origin) ? location.origin : undefined;
    const sock = io(url, { transports:['websocket','polling'], reconnection:true, timeout:2500, auth:{ playerId:getPid(), token:NET.token } });
    NET.sock=sock;
    bindNet(sock);
    sock.on('connect', ()=>{
      NET.connected=true;
      if(!settled){ settled=true; S.mode='net'; clearInterval(S.cdTimer); sysChat('🌍 Connected — playing live with everyone online.'); }
    });
    sock.on('disconnect', ()=>{ NET.connected=false; });
    sock.on('connect_error', ()=>{ if(!settled){ settled=true; try{sock.close();}catch(e){} startLocal(); } });
    setTimeout(()=>{ if(!settled){ settled=true; try{sock.close();}catch(e){} startLocal(); } }, 3000);
  }catch(e){
    startLocal();
  }
}
function reconnectNet(){
  try{ if(NET.sock){ NET.sock.removeAllListeners(); NET.sock.close(); } }catch(e){}
  NET.sock=null; NET.connected=false; S.mode='net'; // server is up; re-key under new identity
  connectNet();
}

/* ============================================================
   ACCOUNT (Supabase auth) + demo wallet
   ============================================================ */
function authMsg(t){ const e=$('auMsg'); if(e) e.textContent=t||''; }
function txLabel(t){ return ({signup_bonus:'Signup bonus', bet:'Bet placed', win:'Cashout win', refund:'Bet cancelled', reset:'Balance reset', reup:'Free re-up'})[t]||t; }
function renderTx(el){
  if(!el) return; el.innerHTML='';
  if(!S.transactions.length){ el.innerHTML='<div class="empty">No transactions yet.</div>'; return; }
  S.transactions.slice(0,50).forEach(t=>{
    const row=document.createElement('div'); row.className='tx-row'; const pos=t.amount>=0;
    row.innerHTML=`<span class="tl">${txLabel(t.type)}</span><span class="ta ${pos?'pos':'neg'}">${pos?'+':'−'}€${fmt(Math.abs(t.amount))}</span><span class="tb">€${fmt(t.balanceAfter)}</span>`;
    el.appendChild(row);
  });
}
function switchAuthTab(mode){
  authMode=mode;
  document.querySelectorAll('.atab').forEach(x=>x.classList.toggle('active', x.dataset.auth===mode));
  const fu=$('fldUser'); if(fu) fu.style.display = mode==='register'?'block':'none';
  const sb=$('auSubmit'); if(sb) sb.textContent = mode==='register'?'Create account':'Log in';
  authMsg('');
}
function renderAccount(){
  const note=$('acctNote'), auth=$('authView'), prof=$('profileView');
  if(!note) return;
  if(!ACCOUNTS_ENABLED){
    note.textContent='Accounts need Supabase (see README). You’re playing as a guest — progress is saved on this device & synced to the game server.';
    auth.style.display='none'; prof.style.display='none'; return;
  }
  if(S.account){
    auth.style.display='none'; prof.style.display='block';
    note.textContent='Your balance & stats sync across every device you log in on.';
    const u=S.account.username||'player';
    $('pfAvatar').textContent=(u[0]||'R').toUpperCase();
    $('pfName').textContent=u;
    $('pfEmail').textContent=S.account.email||'';
    $('pfBalance').textContent='€'+fmt(S.balance);
    const profit=Math.round((S.stats.returned-S.stats.wagered)*100)/100;
    const pf=$('pfProfit'); pf.textContent=(profit>=0?'+':'−')+'€'+fmt(Math.abs(profit)); pf.style.color = profit>=0?'var(--success)':'var(--danger)';
    renderTx($('pfTx'));
  } else {
    auth.style.display='block'; prof.style.display='none';
    note.textContent='Log in or create an account to sync your balance & stats across devices.';
    switchAuthTab(authMode);
  }
}
function updateAccountUI(){
  const lbl=$('acctLabel'); if(lbl) lbl.textContent = S.account ? (S.account.username||'Account') : (ACCOUNTS_ENABLED?'Log in / Register':'Account (guest)');
  const ma=$('menuAcct'); if(ma) ma.textContent = S.account ? (S.account.username||'Account') : 'Account';
  const am=$('accountModal'); if(am && am.classList.contains('show')) renderAccount();
}
function openAccount(){ renderAccount(); $('accountModal').classList.add('show'); }
async function doRegister(){
  if(!supabase) return;
  const email=$('auEmail').value.trim(), pass=$('auPass').value, user=$('auUser').value.trim();
  if(!email||!pass) return authMsg('Enter email and password.');
  if(!user) return authMsg('Choose a username.');
  if(pass.length<6) return authMsg('Password must be at least 6 characters.');
  authMsg('Creating account…');
  const { data, error } = await supabase.auth.signUp({ email, password:pass, options:{ data:{ username:user } } });
  if(error) return authMsg(error.message);
  if(data.session) authMsg('Account created 🎉');
  else authMsg('Account created — check your email to confirm, then log in.');
}
async function doLogin(){
  if(!supabase) return;
  const email=$('auEmail').value.trim(), pass=$('auPass').value;
  if(!email||!pass) return authMsg('Enter email and password.');
  authMsg('Signing in…');
  const { error } = await supabase.auth.signInWithPassword({ email, password:pass });
  if(error) return authMsg(error.message);
  authMsg('');
}
async function doForgot(){
  if(!supabase) return;
  const email=$('auEmail').value.trim();
  if(!email) return authMsg('Enter your email above first.');
  try{ await supabase.auth.resetPasswordForEmail(email); }catch(e){}
  authMsg('If that email exists, a reset link is on its way. (Demo placeholder.)');
}
async function doLogout(){ if(supabase){ try{ await supabase.auth.signOut(); }catch(e){} } $('accountModal').classList.remove('show'); }
async function authInit(){
  if(supabase){
    try{ const { data } = await supabase.auth.getSession(); NET.token = data && data.session ? data.session.access_token : null; }catch(e){ NET.token=null; }
    supabase.auth.onAuthStateChange((event, session)=>{
      NET.token = session ? session.access_token : null;
      updateAccountUI();
      if(event==='SIGNED_IN'){ const am=$('accountModal'); if(am) am.classList.remove('show'); }
      if((event==='SIGNED_IN' || event==='SIGNED_OUT') && NET.connected){ reconnectNet(); }
    });
  }
  updateAccountUI();
  connectNet();
}

/* ============================================================
   PERSISTENCE: balance (server-authoritative) + history/stats (local)
   ============================================================ */
function getPid(){ try{ let p=localStorage.getItem('rr_pid'); if(!p){ p=randSeed(); localStorage.setItem('rr_pid',p); } return p; }catch(e){ return randSeed(); } }
function persist(){
  try{ localStorage.setItem('rr_save', JSON.stringify({ v:1, balance:S.balance, myBets:S.myBets.slice(0,100), stats:S.stats,
    bets:S.slots.map(s=>({bet:s.bet, auto:s.auto})) })); }catch(e){}   // remember the chosen stake/auto too
}
let _persistTmr=null;
function schedulePersist(){ clearTimeout(_persistTmr); _persistTmr=setTimeout(persist, 350); }   // debounced (steppers fire fast)
function loadSave(){
  try{
    const j=JSON.parse(localStorage.getItem('rr_save')||'null');
    if(j && j.v===1){
      if(Array.isArray(j.myBets)) S.myBets=j.myBets;
      if(j.stats) S.stats=Object.assign(S.stats, j.stats);
      if(typeof j.balance==='number') S.balance=j.balance;  // local mode; net welcome overrides
      if(Array.isArray(j.bets)) j.bets.forEach((b,i)=>{ if(S.slots[i]&&b){ if(typeof b.bet==='number') S.slots[i].bet=b.bet; if(typeof b.auto==='number') S.slots[i].auto=b.auto; } });
    }
  }catch(e){}
}
function resetProgress(){   // demo wallet: reset balance to €1000 (keeps stats/history)
  if(S.mode==='net' && NET.sock){ NET.sock.emit('reset'); }
  else { S.balance=1000; updateBalance(); }
  refreshScreens();
}
function testCredit(){   // DEMO/TEST ONLY: top the demo wallet up to €1,000,000 for big-stake testing
  if(S.mode==='net' && NET.sock){ NET.sock.emit('testcredit'); }
  else { S.balance=1000000; updateBalance(); }
  refreshScreens();
}

/* ============================================================
   SOCIAL: leaderboard + public profiles
   ============================================================ */
function lbRow(rank, e, kind){
  const row=document.createElement('div'); row.className='lb-row';
  if(e.pid){ row.style.cursor='pointer'; row.onclick=()=>openProfile(e.pid); }
  const medal = rank<=3 ? ['🥇','🥈','🥉'][rank-1] : '#'+rank;
  const initial=((e.name||'?')[0]||'?').toUpperCase();
  const main = kind==='win' ? '€'+fmt(e.value) : (e.value||0).toFixed(2)+'x';
  row.innerHTML=`<span class="rk">${medal}</span><div class="av sm" style="background:${e.color||'#FF8A00'}">${initial}</div><span class="lname">${e.name}</span><span class="lval">${main}</span>`;
  return row;
}
function renderLeaderboard(){
  const today = S.lbWhen==='today';
  const wins = today? S.leaderboard.winToday : S.leaderboard.winAll;
  const mult = today? S.leaderboard.multToday : S.leaderboard.multAll;
  document.querySelectorAll('.lbtab').forEach(t=>t.classList.toggle('active', t.dataset.when===S.lbWhen));
  const wEl=$('lbWins'), mEl=$('lbMult'); if(!wEl||!mEl) return;
  wEl.innerHTML=''; mEl.innerHTML='';
  if(!wins||!wins.length) wEl.innerHTML='<div class="empty">No wins yet.</div>'; else wins.forEach((e,i)=>wEl.appendChild(lbRow(i+1,e,'win')));
  if(!mult||!mult.length) mEl.innerHTML='<div class="empty">No multipliers yet.</div>'; else mult.forEach((e,i)=>mEl.appendChild(lbRow(i+1,e,'mult')));
}
function openLeaderboard(){
  if(S.mode==='net' && NET.sock) NET.sock.emit('leaderboard:get');
  closeScreens(false); renderLeaderboard(); $('screenLeaderboard').classList.add('show');
}
function openProfile(pid){
  if(!pid) return;
  if(S.mode==='net' && NET.sock) NET.sock.emit('profile:get', { id:pid });
  else renderProfile({ name:'Player', joinDate:Date.now(), played:0, wins:0, losses:0, best:0, bestPayout:0, winRate:0 });
}
function renderProfile(d){
  const u=d.name||'Player';
  const av=$('prAvatar'); av.textContent=(u[0]||'R').toUpperCase(); if(d.color) av.style.background=d.color;
  $('prName').textContent=u;
  const dt=d.joinDate? new Date(d.joinDate):null;
  $('prJoin').textContent='Joined '+(dt? dt.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—');
  const cards=[
    ['Total Rounds', String(d.played||0), '#fff'],
    ['Win Rate', (d.winRate||0)+'%', '#fff'],
    ['Wins', String(d.wins||0), 'var(--success)'],
    ['Losses', String(d.losses||0), 'var(--danger)'],
    ['Highest Multiplier', (d.best||0).toFixed(2)+'x', 'var(--secondary)'],
    ['Biggest Win', '€'+fmt(d.bestPayout||0), 'var(--success)'],
  ];
  $('prStats').innerHTML=cards.map(([l,v,c])=>`<div class="stat-card"><div class="v" style="color:${c}">${v}</div><div class="l">${l}</div></div>`).join('');
  $('profileModal').classList.add('show');
}

/* ============================================================
   BOOT
   ============================================================ */
function seedWinners(){
  for(let i=0;i<6;i++){
    const n=NAMES[Math.floor(Math.random()*NAMES.length)];
    const m=rnd(1.2,9), bet=Math.round(rnd(20,500)/10)*10;
    addWinner(n,COLORS[i%COLORS.length],m,bet*m);
  }
}
function seedHistory(){
  const demo=[1.23,2.15,8.42,1.08,12.65,2.34,1.91];
  // pushHistory prepends (newest = leftmost), so insert reversed to keep order
  [...demo].reverse().forEach(v=>pushHistory(v));
}
function boot(){
  S.bots=makeBots(18);
  resize();
  requestAnimationFrame(draw);
  seedWinners();
  seedHistory();
  loadSounds();  // preload optional /sounds/* assets (no-op if absent)
  loadArt();     // preload optional /rocket.png + /flame.png artwork (no-op if absent)
  loadSave();   // restore balance (local) + history/stats from a previous session
  loadAudioPrefs();  // restore the sound on/off + Music/FX/Sounds mix
  sysChat('Welcome to Liftoff X 🚀  Place a bet, cash out before the crash.');
  syncSound(); syncVolUI();
  updateBalance();
  setBet(0,S.slots[0].bet); setBet(1,S.slots[1].bet); setAuto(0,S.slots[0].auto); setAuto(1,S.slots[1].auto);   // restore saved stake/auto (defaults €1 / OFF)
  authInit();   // restore Supabase session (if any) → connect to server (or local fallback)
}
boot();


  return () => { ENGINE_ALIVE = false; _ints.forEach(clearInterval); if (typeof S !== "undefined" && S.cdTimer) clearInterval(S.cdTimer); try { if (NET.sock) NET.sock.close(); } catch (e) {} };
}
