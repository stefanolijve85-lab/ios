#!/bin/bash
# Build RIOTS on the server itself and put it online: for when you are logged in on the server (PuTTY from the office)
# and the Mac with its WireGuard tunnel is not at hand. It fetches the code from GitHub into ~/riots-src (a build-only
# copy: it is reset to GitHub every time, never edit in it), builds it and copies the result to /var/www/riots.
#
# First time:   git clone --depth 1 -b claude/happy-hypatia-1smfhz https://github.com/stefanolijve85-lab/ios.git ~/riots-src
#               bash ~/riots-src/city-hold/deploy/deploy-on-server.sh
# Every next time:  bash ~/riots-src/city-hold/deploy/deploy-on-server.sh
set -euo pipefail
BRANCH="${RIOTS_BRANCH:-claude/happy-hypatia-1smfhz}"
SRC="${RIOTS_SRC:-$HOME/riots-src}"
REPO="https://github.com/stefanolijve85-lab/ios.git"

# Node.js 20.19 or newer (the build tool needs it)
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ontbreekt. Eenmalig installeren (Ubuntu/Debian):"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]'); NODE_MINOR=$(node -p 'process.versions.node.split(".")[1]')
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  echo "Node.js $(node -v) is te oud (nodig: 20.19 of nieuwer). Bijwerken (Ubuntu/Debian):"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi

# the newest code of the branch (only the latest version: no history needed to build)
if [ ! -d "$SRC/.git" ]; then git clone --depth 1 -b "$BRANCH" "$REPO" "$SRC"; fi
cd "$SRC"
git fetch --depth 1 origin "$BRANCH"
git checkout -q -B "$BRANCH" FETCH_HEAD
git reset -q --hard FETCH_HEAD
echo "Code: $(git log -1 --format='%h %s')"

# build
cd city-hold
npm ci --no-audit --no-fund
npm run build

# online: copy into the web folder and hand it to nginx (sudo asks for the password)
sudo mkdir -p /var/www/riots
sudo rsync -a --delete dist/ /var/www/riots/
sudo chown -R www-data:www-data /var/www/riots
echo "RIOTS staat online: https://riots.xitgames.com"
