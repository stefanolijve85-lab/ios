#!/usr/bin/env bash
# Download the ElevenLabs sound effects (generated 2026-11-02, flow 57zIxSMv8GYUQ6v0Yi5g) into public/audio/<name>.mp3.
# The signed links expire on 2026-11-03 00:00 UTC; after that, download them from the ElevenLabs flow by hand.
# Needs network access to elevenlabsusercontent.com.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p public/audio
while read -r name url; do
  [ -z "$name" ] && continue
  curl -sSf -o "public/audio/$name.mp3" "$url" && echo "ok   $name ($(wc -c < "public/audio/$name.mp3") bytes)" || echo "FAIL $name"
done < tools/sfx/elevenlabs_urls.txt
