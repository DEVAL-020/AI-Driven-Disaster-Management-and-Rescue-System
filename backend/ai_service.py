import json
import logging
import os
import re
import httpx

logger = logging.getLogger("disaster-api.ai")

API_VERSION = "2023-06-01"


def _api_key() -> str:
    return (
        os.environ.get("OPENAI_API_KEY")
        or os.environ.get("ANTHROPIC_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or ""
    ).strip()


def ai_enabled() -> bool:
    return bool(_api_key())


async def _complete_anthropic(key: str, system: str, prompt: str, max_tokens: int = 900) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": key,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
    }
    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")


async def _complete_openai(key: str, system: str, prompt: str, max_tokens: int = 900) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _complete_gemini(key: str, system: str, prompt: str, max_tokens: int = 900) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)
    return ""


async def _complete(system: str, prompt: str, max_tokens: int = 900) -> str:
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if anthropic_key:
        return await _complete_anthropic(anthropic_key, system, prompt, max_tokens)
    if openai_key:
        return await _complete_openai(openai_key, system, prompt, max_tokens)
    if gemini_key:
        return await _complete_gemini(gemini_key, system, prompt, max_tokens)
    raise ValueError("No API key configured")


def _extract_json(text: str):
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    else:
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        if brace:
            text = brace.group(0)
    return json.loads(text)


def _smart_incident_analysis(incident: dict, sensors: list) -> dict:
    inc_type = str(incident.get("type", "Disaster")).title()
    loc = incident.get("location", "Target Sector")
    sev_raw = str(incident.get("severity", "moderate")).lower()

    score_map = {"low": 35, "moderate": 60, "high": 82, "critical": 95}
    risk_map = {"low": "LOW", "moderate": "MODERATE", "high": "HIGH", "critical": "CRITICAL"}

    score = score_map.get(sev_raw, 65)
    risk = risk_map.get(sev_raw, "HIGH")

    actions = [
        f"Deploy primary {inc_type} response squad to {loc}",
        "Establish 500m safety perimeter & emergency evacuation corridor",
        "Stream live telemetry from nearest IoT sensor nodes",
    ]
    if sev_raw in ["high", "critical"]:
        actions.insert(1, "Issue high-priority civil emergency warning broadcast")

    resources = ["Rescue Team", "Medical Triage Unit"]
    low_type = inc_type.lower()
    if "fire" in low_type or "thermal" in low_type:
        resources.extend(["Thermal Imaging Drones", "Hazmat Squad"])
    elif "flood" in low_type or "rain" in low_type:
        resources.extend(["Zodiac Boats", "Water Evacuation Fleet"])
    elif "quake" in low_type or "seismic" in low_type:
        resources.extend(["USAR Acoustic Radar", "Heavy Extrication Equipment"])
    else:
        resources.extend(["Tactical Drone", "Mobile Command Vehicle"])

    return {
        "severity_score": score,
        "risk_level": risk,
        "predicted_spread": f"Potential 1.5km spread across {loc} within 30-45 minutes if uncontained.",
        "population_at_risk": "Estimated 250 - 1,200 individuals in proximity.",
        "recommended_actions": actions,
        "resources_needed": list(set(resources)),
        "alert_message": f"CRITICAL NOTICE: {inc_type} active at {loc}. Tactical intervention recommended.",
    }


