import { TopBar } from "@/components/TopBar";
import { RiskBadge } from "@/components/RiskBadge";
import { sampleSuppliers } from "@/lib/sample";

export default function SuppliersPage() {
  return (
    <>
      <TopBar title="Suppliers" subtitle="Trust ranked, lowest first" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-ink-500 bg-ink-950/40">
              <tr>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left">Domain</th>
                <th className="text-left">VAT</th>
                <th className="text-left">Status</th>
                <th className="text-right pr-4">Trust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {[...sampleSuppliers].sort((a, b) => (a.trust_score ?? 0) - (b.trust_score ?? 0)).map(s => (
                <tr key={s.id} className="hover:bg-ink-900/50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="text-ink-300">{s.primary_domain}</td>
                  <td className="font-mono text-xs text-ink-300">{s.vat ?? "—"}</td>
                  <td className="capitalize text-ink-300">{s.status}</td>
                  <td className="text-right pr-4">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      {s.trust_score ?? "—"}
                      <RiskBadge band={s.trust_band} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
