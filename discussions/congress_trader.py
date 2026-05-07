#!/usr/bin/env python3
"""
Congress Trading Bot
Volgt aankopen van Amerikaanse congresleden (STOCK Act data)
en plaatst automatisch dezelfde trades op Alpaca paper account.
"""

import requests
import json
import os
from datetime import datetime, timedelta

ALPACA_KEY    = os.environ.get("ALPACA_API_KEY", "PKTP2H5MQ5IYZJW4YU5DZHDELR")
ALPACA_SECRET = os.environ.get("ALPACA_SECRET_KEY", "82GvS5zfFrkmRVG1fEaWdgizFYfx8cDixmnK44hdFmTi")
ALPACA_URL    = os.environ.get("ALPACA_BASE_URL", "https://paper-api.alpaca.markets/v2")

HEADERS_ALPACA = {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
    "Content-Type": "application/json"
}

# Quiver Quant - gratis Congressional trading data
QUIVER_URL = "https://api.quiverquant.com/beta/live/congresstrading"


def get_congress_trades():
    """Haal recente Congress aankopen op via Quiver Quant."""
    try:
        resp = requests.get(QUIVER_URL, timeout=10)
        if resp.status_code == 200:
            trades = resp.json()
            # Filter: alleen aankopen van afgelopen 7 dagen
            cutoff = datetime.now() - timedelta(days=7)
            buys = []
            for t in trades:
                if t.get("Transaction") in ("Purchase", "Buy"):
                    try:
                        date = datetime.strptime(t["TransactionDate"], "%Y-%m-%d")
                        if date >= cutoff:
                            buys.append(t)
                    except Exception:
                        pass
            return buys
        else:
            print(f"Quiver Quant status: {resp.status_code}")
            return []
    except Exception as e:
        print(f"Fout bij ophalen Congress data: {e}")
        return []


def get_account():
    """Haal Alpaca account info op."""
    resp = requests.get(f"{ALPACA_URL}/account", headers=HEADERS_ALPACA)
    return resp.json()


def place_order(symbol, qty=1):
    """Koop een aandeel op Alpaca paper account."""
    payload = {
        "symbol": symbol,
        "qty": str(qty),
        "side": "buy",
        "type": "market",
        "time_in_force": "gtc"
    }
    resp = requests.post(f"{ALPACA_URL}/orders", headers=HEADERS_ALPACA, json=payload)
    return resp.json()


def get_open_orders():
    resp = requests.get(f"{ALPACA_URL}/orders", headers=HEADERS_ALPACA)
    return resp.json()


def get_positions():
    resp = requests.get(f"{ALPACA_URL}/positions", headers=HEADERS_ALPACA)
    return resp.json()


def run():
    print("=" * 60)
    print("Congress Trading Bot - Paper Account")
    print("=" * 60)

    # Account status
    account = get_account()
    print(f"\nAccount status : {account.get('status')}")
    print(f"Cash beschikbaar: ${float(account.get('cash', 0)):,.2f}")
    print(f"Portfolio waarde: ${float(account.get('portfolio_value', 0)):,.2f}")

    # Huidige posities
    positions = get_positions()
    if positions:
        print(f"\nHuidige posities ({len(positions)}):")
        for p in positions:
            print(f"  {p['symbol']:6s}  qty: {p['qty']:>6}  waarde: ${float(p.get('market_value', 0)):,.2f}")

    # Congress trades ophalen
    print("\nCongress trades ophalen...")
    trades = get_congress_trades()

    if not trades:
        print("Geen recente Congress aankopen gevonden (of API limiet bereikt).")
        print("\nVoorbeeld van hoe het werkt als er trades zijn:")
        print("  Congreslid koopt AAPL -> bot koopt 1 AAPL")
        print("  Congreslid koopt NVDA -> bot koopt 1 NVDA")
        return

    # Top aankopen tonen en uitvoeren
    print(f"\n{len(trades)} recente aankopen gevonden:")
    already_ordered = set()

    for trade in trades[:10]:  # max 10 per run
        symbol = trade.get("Ticker", "").strip()
        member = trade.get("Representative", trade.get("Senator", "Onbekend"))
        date   = trade.get("TransactionDate", "")
        amount = trade.get("Amount", "")

        if not symbol or symbol in already_ordered:
            continue

        print(f"\n  {symbol:6s} | {member} | {date} | ${amount}")

        order = place_order(symbol, qty=1)
        status = order.get("status", order.get("message", "onbekend"))
        print(f"  -> Order: {status} (ID: {order.get('id', 'n/a')})")
        already_ordered.add(symbol)

    print("\n" + "=" * 60)
    print("Klaar. Controleer je Alpaca dashboard voor de orders.")


if __name__ == "__main__":
    run()
