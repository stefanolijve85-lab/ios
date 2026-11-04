#!/bin/bash
# Build RIOTS on the Mac and put it on the server (the machine that runs Detepo and Kwizillo).
# Run from anywhere:  ~/cityhold-game/city-hold/deploy/deploy.sh
# Needs: the WireGuard tunnel up, the key ~/.ssh/kwizillo_deploy. sudo on the server asks for the password once.
set -euo pipefail
HOST="${RIOTS_HOST:-solotech@10.88.0.2}"
KEY="${RIOTS_KEY:-$HOME/.ssh/kwizillo_deploy}"
cd "$(dirname "$0")/.."
npm run build
# 1. upload to a staging folder in the home directory (only changed files travel)
rsync -az --delete -e "ssh -i $KEY" dist/ "$HOST:riots-stage/"
# 2. move it into place as root and hand it to nginx
ssh -t -i "$KEY" "$HOST" 'sudo mkdir -p /var/www/riots && sudo rsync -a --delete ~/riots-stage/ /var/www/riots/ && sudo chown -R www-data:www-data /var/www/riots && echo "RIOTS staat online"'
