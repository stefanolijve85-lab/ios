#!/usr/bin/env python3
"""End-to-end smoke test: signup → upload invoice → poll → print Trust Score.

Usage:
    python scripts/demo.py [path/to/invoice.pdf]

If no PDF path is given, a minimal in-memory PDF is generated. The script
prints what each step returned so you can see the full lifecycle:

    1. POST /v1/auth/signup
    2. POST /v1/invoices  (multipart upload)
    3. GET  /v1/invoices/{id}  (poll until status == 'scored')
    4. GET  /v1/insights/overview

Requires only stdlib + `requests`. Run after `docker compose up`.
"""
from __future__ import annotations

import json
import os
import secrets
import sys
import time
from pathlib import Path

import urllib.request
import urllib.error
import mimetypes

API = os.environ.get("API_BASE", "http://localhost:8000")


def _post_json(path: str, body: dict, token: str | None = None) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode(),
        headers={
            "content-type": "application/json",
            **({"authorization": f"Bearer {token}"} if token else {}),
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _get(path: str, token: str) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _post_multipart(path: str, fields: dict, files: dict, token: str) -> dict:
    boundary = "----TLBoundary" + secrets.token_hex(8)
    parts: list[bytes] = []
    for k, v in fields.items():
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        parts.append(f"{v}\r\n".encode())
    for k, (filename, content, mime) in files.items():
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(
            f'Content-Disposition: form-data; name="{k}"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n".encode()
        )
        parts.append(content)
        parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
    req = urllib.request.Request(
        f"{API}{path}", data=body,
        headers={
            "authorization": f"Bearer {token}",
            "content-type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _minimal_pdf() -> bytes:
    """A 3-line valid PDF — enough for forensics + ingestion to do something."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        b"2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n"
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj\n"
        b"trailer<< /Root 1 0 R >>\n"
        b"%%EOF\n"
    )


def main() -> int:
    print(f"→ API base: {API}")

    # 1. Signup
    suffix = secrets.token_hex(3)
    email = f"demo-{suffix}@trustline.local"
    password = "demo-password-123!"
    print(f"\n[1/4] POST /v1/auth/signup  (email={email})")
    tokens = _post_json("/v1/auth/signup", {
        "email": email,
        "password": password,
        "full_name": "Demo Admin",
        "tenant_name": f"Demo Tenant {suffix}",
    })
    access = tokens["access_token"]
    print(f"      ↳ got access token (exp {tokens['expires_in']}s)")

    # 2. Upload
    if len(sys.argv) > 1:
        pdf_path = Path(sys.argv[1])
        body = pdf_path.read_bytes()
        filename = pdf_path.name
        mime = mimetypes.guess_type(filename)[0] or "application/pdf"
    else:
        body = _minimal_pdf()
        filename = "demo.pdf"
        mime = "application/pdf"
    print(f"\n[2/4] POST /v1/invoices    (file={filename}, {len(body)} bytes)")
    up = _post_multipart(
        "/v1/invoices",
        fields={"source": "upload"},
        files={"file": (filename, body, mime)},
        token=access,
    )
    invoice_id = up["id"]
    print(f"      ↳ invoice_id={invoice_id}, status={up['status']}")

    # 3. Poll until scored
    print(f"\n[3/4] GET  /v1/invoices/{invoice_id}  (polling…)")
    detail = None
    for attempt in range(30):
        detail = _get(f"/v1/invoices/{invoice_id}", access)
        if detail.get("status") == "scored":
            break
        time.sleep(1)
    if not detail or detail.get("status") != "scored":
        print("      ✗ timed out waiting for worker — is the celery worker running?")
        return 1

    score = detail.get("trust_score")
    band = detail.get("risk_band")
    print(f"      ↳ Trust Score: {score} ({band})")
    risk = detail.get("risk") or {}
    if risk.get("recommended_action"):
        print(f"        Action: {risk['recommended_action']}")
    for c in (risk.get("contributors") or [])[:5]:
        print(f"        · {c['signal']:<35} raw={c['raw_score']:>3}  "
              f"Δ={c['delta']:+.1f}  — {c['reason']}")

    # 4. Insights
    print(f"\n[4/4] GET  /v1/insights/overview")
    ov = _get("/v1/insights/overview", access)
    print(f"      ↳ {ov['invoices_total']} invoices, "
          f"{ov['invoices_high_risk']} high-risk, "
          f"avg trust {ov['avg_trust_score']:.1f}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(2)
