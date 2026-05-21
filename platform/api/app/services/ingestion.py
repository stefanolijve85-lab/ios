"""Document ingestion: persistence, OCR provider abstraction, parsing."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import date
from typing import Protocol

from ..config import settings


@dataclass
class ParsedInvoice:
    supplier_name: str | None = None
    supplier_address: str | None = None
    supplier_domain: str | None = None
    iban: str | None = None
    vat: str | None = None
    invoice_number: str | None = None
    issue_date: date | None = None
    due_date: date | None = None
    currency: str | None = None
    subtotal_cents: int | None = None
    tax_cents: int | None = None
    total_cents: int | None = None
    language: str | None = None
    raw_text_excerpt: str | None = None
    line_items: list[dict] = field(default_factory=list)


class OCRProvider(Protocol):
    def parse(self, file_bytes: bytes, *, mime_type: str) -> ParsedInvoice: ...


class MockOCRProvider:
    """Deterministic provider for local dev — extracts a few obvious fields."""
    def parse(self, file_bytes: bytes, *, mime_type: str) -> ParsedInvoice:
        # Best-effort: read text out of small PDFs.
        text = ""
        try:
            from io import BytesIO
            from pypdf import PdfReader
            r = PdfReader(BytesIO(file_bytes))
            text = "\n".join((p.extract_text() or "") for p in r.pages[:3])
        except Exception:
            text = ""
        excerpt = text[:4000] if text else None

        import re
        iban = None
        m = re.search(r"\b([A-Z]{2}[0-9A-Z]{13,30})\b", text)
        if m: iban = m.group(1)

        vat = None
        m = re.search(r"\b([A-Z]{2}[0-9A-Z]{8,12})\b", text)
        if m: vat = m.group(1)

        total = None
        m = re.search(r"(?:total|totaal)[^\d]{0,16}([0-9][0-9.,]*)", text, re.I)
        if m:
            try:
                total = int(round(float(m.group(1).replace(".", "").replace(",", ".")) * 100))
            except Exception:
                pass

        return ParsedInvoice(
            iban=iban, vat=vat, total_cents=total,
            raw_text_excerpt=excerpt,
        )


class AzureDocIntelligenceProvider:
    """Real impl calls Azure Document Intelligence prebuilt-invoice."""
    def parse(self, file_bytes: bytes, *, mime_type: str) -> ParsedInvoice:  # pragma: no cover
        raise NotImplementedError("Wire up DocumentAnalysisClient here")


def get_ocr_provider() -> OCRProvider:
    if settings.ocr_provider == "azure":
        return AzureDocIntelligenceProvider()
    return MockOCRProvider()


def sha256_of(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
