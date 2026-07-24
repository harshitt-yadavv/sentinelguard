# SentinelGuard — Weekly Log

## Week 1 (starting 29 June 2026)
- Set up repository, project structure, and development environment.
- Built Module A: synthetic event generator with per-user behavioral profiles (active hours, typical volume).
- Built Module B: baseline engine (learns per-user normal hour range, volume mean/std, action distribution) and rule-based explainable risk scorer.
- Injected deliberate attack scenarios (off-hours large-volume USB copy and cloud upload) and confirmed the rule-based scorer correctly classifies them HIGH while leaving normal activity and a control case LOW.
- Added an Isolation Forest ML model as a second, independent detection method; confirmed it agrees with the rule-based scorer on both attacks.
- Built Module C: Express backend exposing `/api/events` and `/api/alerts`.
- Built Module D: React dashboard consuming the API, with a live event feed and alerts table.
- Polished the dashboard: auto-refresh, sortable columns, risk-over-time chart with threshold lines.
- Added JWT authentication: login endpoint, protected alerts route, and a working login screen in the dashboard.

## Week 2
_(update as you go)_

## Week 3
_(update as you go)_