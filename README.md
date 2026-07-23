# SentinelGuard

**AI-Assisted Insider Threat Detection and Data Exfiltration Prevention System**

SentinelGuard is a prototype security system that builds a behavioral baseline for each user in an organization and flags activity that deviates from it — unusual file access volume, after-hours activity, attempted transfers to removable media or external cloud destinations, and large or atypical outbound file movement. Each event is assigned a dynamic, explainable risk score, and the system triggers a graded automated response.

> **Note on scope:** real OS-level endpoint agents (USB blocking, mail-server interception, cloud DLP hooks) require enterprise infrastructure and elevated privileges out of reach for an individual project. This prototype uses a realistic, clearly-labeled activity simulator in place of live endpoint sensors. The detection logic, risk-scoring engine, backend, and dashboard are all real and fully functional — only the source of raw activity events is synthetic. This is a deliberate design decision, not a limitation hidden from the reader.

---

## Why this project

Traditional security controls rely on manual log review and after-the-fact investigation — by which point sensitive data may already be gone. SentinelGuard instead continuously scores risk in near real time, so suspicious behavior is surfaced *before* data leaves the organization.

## Features

- **Synthetic activity-event generator** — realistic per-user logs: file access, downloads, USB copy attempts, cloud-upload attempts, email-attachment events.
- **Behavioral baseline engine** — learns each user's typical hours, file volume, and destinations from historical activity.
- **Anomaly detection** — statistical z-score baselining combined with an Isolation Forest model.
- **Explainable risk scoring** — a weighted 0–100 score per event and per user, with a contributing-factor breakdown (not a black box).
- **Graded automated response** — low risk → log only, medium risk → alert administrator, high risk → simulated session flag/lock.
- **Administrator dashboard** — live event feed, per-user risk view, alert timeline, and an investigation drill-down, with manual override controls.
- **Full audit log** of every event, score, and action.

## Tech stack

| Layer | Technology |
|---|---|
| Event simulation & ML | Python, Scikit-learn |
| Backend / REST API | Node.js, Express |
| Frontend dashboard | React |
| Auth | JWT (admin / analyst roles) |

## Architecture
Event Simulator (Python)
│
▼
Baseline & Risk-Scoring Engine (Python / Scikit-learn)
│
▼
Backend REST API (Node.js / Express) ──▶ Audit Log
│
▼
Admin Dashboard (React)


## Project structure

sentinelguard/
├── simulator/ # Module A — synthetic activity-event generator
├── risk-engine/ # Module B — behavioral baseline & anomaly/risk scoring
├── backend/ # Module C — Express REST API & response logic
├── dashboard/ # Module D — React administrator dashboard
├── docs/ # architecture notes, weekly logs, final report
└── README.md


## Getting started

```bash
git clone https://github.com/your-username/sentinelguard.git
cd sentinelguard
```

Setup instructions for each module are documented in that module's own folder as it's built.

## Roadmap

- [x] Project scaffolding & repository setup
- [ ] Module A — Activity simulation & event pipeline
- [ ] Module B — Behavioral baseline & risk-scoring engine
- [ ] Module C — Backend, response logic & APIs
- [ ] Module D — Administrator dashboard
- [ ] Evaluation against labeled attack scenarios
- [ ] Final report & demo script

**Timeline:** 29 June 2026 – 10 August 2026 (individual project, ~6 weeks).

## Author

**Harshit Yadav**

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.