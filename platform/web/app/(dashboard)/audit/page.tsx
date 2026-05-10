import { TopBar } from "@/components/TopBar";

const events = [
  { ts: "10:42", actor: "sander@acme.nl",   action: "invoice.uploaded",  detail: "inv_01 · Helix Capital" },
  { ts: "10:42", actor: "system",            action: "invoice.scored",    detail: "inv_01 · trust 18 (high)" },
  { ts: "10:42", actor: "system",            action: "alert.created",     detail: "alr_1 · high_risk_invoice" },
  { ts: "10:41", actor: "anna@acme.nl",      action: "supplier.locked",   detail: "sup_helix" },
  { ts: "10:38", actor: "tlk_live_…1f3a",    action: "api.invoice.list",  detail: "200 OK · 28 rows" },
  { ts: "10:33", actor: "sander@acme.nl",    action: "auth.login",        detail: "MFA · Chrome on macOS" },
];

export default function AuditPage() {
  return (
    <>
      <TopBar title="Audit log" subtitle="Append-only · hash-chained · auditor accessible" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-ink-500 bg-ink-950/40">
              <tr>
                <th className="text-left px-4 py-3 w-24">Time</th>
                <th className="text-left">Actor</th>
                <th className="text-left">Action</th>
                <th className="text-left pr-4">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800 font-mono text-xs">
              {events.map((e, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-ink-400">{e.ts}</td>
                  <td className="text-ink-300">{e.actor}</td>
                  <td className="text-accent-300">{e.action}</td>
                  <td className="text-ink-300 pr-4">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-ink-500 mt-3">
          Each row's <span className="font-mono">hash</span> is chained to the previous row.
          Tampering breaks the chain and is surfaced in the daily audit-integrity report.
        </p>
      </div>
    </>
  );
}
