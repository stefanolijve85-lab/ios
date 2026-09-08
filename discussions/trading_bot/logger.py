import os
from datetime import datetime

LOG_FILE = os.path.join(os.path.dirname(__file__), "trading_bot.log")


def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")
