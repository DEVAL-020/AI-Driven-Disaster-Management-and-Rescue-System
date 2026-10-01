# PRD — SentinelAI: AI-Driven Disaster Management & Rescue System

## Original Problem Statement
Build a full-stack AI-Driven Disaster Management and Rescue System as a Computer Networks PBL project, integrating AI, IoT, Cloud, Computer Networks, and Cybersecurity.

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn/ui + Framer Motion + React-Leaflet (dark tactical command-center theme).
- **Backend**: FastAPI (all routes `/api`-prefixed), Motor/MongoDB.
- **Auth**: JWT in httpOnly cookies (access + refresh), bcrypt, role-based (admin / rescue_team / citizen).
- **AI**: OpenAI Anthropic Claude via REST (optional `ANTHROPIC_API_KEY`).

## User Personas
- **Admin (Command Control)**: full oversight — incidents, AI analysis, IoT, rescue dispatch, SOS, security.
- **Rescue Team (Tactical Dispatch)**: incidents, AI analysis, IoT, dispatch, SOS.
- **Citizen (SOS Portal)**: submit SOS, view live map & sensors, track own reports.

## Core Requirements (static)
- Live disaster dashboard with interactive Leaflet map + severity markers.
- IoT sensor simulation (seismic, water level, temperature, air quality, wind) with live tick + pause/resume.
- AI prediction: severity score, risk level, spread, population at risk, recommended actions, alert message.
- Rescue operations: team allocation/dispatch + recall, citizen SOS intake & resolution.
- Role-based login & security; CN/Cybersecurity indicators (MQTT/TLS mesh, AES-256/RSA-2048, DDoS, ping/packet-loss/bandwidth).

## Implemented (2026-06)
- JWT auth (register/login/logout/me) with 3 seeded roles — DONE.
- Landing, Login (one-click demo logins), Register pages — DONE.
- Role-aware command dashboard with tabbed modules — DONE.
- Incident CRUD + AI analysis per incident — DONE.
- IoT sensor feed with live simulation — DONE.
- Rescue team dispatch/recall + allocation to incidents/SOS — DONE.
- Citizen SOS portal + admin/rescue SOS management — DONE.
- Security event log + network topology/stats banner — DONE.
- RESCUE-AI chat assistant  — DONE.
- E2E tested: 25/25 backend tests pass, frontend core flows pass.

## Backlog
- **P1**: Split server.py into routers (incidents/sensors/sos/teams) before further growth.
- **P1**: Brute-force lockout on /auth/login; wrap ObjectId() parsing → 400 on bad ids.
- **P2**: Streaming AI responses (SSE) in chat; WebSocket push for live sensor feed.
- **P2**: Historical incident charts (recharts) and SOS heatmap.
- **P2**: Email/SMS alerting on CRITICAL AI risk.

## Test Credentials
See /app/memory/test_credentials.md (admin@rescue.io/admin123, rescue@rescue.io/password123, citizen@rescue.io/password123).
