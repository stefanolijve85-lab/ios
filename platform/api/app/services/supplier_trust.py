"""Supplier verification: VAT, registry, domain age, sanctions."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import Supplier, SupplierSignals


# Stub sanctions store. In prod, hydrated nightly from OFAC SDN, EU
# consolidated, UN consolidated lists into a fast lookup table.
_SANCTIONS_NAMES = {"Sanctioned Holdings BV"}
_SANCTIONS_VATS = set()


@dataclass
class SupplierTrustResult:
    score: int                               # 0..100
    vat_valid: bool | None
    domain_age_days: int | None
    has_mx: bool | None
    has_spf: bool | None
    has_dmarc: bool | None
    sanctions_match: bool
    signals: list[dict] = field(default_factory=list)


# ─── VAT helpers ─────────────────────────────────────────────────────────

_VAT_PATTERN = re.compile(r"^[A-Z]{2}[A-Z0-9]+$")


def vat_format_ok(vat: str | None) -> bool:
    if not vat:
        return False
    cleaned = vat.replace(" ", "").upper()
    return bool(_VAT_PATTERN.match(cleaned)) and 4 <= len(cleaned) <= 14


def vat_lookup_stub(vat: str) -> bool | None:
    """Stand-in for VIES SOAP call; returns None when offline."""
    # Heuristic: NL VAT must end with B + 2 digits.
    cleaned = vat.replace(" ", "").upper()
    if cleaned.startswith("NL"):
        return bool(re.match(r"^NL[0-9]{9}B[0-9]{2}$", cleaned))
    return None


def assess(
    session: Session,
    *,
    supplier: Supplier,
    extracted_vat: str | None = None,
    extracted_domain: str | None = None,
) -> SupplierTrustResult:
    signals: list[dict] = []
    score = 100

    vat = (extracted_vat or supplier.vat or "").strip() or None
    if vat and not vat_format_ok(vat):
        signals.append({"code": "vat_malformed", "severity": "medium",
                        "detail": f"VAT {vat!r} fails format check"})
        score -= 10
    vat_valid = vat_lookup_stub(vat) if vat and vat_format_ok(vat) else None
    if vat_valid is False:
        signals.append({"code": "vat_invalid", "severity": "high",
                        "detail": "VAT registry lookup failed"})
        score -= 25

    # Sanctions check (name + VAT exact match — extend with fuzzy in prod).
    sanc = supplier.name in _SANCTIONS_NAMES or (vat and vat in _SANCTIONS_VATS)
    if sanc:
        signals.append({"code": "sanctions_hit", "severity": "critical",
                        "detail": "Supplier appears on sanctions list"})
        score -= 60

    # Pull stored signals (populated async by background WHOIS/DNS jobs).
    sig = session.get(SupplierSignals, supplier.id)
    domain_age = sig.domain_age_days if sig else None
    has_mx = sig.mx_present if sig else None
    has_spf = sig.spf_present if sig else None
    has_dmarc = sig.dmarc_present if sig else None

    if domain_age is not None and domain_age < 30:
        signals.append({"code": "young_domain", "severity": "high",
                        "detail": f"Supplier domain registered {domain_age} days ago"})
        score -= 25
    elif domain_age is not None and domain_age < 180:
        signals.append({"code": "newish_domain", "severity": "medium",
                        "detail": f"Supplier domain only {domain_age} days old"})
        score -= 10

    if has_mx is False:
        signals.append({"code": "no_mx", "severity": "medium",
                        "detail": "Supplier domain has no MX record"})
        score -= 10
    if has_dmarc is False:
        signals.append({"code": "no_dmarc", "severity": "low",
                        "detail": "Supplier domain has no DMARC policy"})
        score -= 5

    return SupplierTrustResult(
        score=max(0, min(100, score)),
        vat_valid=vat_valid,
        domain_age_days=domain_age,
        has_mx=has_mx, has_spf=has_spf, has_dmarc=has_dmarc,
        sanctions_match=bool(sanc),
        signals=signals,
    )
