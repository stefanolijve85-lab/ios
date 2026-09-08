#!/usr/bin/env python3
"""
Trading Bot Scheduler
- Draait op de achtergrond op je Mac
- Actief tijdens Amerikaanse beurs-uren (09:30 - 16:00 ET)
- Monitort Congress trades elke 30 minuten
- Monitort financieel nieuws elke 2 minuten
- Plaatst automatisch orders op Alpaca paper account

Start:  python3 scheduler.py
Stop:   Ctrl+C  of  kill $(cat bot.pid)
Logs:   tail -f trading_bot.log
"""

import time
import os
import sys
import signal
from datetime import datetime

import alpaca
import news_monitor
import congress_monitor
from logger import log
from config import NEWS_INTERVAL_SEC, CONGRESS_INTERVAL_SEC, QTY_PER_TRADE

PID_FILE = os.path.join(os.path.dirname(__file__), "bot.pid")

_last_news_check     = 0
_last_congress_check = 0
_traded_today        = set()   # Voorkom dubbele trades per dag


def write_pid():
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))


def cleanup(sig=None, frame=None):
    log("[BOT] Gestopt.")
    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)
    sys.exit(0)


def reset_daily():
    """Reset traded set elke nieuwe dag."""
    global _traded_today
    _traded_today = set()
    log("[BOT] Nieuwe handelsdag — trades gereset.")


def execute_signal(signal_data, source):
    """Voer een trade uit op basis van een signaal."""
    ticker = signal_data["ticker"]
    action = signal_data["action"]

    if ticker in _traded_today:
        log(f"[BOT] {ticker} al verhandeld vandaag — sla over.")
        return

    if not alpaca.is_market_open():
        log(f"[BOT] Markt gesloten — {ticker} order niet geplaatst.")
        return

    account = alpaca.get_account()
    cash = float(account.get("cash", 0))
    if cash < 50:
        log(f"[BOT] Onvoldoende cash (${cash:.2f}) — kan niet handelen.")
        return

    if action == "BUY":
        if alpaca.already_has_position(ticker) or alpaca.already_has_order(ticker):
            log(f"[BOT] Al een positie of order voor {ticker} — sla over.")
            return
        order = alpaca.place_buy(ticker, qty=QTY_PER_TRADE)
        status = order.get("status", order.get("message", "?"))
        log(f"[BOT] KOOP {ticker} x{QTY_PER_TRADE} via {source} | status: {status} | ID: {order.get('id','?')}")

    elif action == "SELL":
        if not alpaca.already_has_position(ticker):
            log(f"[BOT] Geen positie in {ticker} om te verkopen.")
            return
        order = alpaca.place_sell(ticker, qty=QTY_PER_TRADE)
        status = order.get("status", order.get("message", "?"))
        log(f"[BOT] VERKOOP {ticker} x{QTY_PER_TRADE} via {source} | status: {status} | ID: {order.get('id','?')}")

    _traded_today.add(ticker)


def check_market_status():
    """Log de markt status."""
    clock = alpaca.get_clock()
    is_open = clock.get("is_open", False)
    next_event = clock.get("next_open" if not is_open else "next_close", "?")
    status = "OPEN" if is_open else "GESLOTEN"
    log(f"[MARKT] Status: {status} | Volgende event: {next_event}")
    return is_open


def run_news_check():
    global _last_news_check
    now = time.time()
    if now - _last_news_check < NEWS_INTERVAL_SEC:
        return
    _last_news_check = now
    log("[NIEUWS] Nieuws scannen...")
    signals = news_monitor.fetch_signals()
    if signals:
        log(f"[NIEUWS] {len(signals)} signaal(en) gevonden.")
        for s in signals:
            execute_signal(s, source=f"Nieuws:{s.get('source','?')}")
    else:
        log("[NIEUWS] Geen nieuwe signalen.")


def run_congress_check():
    global _last_congress_check
    now = time.time()
    if now - _last_congress_check < CONGRESS_INTERVAL_SEC:
        return
    _last_congress_check = now
    log("[CONGRESS] Congress trades checken...")
    signals = congress_monitor.fetch_signals()
    if signals:
        log(f"[CONGRESS] {len(signals)} nieuwe trade(s) gevonden.")
        for s in signals:
            execute_signal(s, source=f"Congress:{s.get('member','?')}")
    else:
        log("[CONGRESS] Geen nieuwe Congress trades.")


def main():
    write_pid()
    signal.signal(signal.SIGINT,  cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    log("=" * 60)
    log("[BOT] Congress & Nieuws Trading Bot gestart")
    log(f"[BOT] PID: {os.getpid()} | Log: trading_bot.log")
    log(f"[BOT] Nieuws check: elke {NEWS_INTERVAL_SEC//60} min")
    log(f"[BOT] Congress check: elke {CONGRESS_INTERVAL_SEC//60} min")
    log("=" * 60)

    # Account info tonen
    account = alpaca.get_account()
    log(f"[ACCOUNT] Status: {account.get('status')} | Cash: ${float(account.get('cash',0)):,.2f} | Portfolio: ${float(account.get('portfolio_value',0)):,.2f}")

    last_day = datetime.now().date()
    check_market_status()

    # Direct eerste check uitvoeren
    _last_news_check     = 0
    _last_congress_check = 0

    while True:
        try:
            now = datetime.now()

            # Reset elke nieuwe dag
            if now.date() != last_day:
                last_day = now.date()
                reset_daily()
                check_market_status()

            # Elke 30 minuten markt status loggen
            if now.minute in (0, 30) and now.second < 10:
                check_market_status()

            run_congress_check()
            run_news_check()

            time.sleep(10)  # Elke 10 seconden de loop checken

        except KeyboardInterrupt:
            cleanup()
        except Exception as e:
            log(f"[BOT] Onverwachte fout: {e}")
            time.sleep(30)


if __name__ == "__main__":
    main()
