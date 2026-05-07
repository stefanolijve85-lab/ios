import requests
from datetime import datetime, timedelta
from logger import log

QUIVER_URL = "https://api.quiverquant.com/beta/live/congresstrading"
_processed_trades = set()


def fetch_signals():
    """Haal recente Congress aankopen op en geef signalen terug."""
    signals = []
    try:
        resp = requests.get(QUIVER_URL, timeout=15)
        if resp.status_code != 200:
            log(f"[CONGRESS] API status: {resp.status_code}")
            return signals

        trades = resp.json()
        cutoff = datetime.now() - timedelta(days=7)

        for trade in trades:
            if trade.get("Transaction") not in ("Purchase", "Buy"):
                continue

            ticker = trade.get("Ticker", "").strip()
            member = trade.get("Representative") or trade.get("Senator", "Onbekend")
            date_str = trade.get("TransactionDate", "")
            trade_id = f"{ticker}-{member}-{date_str}"

            if not ticker or trade_id in _processed_trades:
                continue

            try:
                date = datetime.strptime(date_str, "%Y-%m-%d")
                if date < cutoff:
                    continue
            except Exception:
                continue

            _processed_trades.add(trade_id)
            amount = trade.get("Amount", "onbekend")

            log(f"[CONGRESS] Aankoop gevonden: {ticker} door {member} op {date_str} (${amount})")
            signals.append({
                "ticker": ticker,
                "action": "BUY",
                "member": member,
                "date":   date_str,
                "amount": amount
            })

    except Exception as e:
        log(f"[CONGRESS] Fout: {e}")

    return signals
