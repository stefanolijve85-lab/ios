// Demo wallet — the built-in local wallet used for fun-play / demo mode.
//
// Balances live in the RGS store (wallet accounts). No external money. Every
// player session is seeded with an opening demo balance. Implements the same
// WalletProvider contract as the seamless wallet, so switching to real money is
// purely a config change.
//
// WalletProvider contract (all amounts in integer minor units):
//   getBalance(session)                              -> balanceMinor
//   debit({ session, amountMinor, ref, ... })        -> { balanceMinor }
//   credit({ session, amountMinor, ref, ... })       -> { balanceMinor }
//   rollback({ session, amountMinor, ref, ... })     -> { balanceMinor }
// Idempotency (by `ref`) is enforced by the RGS ledger, not here.

class InsufficientFundsError extends Error {
  constructor() { super('INSUFFICIENT_FUNDS'); this.code = 'INSUFFICIENT_FUNDS'; }
}

class DemoWallet {
  constructor({ store, openingMinor }) {
    this.store = store;
    this.openingMinor = openingMinor;
    this.kind = 'demo';
  }

  async ensureAccount(session) {
    return this.store.ensureWalletAccount(session, this.openingMinor);
  }

  async getBalance(session) {
    await this.ensureAccount(session);
    return this.store.getWalletBalance(session);
  }

  async debit({ session, amountMinor }) {
    await this.ensureAccount(session);
    const bal = await this.store.getWalletBalance(session);
    if (amountMinor > bal) throw new InsufficientFundsError();
    return { balanceMinor: await this.store.setWalletBalance(session, bal - amountMinor) };
  }

  async credit({ session, amountMinor }) {
    await this.ensureAccount(session);
    const bal = await this.store.getWalletBalance(session);
    return { balanceMinor: await this.store.setWalletBalance(session, bal + amountMinor) };
  }

  // refund a previously debited stake (bet cancel / round rollback)
  async rollback({ session, amountMinor }) {
    return this.credit({ session, amountMinor });
  }
}

module.exports = { DemoWallet, InsufficientFundsError };
