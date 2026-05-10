"""IBAN validation, country risk, history-based change detection.

The math (mod-97) is deterministic and runs in-process; sanctions/country
lists are loaded once. History comparisons are tenant-local Postgres reads.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import SupplierIbanHistory


# IBAN country length table (subset; extend per ISO 13616 registry).
IBAN_LENGTHS: dict[str, int] = {
    "AT": 20, "BE": 16, "BG": 22, "CH": 21, "CY": 28, "CZ": 24, "DE": 22,
    "DK": 18, "EE": 20, "ES": 24, "FI": 18, "FR": 27, "GB": 22, "GR": 27,
    "HR": 21, "HU": 28, "IE": 22, "IS": 26, "IT": 27, "LI": 21, "LT": 20,
    "LU": 20, "LV": 21, "MC": 27, "MT": 31, "NL": 18, "NO": 15, "PL": 28,
    "PT": 25, "RO": 24, "SE": 24, "SI": 19, "SK": 24, "SM": 27,
    "AE": 23, "AU": 0,  # AU has no IBAN — flag if claimed
    "US": 0,  # US has no IBAN — flag if claimed
}

# Static country-risk score (0 best, 100 worst). Real impl would pull FATF.
HIGH_RISK_COUNTRIES = {"IR", "KP", "SY", "MM", "VE", "BY", "RU", "AF", "YE"}
ELEVATED_RISK_COUNTRIES = {"NG", "PK", "TR", "UA", "AL", "MK"}


@dataclass
class IbanResult:
    score: int                          # 0..100 trust (higher = better)
    valid_format: bool
    valid_checksum: bool
    country: str | None
    country_risk: str                   # 'low' | 'elevated' | 'high'
    is_new_for_supplier: bool
    days_since_first_seen: int | None
    change_velocity_30d: int            # IBAN changes in last 30 days
    signals: list[dict]


def normalize(iban: str) -> str:
    return "".join(ch for ch in (iban or "").upper() if ch.isalnum())


def mod97(iban: str) -> bool:
    """Standard IBAN mod-97 checksum: rearrange and convert letters→digits."""
    if len(iban) < 4:
        return False
    rearranged = iban[4:] + iban[:4]
    converted = "".join(
        str(ord(c) - 55) if c.isalpha() else c for c in rearranged
    )
    try:
        return int(converted) % 97 == 1
    except ValueError:
        return False


def assess(
    session: Session,
    *,
    tenant_id: str,
    supplier_id: str | None,
    iban_raw: str | None,
) -> IbanResult:
    iban = normalize(iban_raw or "")
    signals: list[dict] = []

    if not iban:
        return IbanResult(0, False, False, None, "high", False, None, 0,
                          [{"code": "iban_missing", "severity": "high",
                            "detail": "No IBAN extracted"}])

    country = iban[:2] if iban[:2].isalpha() else None
    expected_len = IBAN_LENGTHS.get(country or "")
    valid_format = bool(country and expected_len and len(iban) == expected_len)
    if not valid_format:
        signals.append({"code": "iban_format",
                        "severity": "high",
                        "detail": f"Length/country mismatch ({country}, len={len(iban)})"})

    valid_checksum = mod97(iban) if valid_format else False
    if valid_format and not valid_checksum:
        signals.append({"code": "iban_checksum",
                        "severity": "high",
                        "detail": "Mod-97 checksum failed"})

    if country in HIGH_RISK_COUNTRIES:
        country_risk = "high"
        signals.append({"code": "iban_country_high_risk",
                        "severity": "high",
                        "detail": f"IBAN country {country} on high-risk list"})
    elif country in ELEVATED_RISK_COUNTRIES:
        country_risk = "elevated"
        signals.append({"code": "iban_country_elevated",
                        "severity": "medium",
                        "detail": f"IBAN country {country} flagged"})
    else:
        country_risk = "low"

    is_new = True
    days_seen: int | None = None
    velocity_30d = 0

    if supplier_id:
        history = session.execute(
            select(SupplierIbanHistory)
            .where(SupplierIbanHistory.tenant_id == tenant_id)
            .where(SupplierIbanHistory.supplier_id == supplier_id)
        ).scalars().all()

        for row in history:
            if row.iban == iban:
                is_new = False
                age = datetime.now(timezone.utc) - (
                    row.first_seen_at.replace(tzinfo=timezone.utc)
                    if row.first_seen_at.tzinfo is None else row.first_seen_at
                )
                days_seen = age.days

        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        velocity_30d = sum(
            1 for r in history
            if r.first_seen_at and (
                r.first_seen_at.replace(tzinfo=timezone.utc)
                if r.first_seen_at.tzinfo is None else r.first_seen_at
            ) >= cutoff
        )

        if is_new and history:
            signals.append({
                "code": "iban_new_for_supplier",
                "severity": "high",
                "detail": "Supplier has never used this IBAN before",
            })
        if velocity_30d >= 2:
            signals.append({
                "code": "iban_change_velocity",
                "severity": "high",
                "detail": f"{velocity_30d} IBAN changes in last 30 days",
            })

    # Score: start from 100 and subtract based on findings.
    score = 100
    if not valid_format: score -= 60
    elif not valid_checksum: score -= 50
    if country_risk == "high": score -= 35
    elif country_risk == "elevated": score -= 15
    if is_new and supplier_id and history: score -= 25
    if velocity_30d >= 2: score -= 25
    score = max(0, min(100, score))

    return IbanResult(
        score=score,
        valid_format=valid_format,
        valid_checksum=valid_checksum,
        country=country,
        country_risk=country_risk,
        is_new_for_supplier=is_new and bool(supplier_id),
        days_since_first_seen=days_seen,
        change_velocity_30d=velocity_30d,
        signals=signals,
    )
