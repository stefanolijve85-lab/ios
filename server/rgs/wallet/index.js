// Wallet factory — pick the wallet provider from config (RGS_MODE).
//   demo     : built-in local wallet (default)
//   seamless : real-money operator wallet API

const { DemoWallet } = require('./demo');
const { SeamlessHttpWallet } = require('./seamless');

function createWallet(config, store) {
  if (config.mode === 'seamless') {
    return new SeamlessHttpWallet({
      baseUrl: config.walletUrl,
      apiKey: config.walletApiKey,
      timeoutMs: config.walletTimeoutMs,
    });
  }
  return new DemoWallet({ store, openingMinor: config.demoBalanceMinor });
}

module.exports = { createWallet };
