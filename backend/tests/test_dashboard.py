import pytest
from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4

@pytest.fixture
def client():
    return TestClient(app)

def test_dashboard_endpoints(client: TestClient):
    unique_email = f"user-{uuid4()}@example.com"
    # 1. Register and login to retrieve authentication
    register_payload = {
        "email": unique_email,
        "password": "securepassword",
        "name": "Dashboard Tester"
    }
    reg_resp = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_resp.status_code == 201
    
    login_payload = {
        "email": unique_email,
        "password": "securepassword"
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Assert initial overview metrics return zero values
    overview_resp = client.get("/api/v1/dashboard/overview", headers=headers)
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert overview["total_forms"] == 0
    assert overview["total_responses"] == 0
    assert overview["today_responses"] == 0
    assert overview["avg_responses_per_form"] == 0.0
    
    # 3. Create a form template
    form_payload = {
        "title": "Feedback Survey",
        "description": "Enterprise customer survey test",
        "settings": {}
    }
    form_resp = client.post("/api/v1/forms", json=form_payload, headers=headers)
    assert form_resp.status_code == 201  # Forms create returns 201 Created
    form_id = form_resp.json()["id"]
    
    # 4. Check overview telemetry updates
    overview_resp2 = client.get("/api/v1/dashboard/overview", headers=headers)
    overview2 = overview_resp2.json()
    assert overview2["total_forms"] == 1
    assert overview2["draft_forms"] == 1
    
    # 5. Check recent activities list
    activity_resp = client.get("/api/v1/dashboard/activity", headers=headers)
    assert activity_resp.status_code == 200
    activity = activity_resp.json()
    assert len(activity) > 0
    assert activity[0]["type"] == "create"
    
    # 6. Check recently edited list
    recent_resp = client.get("/api/v1/dashboard/recent", headers=headers)
    assert recent_resp.status_code == 200
    recent = recent_resp.json()
    assert len(recent) == 1
    assert recent[0]["title"] == "Feedback Survey"
    
    # 7. Update user preferences
    pref_payload = {"theme": "dark", "favorites": [str(form_id)]}
    pref_resp = client.patch("/api/v1/dashboard/preferences", json=pref_payload, headers=headers)
    assert pref_resp.status_code == 200
    assert pref_resp.json()["theme"] == "dark"
    
    # 8. Get user favorites list
    fav_resp = client.get("/api/v1/dashboard/favorites", headers=headers)
    assert fav_resp.status_code == 200
    favorites = fav_resp.json()
    assert len(favorites) == 1
    assert favorites[0]["title"] == "Feedback Survey"
