import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { RiskBadge } from "@/components/RiskBadge";
import { TrustScoreRing } from "@/components/TrustScoreRing";
import { sampleInvoiceDetail } from "@/lib/sample";
import { money } from "@/lib/format";

export default function InvoiceDetailPage(_: { params: Promise<{ id: string }> }) {
  const inv = sampleInvoiceDetail;

  return (
    <>
      <TopBar
        title={`Invoice ${inv.invoice_number ?? inv.id}`}
        subtitle={`${inv.supplier?.name ?? "Unknown supplier"} · ${money(inv.total_cents, inv.currency || "EUR")}`}
        actions={
          <>
            <button className="btn-ghost text-ink-200">Send to fraud queue</button>
            <button className="btn-primary">Hold payment</button>
          </>
        }
      />
      <div className="p-6 grid lg:grid-cols-3 gap-5">
        {/* Left: Trust + reasons */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-6 flex items-start gap-6">
            <TrustScoreRing score={inv.risk?.trust_score ?? null} size={120} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <RiskBadge band={inv.risk?.risk_band} />
                <span className="text-xs text-ink-400">model {inv.risk?.model_version} · weights {inv.risk?.weights_version}</span>
              </div>
              <p className="mt-3 text-ink-200">{inv.risk?.recommended_action}</p>
              <p className="mt-2 text-xs text-ink-500">
                Trustline never asserts fraud. The Trust Score is a transparent weighted aggregation
                of seven independent signals; reviewers retain final decision authority.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">Top contributing signals</div>
            <table className="mt-4 w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left py-2">Signal</th>
                  <th className="text-right">Raw</th>
                  <th className="text-right">Weight</th>
                  <th className="text-right">Δ</th>
                  <th className="text-left pl-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {inv.risk?.contributors.map(c => (
                  <tr key={c.signal}>
                    <td className="py-2 font-mono text-xs">{c.signal}</td>
                    <td className="text-right tabular-nums">{c.raw_score}</td>
                    <td className="text-right tabular-nums">{(c.weight * 100).toFixed(0)}%</td>
                    <td className={`text-right tabular-nums ${c.delta < 0 ? "text-red-400" : "text-accent-400"}`}>
                      {c.delta > 0 ? "+" : ""}{c.delta.toFixed(1)}
                    </td>
                    <td className="pl-4 text-ink-300">{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">PDF forensics</div>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {[
                ["Metadata", inv.forensic?.metadata_score],
                ["Fonts",    inv.forensic?.font_score],
                ["Rendering",inv.forensic?.rendering_score],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg ring-1 ring-ink-800 bg-ink-950/40 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-ink-500">{k as string}</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1">{(v as number) ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {inv.forensic?.signals.map(s => (
                <div key={s.code} className="flex items-start gap-3 rounded-md bg-ink-950/40 ring-1 ring-ink-800 px-3 py-2">
                  <span className={
                    s.severity === "critical" ? "mt-1 size-2 rounded-full bg-red-500" :
                    s.severity === "high" ? "mt-1 size-2 rounded-full bg-orange-500" :
                    s.severity === "medium" ? "mt-1 size-2 rounded-full bg-amber-500" :
                    "mt-1 size-2 rounded-full bg-ink-500"
                  } />
                  <div>
                    <div className="font-mono text-xs text-ink-400">{s.code}</div>
                    <div className="text-ink-200">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">Supplier</div>
            <div className="mt-2 font-medium">{inv.supplier?.name}</div>
            <div className="text-xs text-ink-400 mt-1">{inv.supplier?.primary_domain}</div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <RiskBadge band={inv.supplier?.trust_band} />
              <span className="text-ink-400">trust {inv.supplier?.trust_score}</span>
            </div>
            <Link href={`/suppliers/${inv.supplier?.id}`} className="mt-4 btn-ghost text-ink-100 w-full">View supplier →</Link>
          </div>

          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">Payment</div>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-400">IBAN</dt><dd className="font-mono">{inv.iban}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Country</dt><dd>{inv.iban_country}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Holder</dt><dd>{inv.bank_account_holder}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Amount</dt><dd className="tabular-nums">{money(inv.total_cents, inv.currency || "EUR")}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-400">Due</dt><dd>{inv.due_date}</dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-500">Audit trail</div>
            <ul className="mt-2 space-y-2 text-sm">
              <li>· <span className="text-ink-400">10:42</span> Uploaded by sander@acme.nl</li>
              <li>· <span className="text-ink-400">10:42</span> OCR parsed (Azure DocIntel)</li>
              <li>· <span className="text-ink-400">10:42</span> Forensics report stored</li>
              <li>· <span className="text-ink-400">10:42</span> Trust Score 18 (high)</li>
              <li>· <span className="text-ink-400">10:42</span> Alert created for CFO</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
