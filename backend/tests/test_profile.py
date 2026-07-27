import pytest
from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
import io

@pytest.fixture
def client():
    return TestClient(app)

def test_profile_endpoints(client: TestClient):
    unique_email = f"user-{uuid4()}@example.com"
    
    # 1. Register new user
    reg_payload = {
        "email": unique_email,
        "password": "secure-Password-1",
        "name": "Alex Admin"
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    
    # 2. Login to retrieve bearer token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "secure-Password-1"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get profile
    profile_resp = client.get("/api/v1/profile", headers=headers)
    assert profile_resp.status_code == 200
    profile = profile_resp.json()
    assert profile["name"] == "Alex Admin"
    assert profile["timezone"] == "UTC"
    
    # 4. Patch profile
    patch_payload = {
        "name": "Alex Modified",
        "timezone": "EST",
        "bio": "Low code developer"
    }
    patch_resp = client.patch("/api/v1/profile", json=patch_payload, headers=headers)
    assert patch_resp.status_code == 200
    updated_profile = patch_resp.json()
    assert updated_profile["name"] == "Alex Modified"
    assert updated_profile["timezone"] == "EST"
    assert updated_profile["bio"] == "Low code developer"
    
    # 5. Get settings
    settings_resp = client.get("/api/v1/settings", headers=headers)
    assert settings_resp.status_code == 200
    settings_data = settings_resp.json()
    assert settings_data["appearance"] == "dark"
    assert settings_data["notifications"]["email_notifications"] is True
    
    # 6. Patch settings
    settings_patch = {
        "appearance": "light",
        "notifications": {
            "email_notifications": False,
            "submission_alerts": True,
            "weekly_reports": True,
            "marketing_emails": False
        }
    }
    settings_patch_resp = client.patch("/api/v1/settings", json=settings_patch, headers=headers)
    assert settings_patch_resp.status_code == 200
    updated_settings = settings_patch_resp.json()
    assert updated_settings["appearance"] == "light"
    assert updated_settings["notifications"]["email_notifications"] is False
    assert updated_settings["notifications"]["weekly_reports"] is True
    
    # 7. Upload avatar mock (Corrected tuple syntax: (filename, file_object, content_type))
    avatar_file = ("avatar.png", io.BytesIO(b"dummy image data"), "image/png")
    avatar_resp = client.post(
        "/api/v1/profile/avatar",
        files={"file": avatar_file},
        headers=headers
    )
    assert avatar_resp.status_code == 200
    assert "avatar_url" in avatar_resp.json()
    
    # 8. Change password verification failure
    pw_fail_payload = {
        "current_password": "wrongpassword",
        "new_password": "NewSecurePassword-2"
    }
    pw_fail_resp = client.post("/api/v1/profile/change-password", json=pw_fail_payload, headers=headers)
    assert pw_fail_resp.status_code == 400
    
    # 9. Change password success
    pw_success_payload = {
        "current_password": "secure-Password-1",
        "new_password": "NewSecurePassword-2"
    }
    pw_success_resp = client.post("/api/v1/profile/change-password", json=pw_success_payload, headers=headers)
    assert pw_success_resp.status_code == 200
    
    # 10. Login with new credentials
    login_new_resp = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "NewSecurePassword-2"
    })
    assert login_new_resp.status_code == 200
    
    # 11. Delete account verification failure (using request for DELETE body compatibility)
    del_fail_resp = client.request(
        "DELETE", 
        "/api/v1/account", 
        json={"password": "wrongpassword"}, 
        headers=headers
    )
    assert del_fail_resp.status_code == 400
    
    # 12. Delete account success
    del_success_resp = client.request(
        "DELETE", 
        "/api/v1/account", 
        json={"password": "NewSecurePassword-2"}, 
        headers=headers
    )
    assert del_success_resp.status_code == 200
