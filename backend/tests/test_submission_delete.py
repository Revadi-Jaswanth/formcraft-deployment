import pytest
from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4

@pytest.fixture
def client():
    return TestClient(app)

def test_submission_deletion(client: TestClient):
    unique_email = f"user-{uuid4()}@example.com"
    
    # Register
    client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "secure-Password-1",
        "name": "Alex Submitter"
    })
    
    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "secure-Password-1"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create form
    form_resp = client.post("/api/v1/forms", json={
        "title": "Feedback Survey",
        "description": "Short test"
    }, headers=headers)
    form_id = form_resp.json()["id"]
    
    # Add a field to the form (required before publishing)
    field_resp = client.post(f"/api/v1/forms/{form_id}/fields", json={
        "label": "Name",
        "field_type": "text",
        "is_required": True,
        "placeholder": "Enter name",
        "description": "Full name field"
    }, headers=headers)
    assert field_resp.status_code == 201
    field_id = field_resp.json()["id"]
    
    # Publish form to set status = published and get share_token
    pub_resp = client.post(f"/api/v1/forms/{form_id}/publish", json={}, headers=headers)
    assert pub_resp.status_code == 200
    share_token = pub_resp.json()["share_token"]
    assert share_token is not None
    
    # Submit response anonymously (public, returns 201)
    sub_resp = client.post(f"/api/v1/public/forms/{share_token}/submit", json={
        "responses": [
            {
                "field_id": field_id,
                "value": "John Doe"
            }
        ]
    })
    assert sub_resp.status_code == 201
    sub_id = sub_resp.json()["response_id"]
    
    # Get submissions (as owner, returns PaginatedResponse)
    subs_resp = client.get(f"/api/v1/forms/{form_id}/submissions", headers=headers)
    assert len(subs_resp.json()["items"]) == 1
    
    # Delete submission
    del_resp = client.delete(f"/api/v1/forms/{form_id}/submissions/{sub_id}", headers=headers)
    assert del_resp.status_code == 200
    
    # Check submissions again
    subs_resp_2 = client.get(f"/api/v1/forms/{form_id}/submissions", headers=headers)
    assert len(subs_resp_2.json()["items"]) == 0
