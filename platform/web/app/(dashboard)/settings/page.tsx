import { TopBar } from "@/components/TopBar";

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Tenant policy, integrations, and access" />
      <div className="p-6 grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="font-semibold">Risk policy</div>
          <p className="text-sm text-ink-400 mt-1">
            Tune the weights used to compute Trust Scores. Changes are versioned and logged.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Forensics",  18],
              ["Supplier",   22],
              ["IBAN",       22],
              ["Email",      12],
              ["Anomaly",    14],
              ["Vision",     7],
              ["History",    5],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center gap-3">
                <div className="w-28 text-ink-300">{k as string}</div>
                <input type="range" min={0} max={40} defaultValue={v as number}
                       className="flex-1 accent-accent-500" />
                <div className="w-10 text-right tabular-nums">{v}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold">Approval policy</div>
          <p className="text-sm text-ink-400 mt-1">Auto-routing of invoices by score band.</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>· Trusted (≥90): auto-approve up to €5 000</li>
            <li>· Low (75–89): single approver</li>
            <li>· Medium (55–74): dual approver</li>
            <li>· Suspicious (35–54): fraud queue</li>
            <li>· High / Critical: block + CFO notification</li>
          </ul>
        </div>

        <div className="card p-5">
          <div className="font-semibold">Integrations</div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {["Exact", "AFAS", "Twinfield", "SAP", "QuickBooks", "Xero", "Microsoft 365", "Gmail", "Slack", "Teams"]
              .map(n => (
                <li key={n} className="rounded ring-1 ring-ink-800 bg-ink-950/40 px-3 py-2 flex justify-between">
                  <span>{n}</span><button className="text-xs text-accent-300">Connect</button>
                </li>
              ))}
          </ul>
        </div>

        <div className="card p-5">
          <div className="font-semibold">API keys</div>
          <p className="text-sm text-ink-400 mt-1">Per-key scopes; rotate every 365 days.</p>
          <div className="mt-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between rounded ring-1 ring-ink-800 bg-ink-950/40 px-3 py-2">
              <span>tlk_live_····1f3a</span>
              <span className="text-ink-400">invoices:read · scoped to ERP sync</span>
            </div>
          </div>
          <button className="mt-3 btn-primary text-xs">Create API key</button>
        </div>
      </div>
    </>
  );
}
