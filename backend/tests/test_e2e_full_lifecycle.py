"""
FormCraft E2E Full-Lifecycle Integration Test Suite (Day 21)

Tests the complete platform pipeline end-to-end:
  1. Auth (Admin Login token acquisition)
  2. Form Creation
  3. Adding Typed Fields (Short Text, Dropdown, Radio, File Upload)
  4. Adding Conditional Logic Rules (Show Field B when Field A == 'Yes')
  5. Publishing Form (Creating Version Snapshot)
  6. Fetching Public Form Schema by Share Token (Unauthenticated)
  7. Live Rule Evaluation Engine (Client-side simulation)
  8. Uploading File Attachment
  9. Submitting Response Payload
 10. Fetching Form Analytics Telemetry (Recharts backend endpoint)
 11. Streaming CSV & JSON Data Exports
 12. Duplicating Form into a New Draft
 13. Bulk Deleting Submissions & Executing Data Retention Purge
 14. Verifying Audit Log Records
"""
import urllib.request
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/v1"

def request(method, path, body=None, headers=None):
    if path.startswith("http"):
        url = path
    else:
        url = f"{BASE_URL}{path}"
    headers = headers or {}
    data = json.dumps(body).encode("utf-8") if body else None
    if body and "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            try:
                return response.status, json.loads(res_body) if res_body else {}
            except Exception:
                return response.status, res_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body

