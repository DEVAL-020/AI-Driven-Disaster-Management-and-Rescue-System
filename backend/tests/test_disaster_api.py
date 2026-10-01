import os
import requests
import pytest

BASE_URL = os.environ.get("API_BASE_URL", os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = ("admin@rescue.io", "admin123")
RESCUE = ("rescue@rescue.io", "password123")
CITIZEN = ("citizen@rescue.io", "password123")


def login_session(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    data = r.json()
    assert data["email"] == email
    assert "token" in data
    assert "access_token" in s.cookies, "httpOnly access_token cookie not set"
    return s, data


@pytest.fixture(scope="module")
def admin_session():
    s, _ = login_session(*ADMIN)
    return s


@pytest.fixture(scope="module")
def rescue_session():
    s, _ = login_session(*RESCUE)
    return s


@pytest.fixture(scope="module")
def citizen_session():
    s, _ = login_session(*CITIZEN)
    return s


class TestAuth:
    def test_admin_login(self):
        s, data = login_session(*ADMIN)
        assert data["role"] == "admin"

    def test_rescue_login(self):
        s, data = login_session(*RESCUE)
        assert data["role"] == "rescue_team"

    def test_citizen_login(self):
        s, data = login_session(*CITIZEN)
        assert data["role"] == "citizen"

    def test_invalid_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@rescue.io", "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_endpoint(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == "admin@rescue.io"

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 401

    def test_citizen_register(self):
        import uuid
        email = f"TEST_citizen_{uuid.uuid4().hex[:8]}@rescue.io"
        r = requests.post(f"{API}/auth/register", json={
            "name": "Test Citizen", "email": email, "password": "testpass123"
        }, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "citizen"
        assert data["email"] == email.lower()


class TestCore:
    def test_stats(self, admin_session):
        r = admin_session.get(f"{API}/stats", timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("active_incidents", "pending_sos", "teams_available", "teams_deployed", "critical_sensors"):
            assert k in d

    def test_sensors_list(self, admin_session):
        r = admin_session.get(f"{API}/sensors", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6, f"expected 6 sensors, got {len(data)}"
        assert all("value" in s and "status" in s for s in data)

    def test_sensor_tick(self, admin_session):
        r = admin_session.post(f"{API}/sensors/tick", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) == 6

    def test_teams_list(self, admin_session):
        r = admin_session.get(f"{API}/teams", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) == 4

    def test_network_stats(self, admin_session):
        r = admin_session.get(f"{API}/network/stats", timeout=20)
        assert r.status_code == 200
        assert "ping_ms" in r.json()

    def test_security_logs(self, admin_session):
        r = admin_session.get(f"{API}/security/logs", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) > 0


class TestIncidents:
    def test_list(self, admin_session):
        r = admin_session.get(f"{API}/incidents", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_citizen_cannot_create_incident(self, citizen_session):
        r = citizen_session.post(f"{API}/incidents", json={
            "type": "Flood", "location": "X", "lat": 1.0, "lng": 1.0, "severity": "high"
        }, timeout=20)
        assert r.status_code == 403

    def test_admin_create_incident(self, admin_session):
        r = admin_session.post(f"{API}/incidents", json={
            "type": "TEST_Flood", "location": "TEST loc", "lat": 28.6, "lng": 77.2,
            "severity": "high", "description": "test"
        }, timeout=20)
        assert r.status_code == 200
        inc = r.json()
        assert inc["type"] == "TEST_Flood"
        assert "id" in inc
        pytest.incident_id = inc["id"]


class TestAI:
    def test_analyze(self, admin_session):
        inc_id = getattr(pytest, "incident_id", None)
        if not inc_id:
            r = admin_session.get(f"{API}/incidents", timeout=20)
            inc_id = r.json()[0]["id"]
        r = admin_session.post(f"{API}/incidents/{inc_id}/analyze", timeout=60)
        assert r.status_code == 200, r.text
        inc = r.json()
        assert inc.get("ai_analysis") is not None
        a = inc["ai_analysis"]
        for k in ("severity_score", "risk_level", "recommended_actions", "alert_message"):
            assert k in a, f"missing {k} in ai_analysis"

    def test_citizen_cannot_analyze(self, citizen_session, admin_session):
        r = admin_session.get(f"{API}/incidents", timeout=20)
        inc_id = r.json()[0]["id"]
        r2 = citizen_session.post(f"{API}/incidents/{inc_id}/analyze", timeout=20)
        assert r2.status_code == 403

    def test_ai_chat(self, admin_session):
        r = admin_session.post(f"{API}/ai/chat",
                               json={"message": "What are top 3 flood rescue priorities?",
                                     "session_id": "pytest"}, timeout=60)
        assert r.status_code == 200, r.text
        assert isinstance(r.json().get("reply"), str)
        assert len(r.json()["reply"]) > 10


class TestSOS:
    def test_citizen_create_sos(self, citizen_session):
        r = citizen_session.post(f"{API}/sos", json={
            "name": "Alice", "phone": "999", "emergency_type": "medical",
            "location": "Block A", "lat": 28.6, "lng": 77.2, "people_count": 2,
            "message": "TEST sos"
        }, timeout=20)
        assert r.status_code == 200
        sos = r.json()
        assert sos["status"] == "pending"
        pytest.sos_id = sos["id"]

    def test_citizen_sees_only_own(self, citizen_session):
        r = citizen_session.get(f"{API}/sos", timeout=20)
        assert r.status_code == 200
        emails = {s["reported_by"] for s in r.json()}
        assert emails.issubset({"citizen@rescue.io"})

    def test_admin_sees_all_sos(self, admin_session):
        r = admin_session.get(f"{API}/sos", timeout=20)
        assert r.status_code == 200

    def test_admin_resolve_sos(self, admin_session):
        sos_id = getattr(pytest, "sos_id", None)
        if not sos_id:
            pytest.skip("no sos id")
        r = admin_session.patch(f"{API}/sos/{sos_id}/status", json={"status": "resolved"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "resolved"


class TestAllocation:
    def test_citizen_cannot_allocate(self, citizen_session, admin_session):
        teams = admin_session.get(f"{API}/teams", timeout=20).json()
        incs = admin_session.get(f"{API}/incidents", timeout=20).json()
        r = citizen_session.post(f"{API}/allocate", json={
            "team_id": teams[0]["id"], "incident_id": incs[0]["id"]
        }, timeout=20)
        assert r.status_code == 403

    def test_admin_allocate_and_recall(self, admin_session):
        teams = admin_session.get(f"{API}/teams", timeout=20).json()
        incs = admin_session.get(f"{API}/incidents", timeout=20).json()
        available = next((t for t in teams if t["status"] == "available"), teams[0])
        r = admin_session.post(f"{API}/allocate", json={
            "team_id": available["id"], "incident_id": incs[0]["id"]
        }, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "deployed"
        r2 = admin_session.post(f"{API}/teams/{available['id']}/recall", timeout=20)
        assert r2.status_code == 200
        assert r2.json()["status"] == "available"
