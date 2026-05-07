#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$DIR/bot.pid" ]; then
    echo "Bot draait niet (geen bot.pid gevonden)."
    exit 0
fi

PID=$(cat "$DIR/bot.pid")
if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "Bot gestopt (PID: $PID)"
    rm -f "$DIR/bot.pid"
else
    echo "Bot was al gestopt."
    rm -f "$DIR/bot.pid"
fi
