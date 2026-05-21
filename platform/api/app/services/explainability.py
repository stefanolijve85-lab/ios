"""Explainable narrative generation.

We combine the structured contributors into hedged natural language. The
LLM is *only* used to phrase what the deterministic scorer already decided;
it never changes the score.

Banned phrases are checked at the boundary so no operator can ship a
phrasing that asserts fraud.
"""
from __future__ import annotations

import re

from ..schemas import RiskAssessmentOut, SignalContribution

BANNED_PHRASES = re.compile(
    r"\b(definitely fraudulent|confirmed fraud|known scam|certainly fake|"
    r"this is fraud|this is a scam)\b",
    re.IGNORECASE,
)

HEDGE_VERBS = {
    "trusted":    "appears trustworthy",
    "low":        "appears low-risk",
    "medium":     "shows some risk indicators",
    "suspicious": "shows multiple risk indicators",
    "high":       "shows strong risk indicators",
    "critical":   "shows critical risk indicators",
}


def narrate(assessment: RiskAssessmentOut) -> str:
    band = assessment.risk_band
    head = f"This invoice {HEDGE_VERBS[band]} (Trust Score {assessment.trust_score}/100)."
    bullets: list[str] = []
    for c in assessment.contributors[:5]:
        if c.weighted < 0 or c.delta < 0:
            bullets.append(f"• {c.reason}")
    if not bullets:
        bullets.append("• No strong negative signals were detected.")
    rec = f"Recommended action: {assessment.recommended_action}."
    out = "\n".join([head, *bullets, rec])
    if BANNED_PHRASES.search(out):
        # Should never happen — fail closed.
        return f"{head}\n{rec}"
    return out
