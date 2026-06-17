// RGS (Remote Gaming Server) configuration — read once from the environment.
//
// The engine runs in one of two modes:
//   - 'demo'     : a built-in local wallet + ledger (no external money). This is
//                  the default so the games keep working out of the box.
//   - 'seamless' : real-money play. Bets/wins are settled against an operator's
//                  seamless wallet API (debit/credit/rollback). Required for
//                  aggregator / partner integrations.
//
// Money is handled everywhere in INTEGER MINOR UNITS (e.g. cents) to avoid any
// floating-point drift in the ledger. Conversion to/from major units happens
// only at the UI boundary.

function intEnv(name, fallback) {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) ? v : fallback;
}

const config = {
  // 'demo' | 'seamless'
  mode: (process.env.RGS_MODE || 'demo').toLowerCase(),

  // 'memory' | 'postgres'
  store: (process.env.RGS_STORE || 'memory').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || '',

  // HMAC secret used to sign/verify launch tokens. MUST be overridden in prod.
  secret: process.env.RGS_SECRET || 'dev-insecure-rgs-secret-change-me',

  // seamless wallet API base URL + auth (operator side)
  walletUrl: process.env.RGS_WALLET_URL || '',
  walletApiKey: process.env.RGS_WALLET_KEY || '',
  walletTimeoutMs: intEnv('RGS_WALLET_TIMEOUT_MS', 8000),

  // defaults for demo play
  currency: process.env.RGS_CURRENCY || 'EUR',
  demoBalanceMinor: intEnv('RGS_DEMO_BALANCE_MINOR', 245321), // €2453.21

  // launch-token lifetime (seconds)
  tokenTtlSec: intEnv('RGS_TOKEN_TTL_SEC', 3600),

  // Responsible Gaming / player protection. Everything defaults to 0 (= OFF) so
  // demo play is unchanged; an operator turns limits on via env, or per player
  // via the launch token's `limits` claim (which overrides these defaults).
  // Money limits are in INTEGER MINOR UNITS; times in milliseconds.
  rg: {
    stakeMaxMinor: intEnv('RG_STAKE_MAX_MINOR', 0),            // max stake per bet
    sessionWagerMaxMinor: intEnv('RG_SESSION_WAGER_MAX_MINOR', 0), // max total staked / session
    sessionLossMaxMinor: intEnv('RG_SESSION_LOSS_MAX_MINOR', 0),   // max net loss / session
    sessionTimeMaxMs: intEnv('RG_SESSION_TIME_MAX_MS', 0),    // max session length
    realityCheckMs: intEnv('RG_REALITY_CHECK_MS', 0),         // periodic "you've played N min" nudge
  },
};

function isProd() {
  return process.env.NODE_ENV === 'production';
}

// Surface obvious misconfigurations early (don't throw — just warn loudly).
function validate(log = console) {
  if (config.mode === 'seamless' && !config.walletUrl) {
    log.warn('[RGS] mode=seamless but RGS_WALLET_URL is not set');
  }
  if (config.store === 'postgres' && !config.databaseUrl) {
    log.warn('[RGS] store=postgres but DATABASE_URL is not set');
  }
  if (isProd() && config.secret === 'dev-insecure-rgs-secret-change-me') {
    log.warn('[RGS] RGS_SECRET is the insecure default — set a strong secret in production');
  }
}

module.exports = { config, validate, isProd };