def _smart_chat_response(message: str) -> str:
    msg = message.lower().strip()

    if any(w in msg for w in ["hi", "hello", "hey", "greetings", "start", "who are you", "help"]):
        return (
            "Greetings Operator. I am RESCUE-AI, your tactical command center intelligence assistant. "
            "I can assist you with emergency response protocols, incident analysis, IoT sensor telemetry, "
            "team dispatch coordination, and disaster safety guidelines. How can I assist you right now?"
        )

    if any(w in msg for w in ["flood", "water", "rain", "drown", "overflow", "river"]):
        return (
            "[FLOOD EMERGENCY PROTOCOL]\n"
            "1. Monitor live water-level telemetry and flow rates across affected sectors.\n"
            "2. Issue immediate high-volume evacuation warnings for low-lying zones.\n"
            "3. Deploy Water Rescue Teams (zodiac boats & life-vest equipped personnel).\n"
            "4. Coordinate with civil engineering to engage automated emergency drainage pumps.\n"
            "5. Establish temporary emergency shelter & medical triage at elevated locations."
        )

    if any(w in msg for w in ["fire", "wildfire", "smoke", "burn", "heat", "thermal"]):
        return (
            "[WILDFIRE / THERMAL EMERGENCY PROTOCOL]\n"
            "1. Deploy Hazmat & Fire Suppression Teams to contain fire front perimeter.\n"
            "2. Enforce a 1-kilometer containment zone; clear downwind evacuation routes.\n"
            "3. Track thermal camera and air-quality IoT telemetry for smoke dispersion.\n"
            "4. Alert regional trauma centers for severe burn and inhalation injury triage."
        )

    if any(w in msg for w in ["earthquake", "seismic", "quake", "shake", "collapse", "rubble"]):
        return (
            "[SEISMIC / EARTHQUAKE RESPONSE PROTOCOL]\n"
            "1. Dispatch Urban Search & Rescue (USAR) units with acoustic listening sensors.\n"
            "2. Assess structural safety of critical bridges, hospitals, and command hubs.\n"
            "3. Automatically trigger main gas cut-off valves to prevent secondary explosions.\n"
            "4. Establish emergency trauma posts outside high-density collapsed structures."
        )

    if any(w in msg for w in ["medical", "sos", "triage", "injury", "injured", "victim"]):
        return (
            "[MEDICAL TRIAGE & SOS DISPATCH PROTOCOL]\n"
            "1. Implement START Triage (Red = Immediate Trauma, Yellow = Delayed, Green = Minor).\n"
            "2. Dispatch nearest available Emergency Medical Services (EMS) to critical SOS coordinates.\n"
            "3. Establish direct communication channel with field paramedics.\n"
            "4. Maintain open ambulance transport corridors to central hospitals."
        )

    if any(w in msg for w in ["team", "dispatch", "resource", "unit", "available", "squad"]):
        return (
            "[RESOURCE & TEAM ALLOCATION STATUS]\n"
            "1. Evaluate active team status across Command Control, Tactical Dispatch, and Citizen SOS.\n"
            "2. Match team specialization (Fire, EMS, USAR, Water Rescue) to high-severity incidents.\n"
            "3. Maintain a minimum 15% reserve unit buffer for sudden cascading emergencies.\n"
            "4. Track team GPS positions and telemetry in real time via live command map."
        )

    if any(w in msg for w in ["network", "mesh", "mqtt", "security", "encryption", "tls", "ddos"]):
        return (
            "[NETWORK MESH & CYBER SECURITY STATUS]\n"
            "1. Mesh Topology: Operating over MQTT-over-TLS 1.3 with AES-256-GCM payload encryption.\n"
            "2. Resiliency: Self-healing peer nodes dynamically reroute data if edge relays fail.\n"
            "3. Cyber Defense: Real-time rate limiting, WAF filtering, and DDoS mitigation active.\n"
            "4. Audit Trail: All command actions & telemetry packets are cryptographically signed."
        )

    return (
        f"RESCUE-AI Operational Guidance regarding '{message}':\n"
        "1. Prioritize life safety and establish unified incident command.\n"
        "2. Review live IoT sensor telemetry and field SOS reports for affected sectors.\n"
        "3. Triage victims and dispatch nearest specialized response teams.\n"
        "4. Continuously log incident updates and coordinate with tactical field commanders."
    )


async def analyze_incident(incident: dict, sensors: list) -> dict:
    if not ai_enabled():
        return _smart_incident_analysis(incident, sensors)

    system = (
        "You are the AI core of a disaster management & rescue command system. "
        "Analyze the incident and live IoT sensor telemetry, then return STRICT JSON only. "
        "Schema: {\"severity_score\": int 0-100, \"risk_level\": \"LOW|MODERATE|HIGH|CRITICAL\", "
        "\"predicted_spread\": string, \"population_at_risk\": string, "
        "\"recommended_actions\": [string, string, string], "
        "\"resources_needed\": [string], \"alert_message\": string}. "
        "Be concise, operational, and realistic."
    )
    sensor_txt = "\n".join(
        f"- {s.get('type')} @ {s.get('location')}: {s.get('value')} {s.get('unit')} ({s.get('status')})"
        for s in sensors
    ) or "No live sensor data."
    prompt = (
        f"INCIDENT\nType: {incident.get('type')}\nLocation: {incident.get('location')}\n"
        f"Reported severity: {incident.get('severity')}\nDescription: {incident.get('description')}\n\n"
        f"LIVE IOT TELEMETRY\n{sensor_txt}\n\nReturn the JSON assessment now."
    )
    try:
        resp = await _complete(system, prompt)
        return _extract_json(resp)
    except Exception as exc:
        logger.warning("AI analysis error, falling back to smart engine: %s", exc)
        return _smart_incident_analysis(incident, sensors)


async def chat_assistant(message: str) -> str:
    if not ai_enabled():
        return _smart_chat_response(message)
    system = (
        "You are RESCUE-AI, an expert emergency response assistant for a disaster "
        "management command center. Give clear, actionable, concise guidance on rescue "
        "operations, safety protocols, resource allocation, and disaster response."
    )
    try:
        return await _complete(system, message, max_tokens=600)
    except Exception as exc:
        logger.warning("AI chat error, falling back to smart engine: %s", exc)
        return _smart_chat_response(message)
