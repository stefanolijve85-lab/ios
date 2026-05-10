"""SQLAlchemy ORM. Mirrors `migrations/001_init.sql`."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Tenant(Base):
    __tablename__ = "tenants"
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True,
                                    server_default=text("gen_random_uuid()"))
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    isolation_mode: Mapped[str] = mapped_column(Text, nullable=False, default="logical")
    plan: Mapped[str] = mapped_column(Text, nullable=False, default="starter")
    policy: Mapped[dict] = mapped_column(JSONB, nullable=False,
                                         server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[str | None] = mapped_column(Text)
    last_login_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class Membership(Base):
    __tablename__ = "memberships"
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("tenants.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        Text, ForeignKey("users.id"), primary_key=True)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class ApiKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    prefix: Mapped[str] = mapped_column(Text, nullable=False)
    last4: Mapped[str] = mapped_column(Text, nullable=False)
    hash: Mapped[str] = mapped_column(Text, nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_by: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    last_used_at: Mapped[datetime | None] = mapped_column()
    revoked_at: Mapped[datetime | None] = mapped_column()


class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    legal_name: Mapped[str | None] = mapped_column(Text)
    vat: Mapped[str | None] = mapped_column(Text)
    registration_no: Mapped[str | None] = mapped_column(Text)
    country: Mapped[str | None] = mapped_column(String(2))
    primary_domain: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="active")
    trust_score: Mapped[int | None] = mapped_column(Integer)
    trust_band: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class SupplierIbanHistory(Base):
    __tablename__ = "supplier_iban_history"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    supplier_id: Mapped[str] = mapped_column(Text, ForeignKey("suppliers.id"))
    iban: Mapped[str] = mapped_column(Text, nullable=False)
    iban_country: Mapped[str | None] = mapped_column(String(2))
    first_seen_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    last_seen_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    use_count: Mapped[int] = mapped_column(Integer, default=1)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)


class SupplierSignals(Base):
    __tablename__ = "supplier_signals"
    supplier_id: Mapped[str] = mapped_column(Text, ForeignKey("suppliers.id"),
                                             primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    vat_valid: Mapped[bool | None] = mapped_column(Boolean)
    vat_checked_at: Mapped[datetime | None] = mapped_column()
    domain_age_days: Mapped[int | None] = mapped_column(Integer)
    mx_present: Mapped[bool | None] = mapped_column(Boolean)
    spf_present: Mapped[bool | None] = mapped_column(Boolean)
    dmarc_present: Mapped[bool | None] = mapped_column(Boolean)
    sanctions_match: Mapped[bool] = mapped_column(Boolean, default=False)
    sanctions_lists: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    registry_match: Mapped[bool | None] = mapped_column(Boolean)
    raw: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="received")
    ocr_provider: Mapped[str | None] = mapped_column(Text)
    ocr_raw_key: Mapped[str | None] = mapped_column(Text)
    parsed_at: Mapped[datetime | None] = mapped_column()
    failure_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    document_id: Mapped[str] = mapped_column(Text, ForeignKey("documents.id"))
    supplier_id: Mapped[str | None] = mapped_column(Text, ForeignKey("suppliers.id"))
    external_ref: Mapped[str | None] = mapped_column(Text)

    invoice_number: Mapped[str | None] = mapped_column(Text)
    issue_date: Mapped[date | None] = mapped_column(Date)
    due_date: Mapped[date | None] = mapped_column(Date)

    currency: Mapped[str | None] = mapped_column(String(3))
    subtotal_cents: Mapped[int | None] = mapped_column(BigInteger)
    tax_cents: Mapped[int | None] = mapped_column(BigInteger)
    total_cents: Mapped[int | None] = mapped_column(BigInteger)

    iban: Mapped[str | None] = mapped_column(Text)
    iban_country: Mapped[str | None] = mapped_column(String(2))
    bank_account_holder: Mapped[str | None] = mapped_column(Text)

    language: Mapped[str | None] = mapped_column(Text)
    raw_text_excerpt: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(Text, default="processing")
    trust_score: Mapped[int | None] = mapped_column(Integer)
    risk_band: Mapped[str | None] = mapped_column(Text)
    scored_at: Mapped[datetime | None] = mapped_column()

    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invoice_id: Mapped[str] = mapped_column(Text, ForeignKey("invoices.id"))
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_band: Mapped[str] = mapped_column(Text, nullable=False)
    hard_penalty: Mapped[int] = mapped_column(Integer, default=0)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    contributors: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    weights_version: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class ForensicReport(Base):
    __tablename__ = "forensic_reports"
    invoice_id: Mapped[str] = mapped_column(Text, ForeignKey("invoices.id"),
                                            primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    has_javascript: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_score: Mapped[int | None] = mapped_column(Integer)
    font_score: Mapped[int | None] = mapped_column(Integer)
    rendering_score: Mapped[int | None] = mapped_column(Integer)
    signals: Mapped[list[dict]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class EmailArtifact(Base):
    __tablename__ = "email_artifacts"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    document_id: Mapped[str | None] = mapped_column(Text, ForeignKey("documents.id"))
    invoice_id: Mapped[str | None] = mapped_column(Text, ForeignKey("invoices.id"))
    message_id: Mapped[str | None] = mapped_column(Text)
    from_addr: Mapped[str | None] = mapped_column(Text)
    reply_to_addr: Mapped[str | None] = mapped_column(Text)
    display_name: Mapped[str | None] = mapped_column(Text)
    spf_pass: Mapped[bool | None] = mapped_column(Boolean)
    dkim_pass: Mapped[bool | None] = mapped_column(Boolean)
    dmarc_pass: Mapped[bool | None] = mapped_column(Boolean)
    lookalike_score: Mapped[int | None] = mapped_column(Integer)
    signals: Mapped[list[dict]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invoice_id: Mapped[str] = mapped_column(Text, ForeignKey("invoices.id"))
    state: Mapped[str] = mapped_column(Text, default="open")
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[str | None] = mapped_column(Text, ForeignKey("users.id"))
    due_at: Mapped[datetime | None] = mapped_column()
    closed_at: Mapped[datetime | None] = mapped_column()
    closed_by: Mapped[str | None] = mapped_column(Text)
    closure_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invoice_id: Mapped[str | None] = mapped_column(Text, ForeignKey("invoices.id"))
    supplier_id: Mapped[str | None] = mapped_column(Text, ForeignKey("suppliers.id"))
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    state: Mapped[str] = mapped_column(Text, default="open")
    title: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text)
    payload: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    resolved_at: Mapped[datetime | None] = mapped_column()


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False))
    actor_id: Mapped[str | None] = mapped_column(Text)
    actor_kind: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    resource_kind: Mapped[str | None] = mapped_column(Text)
    resource_id: Mapped[str | None] = mapped_column(Text)
    ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(Text)
    payload: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    prev_hash: Mapped[str | None] = mapped_column(Text)
    hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    secret: Mapped[str] = mapped_column(Text, nullable=False)
    events: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    endpoint_id: Mapped[str] = mapped_column(Text, ForeignKey("webhook_endpoints.id"))
    event: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_status_code: Mapped[int | None] = mapped_column(Integer)
    last_error: Mapped[str | None] = mapped_column(Text)
    next_attempt_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    invoice_id: Mapped[str] = mapped_column(Text, ForeignKey("invoices.id"))
    reviewer_id: Mapped[str | None] = mapped_column(Text, ForeignKey("users.id"))
    decision: Mapped[str] = mapped_column(Text, nullable=False)
    reason_code: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
