import { TopBar } from "@/components/TopBar";

const insights = [
  {
    title: "12% increase in suspicious invoices this month",
    detail: "The rise concentrates on three suppliers added in the last 60 days. Recommend reviewing onboarding controls.",
    cta: "Review new suppliers",
  },
  {
    title: "Helix Capital changed payment details twice",
    detail: "First seen 18 days ago, now claims a third IBAN. Consistent with a vendor-impersonation pattern.",
    cta: "Lock supplier",
  },
  {
    title: "High-risk invoices cluster on Friday afternoons",
    detail: "63% of invoices scored < 35 arrived between 14:30 and 17:30 local time on Fridays. Consider a Friday-only dual-approval rule.",
    cta: "Add policy rule",
  },
  {
    title: "Potential phishing campaign detected",
    detail: "Three invoices in the last 7 days arrived from lookalike domains with reply-to mismatches.",
    cta: "Open phishing report",
  },
];

export default function InsightsPage() {
  return (
    <>
      <TopBar title="AI Insights" subtitle="Executive trends and recommended actions" />
      <div className="p-6 grid lg:grid-cols-2 gap-5">
        {insights.map(i => (
          <div key={i.title} className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-accent-300">Insight</div>
            <div className="mt-2 text-lg font-semibold">{i.title}</div>
            <p className="mt-2 text-sm text-ink-300">{i.detail}</p>
            <div className="mt-4">
              <button className="btn-primary text-xs">{i.cta} →</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
