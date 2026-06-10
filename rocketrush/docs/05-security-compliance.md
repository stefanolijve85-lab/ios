# 13, 14 · Security Architecture & Compliance Architecture

---

<a id="security"></a>
## Security Architecture

### Threat model (a money game attracts these)
1. **Outcome manipulation** — cheat the multiplier or cash-out time.
2. **Economic fraud** — bonus abuse, collusion, multi-accounting, chargebacks.
3. **Bots** — automated optimal-cashout farming.
4. **Account takeover** — credential stuffing, session theft.
5. **Availability** — DDoS on the realtime tier.

### Defense in depth
| Layer | Control |
|-------|---------|
| **Edge** | Cloudflare WAF, L3/4 + L7 **DDoS protection**, geo/ASN rules, bot fingerprint challenge, global **rate limiting** before traffic hits origin |
| **Gateway** | Per-IP + per-user **rate limits** (Redis token bucket) on `bet:place`, `cashout`, `chat:send`, auth; request-size caps; strict zod validation on every payload |
| **Auth** | Argon2id password hashing; **2FA (TOTP)**; short-lived JWT access + rotating refresh; **encrypted sessions** bound to device hash + IP; revocation list; lockout on credential-stuffing patterns |
| **Game integrity** | **Server-authoritative** rounds; crash point committed (hashed) before betting opens; cashout time validated against the server clock — a client *cannot* submit a future or post-crash time; deterministic, reproducible outcomes |
| **Wallet** | Atomic, **idempotent** debit/credit in a DB transaction; double-entry ledger; no float math; balance-vs-ledger drift alarm |
| **Fraud detection** | Kafka `risk-events` stream → rules + scoring: velocity, win-rate anomalies, shared device/IP clusters (collusion), deposit/withdraw mismatch; auto-hold + manual review queue |
| **Bot detection** | Cashout-timing entropy analysis (humans jitter, bots don't), input cadence, headless/automation fingerprints, device attestation; progressive friction (CAPTCHA → hold) |
| **Transport** | TLS 1.3 everywhere, WSS only, HSTS, secure+httpOnly+SameSite cookies, CSP, no secrets in client |
| **Audit logging** | Append-only `audit_log` for auth, bets, cashouts, limit changes, every operator action; shipped to immutable storage |
| **Secrets** | AWS KMS / Secrets Manager; server seeds + TOTP secrets encrypted at rest; least-privilege IAM; rotation |

### Provably-fair = security *and* trust
Because the crash point is `HMAC-SHA256(serverSeed, clientSeed:nonce)` with the
`serverSeed` **hash published before** the round and the seed **revealed after**,
neither the operator nor the player can alter an outcome after bets are placed —
and anyone can prove it. See `docs/06-provably-fair.md` and `verify-fairness.mjs`.

### Secure SDLC
SAST + dependency scanning + secret scanning in CI; signed container images;
least-privilege K8s (network policies, non-root, read-only FS); pen-test before
launch and per major release; coordinated disclosure policy.

---

<a id="compliance"></a>
## Compliance & Responsible Gaming Architecture

> Built **compliance-ready**: the controls below are first-class features, not
> bolt-ons. Specific licensing obligations vary by jurisdiction; the platform is
> designed so a regulatory pack can be enabled per region.

### Responsible Gaming (player-facing, enforced server-side)
| Feature | Implementation |
|---------|----------------|
| **Deposit limits** | Daily / weekly / monthly caps (`rg_limits`), enforced at deposit + bet time; decreases instant, increases delayed (cool-off) |
| **Loss limits** | Daily net-loss cap blocks further bets when hit |
| **Session limits** | Server tracks session duration; auto-pause + forced break at limit |
| **Reality checks** | Periodic "you've played N minutes / net result €X" interstitial |
| **Cooling-off** | Self-set lockout (hours–weeks); bets + deposits blocked until expiry |
| **Self-exclusion** | Immediate, irreversible-for-period account lock; honored across login |
| **Age/affordability hooks** | KYC gate + affordability signals before higher limits |

All RG checks run in a single `rg.guard` evaluated on the **server** before any
bet — the client UI (Settings modal) only reflects state it can never bypass.

### Regulatory & data compliance
| Area | Approach |
|------|----------|
| **KYC / AML** | Identity verification before withdrawal; sanctions/PEP screening; transaction monitoring; SAR workflow |
| **Geo-compliance** | Geo-fencing + license-aware feature flags; block restricted regions at edge |
| **Game fairness certification** | RNG/fairness method documented + reproducible (provably fair) for regulator/lab audit; full round history retained |
| **Data protection (GDPR)** | Lawful basis, data minimization, export + erasure endpoints, retention schedules, EU data residency option |
| **Audit & reporting** | Immutable `audit_log`; GGR, payout %, and RG-intervention reports available to operators/regulators |
| **PCI scope** | Card data handled only by PSP (tokenized); platform stays out of PCI scope |
| **Marketing/ad rules** | Region-aware messaging, mandatory RG messaging + self-exclusion links |

### Operator dashboard ↔ compliance
The operator dashboard (`docs/02`) surfaces the regulator-relevant view — GGR,
payout ratio, RG interventions, self-exclusion counts, regional breakdown,
round statistics — all sourced from the audit/Kafka stream, never from
mutable in-game state.
