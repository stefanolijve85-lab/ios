"""Behavioral anomaly detection.

v1: per-tenant z-score on amount, weekday, hour, supplier frequency.
v2 (post-MVP): LightGBM gradient boosted classifier trained on
`feedback_events` history.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Invoice


@dataclass
class AnomalyResult:
    score: int                          # 0..100, higher = more normal
    amount_z: float
    is_offhours: bool
    supplier_freq_30d: int
    duplicate_amount_match: bool
    signals: list[dict] = field(default_factory=list)


def _stats(values: list[float]) -> tuple[float, float]:
    arr = np.array(values, dtype=float) if values else np.array([0.0])
    return float(arr.mean()), float(arr.std() or 1.0)


def assess(
    session: Session,
    *,
    tenant_id: str,
    supplier_id: str | None,
    total_cents: int | None,
    issue_dt: datetime | None,
) -> AnomalyResult:
    signals: list[dict] = []

    # Recent invoices for this tenant (last 180 days).
    cutoff = datetime.now(timezone.utc) - timedelta(days=180)
    rows = session.execute(
        select(Invoice.total_cents, Invoice.created_at, Invoice.supplier_id)
        .where(Invoice.tenant_id == tenant_id)
        .where(Invoice.created_at >= cutoff)
        .where(Invoice.total_cents.is_not(None))
    ).all()

    amounts = [float(r[0]) for r in rows if r[0] is not None]
    mean, std = _stats(amounts) if amounts else (0.0, 1.0)

    z = 0.0
    if total_cents is not None and amounts:
        z = (float(total_cents) - mean) / std

    if abs(z) >= 4:
        signals.append({"code": "amount_extreme",
                        "severity": "high",
                        "detail": f"Amount is {z:+.1f}σ from tenant baseline"})
    elif abs(z) >= 2.5:
        signals.append({"code": "amount_outlier",
                        "severity": "medium",
                        "detail": f"Amount is {z:+.1f}σ from tenant baseline"})

    is_offhours = False
    if issue_dt is not None:
        # Friday afternoon / weekend / outside business hours.
        wd = issue_dt.weekday()      # Mon=0
        h = issue_dt.hour
        if wd >= 5 or h < 7 or h >= 19 or (wd == 4 and h >= 15):
            is_offhours = True
            signals.append({"code": "offhours_arrival",
                            "severity": "low",
                            "detail": f"Invoice received at "
                                      f"{issue_dt.strftime('%a %H:%M')}"})

    supplier_freq = 0
    if supplier_id:
        thirty = datetime.now(timezone.utc) - timedelta(days=30)
        supplier_freq = sum(
            1 for r in rows
            if r[2] == supplier_id and r[1] and (
                r[1].replace(tzinfo=timezone.utc) if r[1].tzinfo is None else r[1]
            ) >= thirty
        )

    # Duplicate amount within 7 days for the same supplier — common
    # double-billing or re-submission pattern.
    duplicate = False
    if supplier_id and total_cents is not None:
        seven = datetime.now(timezone.utc) - timedelta(days=7)
        for amt, when, sup in rows:
            if sup != supplier_id or amt != total_cents:
                continue
            ts = when.replace(tzinfo=timezone.utc) if when and when.tzinfo is None else when
            if ts and ts >= seven:
                duplicate = True
                break
        if duplicate:
            signals.append({"code": "amount_duplicate",
                            "severity": "medium",
                            "detail": "Same supplier+amount in last 7 days"})

    score = 100
    score -= min(50, int(abs(z) * 8))
    if is_offhours: score -= 5
    if duplicate: score -= 15
    score = max(0, min(100, score))

    return AnomalyResult(
        score=score,
        amount_z=z,
        is_offhours=is_offhours,
        supplier_freq_30d=supplier_freq,
        duplicate_amount_match=duplicate,
        signals=signals,
    )
