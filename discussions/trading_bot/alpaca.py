import requests
from config import ALPACA_URL, HEADERS


def get_account():
    r = requests.get(f"{ALPACA_URL}/account", headers=HEADERS, timeout=10)
    return r.json()


def get_positions():
    r = requests.get(f"{ALPACA_URL}/positions", headers=HEADERS, timeout=10)
    return r.json() if r.status_code == 200 else []


def get_open_orders():
    r = requests.get(f"{ALPACA_URL}/orders?status=open", headers=HEADERS, timeout=10)
    return r.json() if r.status_code == 200 else []


def already_has_position(symbol):
    positions = get_positions()
    return any(p["symbol"] == symbol for p in positions)


def already_has_order(symbol):
    orders = get_open_orders()
    return any(o["symbol"] == symbol for o in orders)


def place_buy(symbol, qty=1):
    payload = {
        "symbol": symbol,
        "qty": str(qty),
        "side": "buy",
        "type": "market",
        "time_in_force": "gtc"
    }
    r = requests.post(f"{ALPACA_URL}/orders", headers=HEADERS, json=payload, timeout=10)
    return r.json()


def place_sell(symbol, qty=1):
    payload = {
        "symbol": symbol,
        "qty": str(qty),
        "side": "sell",
        "type": "market",
        "time_in_force": "gtc"
    }
    r = requests.post(f"{ALPACA_URL}/orders", headers=HEADERS, json=payload, timeout=10)
    return r.json()


def is_market_open():
    r = requests.get(f"{ALPACA_URL}/clock", headers=HEADERS, timeout=10)
    if r.status_code == 200:
        return r.json().get("is_open", False)
    return False


def get_clock():
    r = requests.get(f"{ALPACA_URL}/clock", headers=HEADERS, timeout=10)
    return r.json() if r.status_code == 200 else {}
