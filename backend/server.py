from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from bson.errors import InvalidId

import auth as auth_mod
import ai_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("disaster-api")

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
db = client[os.environ.get("DB_NAME", "disaster_command")]

app = FastAPI(title="Disaster Command AI")
api = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Invalid id")


def ser(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "citizen"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class IncidentIn(BaseModel):
    type: str
    location: str
    lat: float
    lng: float
    severity: str = "moderate"
    description: str = ""


class IncidentStatusIn(BaseModel):
    status: str


class SOSIn(BaseModel):
    name: str
    phone: str
    emergency_type: str
    location: str
    lat: float
    lng: float
    people_count: int = 1
    message: str = ""


class AllocateIn(BaseModel):
    team_id: str
    incident_id: Optional[str] = None
    sos_id: Optional[str] = None


class ChatIn(BaseModel):
    message: str
    session_id: str = "rescue-assistant"


async def current_user(request: Request) -> dict:
    return await auth_mod.get_current_user(request, db)


def require_roles(*roles):
    async def checker(request: Request) -> dict:
        user = await auth_mod.get_current_user(request, db)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker


@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    role = payload.role if payload.role in auth_mod.ROLES else "citizen"
    if role == "admin":
        role = "citizen"
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": payload.name,
        "email": email,
        "password_hash": auth_mod.hash_password(payload.password),
        "role": role,
        "created_at": now_iso(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    at = auth_mod.create_access_token(uid, email, role)
    rt = auth_mod.create_refresh_token(uid)
    auth_mod.set_auth_cookies(response, at, rt)
    return {"id": uid, "name": payload.name, "email": email, "role": role, "token": at}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not auth_mod.verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    at = auth_mod.create_access_token(uid, email, user["role"])
    rt = auth_mod.create_refresh_token(uid)
    auth_mod.set_auth_cookies(response, at, rt)
    return {"id": uid, "name": user["name"], "email": email, "role": user["role"], "token": at}


@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(current_user)):
    auth_mod.clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


@api.get("/incidents")
async def list_incidents(user: dict = Depends(current_user)):
    docs = await db.incidents.find().sort("created_at", -1).to_list(500)
    return [ser(d) for d in docs]


@api.post("/incidents")
async def create_incident(payload: IncidentIn, user: dict = Depends(require_roles("admin", "rescue_team"))):
    doc = payload.model_dump()
    doc.update({
        "status": "active",
        "reported_by": user["email"],
        "created_at": now_iso(),
        "ai_analysis": None,
    })
    res = await db.incidents.insert_one(doc)
    return ser(await db.incidents.find_one({"_id": res.inserted_id}))


@api.patch("/incidents/{incident_id}/status")
async def update_incident_status(incident_id: str, payload: IncidentStatusIn,
                                 user: dict = Depends(require_roles("admin", "rescue_team"))):
    res = await db.incidents.update_one({"_id": oid(incident_id)},
                                        {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return ser(await db.incidents.find_one({"_id": oid(incident_id)}))


@api.delete("/incidents/{incident_id}")
async def delete_incident(incident_id: str, user: dict = Depends(require_roles("admin"))):
    await db.incidents.delete_one({"_id": oid(incident_id)})
    return {"ok": True}


@api.post("/incidents/{incident_id}/analyze")
async def analyze_incident(incident_id: str, user: dict = Depends(require_roles("admin", "rescue_team"))):
    inc = await db.incidents.find_one({"_id": oid(incident_id)})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    sensors = await db.sensors.find().to_list(100)
    analysis = await ai_service.analyze_incident(ser(inc), [ser(s) for s in sensors])
    analysis["generated_at"] = now_iso()
    await db.incidents.update_one({"_id": oid(incident_id)}, {"$set": {"ai_analysis": analysis}})
    return ser(await db.incidents.find_one({"_id": oid(incident_id)}))


SENSOR_RANGES = {
    "seismic": ("Richter", 0.5, 7.5, 4.0),
    "water_level": ("m", 0.2, 9.0, 4.5),
    "temperature": ("°C", 15, 65, 45),
    "air_quality": ("AQI", 20, 480, 200),
    "wind_speed": ("km/h", 5, 160, 90),
}


def sensor_status(stype: str, value: float) -> str:
    _, lo, hi, danger = SENSOR_RANGES[stype]
    if value >= danger:
        return "critical"
    if value >= danger * 0.7:
        return "warning"
    return "normal"


@api.get("/sensors")
async def list_sensors(user: dict = Depends(current_user)):
    docs = await db.sensors.find().to_list(100)
    return [ser(d) for d in docs]


@api.post("/sensors/tick")
async def tick_sensors(user: dict = Depends(current_user)):
    docs = await db.sensors.find().to_list(100)
    updated = []
    for s in docs:
        stype = s["type"]
        unit, lo, hi, danger = SENSOR_RANGES[stype]
        drift = random.uniform(-0.12, 0.14) * (hi - lo) * 0.25
        value = round(min(hi, max(lo, s["value"] + drift)), 2)
        status = sensor_status(stype, value)
        await db.sensors.update_one(
            {"_id": s["_id"]},
            {"$set": {"value": value, "status": status, "updated_at": now_iso()}},
        )
        s.update({"value": value, "status": status, "updated_at": now_iso()})
        updated.append(ser(s))
    return updated


@api.post("/sos")
async def create_sos(payload: SOSIn, user: dict = Depends(current_user)):
    doc = payload.model_dump()
    doc.update({
        "status": "pending",
        "reported_by": user["email"],
        "assigned_team": None,
        "created_at": now_iso(),
    })
    res = await db.sos_reports.insert_one(doc)
    return ser(await db.sos_reports.find_one({"_id": res.inserted_id}))


@api.get("/sos")
async def list_sos(user: dict = Depends(current_user)):
    query = {} if user["role"] in ("admin", "rescue_team") else {"reported_by": user["email"]}
    docs = await db.sos_reports.find(query).sort("created_at", -1).to_list(500)
    return [ser(d) for d in docs]


@api.patch("/sos/{sos_id}/status")
async def update_sos_status(sos_id: str, payload: IncidentStatusIn,
                            user: dict = Depends(require_roles("admin", "rescue_team"))):
    res = await db.sos_reports.update_one({"_id": oid(sos_id)}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="SOS report not found")
    return ser(await db.sos_reports.find_one({"_id": oid(sos_id)}))


@api.get("/teams")
async def list_teams(user: dict = Depends(current_user)):
    docs = await db.teams.find().to_list(100)
    return [ser(d) for d in docs]


@api.post("/allocate")
async def allocate(payload: AllocateIn, user: dict = Depends(require_roles("admin", "rescue_team"))):
    team = await db.teams.find_one({"_id": oid(payload.team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    target = payload.incident_id or payload.sos_id
    await db.teams.update_one({"_id": oid(payload.team_id)},
                              {"$set": {"status": "deployed", "assigned_to": target}})
    if payload.sos_id:
        await db.sos_reports.update_one({"_id": oid(payload.sos_id)},
                                        {"$set": {"status": "dispatched", "assigned_team": team["name"]}})
    if payload.incident_id:
        await db.incidents.update_one({"_id": oid(payload.incident_id)},
                                      {"$set": {"status": "responding"}})
    return ser(await db.teams.find_one({"_id": oid(payload.team_id)}))


@api.post("/teams/{team_id}/recall")
async def recall_team(team_id: str, user: dict = Depends(require_roles("admin", "rescue_team"))):
    await db.teams.update_one({"_id": oid(team_id)},
                              {"$set": {"status": "available", "assigned_to": None}})
    return ser(await db.teams.find_one({"_id": oid(team_id)}))


@api.get("/network/stats")
async def network_stats(user: dict = Depends(current_user)):
    return {
        "ping_ms": random.randint(8, 48),
        "packet_loss_pct": round(random.uniform(0.0, 2.4), 2),
        "bandwidth_mbps": random.randint(120, 940),
        "mesh_nodes_online": random.randint(42, 64),
        "mesh_nodes_total": 64,
        "encryption": "AES-256 / RSA-2048",
        "protocol": "MQTT over TLS 1.3",
        "edge_cloud_sync": "synced",
        "ddos_mitigation": "active",
        "timestamp": now_iso(),
    }


@api.get("/security/logs")
async def security_logs(user: dict = Depends(current_user)):
    docs = await db.security_logs.find().sort("created_at", -1).to_list(40)
    return [ser(d) for d in docs]


@api.get("/stats")
async def dashboard_stats(user: dict = Depends(current_user)):
    active = await db.incidents.count_documents({"status": {"$in": ["active", "responding"]}})
    resolved = await db.incidents.count_documents({"status": "resolved"})
    pending_sos = await db.sos_reports.count_documents({"status": "pending"})
    teams_available = await db.teams.count_documents({"status": "available"})
    teams_deployed = await db.teams.count_documents({"status": "deployed"})
    critical_sensors = await db.sensors.count_documents({"status": "critical"})
    return {
        "active_incidents": active,
        "resolved_incidents": resolved,
        "pending_sos": pending_sos,
        "teams_available": teams_available,
        "teams_deployed": teams_deployed,
        "critical_sensors": critical_sensors,
    }


@api.post("/ai/chat")
async def ai_chat(payload: ChatIn, user: dict = Depends(current_user)):
    reply = await ai_service.chat_assistant(payload.message)
    return {"reply": reply}


_origins = {"http://localhost:3000"}
_origins.update(o.strip().rstrip("/") for o in os.environ.get("FRONTEND_URL", "").split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=sorted(_origins),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed():
    await db.users.create_index("email", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@rescue.io").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "name": "Command Admin", "email": admin_email,
            "password_hash": auth_mod.hash_password(admin_pw),
            "role": "admin", "created_at": now_iso(),
        })
    elif not auth_mod.verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": auth_mod.hash_password(admin_pw)}})

    for email, name, role in [
        ("rescue@rescue.io", "Alpha Team Lead", "rescue_team"),
        ("citizen@rescue.io", "Jordan Citizen", "citizen"),
    ]:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "name": name, "email": email,
                "password_hash": auth_mod.hash_password("password123"),
                "role": role, "created_at": now_iso(),
            })

    if await db.sensors.count_documents({}) == 0:
        seed_sensors = [
            ("seismic", "Fault Zone A - Riverside", 28.6139, 77.2090),
            ("water_level", "Yamuna Dam Spillway", 28.6692, 77.2300),
            ("temperature", "Wildfire Sector 7", 28.5355, 77.3910),
            ("air_quality", "Industrial Belt East", 28.7041, 77.1025),
            ("wind_speed", "Coastal Station Delta", 28.4595, 77.0266),
            ("water_level", "North Canal Gauge", 28.7500, 77.1200),
        ]
        docs = []
        for stype, loc, lat, lng in seed_sensors:
            unit, lo, hi, danger = SENSOR_RANGES[stype]
            value = round(random.uniform(lo, danger * 0.95), 2)
            docs.append({
                "type": stype, "location": loc, "lat": lat, "lng": lng,
                "unit": unit, "value": value, "status": sensor_status(stype, value),
                "updated_at": now_iso(),
            })
        await db.sensors.insert_many(docs)

    if await db.incidents.count_documents({}) == 0:
        await db.incidents.insert_many([
            {"type": "Flood", "location": "Yamuna Riverbank, East Delhi", "lat": 28.6692, "lng": 77.2300,
             "severity": "high", "description": "Rising water levels breaching embankment near residential blocks.",
             "status": "active", "reported_by": admin_email, "created_at": now_iso(), "ai_analysis": None},
            {"type": "Wildfire", "location": "Sector 7 Forest Reserve", "lat": 28.5355, "lng": 77.3910,
             "severity": "critical", "description": "Fast-spreading wildfire with high wind conditions.",
             "status": "responding", "reported_by": admin_email, "created_at": now_iso(), "ai_analysis": None},
            {"type": "Earthquake", "location": "Downtown Fault Zone A", "lat": 28.6139, "lng": 77.2090,
             "severity": "moderate", "description": "4.6 magnitude tremor, structural assessment underway.",
             "status": "active", "reported_by": admin_email, "created_at": now_iso(), "ai_analysis": None},
        ])

    if await db.teams.count_documents({}) == 0:
        await db.teams.insert_many([
            {"name": "Alpha Rescue", "specialty": "Urban Search & Rescue", "members": 8,
             "status": "available", "assigned_to": None, "base": "Central Station"},
            {"name": "Bravo Medical", "specialty": "Medical Evac", "members": 6,
             "status": "available", "assigned_to": None, "base": "North Hospital"},
            {"name": "Charlie Fire", "specialty": "Firefighting", "members": 10,
             "status": "deployed", "assigned_to": None, "base": "Fire HQ"},
            {"name": "Delta Aqua", "specialty": "Water Rescue", "members": 7,
             "status": "available", "assigned_to": None, "base": "Riverside Dock"},
        ])

    if await db.security_logs.count_documents({}) == 0:
        base = datetime.now(timezone.utc)
        logs = [
            ("info", "TLS 1.3 handshake completed with edge node MESH-14"),
            ("warning", "Rate-limit triggered from 203.0.113.44 — DDoS filter engaged"),
            ("info", "AES-256 payload decrypted from IoT gateway GW-03"),
            ("critical", "Blocked unauthorized access attempt to /api/incidents (403)"),
            ("info", "RSA-2048 key rotation completed for command channel"),
            ("warning", "Packet loss spike 3.1% on mesh link NODE-22 ↔ NODE-31"),
        ]
        await db.security_logs.insert_many([
            {"level": lvl, "message": msg, "created_at": (base - timedelta(minutes=i * 3)).isoformat()}
            for i, (lvl, msg) in enumerate(logs)
        ])


_seeded = False


@app.middleware("http")
async def ensure_seeded(request: Request, call_next):
    global _seeded
    if not _seeded and request.url.path.startswith("/api"):
        try:
            await seed()
            _seeded = True
            logger.info("Seeding complete.")
        except Exception as exc:
            logger.error("Seeding failed: %s", exc)
            return Response(
                content='{"detail":"Database unavailable"}',
                status_code=503,
                media_type="application/json",
            )
    return await call_next(request)


@api.get("/")
async def root():
    return {"status": "ok", "service": "SentinelAI Emergency Response System API"}


@api.get("/health")
async def health():
    return {"status": "ok", "ai": ai_service.ai_enabled()}


app.include_router(api)
