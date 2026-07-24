# SentinelGuard — Architecture & Design Notes

## Overview
SentinelGuard is a 4-module pipeline that simulates user activity, scores it for insider-threat risk, serves the results over an authenticated API, and displays them on a live dashboard.

Event Simulator (Python)
│ writes data/events.json
▼
Baseline & Risk-Scoring Engine (Python)
│ writes data/scored_events.json
▼
Backend REST API (Node.js / Express)
│ /api/events (public), /api/alerts (JWT-protected)
▼
React Dashboard (auto-refreshing, sortable, charted)


## Module A — Event Simulator (`/simulator`)
- Generates 500 synthetic events across 3 users, each with a distinct "normal" active-hour window and typical file-size range.
- Also generates a small set of deliberately anomalous "attack" events (off-hours, oversized transfers) used to validate detection.
- Output: `data/events.json`, `data/attack_events.json`.

## Module B — Risk Engine (`/risk-engine`)
Two independent detection approaches, used to cross-validate results:

1. **Rule-based scoring** (`risk_scoring.py`) — explainable, weighted scoring:
   - Off-hours activity: +30
   - Volume z-score > 2: +20, z-score > 3: +40
   - Inherently risky action types (USB copy, cloud upload): +10 to +15
   - Final score classified LOW (<35) / MEDIUM (35–69) / HIGH (≥70)
2. **ML-based anomaly detection** (`ml_model.py`) — an Isolation Forest trained on hour, volume, and one-hot-encoded action type, with `contamination=0.01`. Flags structurally unusual combinations a fixed rule set might miss.

**Validation result:** both methods independently flagged both injected attack events as anomalous, and both correctly left the normal control case unflagged.

## Module C — Backend API (`/backend`)
- Express server exposing:
  - `POST /api/login` — accepts username/password, returns a signed JWT (2h expiry). Passwords are bcrypt-hashed.
  - `GET /api/events` — public, returns all scored events.
  - `GET /api/alerts` — **JWT-protected**, returns only MEDIUM/HIGH events.
- Demo accounts: `admin` / `admin123`, `analyst` / `analyst123`.

## Module D — Dashboard (`/dashboard`)
- React + Vite app.
- Login screen gates access; token attached to protected requests via `Authorization: Bearer` header.
- Auto-refreshes every 10 seconds.
- Sortable event table, alerts panel with human-readable reasons, and a risk-over-time chart with HIGH/MEDIUM threshold reference lines.

## Known scope limitations (by design)
- Activity is simulated, not pulled from real OS-level sensors (USB blocking, mail interception, cloud DLP), which require enterprise infrastructure out of reach for an individual project.
- JWT secret is hardcoded for this prototype; a production system would use environment variables and a secrets manager.
- User accounts are hardcoded rather than stored in a database.

## Possible future work
- Persist events to a real database instead of flat JSON files.
- Real-time event streaming instead of batch scoring + polling.
- Session/device-level correlation across events (currently scored per-event).