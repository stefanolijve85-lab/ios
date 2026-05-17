# 16 — Mobile Deployment Checklist

## Pre-Submission Hard Gates

| Gate | iOS | Android |
|---|---|---|
| Crash-free users ≥ 99.5% | ✓ | ✓ |
| Cold start ≤ 2 s on iPhone 12 / Pixel 6a | ✓ | ✓ |
| Average FPS ≥ 55 mid-tier 5-min session | ✓ | ✓ |
| No private API usage | ✓ | n/a |
| Bundle ≤ 80 MB IPA / 60 MB AAB | ✓ | ✓ |
| ATT prompt copy reviewed | ✓ | n/a |
| Data safety form completed | n/a | ✓ |
| Loot box odds disclosure visible | ✓ | ✓ |
| Refund policy linked | ✓ | ✓ |
| Onboarding works offline | ✓ | ✓ |

## iOS Submission Checklist

### App Store Connect
- [ ] Bundle ID, SKU, app name finalized.
- [ ] Categories: **Games > Action** (primary), **Games > Arcade** (secondary).
- [ ] Content Rating: 9+ (cartoon violence on barrels).
- [ ] Privacy nutrition labels:
  - Identifiers: IDFA (with consent), App User ID.
  - Diagnostics: crash data, performance data.
  - Purchases: IAP receipts.
- [ ] App Tracking Transparency (ATT) prompt — only after session 3.
- [ ] In-app purchase products created (cosmetic SKUs + currency packs + battle pass).
- [ ] StoreKit configuration file committed for testing.
- [ ] Sandbox tester accounts created.

### Build
- [ ] Xcode 16+, iOS deployment target 15+.
- [ ] ARM64 only.
- [ ] Symbols uploaded to crash reporter (Sentry + Apple).
- [ ] App Thinning enabled (HEVC textures for Apple devices).
- [ ] Bitcode: deprecated in Xcode 14+ → off.
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) included with all required reasons.
- [ ] Code-signed with distribution cert + provisioning profile.

### Localization
- [ ] App Store listing translated to: EN, ES, FR, DE, PT-BR, JA, KO, ZH-CN, RU, AR.
- [ ] In-app strings localized in Unity Localization tables.
- [ ] Screenshots per locale (4 per device class minimum).

### Marketing Assets
- [ ] 6.7" / 6.5" / 5.5" iPhone screenshots.
- [ ] 12.9" / 11" iPad screenshots (if supporting).
- [ ] App preview video (15–30 s, gameplay-first).

## Android Submission Checklist

### Play Console
- [ ] Application ID finalized.
- [ ] Internal testing track active for QA.
- [ ] Closed beta opt-in URL distributed.
- [ ] Data safety form: data collected, sharing, security practices.
- [ ] Content rating: PEGI 7 / ESRB E10+.
- [ ] AdMob/LevelPlay App ID configured.
- [ ] All IAP SKUs created and activated.

### Build
- [ ] AAB only (Play App Signing).
- [ ] `minSdkVersion = 26` (Android 8). `targetSdkVersion` per Play requirements (2026: SDK 35).
- [ ] ARM64 + ARMv7. ARM64 primary.
- [ ] R8 / ProGuard rules audited (no critical class stripped).
- [ ] Symbols uploaded for native crashes.
- [ ] Permissions audit: `INTERNET` (required), `VIBRATE` (haptics), `RECEIVE_BOOT_COMPLETED` (push), no others.
- [ ] No `MANAGE_EXTERNAL_STORAGE`.
- [ ] Foreground service usage justified or removed.

### Compliance
- [ ] Google Play Families policy if targeting kids — we don't.
- [ ] Real Money Gambling: N/A. Loot box odds disclosed.
- [ ] Subscription cancellation flow tested.
- [ ] Refund flow tested via Play.

## Cross-Platform

### Privacy & Consent
- [ ] CMP (Consent Management Platform) integrated (Funding Choices or similar).
- [ ] EU: GDPR-compliant non-consent path serves contextual ads.
- [ ] California: CCPA "Do Not Sell" link in settings.
- [ ] Children under 13: contextual ads only; no IDFA; no personalised IAP recommendations.

### Analytics
- [ ] Unity Analytics + custom event schema validated end-to-end.
- [ ] Pre-production smoke test in staging environment.
- [ ] Funnel events firing in correct order on real devices.

### Crash Reporting
- [ ] Cloud Diagnostics on.
- [ ] Sentry SDK initialized with release tag (matches build version).
- [ ] PII scrubbed from breadcrumbs (no usernames, no IPs).
- [ ] Test crash submission verified end-to-end.

### LiveOps Plumbing
- [ ] Remote Config keys validated, defaults shipped in build.
- [ ] Server-driven content (events, BP) tested with kill-switch.
- [ ] Push notifications via Unity Cloud / FCM tested on both platforms.

## Performance Validation (Pre-Submit)

| Test | Pass Criteria |
|---|---|
| Cold start (3 devices, 3 trials) | Median ≤ 2.0 s |
| 30-min soak | Memory growth ≤ 5 MB, no crash, thermals ≤ "warm" |
| 100 runs auto-play | No NaN positions, no stuck states |
| Offline launch | App boots, plays runs, queues telemetry/IAP for replay |
| Background→Foreground 10x | No state loss, no audio glitch |
| Low storage warning | Graceful save, no corruption |

## Store Listing

### Tagline
> "One pull. Infinite chaos."

### Short Description (Play, 80 chars)
> Drag, release, and ricochet through wild biomes in this physics slingshot epic.

### Long Description Highlights
- Drag-and-release physics that feels electric.
- 16+ wacky projectiles, 6 launcher tiers, 8 biomes.
- Bounce, boost, ricochet — chase the next personal best.
- Free to play, fair monetization, no energy timers.

### Screenshots — Story Order
1. Launch in action with combo x6.
2. End-of-run "NEW PERSONAL BEST!" card.
3. Upgrade tree with juicy stat bars.
4. Cosmetic loadout showing the Disco Watermelon.
5. Biome variety mosaic.

### Trailer Beats (15 s)
1. 0–2 s: extreme close-up on slingshot draw, *thwock*.
2. 2–6 s: projectile rocketing through colorful chaos, multiplier counter climbing.
3. 6–10 s: cinematic boss bounce.
4. 10–13 s: end-run card with PB.
5. 13–15 s: title + tagline + "Free Now" CTA.

## Post-Launch Day-1 Plan

- 24/7 oncall rotation for first 48 h.
- LiveOps team monitors funnel breaks every 2 h.
- Hotfix readiness: signed builds for both stores in queue.
- Customer support tickets routed through Zendesk; FAQs prepped.
