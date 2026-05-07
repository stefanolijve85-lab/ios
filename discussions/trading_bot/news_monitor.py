import feedparser
import re
from datetime import datetime
from logger import log
from config import NEWS_FEEDS, BUY_KEYWORDS, SELL_KEYWORDS

# Bijhouden welke artikelen al verwerkt zijn
_seen_articles = set()

# Bekende ticker symbolen om te herkennen in nieuws
WATCHLIST = {
    "Tesla": "TSLA", "Apple": "AAPL", "AAPL": "AAPL", "TSLA": "TSLA",
    "Nvidia": "NVDA", "NVDA": "NVDA", "Microsoft": "MSFT", "MSFT": "MSFT",
    "Amazon": "AMZN", "AMZN": "AMZN", "Google": "GOOGL", "Alphabet": "GOOGL",
    "Meta": "META", "Netflix": "NFLX", "AMD": "AMD", "Intel": "INTC",
    "JPMorgan": "JPM", "Goldman": "GS", "Palantir": "PLTR", "Rivian": "RIVN",
    "Uber": "UBER", "Airbnb": "ABNB", "Coinbase": "COIN", "PayPal": "PYPL",
}


def extract_ticker(text):
    """Zoek naar bedrijfsnaam of ticker in tekst."""
    text_upper = text.upper()
    for name, ticker in WATCHLIST.items():
        if name.upper() in text_upper or f"${ticker}" in text_upper:
            return ticker
    # Zoek naar $TICKER patroon
    match = re.search(r'\$([A-Z]{2,5})\b', text)
    if match:
        return match.group(1)
    return None


def analyze_sentiment(text):
    """Bepaal of nieuws positief of negatief is."""
    text_lower = text.lower()
    buy_score  = sum(1 for kw in BUY_KEYWORDS  if kw in text_lower)
    sell_score = sum(1 for kw in SELL_KEYWORDS if kw in text_lower)
    if buy_score > sell_score:
        return "BUY", buy_score
    if sell_score > buy_score:
        return "SELL", sell_score
    return "NEUTRAL", 0


def fetch_signals():
    """Haal nieuws op en geef trading signalen terug."""
    signals = []

    for feed_url in NEWS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:20]:
                article_id = entry.get("id", entry.get("link", ""))
                if article_id in _seen_articles:
                    continue
                _seen_articles.add(article_id)

                title   = entry.get("title", "")
                summary = entry.get("summary", "")
                full_text = f"{title} {summary}"

                ticker = extract_ticker(full_text)
                if not ticker:
                    continue

                action, score = analyze_sentiment(full_text)
                if action == "NEUTRAL" or score == 0:
                    continue

                signals.append({
                    "ticker": ticker,
                    "action": action,
                    "score":  score,
                    "title":  title[:120],
                    "source": feed.feed.get("title", feed_url),
                    "time":   datetime.now().strftime("%H:%M:%S")
                })

                log(f"[NIEUWS] {action} signaal voor {ticker} (score:{score}) | {title[:80]}")

        except Exception as e:
            log(f"[NIEUWS] Fout bij feed {feed_url}: {e}")

    return signals
