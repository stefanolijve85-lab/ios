"""PDF forensic analysis.

Inspects the document at the structural level — metadata, fonts, embedded
JavaScript, object tree anomalies, suspicious producer strings.

This is intentionally conservative: a single signal is *informational*; only
multiple co-occurring signals push the score down meaningfully.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from io import BytesIO

try:
    from pypdf import PdfReader  # type: ignore
except ImportError:  # pragma: no cover
    PdfReader = None  # the worker container has it; tests can mock


# Producers known to legitimately produce invoices.
TRUSTED_PRODUCERS = {
    "adobe pdf library", "ilovepdf", "tcpdf", "wkhtmltopdf",
    "microsoft: print to pdf", "microsoft word", "libreoffice",
    "quartz pdfcontext", "skia/pdf", "ghostscript", "podofo",
    "exact synergy", "afas", "twinfield", "xero", "quickbooks",
    "stripe", "sap", "oracle reports",
}

# Producers strongly associated with manual editing of someone else's PDF.
SUSPICIOUS_PRODUCERS = {
    "adobe photoshop", "gimp", "preview",  # ← Mac Preview can re-save w/ edits
    "pdfescape", "smallpdf", "sejda", "pdf24", "ilovepdf editor",
}


@dataclass
class ForensicResult:
    score: int                          # 0..100 trust
    has_javascript: bool
    metadata_score: int
    font_score: int
    rendering_score: int
    signals: list[dict] = field(default_factory=list)


def analyze(file_bytes: bytes) -> ForensicResult:
    if PdfReader is None:
        return ForensicResult(50, False, 50, 50, 50, [
            {"code": "forensics_unavailable", "severity": "info",
             "detail": "PDF library not installed in this environment"}])

    signals: list[dict] = []
    metadata_score = 100
    font_score = 100
    rendering_score = 100
    has_js = False

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception as e:
        return ForensicResult(0, False, 0, 0, 0, [
            {"code": "pdf_parse_failed", "severity": "high",
             "detail": f"Could not parse PDF: {e}"}])

    info = reader.metadata or {}
    producer = (info.get("/Producer") or "").lower()
    creator = (info.get("/Creator") or "").lower()

    if any(p in producer for p in SUSPICIOUS_PRODUCERS) or any(
        p in creator for p in SUSPICIOUS_PRODUCERS
    ):
        signals.append({
            "code": "suspicious_producer",
            "severity": "high",
            "detail": f"Producer/creator suggests manual editing: "
                      f"producer={producer!r} creator={creator!r}",
        })
        metadata_score -= 40

    if producer and not any(t in producer for t in TRUSTED_PRODUCERS) \
            and not any(p in producer for p in SUSPICIOUS_PRODUCERS):
        signals.append({
            "code": "unknown_producer",
            "severity": "low",
            "detail": f"Unrecognized producer string: {producer!r}",
        })
        metadata_score -= 5

    creation_raw = str(info.get("/CreationDate") or "")
    mod_raw = str(info.get("/ModDate") or "")
    if creation_raw and mod_raw and mod_raw < creation_raw:
        signals.append({
            "code": "moddate_before_creation",
            "severity": "high",
            "detail": "Modification date precedes creation date",
        })
        metadata_score -= 25

    # Embedded JavaScript / launch actions.
    try:
        if "/JavaScript" in reader.trailer.get("/Root", {}) \
                or "/JS" in reader.trailer.get("/Root", {}):
            has_js = True
        for page in reader.pages:
            if "/AA" in page or "/JS" in page or "/JavaScript" in page:
                has_js = True
                break
    except Exception:
        pass
    if has_js:
        signals.append({
            "code": "embedded_javascript",
            "severity": "critical",
            "detail": "PDF contains embedded JavaScript or auto-actions",
        })
        rendering_score -= 60

    # Font analysis: many invoices have 1–4 fonts; an unusually high count
    # often correlates with copy-pasted text overlays.
    font_count = 0
    for page in reader.pages:
        try:
            res = page.get("/Resources") or {}
            fonts = (res.get("/Font") or {}) if isinstance(res, dict) else {}
            font_count = max(font_count, len(fonts))
        except Exception:
            continue
    if font_count >= 12:
        signals.append({
            "code": "excessive_fonts",
            "severity": "medium",
            "detail": f"Page uses {font_count} distinct fonts",
        })
        font_score -= 20

    # Page count sanity: 0-page PDFs and >40-page invoices are both unusual.
    pages = len(reader.pages)
    if pages == 0:
        signals.append({"code": "zero_pages", "severity": "high",
                        "detail": "PDF has zero rendered pages"})
        rendering_score -= 50
    elif pages > 40:
        signals.append({"code": "many_pages", "severity": "low",
                        "detail": f"Invoice has {pages} pages — unusually long"})

    score = max(0, min(100, int(
        0.45 * metadata_score + 0.30 * font_score + 0.25 * rendering_score
    )))

    return ForensicResult(
        score=score,
        has_javascript=has_js,
        metadata_score=metadata_score,
        font_score=font_score,
        rendering_score=rendering_score,
        signals=signals,
    )
