"""Visual template fingerprinting.

This module is intentionally a thin scaffold. The production version
rasterizes page 1, runs perceptual hashing (pHash) and a CLIP-style layout
embedding, and compares against the tenant's known templates for that
supplier.

Here we expose a stable interface and a deterministic fallback.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field


@dataclass
class VisionResult:
    score: int                          # 0..100 trust
    perceptual_hash: str
    template_match: bool                # matched a known supplier template
    template_supplier_id: str | None
    signals: list[dict] = field(default_factory=list)


def fingerprint(file_bytes: bytes) -> str:
    """Stable fingerprint of the document bytes — placeholder for pHash."""
    return hashlib.blake2s(file_bytes, digest_size=16).hexdigest()


def assess(
    file_bytes: bytes,
    *,
    expected_supplier_id: str | None = None,
    known_templates: dict[str, list[str]] | None = None,
) -> VisionResult:
    """Compare the document fingerprint against known templates.

    `known_templates` maps `supplier_id -> [fingerprint, ...]` for the
    tenant's stored templates. In a real impl this is a vector index lookup.
    """
    fp = fingerprint(file_bytes)
    known_templates = known_templates or {}

    matched_supplier = None
    for sup_id, fps in known_templates.items():
        if fp in fps:
            matched_supplier = sup_id
            break

    signals: list[dict] = []
    score = 80  # baseline when we have no template to compare against

    if matched_supplier is not None:
        if expected_supplier_id and matched_supplier != expected_supplier_id:
            signals.append({
                "code": "template_supplier_mismatch",
                "severity": "high",
                "detail": f"Layout matches supplier {matched_supplier!r} "
                          f"but invoice claims {expected_supplier_id!r}",
            })
            score = 25
        else:
            score = 95
    else:
        if expected_supplier_id and expected_supplier_id in known_templates:
            signals.append({
                "code": "template_drift",
                "severity": "medium",
                "detail": "Visual layout does not match known supplier templates",
            })
            score = 60

    return VisionResult(
        score=score,
        perceptual_hash=fp,
        template_match=matched_supplier is not None,
        template_supplier_id=matched_supplier,
        signals=signals,
    )