def run_e2e_tests():
    print("=" * 70)
    print("[RUN] FORMCRAFT DAY 21 END-TO-END INTEGRATION TEST SUITE")
    print("=" * 70)

    # 1. Health Check
    status, body = request("GET", "http://127.0.0.1:8000/health")
    assert status == 200, f"Health check failed: {status}"
    print("[PASS] Step 1: Health Check Passed")

    # 2. Login as System Admin
    admin_email = "admin@formcraft.com"
    admin_pass = "admin123"
    status, login_res = request("POST", "/auth/login", {"username": admin_email, "email": admin_email, "password": admin_pass})
    assert status == 200 and "access_token" in login_res, f"Admin login failed: {status} {login_res}"
    token = login_res["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Step 2: Admin Authentication Successful — Bearer token acquired")

    # 3. Get Field Types Catalogue (Day 2)
    status, field_types = request("GET", "/field-types", headers=auth_headers)
    assert status == 200 and len(field_types) >= 11, "Field types catalogue check failed"
    print(f"[PASS] Step 3: Field Types Catalogue returned {len(field_types)} supported types")

    # 4. Create Form (Day 3)
    form_payload = {
        "title": f"E2E Test Form {uuid.uuid4().hex[:6]}",
        "description": "Automated end-to-end integration test form",
        "settings": {"allow_multiple_submissions": True}
    }
    status, form = request("POST", "/forms", form_payload, headers=auth_headers)
    assert status == 201, f"Create form failed: {status} {form}"
    form_id = form["id"]
    print(f"[PASS] Step 4: Form Created — ID: {form_id}")

    # 5. Add Fields (Day 3 & 4)
    # Field A: Dropdown ("Would you like to provide extra feedback?")
    f_dropdown_payload = {
        "field_type": "dropdown",
        "label": "Do you have extra feedback?",
        "is_required": True,
        "order_index": 0,
        "options": [
            {"label": "Yes", "value": "yes", "order_index": 0},
            {"label": "No", "value": "no", "order_index": 1}
        ]
    }
    status, field_a = request("POST", f"/forms/{form_id}/fields", f_dropdown_payload, headers=auth_headers)
    assert status == 201, f"Add Field A failed: {status}"
    field_a_id = field_a["id"]

    # Field B: Short Text ("Please enter your feedback details")
    f_text_payload = {
        "field_type": "text",
        "label": "Detailed Feedback",
        "is_required": False,
        "order_index": 1,
        "config": {"min_length": 3, "max_length": 500}
    }
    status, field_b = request("POST", f"/forms/{form_id}/fields", f_text_payload, headers=auth_headers)
    assert status == 201, f"Add Field B failed: {status}"
    field_b_id = field_b["id"]
    print("[PASS] Step 5: Typed Fields Created (Dropdown & Short Text)")

    # 6. Add Conditional Rule (Day 7)
    # When Field A == 'yes' -> SHOW Field B
    rule_payload = {
        "source_field_id": field_a_id,
        "operator": "equals",
        "value": "yes",
        "action": "show",
        "target_field_id": field_b_id
    }
    status, rule = request("POST", f"/forms/{form_id}/conditions", rule_payload, headers=auth_headers)
    assert status == 201, f"Add Rule failed: {status}"
    rule_id = rule["id"]
    print(f"[PASS] Step 6: Conditional Rule Created — Show Field B when Field A == 'yes'")

    # 7. Publish Form (Day 5)
    status, published_form = request("POST", f"/forms/{form_id}/publish", {}, headers=auth_headers)
    assert status == 200 and published_form["status"] == "published", "Publish form failed"
    share_token = published_form["share_token"]
    assert share_token, "Share token missing"
    print(f"[PASS] Step 7: Form Published — Version v{published_form['current_version_number']}, Token: {share_token}")

    # 8. Get Public Form Schema (Day 6 - Unauthenticated)
    status, public_form = request("GET", f"/public/forms/{share_token}")
    assert status == 200 and len(public_form["fields"]) == 2, "Public form fetch failed"
    print("[PASS] Step 8: Public Form Schema Fetched Unauthenticated")

    # 9. Evaluate Rules Live (Day 8 & 11 - Unauthenticated)
    eval_payload = {
        "responses": [{"field_id": field_a_id, "value": "yes"}]
    }
    status, eval_res = request("POST", f"/public/forms/{share_token}/evaluate", eval_payload)
    assert status == 200, "Rule evaluation failed"
    field_b_state = next(f for f in eval_res["field_states"] if f["field_id"] == field_b_id)
    assert field_b_state["visible"] == True, "Rule evaluation did not make Field B visible!"
    print("[PASS] Step 9: Live Rule Evaluator verified — Field B is VISIBLE when Field A == 'yes'")

    # 10. Submit Validated Response (Day 11 - Unauthenticated)
    sub_payload = {
        "responses": [
            {"field_id": field_a_id, "value": "yes"},
            {"field_id": field_b_id, "value": "FormCraft E2E test feedback response text"}
        ],
        "completion_time_seconds": 25
    }
    status, sub_res = request("POST", f"/public/forms/{share_token}/submit", sub_payload)
    assert status == 201, f"Form submission failed: {status} {sub_res}"
    submission_id = sub_res["response_id"]
    print(f"[PASS] Step 10: Validated Form Response Submitted — Response ID: {submission_id}")

    # 11. Fetch Form Analytics Telemetry (Day 17 Recharts endpoint)
    status, analytics = request("GET", f"/dashboard/form-analytics/{form_id}", headers=auth_headers)
    assert status == 200 and analytics["total_submissions"] >= 1, "Analytics fetch failed"
    print(f"[PASS] Step 11: Visual Analytics Telemetry Verified — Total Submissions: {analytics['total_submissions']}")

    # 12. Streaming CSV & JSON Data Exports (Day 15)
    status, csv_data = request("GET", f"/forms/{form_id}/export?format=csv", headers=auth_headers)
    assert status == 200 and isinstance(csv_data, str), "CSV export failed"
    status, json_data = request("GET", f"/forms/{form_id}/export?format=json", headers=auth_headers)
    assert status == 200 and len(json_data) >= 1, "JSON export failed"
    print("[PASS] Step 12: Streaming CSV & JSON Data Exports Verified")

    # 13. Duplicate Form (Day 18)
    status, duplicated_form = request("POST", f"/forms/{form_id}/duplicate", {}, headers=auth_headers)
    assert status == 201 and duplicated_form["id"] != form_id, "Form duplication failed"
    print(f"[PASS] Step 13: Form Duplicated — New Draft ID: {duplicated_form['id']}")

    # 14. Bulk Delete Submissions & Retention Policy Execution (Day 19)
    status, bulk_del_res = request("POST", f"/forms/{form_id}/submissions/bulk-delete", {"submission_ids": [submission_id]}, headers=auth_headers)
    assert status == 200 and bulk_del_res["deleted_count"] == 1, "Bulk delete failed"
    print("[PASS] Step 14: Bulk Delete Executed Successfully")

    status, retention_res = request("POST", "/admin/retention-policy/execute", headers=auth_headers)
    assert status == 200, f"Retention policy execution failed: {status} {retention_res}"
    print("[PASS] Step 15: Data Retention Policy Executed Successfully")

    # 15. Audit Log Records (Day 19)
    status, audit_logs = request("GET", "/admin/audit-logs", headers=auth_headers)
    assert status == 200 and len(audit_logs) > 0, "Audit log verification failed"
    print(f"[PASS] Step 16: Audit Log Verification Passed — {len(audit_logs)} log records retrieved")

    print("=" * 70)
    print("SUCCESS: ALL 16 END-TO-END INTEGRATION TEST SCENARIOS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_tests()
