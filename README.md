# Trustline

This repository contains two projects that together form the Trustline product:

| Project | Stack | Purpose |
|---|---|---|
| **`/platform`** | Next.js + FastAPI + Postgres + Redis | The SaaS — landing page, dashboard, API, AI/ML pipeline |
| **Repo root (`/app`, `/components`, `/hooks`, `/constants`)** | Expo + React Native | Mobile companion — on-the-go approvals, push notifications, MFA |

> **The AI trust layer for business payments.**
> Detect invoice fraud, supplier impersonation, manipulated PDFs, and
> abnormal payment behavior before money leaves your business.

## Get started with the SaaS

```bash
cd platform
cp api/.env.example api/.env
docker compose up --build
```

- Landing + dashboard: http://localhost:3000
- API + OpenAPI docs:   http://localhost:8000/docs

See [`platform/README.md`](./platform/README.md) for the full layout, and
[`platform/docs/ARCHITECTURE.md`](./platform/docs/ARCHITECTURE.md) for the
system design.

## Get started with the mobile app

The original Expo project remains in place at the repository root.

```bash
npm install
npx expo start
```

Future work wires the mobile app to the Trustline API for reviewer-on-the-go
flows (see [`platform/docs/ROADMAP.md`](./platform/docs/ROADMAP.md)).
