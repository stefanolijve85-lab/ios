/**
 * Sample data used when the dashboard runs without a live API connection.
 * The real data path is `lib/api.ts` — this module exists only so the demo
 * pages can render meaningfully in isolation (e.g. for screenshots, e2e
 * fixtures, design review).
 */
import type {
  Alert, InsightsOverview, InvoiceBrief, InvoiceDetail, SupplierBrief,
} from "./types";

export const sampleSuppliers: SupplierBrief[] = [
  { id: "sup_acme",   name: "Acme Holding BV",     vat: "NL855512456B01", primary_domain: "acme-holding.nl",  trust_score: 92, trust_band: "trusted",    status: "active" },
  { id: "sup_pure",   name: "PureFiber GmbH",      vat: "DE298775601",    primary_domain: "purefiber.de",     trust_score: 86, trust_band: "low",        status: "active" },
  { id: "sup_kaip",   name: "Kaiper Logistics",    vat: "BE0865.123.456", primary_domain: "kaiperlog.be",     trust_score: 71, trust_band: "medium",     status: "active" },
  { id: "sup_brnz",   name: "Bronze IT Services",  vat: null,              primary_domain: "bronze-it-srv.com", trust_score: 41, trust_band: "suspicious", status: "active" },
  { id: "sup_helix",  name: "Helix Capital LLC",   vat: null,              primary_domain: "helix-cap.io",      trust_score: 18, trust_band: "high",       status: "locked" },
];

export const sampleInvoices: InvoiceBrief[] = [
  { id: "inv_01", invoice_number: "2026-0418", supplier: sampleSuppliers[4], total_cents: 4895000,  currency: "EUR", status: "scored",   trust_score: 18, risk_band: "high",       created_at: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: "inv_02", invoice_number: "INV-22431", supplier: sampleSuppliers[3], total_cents: 1242000,  currency: "EUR", status: "scored",   trust_score: 41, risk_band: "suspicious", created_at: new Date(Date.now() - 24 * 60_000).toISOString() },
  { id: "inv_03", invoice_number: "PF-90121",  supplier: sampleSuppliers[1], total_cents: 318450,   currency: "EUR", status: "approved", trust_score: 86, risk_band: "low",        created_at: new Date(Date.now() - 92 * 60_000).toISOString() },
  { id: "inv_04", invoice_number: "AC-1212",   supplier: sampleSuppliers[0], total_cents: 1019800,  currency: "EUR", status: "scored",   trust_score: 92, risk_band: "trusted",    created_at: new Date(Date.now() - 8 * 3600_000).toISOString() },
  { id: "inv_05", invoice_number: "KP-77231",  supplier: sampleSuppliers[2], total_cents: 425100,   currency: "EUR", status: "scored",   trust_score: 71, risk_band: "medium",     created_at: new Date(Date.now() - 26 * 3600_000).toISOString() },
];

export const sampleInvoiceDetail: InvoiceDetail = {
  ...sampleInvoices[0],
  issue_date: new Date(Date.now() - 24 * 3600_000).toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 7 * 24 * 3600_000).toISOString().slice(0, 10),
  iban: "DE07500105170243210198",
  iban_country: "DE",
  bank_account_holder: "Helix Receivables Ltd",
  forensic: {
    score: 31, has_javascript: true,
    metadata_score: 55, font_score: 70, rendering_score: 25,
    signals: [
      { code: "embedded_javascript", severity: "critical", detail: "PDF contains JavaScript actions" },
      { code: "suspicious_producer", severity: "high",     detail: "Producer reads 'Adobe Photoshop 24.7'" },
      { code: "moddate_before_creation", severity: "high", detail: "ModDate precedes CreationDate by 2 days" },
    ],
  },
  risk: {
    trust_score: 18,
    risk_band: "high",
    hard_penalty: 40,
    recommended_action: "Block payment; notify CFO; verify supplier directly.",
    contributors: [
      { signal: "iban",      raw_score: 20, weight: 0.22, weighted: 4.4,  delta: -12.1, reason: "IBAN never seen for this supplier; Germany account from a UK-domiciled supplier" },
      { signal: "supplier",  raw_score: 32, weight: 0.22, weighted: 7.0,  delta: -9.5,  reason: "Domain registered 18 days ago; no DMARC policy" },
      { signal: "forensics", raw_score: 31, weight: 0.18, weighted: 5.6,  delta: -7.9,  reason: "Embedded JavaScript and Photoshop producer string" },
      { signal: "penalty:embedded_javascript", raw_score: 0, weight: 0,    weighted: -40, delta: -40,    reason: "PDF contains executable code — never expected in invoices" },
      { signal: "anomaly",   raw_score: 48, weight: 0.14, weighted: 6.7,  delta: -3.8,  reason: "Amount is +3.2σ above 90-day baseline" },
    ],
    weights_version: "v1.0.0",
    model_version: "trust-score-v1",
    created_at: new Date().toISOString(),
  },
};

export const sampleAlerts: Alert[] = [
  { id: "alr_1", kind: "high_risk_invoice",   severity: "high",     state: "open", title: "High-risk invoice flagged",       detail: "Helix Capital — Invoice #2026-0418 ·  Trust Score 18", invoice_id: "inv_01", supplier_id: "sup_helix", created_at: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: "alr_2", kind: "iban_changed",        severity: "high",     state: "open", title: "Supplier IBAN change detected",   detail: "PureFiber GmbH switched from DE89… to NL12…",          invoice_id: "inv_03", supplier_id: "sup_pure",  created_at: new Date(Date.now() - 70 * 60_000).toISOString() },
  { id: "alr_3", kind: "lookalike_domain",    severity: "medium",   state: "open", title: "Lookalike sender domain",          detail: "kaiperlog.be vs kaperlog.be (1 edit)",                  invoice_id: "inv_05", supplier_id: "sup_kaip",  created_at: new Date(Date.now() - 4 * 3600_000).toISOString() },
];

export const sampleOverview: InsightsOverview = {
  period_days: 30,
  invoices_total: 1842,
  invoices_high_risk: 41,
  avg_trust_score: 81.2,
  risk_mix: { trusted: 1023, low: 528, medium: 210, suspicious: 26, high: 14, critical: 1, unscored: 40 },
  trust_trend: Array.from({ length: 21 }, (_, i) => ({
    date: new Date(Date.now() - (20 - i) * 86_400_000).toISOString().slice(0, 10),
    score: 70 + Math.round(Math.sin(i / 2) * 8 + i / 3 + Math.random() * 4),
  })),
  top_suppliers: [sampleSuppliers[4], sampleSuppliers[3], sampleSuppliers[2]],
  iban_changes_count: 6,
};
