import os

# Alpaca Paper Trading
ALPACA_KEY    = os.environ.get("ALPACA_API_KEY",    "PKTP2H5MQ5IYZJW4YU5DZHDELR")
ALPACA_SECRET = os.environ.get("ALPACA_SECRET_KEY", "82GvS5zfFrkmRVG1fEaWdgizFYfx8cDixmnK44hdFmTi")
ALPACA_URL    = "https://paper-api.alpaca.markets/v2"

HEADERS = {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
    "Content-Type": "application/json"
}

# Markt tijden (Eastern Time)
MARKET_OPEN_HOUR   = 9
MARKET_OPEN_MIN    = 30
MARKET_CLOSE_HOUR  = 16
MARKET_CLOSE_MIN   = 0

# Bot instellingen
MAX_POSITION_VALUE = 500    # Max $ per positie
QTY_PER_TRADE      = 1      # Aantal aandelen per trade
NEWS_INTERVAL_SEC  = 120    # Nieuws checken elke 2 min
CONGRESS_INTERVAL_SEC = 1800  # Congress trades checken elke 30 min

# RSS nieuws bronnen (geen API key nodig)
NEWS_FEEDS = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=TSLA,AAPL,NVDA,MSFT,AMZN&region=US&lang=en-US",
    "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "https://feeds.reuters.com/reuters/businessNews",
    "https://www.marketwatch.com/rss/topstories",
]

# Trefwoorden die een koopsignaal geven
BUY_KEYWORDS = [
    "beats earnings", "record revenue", "strong growth", "upgrades",
    "buy rating", "price target raised", "partnership", "contract won",
    "fda approved", "breakthrough", "acquisition"
]

# Trefwoorden die een verkoopsignaal geven
SELL_KEYWORDS = [
    "misses earnings", "revenue decline", "downgrade", "sell rating",
    "price target cut", "investigation", "recall", "bankruptcy",
    "layoffs", "ceo resigns", "fraud"
]
