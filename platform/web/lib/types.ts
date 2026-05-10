export type RiskBand =
  | "trusted" | "low" | "medium" | "suspicious" | "high" | "critical";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type SignalContribution = {
  signal: string;
  raw_score: number;
  weight: number;
  weighted: number;
  delta: number;
  reason: string;
};

export type RiskAssessment = {
  trust_score: number;
  risk_band: RiskBand;
  hard_penalty: number;
  recommended_action: string;
  contributors: SignalContribution[];
  weights_version: string;
  model_version: string;
  created_at: string;
};

export type SupplierBrief = {
  id: string;
  name: string;
  vat: string | null;
  primary_domain: string | null;
  trust_score: number | null;
  trust_band: RiskBand | null;
  status: "active" | "locked" | "archived";
};

export type ForensicReport = {
  score: number;
  has_javascript: boolean;
  metadata_score: number | null;
  font_score: number | null;
  rendering_score: number | null;
  signals: { code: string; severity: Severity; detail: string }[];
};

export type InvoiceBrief = {
  id: string;
  invoice_number: string | null;
  supplier: SupplierBrief | null;
  total_cents: number | null;
  currency: string | null;
  status: string;
  trust_score: number | null;
  risk_band: RiskBand | null;
  created_at: string;
};

export type InvoiceDetail = InvoiceBrief & {
  issue_date: string | null;
  due_date: string | null;
  iban: string | null;
  iban_country: string | null;
  bank_account_holder: string | null;
  forensic: ForensicReport | null;
  risk: RiskAssessment | null;
};

export type Alert = {
  id: string;
  kind: string;
  severity: Severity;
  state: "open" | "acknowledged" | "dismissed";
  title: string;
  detail: string | null;
  invoice_id: string | null;
  supplier_id: string | null;
  created_at: string;
};

export type InsightsOverview = {
  period_days: number;
  invoices_total: number;
  invoices_high_risk: number;
  avg_trust_score: number;
  risk_mix: Record<string, number>;
  trust_trend: { date: string; score: number }[];
  top_suppliers: SupplierBrief[];
  iban_changes_count: number;
};
