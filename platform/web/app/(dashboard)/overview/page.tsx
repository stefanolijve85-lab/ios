import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Stat } from "@/components/Stat";
import { Sparkline } from "@/components/Sparkline";
import { RiskBadge } from "@/components/RiskBadge";
import { sampleOverview, sampleAlerts, sampleInvoices } from "@/lib/sample";
import { money, relativeTime } from "@/lib/format";

export default function OverviewPage() {
  const o = sampleOverview;
  return (
    <>
      <TopBar
        title="Overview"
        subtitle="Last 30 days · Trust posture across your accounts payable"
        actions={
          <>
            <button className="btn-ghost text-ink-200">Export</button>
            <Link href="/invoices" className="btn-primary">Upload invoice</Link>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-5">
          <Stat label="Invoices scanned" value={o.invoices_total.toLocaleString()} sublabel="last 30 days" />
          <Stat label="High-risk caught" value={o.invoices_high_risk} sublabel="suspicious + high + critical" tone="warn" />
          <Stat label="Avg. trust score" value={o.avg_trust_score.toFixed(1)} tone="good" />
          <Stat label="IBAN changes" value={o.iban_changes_count} sublabel="across suppliers" />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="card p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-500">Trust trend</div>
                <div className="text-lg font-semibold mt-1">21 days</div>
              </div>
              <div className="text-xs text-ink-500">Avg. {o.avg_trust_score.toFixed(1)} · target ≥ 80</div>
            </div>
            <div className="mt-4">
              <Sparkline data={o.trust_trend} width={720} height={120} />
            </div>
          </div>

          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">Risk mix</div>
            <div className="mt-3 space-y-2 text-sm">
              {(["trusted","low","medium","suspicious","high","critical"] as const).map((b) => {
                const n = o.risk_mix[b] ?? 0;
                const pct = (n / o.invoices_total) * 100;
                return (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-20"><RiskBadge band={b} /></div>
                    <div className="flex-1 h-1.5 rounded bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <div className={
                        b === "trusted" || b === "low" ? "h-full bg-accent-500" :
                        b === "medium" ? "h-full bg-amber-500" :
                        b === "suspicious" || b === "high" ? "h-full bg-orange-500" :
                        "h-full bg-red-500"
                      } style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-12 text-right tabular-nums text-ink-300">{n}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="card p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Recent invoices</div>
              <Link href="/invoices" className="text-xs text-accent-300 hover:text-accent-200">View all →</Link>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left py-2">Invoice</th>
                  <th className="text-left">Supplier</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {sampleInvoices.map(i => (
                  <tr key={i.id} className="hover:bg-ink-900/50">
                    <td className="py-2"><Link href={`/invoices/${i.id}`} className="font-medium hover:underline">{i.invoice_number}</Link></td>
                    <td>{i.supplier?.name}</td>
                    <td className="text-right tabular-nums">{money(i.total_cents, i.currency || "EUR")}</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-2 tabular-nums">
                        {i.trust_score}
                        <RiskBadge band={i.risk_band} />
                      </span>
                    </td>
                    <td className="text-right text-ink-500">{relativeTime(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Open alerts</div>
              <Link href="/alerts" className="text-xs text-accent-300 hover:text-accent-200">All →</Link>
            </div>
            <div className="mt-3 space-y-3">
              {sampleAlerts.map(a => (
                <div key={a.id} className="rounded-md ring-1 ring-ink-800 bg-ink-950/40 p-3">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span className={
                      a.severity === "critical" ? "size-1.5 rounded-full bg-red-500" :
                      a.severity === "high" ? "size-1.5 rounded-full bg-orange-500" :
                      "size-1.5 rounded-full bg-amber-500"
                    } />
                    <span>{a.severity}</span>
                    <span>·</span>
                    <span>{relativeTime(a.created_at)}</span>
                  </div>
                  <div className="mt-1 font-medium">{a.title}</div>
                  <div className="text-xs text-ink-400">{a.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
