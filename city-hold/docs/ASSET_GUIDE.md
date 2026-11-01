# Asset guide

All forty images are supplied locally. Their original numeric prefixes are preserved; 08 and 09 do not exist, so the highest prefix is 42 while the actual count is 40.

## Map pairs

| City | Clean geometry reference | Mid/late damage appearance reference |
|---|---|---|
| Paris fountain district | 01, 02 | 05, 06, 07 |
| Paris boulevard, optional | 20 | Derive from its own geometry |
| Amsterdam | 21 | 32 |
| London | 22 | 33 |
| Milan | 23 | 34 |
| Berlin | 24 | 35 |
| Sao Paulo | 25 | 36 |

03-04 show Paris zoom/detail. Do not swap independent paintings when the camera zooms. Some generated references have small architectural inconsistencies: use the clean master layout as the geometric authority. Layouts are fictional, not surveys of actual streets or reconstructions of real incidents. Uniforms and equipment are generic visual concepts, not researched official national equipment.

## Action references

37: running. 38: collect merchandise. 39: shield contact and recoil. 40: police bracing/advance. 41: interception and escort. 42: dropped loot.

Each image contains four conceptual poses in reading order, not a guaranteed seamless loop, equal-cell production sprite atlas, motion capture or 3D rig. Character feet, hand contacts and scale need implementation work. Avoid showing all four figures as one unit. Some PNG assets include soft glow around the silhouette despite an alpha channel.

## Reuse and appearance

Personage variants share class stats. The cast includes light- and dark-skinned adults in both defensive and attacking roles. Keep character appearance independent of gameplay ability or behaviour.

## Video

The supplied MP4 is 28 seconds, 1280x720, 24 fps, without audio. It shows scripted selection, purchases, movement, a camera cone, interception, a shutter upgrade and a short attacker segment. It is not a video of working AI, real 3D zoom or a finished playable game. tools/render_reference_demo.py reproduces the reference with Python, Pillow and ffmpeg. It is separate from the future game's source.
