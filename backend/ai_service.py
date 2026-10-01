import json
import logging
import os
import re

import httpx

logger = logging.getLogger("disaster-api.ai")

API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"
DEFAULT_MODEL = "claude-sonnet-5-5"


def _model() -> str:
    return os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)


def _api_key() -> str:
    return os.environ.get("ANTHROPIC_API_KEY", "").strip()


def ai_enabled() -> bool:
    return bool(_api_key())


async def _complete(system: str, prompt: str, max_tokens: int = 900) -> str:
    headers = {
        "x-api-key": _api_key(),
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
    }
    body = {
        "model": _model(),
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(API_URL, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")


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


_SEVERITY_SCORE = {"low": 25, "moderate": 50, "high": 75, "critical": 92}
_RISK = {"low": "LOW", "moderate": "MODERATE", "high": "HIGH", "critical": "CRITICAL"}


def _fallback_analysis(incident: dict, note: str) -> dict:
    sev = str(incident.get("severity", "moderate")).lower()
    return {
        "severity_score": _SEVERITY_SCORE.get(sev, 50),
        "risk_level": _RISK.get(sev, "MODERATE"),
        "predicted_spread": note,
        "population_at_risk": "Unknown - assessment pending",
        "recommended_actions": [
            "Dispatch assessment team",
            "Establish communications with field units",
            "Monitor nearby IoT sensors",
        ],
        "resources_needed": ["Rescue team", "Medical support"],
        "alert_message": f"{incident.get('type', 'Incident')} reported at {incident.get('location', 'unknown location')}.",
    }


async def analyze_incident(incident: dict, sensors: list) -> dict:
    if not ai_enabled():
        return _fallback_analysis(incident, "AI offline: set ANTHROPIC_API_KEY for live predictions.")

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
    except Exception as exc:
        logger.warning("AI analysis failed: %s", exc)
        return _fallback_analysis(incident, "AI service unavailable; showing baseline assessment.")
    try:
        return _extract_json(resp)
    except Exception:
        data = _fallback_analysis(incident, "Unable to parse AI output.")
        data["alert_message"] = resp[:240]
        return data


async def chat_assistant(message: str) -> str:
    if not ai_enabled():
        return (
            "RESCUE-AI is running in offline mode (no ANTHROPIC_API_KEY configured). "
            "General guidance: confirm life safety first, establish a command post, "
            "triage victims, and allocate the nearest suitable team to the highest-severity incident."
        )
    system = (
        "You are RESCUE-AI, an expert emergency response assistant for a disaster "
        "management command center. Give clear, actionable, concise guidance on rescue "
        "operations, safety protocols, resource allocation, and disaster response."
    )
    try:
        return await _complete(system, message, max_tokens=600)
    except Exception as exc:
        logger.warning("AI chat failed: %s", exc)
        return "Unable to reach the AI core right now. Please try again shortly."
