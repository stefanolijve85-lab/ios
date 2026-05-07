import requests

ENDPOINT = "https://paper-api.alpaca.markets/v2"
API_KEY = "PKTP2H5MQ5IYZJW4YU5DZHDELR"
API_SECRET = "82GvS5zfFrkmRVG1fEaWdgizFYfx8cDixmnK44hdFmTi"

headers = {
    "APCA-API-KEY-ID": API_KEY,
    "APCA-API-SECRET-KEY": API_SECRET,
    "Content-Type": "application/json"
}

# Check account
account = requests.get(f"{ENDPOINT}/account", headers=headers)
print("Account:", account.json().get("status"), "| Cash:", account.json().get("cash"))

# Place buy order for 1 TSLA
order = requests.post(f"{ENDPOINT}/orders", headers=headers, json={
    "symbol": "TSLA",
    "qty": "1",
    "side": "buy",
    "type": "market",
    "time_in_force": "gtc"
})

result = order.json()
print("\nOrder geplaatst:")
print(f"  ID:     {result.get('id')}")
print(f"  Symbol: {result.get('symbol')}")
print(f"  Qty:    {result.get('qty')}")
print(f"  Side:   {result.get('side')}")
print(f"  Status: {result.get('status')}")
print(f"  Type:   {result.get('type')}")
