"""Pydantic IO models. Designed to be the public API contract."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

RiskBand = Literal["trusted", "low", "medium", "suspicious", "high", "critical"]
Severity = Literal["info", "low", "medium", "high", "critical"]
Role = Literal["admin", "cfo", "finance", "reviewer", "auditor", "read_only"]


class TenantOut(BaseModel):
    id: str
    slug: str
    name: str
    plan: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Role | None = None
    tenant: TenantOut | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    tenant_name: str = Field(min_length=1, max_length=200)
    tenant_slug: str | None = Field(default=None, pattern=r"^[a-z0-9-]{2,40}$")


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int


class SignalContribution(BaseModel):
    """One row of the explainability table — what contributed to the score."""
    signal: str
    raw_score: int = Field(..., ge=0, le=100)
    weight: float
    weighted: float
    delta: float = 0.0
    reason: str


class RiskAssessmentOut(BaseModel):
    trust_score: int
    risk_band: RiskBand
    hard_penalty: int
    recommended_action: str
    contributors: list[SignalContribution]
    weights_version: str
    model_version: str
    created_at: datetime


class ForensicSignal(BaseModel):
    code: str
    severity: Severity
    detail: str


class ForensicReportOut(BaseModel):
    score: int
    has_javascript: bool
    metadata_score: int | None = None
    font_score: int | None = None
    rendering_score: int | None = None
    signals: list[ForensicSignal]


class SupplierBrief(BaseModel):
    id: str
    name: str
    vat: str | None = None
    primary_domain: str | None = None
    trust_score: int | None = None
    trust_band: RiskBand | None = None
    status: Literal["active", "locked", "archived"]


class InvoiceLineItem(BaseModel):
    position: int
    description: str | None = None
    quantity: float | None = None
    unit_price_cents: int | None = None
    amount_cents: int | None = None
    tax_rate_pct: float | None = None


class InvoiceBrief(BaseModel):
    id: str
    invoice_number: str | None = None
    supplier: SupplierBrief | None = None
    total_cents: int | None = None
    currency: str | None = None
    status: str
    trust_score: int | None = None
    risk_band: RiskBand | None = None
    created_at: datetime


class InvoiceDetail(InvoiceBrief):
    issue_date: date | None = None
    due_date: date | None = None
    iban: str | None = None
    iban_country: str | None = None
    bank_account_holder: str | None = None
    line_items: list[InvoiceLineItem] = []
    forensic: ForensicReportOut | None = None
    risk: RiskAssessmentOut | None = None


class InvoiceUploadOut(BaseModel):
    id: str
    status: str
    estimated_completion_seconds: int = 12


class AlertOut(BaseModel):
    id: str
    kind: str
    severity: Severity
    state: Literal["open", "acknowledged", "dismissed"]
    title: str
    detail: str | None = None
    invoice_id: str | None = None
    supplier_id: str | None = None
    created_at: datetime


class InsightsOverview(BaseModel):
    period_days: int = 30
    invoices_total: int
    invoices_high_risk: int
    avg_trust_score: float
    risk_mix: dict[str, int]            # band → count
    trust_trend: list[dict[str, Any]]   # [{date, score}]
    top_suppliers: list[SupplierBrief]
    iban_changes_count: int


class WebhookEndpointIn(BaseModel):
    url: str
    events: list[str] = []


class WebhookEndpointOut(BaseModel):
    id: str
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
