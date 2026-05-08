"""Trust Score aggregation.

The score is a transparent weighted sum, deliberately *not* a single
end-to-end ML model. Every contributing signal is recorded in
`risk_assessments.contributors` so reviewers and auditors can trace
exactly *why* an invoice scored what it scored.

Wording is hedged on purpose: we never claim fraud. We surface
indicators and recommendations.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterable

from ..schemas import RiskBand, SignalContribution

WEIGHTS_VERSION = "v1.0.0"
MODEL_VERSION = "trust-score-v1"

DEFAULT_WEIGHTS: dict[str, float] = {
    "forensics": 0.18,
    "supplier": 0.22,
    "iban": 0.22,
    "email": 0.12,
    "anomaly": 0.14,
    "vision": 0.07,
    "history": 0.05,
}


@dataclass
class HardPenalty:
    """A penalty that can deduct points and force a band ceiling."""
    code: str
    deduction: int                      # 0..100 points to subtract
    band_ceiling: RiskBand | None       # caps the resulting band
    reason: str


@dataclass
class SubScore:
    name: str
    score: int                          # 0..100, higher = better
    reason: str
    signals: list[dict] = field(default_factory=list)


@dataclass
class RiskDecision:
    trust_score: int
    risk_band: RiskBand
    hard_penalty: int
    recommended_action: str
    contributors: list[SignalContribution]
    weights_version: str = WEIGHTS_VERSION
    model_version: str = MODEL_VERSION
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


_BAND_FLOOR = {
    "trusted": 90, "low": 75, "medium": 55,
    "suspicious": 35, "high": 15, "critical": 0,
}
_BAND_ORDER = ["trusted", "low", "medium", "suspicious", "high", "critical"]


def _band_for_score(score: int) -> RiskBand:
    for band in _BAND_ORDER:
        if score >= _BAND_FLOOR[band]:
            return band  # type: ignore[return-value]
    return "critical"


def _cap_band(band: RiskBand, ceiling: RiskBand | None) -> RiskBand:
    if ceiling is None:
        return band
    if _BAND_ORDER.index(band) >= _BAND_ORDER.index(ceiling):
        return band
    return ceiling


def _action_for_band(band: RiskBand) -> str:
    return {
        "trusted":    "Auto-approve permitted by policy",
        "low":        "Single approver — review IBAN before payment",
        "medium":     "Dual approval recommended",
        "suspicious": "Send to fraud queue; verify supplier out-of-band",
        "high":       "Block payment; notify CFO; verify supplier directly",
        "critical":   "Block payment; lock supplier; trigger incident review",
    }[band]


def score(
    *,
    sub_scores: Iterable[SubScore],
    hard_penalties: Iterable[HardPenalty] = (),
    weights: dict[str, float] | None = None,
) -> RiskDecision:
    weights = {**DEFAULT_WEIGHTS, **(weights or {})}
    contributors: list[SignalContribution] = []

    weighted_total = 0.0
    used_weight = 0.0
    for sub in sub_scores:
        w = weights.get(sub.name, 0.0)
        if w == 0:
            continue
        weighted = sub.score * w
        weighted_total += weighted
        used_weight += w
        contributors.append(SignalContribution(
            signal=sub.name,
            raw_score=int(sub.score),
            weight=w,
            weighted=round(weighted, 2),
            delta=round((sub.score - 75) * w, 2),  # delta vs neutral baseline
            reason=sub.reason,
        ))

    # Re-normalize if some sub-scores were absent — a missing optional
    # sub-score should not artificially depress the total.
    base_score = int(round(weighted_total / used_weight)) if used_weight else 0

    deduction_total = 0
    band_ceiling: RiskBand | None = None
    for hp in hard_penalties:
        deduction_total += hp.deduction
        if hp.band_ceiling and (
            band_ceiling is None
            or _BAND_ORDER.index(hp.band_ceiling) > _BAND_ORDER.index(band_ceiling)
        ):
            band_ceiling = hp.band_ceiling
        contributors.append(SignalContribution(
            signal=f"penalty:{hp.code}",
            raw_score=0,
            weight=0.0,
            weighted=-float(hp.deduction),
            delta=-float(hp.deduction),
            reason=hp.reason,
        ))

    final_score = max(0, min(100, base_score - deduction_total))
    band = _cap_band(_band_for_score(final_score), band_ceiling)

    # Surface only the top 5 contributors by absolute weighted impact, so the
    # UI can show a focused "why" panel.
    contributors.sort(key=lambda c: abs(c.weighted), reverse=True)
    contributors = contributors[:5]

    return RiskDecision(
        trust_score=final_score,
        risk_band=band,
        hard_penalty=deduction_total,
        recommended_action=_action_for_band(band),
        contributors=contributors,
    )


# ─── Helpers for assembling sub-scores from service results ───────────────

def hard_penalties_from_signals(
    *,
    forensics_signals: list[dict],
    supplier_signals: list[dict],
    iban_signals: list[dict],
    email_signals: list[dict],
) -> list[HardPenalty]:
    """Map specific high-impact signals to hard penalties."""
    out: list[HardPenalty] = []
    codes_present = {s["code"] for s in (
        forensics_signals + supplier_signals + iban_signals + email_signals
    )}

    if "embedded_javascript" in codes_present:
        out.append(HardPenalty(
            code="embedded_javascript",
            deduction=40, band_ceiling="suspicious",
            reason="PDF contains executable code — never expected in invoices",
        ))
    if "sanctions_hit" in codes_present:
        out.append(HardPenalty(
            code="sanctions_hit",
            deduction=60, band_ceiling="critical",
            reason="Supplier matches an active sanctions list",
        ))
    if "iban_country_high_risk" in codes_present:
        out.append(HardPenalty(
            code="iban_country_high_risk",
            deduction=25, band_ceiling="high",
            reason="IBAN country is on the high-risk list",
        ))
    if {"young_domain", "iban_new_for_supplier"}.issubset(codes_present):
        out.append(HardPenalty(
            code="young_domain_plus_new_iban",
            deduction=30, band_ceiling="high",
            reason="New supplier domain combined with first-seen IBAN",
        ))
    if {"spf_fail", "dkim_fail"}.issubset(codes_present) \
            and "display_name_spoof" in codes_present:
        out.append(HardPenalty(
            code="email_impersonation",
            deduction=35, band_ceiling="high",
            reason="SPF and DKIM both failed with display-name spoofing",
        ))
    return out
