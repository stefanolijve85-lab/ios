// Single source of truth for game tuning. Shared shape is mirrored on the
// client in src/lib/constants.ts (kept intentionally small + in sync).
module.exports = {
  // Phase durations (ms)
  BETTING_MS: 5000, // vault open, players place bets
  CRASHED_MS: 2500, // heist animation + payout display
  MAX_RUN_MS: 22000, // hard cap on a running round (thief timer length)

  // Multiplier curve: m(t) = e^(GROWTH_K * t_seconds)  (accelerating, Aviator-style)
  // GROWTH_K chosen so the 100x hard cap is reached right at ~22s.
  GROWTH_K: 0.21,

  // Crash distribution
  HOUSE_EDGE: 0.03, // probability of an instant 1.00x bust + tail trim
  MAX_MULTIPLIER: 100.0, // cap so a round always fits inside MAX_RUN_MS (rare high rounds)

  // Tick / broadcast rate (ms). Clients animate at 60fps locally from startTime.
  TICK_MS: 100,

  // Crowd simulation
  BASE_ONLINE: 12000,
  ONLINE_JITTER: 900,
  MIN_HOLDERS: 1400,
  MAX_HOLDERS: 3200,

  // Demo economy
  START_BALANCE: 2453.21,
};
