# SentinelAI — AI-Driven Disaster Management & Rescue System

Role-based command center (admin, rescue team, citizen) with a live incident map, simulated IoT sensor feed,
AI risk analysis, SOS intake, rescue-team dispatch, and a security/network panel.

**Stack:** React 19 (CRA + craco, Tailwind, shadcn/ui, Leaflet) · FastAPI · MongoDB (Motor) · JWT httpOnly cookies · optional Anthropic API.

## Demo accounts (seeded on first request)
| Role | Email | Password |
|---|---|---|
| Admin | admin@rescue.io | `ADMIN_PASSWORD` (default `admin123`) |
| Rescue team | rescue@rescue.io | password123 |
| Citizen | citizen@rescue.io | password123 |

Change `ADMIN_PASSWORD` and `JWT_SECRET` for any public deployment, and consider removing the demo accounts.

## Local development
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # edit values
uvicorn server:app --reload --port 8001

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm start                       # http://localhost:3000
```
Tests (backend running): `cd backend && API_BASE_URL=http://localhost:8001 pytest`

## Deploy to Vercel (single project: frontend + API)
1. Create a free **MongoDB Atlas** cluster, allow access from anywhere (`0.0.0.0/0`), and copy the connection string.
2. Push this repo to GitHub, then **Import** it in Vercel (leave Root Directory as the repo root; `vercel.json` handles build + routing).
3. Add Environment Variables in Vercel:
   - `MONGO_URL`, `DB_NAME`, `JWT_SECRET` (long random), `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `COOKIE_SECURE=true`, `COOKIE_SAMESITE=lax`
   - optional: `ANTHROPIC_API_KEY` (without it the AI features run in offline-fallback mode)
   - Do **not** set `REACT_APP_BACKEND_URL`; the app calls `/api` on the same domain.
4. Deploy. Check `https://<your-app>.vercel.app/api/health`.

## Project layout
See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md). `api/index.py` is the Vercel serverless entrypoint wrapping `backend/server.py`.
