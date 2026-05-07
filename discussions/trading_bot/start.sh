#!/bin/bash
# Start de trading bot op de achtergrond op je Mac

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Check of Python3 beschikbaar is
if ! command -v python3 &>/dev/null; then
    echo "Python3 niet gevonden. Installeer via: brew install python3"
    exit 1
fi

# Installeer dependencies als ze nog niet er zijn
pip3 install requests feedparser schedule --quiet

# Check of bot al draait
if [ -f bot.pid ]; then
    PID=$(cat bot.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "Bot draait al (PID: $PID)"
        echo "Stop eerst met: ./stop.sh"
        exit 1
    fi
fi

echo "Trading bot starten..."
nohup python3 scheduler.py > /dev/null 2>&1 &
sleep 1

if [ -f bot.pid ]; then
    echo "Bot gestart! PID: $(cat bot.pid)"
    echo ""
    echo "Live logs bekijken:  tail -f $DIR/trading_bot.log"
    echo "Bot stoppen:         ./stop.sh"
else
    echo "Fout: bot kon niet starten. Check trading_bot.log"
fi
