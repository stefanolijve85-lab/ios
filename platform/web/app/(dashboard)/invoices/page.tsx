import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { RiskBadge } from "@/components/RiskBadge";
import { sampleInvoices } from "@/lib/sample";
import { money, relativeTime } from "@/lib/format";

export default function InvoicesPage() {
  return (
    <>
      <TopBar
        title="Invoices"
        subtitle="Trust queue · sort by score, status, supplier"
        actions={<button className="btn-primary">Upload invoice</button>}
      />
      <div className="p-6 space-y-4">
        <div className="card p-4 flex flex-wrap gap-2 text-xs">
          {["All", "Processing", "High risk", "Awaiting approval", "Approved", "Rejected"].map((f, i) => (
            <button key={f} className={
              i === 0
                ? "rounded-full bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-white px-3 py-1.5"
                : "rounded-full ring-1 ring-ink-800 px-3 py-1.5 text-ink-300 hover:bg-ink-900"
            }>{f}</button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-ink-500 bg-ink-950/40">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left">Supplier</th>
                <th className="text-left">Status</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Trust</th>
                <th className="text-right pr-4">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {sampleInvoices.map(i => (
                <tr key={i.id} className="hover:bg-ink-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${i.id}`} className="font-medium hover:underline">{i.invoice_number}</Link>
                    <div className="text-[11px] text-ink-500">{i.id}</div>
                  </td>
                  <td>{i.supplier?.name}</td>
                  <td className="capitalize text-ink-300">{i.status}</td>
                  <td className="text-right tabular-nums">{money(i.total_cents, i.currency || "EUR")}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      {i.trust_score}
                      <RiskBadge band={i.risk_band} />
                    </span>
                  </td>
                  <td className="text-right pr-4 text-ink-500">{relativeTime(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
