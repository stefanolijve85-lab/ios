"""Email header analysis: SPF, DKIM, DMARC, lookalike domain detection."""
from __future__ import annotations

import email
import re
from dataclasses import dataclass, field
from email import policy

import tldextract
from rapidfuzz.distance import DamerauLevenshtein


# Homoglyph normalization map (ASCII-fold the most common confusables).
HOMOGLYPHS = str.maketrans({
    "0": "o", "1": "l",
    # Cyrillic look-alikes
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
    "А": "a", "В": "b", "С": "c", "Е": "e", "Н": "h", "К": "k", "М": "m",
    "О": "o", "Р": "p", "Т": "t", "Х": "x",
})

URGENCY_TERMS = re.compile(
    r"\b(urgent|asap|immediately|today|right away|wire|new bank|payment now|"
    r"updated bank details|change of account)\b",
    re.IGNORECASE,
)


@dataclass
class EmailResult:
    score: int                          # 0..100 trust
    spf_pass: bool | None
    dkim_pass: bool | None
    dmarc_pass: bool | None
    from_addr: str | None
    reply_to_addr: str | None
    display_name: str | None
    lookalike_score: int                 # 0..100, higher = more lookalike
    signals: list[dict] = field(default_factory=list)


def _normalize_domain(d: str) -> str:
    return d.translate(HOMOGLYPHS).lower().strip(".")


def _auth_results(headers: dict) -> tuple[bool | None, bool | None, bool | None]:
    """Parse Authentication-Results into (spf, dkim, dmarc) booleans."""
    raw = headers.get("Authentication-Results", "") or ""
    def _check(token: str) -> bool | None:
        m = re.search(rf"\b{token}=(\w+)", raw, re.IGNORECASE)
        if not m:
            return None
        return m.group(1).lower() == "pass"
    return _check("spf"), _check("dkim"), _check("dmarc")


def analyze(eml_bytes: bytes, *, expected_supplier_domain: str | None = None) -> EmailResult:
    msg = email.message_from_bytes(eml_bytes, policy=policy.default)

    headers = {k: v for k, v in msg.items()}
    from_hdr = msg.get("From") or ""
    reply_to_hdr = msg.get("Reply-To") or ""

    name_match = re.match(r'\s*"?([^"<]+?)"?\s*<([^>]+)>', from_hdr)
    if name_match:
        display_name = name_match.group(1).strip() or None
        from_addr = name_match.group(2).strip().lower()
    else:
        display_name = None
        from_addr = (from_hdr or "").strip().lower() or None

    reply_to_match = re.search(r"<([^>]+)>", reply_to_hdr) or None
    reply_to_addr = (reply_to_match.group(1).lower() if reply_to_match else
                     (reply_to_hdr.strip().lower() or None))

    spf, dkim, dmarc = _auth_results(headers)

    signals: list[dict] = []
    score = 100

    if spf is False:
        signals.append({"code": "spf_fail", "severity": "high",
                        "detail": "SPF check failed"})
        score -= 25
    elif spf is None:
        signals.append({"code": "spf_missing", "severity": "low",
                        "detail": "No SPF result in Authentication-Results"})
        score -= 5

    if dkim is False:
        signals.append({"code": "dkim_fail", "severity": "high",
                        "detail": "DKIM signature failed"})
        score -= 25
    elif dkim is None:
        signals.append({"code": "dkim_missing", "severity": "low",
                        "detail": "No DKIM result in Authentication-Results"})
        score -= 5

    if dmarc is False:
        signals.append({"code": "dmarc_fail", "severity": "high",
                        "detail": "DMARC alignment failed"})
        score -= 20

    if from_addr and reply_to_addr and from_addr != reply_to_addr:
        from_dom = from_addr.split("@", 1)[-1] if "@" in from_addr else ""
        reply_dom = reply_to_addr.split("@", 1)[-1] if "@" in reply_to_addr else ""
        if from_dom != reply_dom:
            signals.append({
                "code": "reply_to_mismatch",
                "severity": "medium",
                "detail": f"From {from_dom!r} but Reply-To {reply_dom!r}",
            })
            score -= 12

    lookalike = 0
    if expected_supplier_domain and from_addr and "@" in from_addr:
        actual = _normalize_domain(tldextract.extract(from_addr.split("@", 1)[1]).top_domain_under_public_suffix or "")
        expected = _normalize_domain(tldextract.extract(expected_supplier_domain).top_domain_under_public_suffix or "")
        if actual and expected and actual != expected:
            distance = DamerauLevenshtein.distance(actual, expected)
            similarity = max(0, 100 - distance * 20)
            if 0 < distance <= 2:
                lookalike = similarity
                signals.append({
                    "code": "lookalike_domain",
                    "severity": "high",
                    "detail": f"Sender domain {actual!r} is "
                              f"{distance} edits from supplier {expected!r}",
                })
                score -= 30

    # Display-name spoof: name claims supplier but address is unrelated.
    if display_name and expected_supplier_domain:
        n = _normalize_domain(display_name)
        if expected_supplier_domain.split(".")[0] in n and from_addr \
                and expected_supplier_domain not in from_addr:
            signals.append({
                "code": "display_name_spoof",
                "severity": "high",
                "detail": "Display name impersonates supplier but address differs",
            })
            score -= 20

    body = ""
    try:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_content()
        else:
            body = msg.get_content() if msg.get_content_type() == "text/plain" else ""
    except Exception:
        body = ""

    if URGENCY_TERMS.search(body or ""):
        signals.append({
            "code": "urgency_language",
            "severity": "medium",
            "detail": "Body contains urgency / payment-change language",
        })
        score -= 10

    return EmailResult(
        score=max(0, min(100, score)),
        spf_pass=spf, dkim_pass=dkim, dmarc_pass=dmarc,
        from_addr=from_addr, reply_to_addr=reply_to_addr,
        display_name=display_name,
        lookalike_score=lookalike,
        signals=signals,
    )
