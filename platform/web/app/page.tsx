import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="text-ink-50">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-to-br from-accent-400 to-accent-700 grid place-items-center text-white font-bold">T</div>
          <span className="font-semibold">Trustline</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-ink-200">
          <a href="#how">How it works</a>
          <a href="#pillars">What we detect</a>
          <a href="#pricing">Pricing</a>
          <a href="#security">Security</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/overview" className="btn-ghost text-ink-100">Sign in</Link>
          <Link href="/overview" className="btn-primary">Book a demo</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-700/40 bg-accent-900/30 px-3 py-1 text-[11px] font-medium text-accent-200">
            <span className="size-1.5 rounded-full bg-accent-400" /> SOC2-ready · GDPR · EU data residency
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            The AI trust layer for{" "}
            <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">business payments.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-200 max-w-xl">
            Stop invoice fraud, supplier impersonation, and manipulated PDFs <em>before</em> the
            wire leaves. Every invoice gets a Trust Score with explainable signals — so finance
            teams move fast and safely.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/overview" className="btn-primary">Open dashboard demo →</Link>
            <a href="#how" className="btn-ghost text-ink-100">See how it works</a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-ink-400">
            <div>500K+ invoices scored</div>
            <div className="size-1 rounded-full bg-ink-700" />
            <div>$1.2B+ payments protected</div>
            <div className="size-1 rounded-full bg-ink-700" />
            <div>Avg. 11s per invoice</div>
          </div>
        </div>

        {/* Hero card preview */}
        <div className="card bg-ink-900/80 border-ink-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-400">Invoice review</div>
              <div className="text-sm font-semibold mt-1">Acme Holding · Invoice #2026-0418</div>
            </div>
            <span className="rounded-full bg-red-900/40 text-red-200 ring-1 ring-red-800 px-2 py-0.5 text-[11px] font-medium">
              high risk
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Trust Score", "23", "—34 vs supplier avg"],
              ["IBAN", "DE07···2901", "new for this supplier"],
              ["Forensics", "31", "/JS detected"],
            ].map(([k, v, sub]) => (
              <div key={k} className="rounded-lg bg-ink-950 border border-ink-700 p-3">
                <div className="text-[10px] uppercase tracking-wider text-ink-400">{k}</div>
                <div className="mt-1 text-xl font-semibold">{v}</div>
                <div className="text-[11px] text-ink-400">{sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 text-sm">
            {[
              { sev: "high", text: "Supplier domain registered 18 days ago" },
              { sev: "high", text: "IBAN never seen for this supplier" },
              { sev: "medium", text: "Reply-To differs from From-domain" },
              { sev: "low",   text: "Invoice arrived Friday at 16:42" },
            ].map((r) => (
              <div key={r.text} className="flex items-start gap-3 rounded-md bg-ink-950/60 px-3 py-2 ring-1 ring-ink-800">
                <span className={
                  r.sev === "high" ? "mt-1 size-2 rounded-full bg-red-500" :
                  r.sev === "medium" ? "mt-1 size-2 rounded-full bg-amber-500" :
                  "mt-1 size-2 rounded-full bg-ink-500"
                } />
                <div className="text-ink-100">{r.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-ink-700 pt-4">
            <div className="text-xs text-ink-400">Recommended: <span className="text-ink-100 font-medium">Block payment, escalate to CFO</span></div>
            <div className="flex gap-2">
              <button className="btn-ghost text-ink-100">Send to fraud queue</button>
              <button className="btn-primary">Hold payment</button>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / social proof */}
      <section className="border-y border-ink-800/60 bg-ink-950/40">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-around gap-y-4 text-ink-500 text-sm">
          {["Exact", "AFAS", "Twinfield", "SAP", "QuickBooks", "Xero", "Visma"].map(n => (
            <span key={n} className="font-semibold tracking-wide">{n}</span>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          What Trustline detects
        </h2>
        <p className="mt-3 text-ink-300 max-w-2xl">
          One pipeline, seven independent signals. The Trust Score is a transparent
          weighted aggregation — no black box.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { t: "PDF forensics",       d: "Object-tree, font, and metadata anomalies. Embedded JavaScript. Ghost-edited overlays." },
            { t: "Supplier trust",      d: "VAT, registry, domain age, MX/SPF/DMARC, sanctions matching." },
            { t: "IBAN security",       d: "Mod-97 + country risk + new-IBAN detection + change velocity." },
            { t: "Email authenticity",  d: "SPF/DKIM/DMARC, reply-to mismatch, lookalike domains, display-name spoof." },
            { t: "Behavioral anomaly",  d: "Per-tenant amount/timing/frequency baselines. Duplicate detection." },
            { t: "Visual templates",    d: "Perceptual hashing + layout embeddings vs your supplier templates." },
          ].map((c) => (
            <div key={c.t} className="card bg-ink-900/70 border-ink-800 p-5">
              <div className="size-8 rounded-md bg-accent-900/40 ring-1 ring-accent-800 grid place-items-center text-accent-300 font-semibold">·</div>
              <div className="mt-4 font-semibold">{c.t}</div>
              <div className="mt-1 text-sm text-ink-300">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ["1", "Ingest",     "Upload, drag-drop, forward by email, or sync your ERP."],
            ["2", "Score",      "Seven signals, one weighted Trust Score, full reasoning."],
            ["3", "Decide",     "Auto-approve, dual-approve, or block — with full audit trail."],
          ].map(([n, t, d]) => (
            <div key={n} className="card bg-ink-900/70 border-ink-800 p-6">
              <div className="text-accent-400 text-sm font-mono">{n}</div>
              <div className="mt-2 text-xl font-semibold">{t}</div>
              <div className="mt-2 text-sm text-ink-300">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Pricing</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            { name: "Starter",      price: "€99",  per: "/mo",  invoices: "Up to 250 invoices / mo",  cta: "Start free trial",
              feats: ["All 7 signals", "Email + ERP intake", "Webhook + REST API", "Email support"]},
            { name: "Professional", price: "€499", per: "/mo",  invoices: "Up to 5 000 invoices / mo", cta: "Start free trial", featured: true,
              feats: ["Everything in Starter", "SSO (OIDC) + RBAC", "Slack + Teams alerts", "Priority support"]},
            { name: "Enterprise",   price: "Custom", per: "",   invoices: "Unlimited",                  cta: "Talk to sales",
              feats: ["Dedicated tenancy / BYOK", "Custom integrations", "DPA + EU residency", "Solution architect"]},
          ].map((p) => (
            <div key={p.name} className={`card p-6 ${p.featured ? "bg-ink-900 border-accent-700 ring-1 ring-accent-600" : "bg-ink-900/70 border-ink-800"}`}>
              <div className="flex items-baseline justify-between">
                <div className="font-semibold text-lg">{p.name}</div>
                {p.featured && <span className="rounded bg-accent-700 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">Most popular</span>}
              </div>
              <div className="mt-4 text-3xl font-semibold">{p.price}<span className="text-base text-ink-400">{p.per}</span></div>
              <div className="text-xs text-ink-400 mt-1">{p.invoices}</div>
              <ul className="mt-5 space-y-1.5 text-sm text-ink-200">
                {p.feats.map(f => <li key={f}>· {f}</li>)}
              </ul>
              <Link href="/overview" className="mt-6 btn-primary w-full">{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Security band */}
      <section id="security" className="border-t border-ink-800/60 bg-ink-950/40">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Security is the product.</h2>
            <p className="mt-3 text-ink-300">
              Trustline is built for finance teams who can't afford to be wrong.
              Every signal is recorded; every decision is explainable; every byte is encrypted.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {["SOC2-ready audit log", "GDPR + EU residency", "AES-256 at rest", "TLS 1.3 in transit",
              "Per-tenant KMS keys", "RBAC + SSO + MFA", "Sanctions screening", "PII redaction for AI"]
              .map(s => (
                <li key={s} className="card bg-ink-900/70 border-ink-800 px-4 py-3">{s}</li>
              ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-xs text-ink-500 flex flex-wrap items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Trustline. Trust Score is a registered trademark.</div>
        <div className="flex gap-4">
          <a href="/docs/privacy">Privacy</a>
          <a href="/docs/terms">Terms</a>
          <a href="/docs/security">Security</a>
        </div>
      </footer>
    </main>
  );
}
