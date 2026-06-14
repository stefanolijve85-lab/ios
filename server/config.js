// Engine configuration.
//
//  - `base`   : shared across EVERY Olive Games title. Most importantly the
//               single transparent HOUSE_EDGE (RTP). This is intentionally NOT
//               overridable per game — fairness/RTP is identical everywhere.
//  - `games`  : per-game *feel* tuning only (volatility + pacing). It can never
//               touch the house edge or the fairness engine.
//
// configFor(key) merges base + the game's tuning into the object the Game
// instance runs on.

const base = {
  // shared fairness / economy — same for all games
  HOUSE_EDGE: 0.03, // ONE transparent value → RTP 97% for every title
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

// Per-game "feel": curve speed (GROWTH_K), ceiling (MAX_MULTIPLIER) and pacing.
// GROWTH_K is chosen so the cap is reached right at ~MAX_RUN_MS. Betting stays
// 5s everywhere so the bomb-clock tick audio (4.6s) lines up.
const games = {
  // BANKHEIST X — tense, slow-burn vault. (unchanged from before)
  bankheistx: { GROWTH_K: 0.21, MAX_MULTIPLIER: 100.0, MAX_RUN_MS: 22000 },
  // LIFTOFF X — fast, "to the moon" rocket: climbs quicker, far higher ceiling.
  liftoffx: { GROWTH_K: 0.30, MAX_MULTIPLIER: 1000.0, MAX_RUN_MS: 23000 },
};

const DEFAULT_GAME_KEY = 'bankheistx';

function configFor(key) {
  const k = games[key] ? key : DEFAULT_GAME_KEY;
  return { key: k, ...base, ...games[k] };
}

module.exports = { base, games, configFor, DEFAULT_GAME_KEY };
