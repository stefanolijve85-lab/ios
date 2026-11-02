# Fetch the ElevenLabs sounds and music into public/audio

All 20 files were generated in ElevenLabs flow `57zIxSMv8GYUQ6v0Yi5g` (workspace b50d5aac00e6486db29fbac4919df948).
Signed links expire, so get fresh ones first: call the ElevenLabs tool `creative_get_flow_run_status` with
flow_id `57zIxSMv8GYUQ6v0Yi5g` and the session ids below. Each generation in the result has a fresh `content_url`.
Download each one to `public/audio/<name>.mp3`. The session needs network access to elevenlabsusercontent.com.

| name | session id |
|---|---|
| glass | uytTSJ5gdwAdtZijaX9w |
| barrier | gME2znd1PORCNJUehxNb |
| wood_hit | etxyhWj4SDGwTGfZpiVS |
| whistle | eexohtvxJOmHom4brn3c |
| shield | xVRYf7mG8NKegQxA6vAs |
| ignite | m5hxLzFgqNP75WdQGNDL |
| fire_loop | nbMjvRuDXIgtCR9LKKZ7 |
| hose_loop | LYXFDRUpF53eEKwBP01Q |
| steam | 9Ij1T34UPmPSVYcKiGmz |
| crowd_loop | SxvXjERHq821EKkeIzUV |
| city_loop | CdTzXfJWpd0c59YywP44 |
| siren | G0G6VS3lATrToBfGRIL1 |
| horn | 1CFFKeev5VCo662rWWsU |
| rustle | 6JXHjj98qDu37qeVuj0b |
| molotov | gNLmYS5YqHiyA22Syy8l |
| shutter | bRrW5ILVEi91ZTGxYSEC |
| fountain_loop | pP59MiW1XxagWkEvcAlU |
| crowd_shout | VyrkYjCuypJjmdn1cBIl |
| music_mission | B0Rl08tr9IgWMpyIpBa7 |
| music_menu | u0w8VjRjIZ50zwYHmSzQ |

Afterwards:
- Check the files decode, then run the offline audio check described in IMPLEMENTATION_STATUS.md.
- Every cue should peak at about 0.3 or less, and the music should sit below the effects.
- Commit `public/audio` to branch `claude/happy-hypatia-1smfhz` and push.
