import { TopBar } from "@/components/TopBar";
import { sampleAlerts } from "@/lib/sample";
import { relativeTime } from "@/lib/format";

export default function AlertsPage() {
  return (
    <>
      <TopBar title="Alerts" subtitle="Actionable signals · open queue" />
      <div className="p-6 space-y-3">
        {sampleAlerts.map(a => (
          <div key={a.id} className="card p-4 flex items-start gap-4">
            <span className={
              a.severity === "critical" ? "mt-1.5 size-2.5 rounded-full bg-red-500" :
              a.severity === "high" ? "mt-1.5 size-2.5 rounded-full bg-orange-500" :
              "mt-1.5 size-2.5 rounded-full bg-amber-500"
            } />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-ink-300">{a.detail}</div>
              <div className="text-[11px] text-ink-500 mt-1">
                {a.kind} · severity {a.severity} · {relativeTime(a.created_at)}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-ink-100 text-xs">Dismiss</button>
              <button className="btn-primary text-xs">Acknowledge</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
