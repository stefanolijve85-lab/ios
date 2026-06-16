// Store factory — pick the ledger backing from config (RGS_STORE).
//   memory   : in-process (default; dev / demo / tests)
//   postgres : durable (lazy-loads `pg`; required for real-money play)

const { MemoryStore } = require('./memory');

function createStore(config, log = console) {
  if (config.store === 'postgres') {
    try {
      const { PostgresStore } = require('./postgres');
      return new PostgresStore(config.databaseUrl);
    } catch (e) {
      log.error('[RGS] failed to load Postgres store, falling back to memory:', e && e.message);
      return new MemoryStore();
    }
  }
  return new MemoryStore();
}

module.exports = { createStore };
