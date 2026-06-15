// Engine configuration.
//
//  - `base`   : shared across every title (economy, tick rate, tuning defaults).
//  - `games`  : per-game *feel* tuning (volatility + pacing) and optional RTP.
//  - RTP      : CONFIGURABLE. Operators pick an RTP variant; provably-fair stays
//               intact and the active RTP is transparent per deployment.
//
// RTP resolution order (highest first):
//   1. env XIT_RTP (deployment-wide, e.g. an operator runs the whole site at 96)
//   2. games[key].rtp (a specific title's default)
//   3. DEFAULT_RTP (97)
//
// configFor(key) merges base + the game's tuning + the resolved house edge.

// RTP variant → house edge. Add/trim variants here; each is certified separately.
const RTP_VARIANTS = { 99: 0.01, 97: 0.03, 96: 0.04, 95: 0.05, 94: 0.06 };
const DEFAULT_RTP = 97;

function edgeForRtp(rtp) {
  return RTP_VARIANTS[rtp] != null ? RTP_VARIANTS[rtp] : RTP_VARIANTS[DEFAULT_RTP];
}
function deploymentRtp() {
  const r = parseInt(process.env.XIT_RTP, 10);
  return RTP_VARIANTS[r] != null ? r : DEFAULT_RTP;
}

const base = {
  TICK_MS: 100,
  BASE_ONLINE: 12000,
  ONLINE_JITTER: 900,
  MIN_HOLDERS: 1400,
  MAX_HOLDERS: 3200,
  START_BALANCE: 2453.21,

  // tuning defaults (a game may override any of these)
  BETTING_MS: 5000,
  CRASHED_MS: 2500,
  MAX_RUN_MS: 22000,
  GROWTH_K: 0.21,
  MAX_MULTIPLIER: 100.0,
};

// Per-game "feel": curve speed (GROWTH_K), ceiling (MAX_MULTIPLIER), pacing, and
// an optional default `rtp` (one of RTP_VARIANTS). GROWTH_K is chosen so the cap
// is reached right at ~MAX_RUN_MS. Betting stays 5s everywhere so the bomb-clock
// tick audio (4.6s) lines up.
const games = {
  bankheistx: { GROWTH_K: 0.21, MAX_MULTIPLIER: 100.0, MAX_RUN_MS: 22000 },
  liftoffx: { GROWTH_K: 0.30, MAX_MULTIPLIER: 1000.0, MAX_RUN_MS: 23000 },
  trainridex: { GROWTH_K: 0.24, MAX_MULTIPLIER: 200.0, MAX_RUN_MS: 22000 },
  // DEEP DIVE X — descent into the abyss: medium-fast, high ceiling before the breach.
  deepdivex: { GROWTH_K: 0.26, MAX_MULTIPLIER: 300.0, MAX_RUN_MS: 22000 },
};

const DEFAULT_GAME_KEY = 'bankheistx';

function configFor(key) {
  const k = games[key] ? key : DEFAULT_GAME_KEY;
  const g = games[k];
  const rtp = g.rtp != null && RTP_VARIANTS[g.rtp] != null ? g.rtp : deploymentRtp();
  return { key: k, ...base, ...g, RTP: rtp, HOUSE_EDGE: edgeForRtp(rtp) };
}

module.exports = { base, games, configFor, DEFAULT_GAME_KEY, RTP_VARIANTS, DEFAULT_RTP };
