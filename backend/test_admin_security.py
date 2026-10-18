import os
import sys
from fastapi.testclient import TestClient

# Ensure current directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from seed_data import ensure_admin

def run_admin_security_tests():
    print("=== VentureBridge Admin Moderation Security Test Suite ===")
    ensure_admin()
    client = TestClient(app)

    # 1. Unauthenticated requests must receive HTTP 401
    print("\n1. Testing Unauthenticated Access...")
    r_get = client.get("/api/admin/reports")
    assert r_get.status_code == 401, f"Expected 401 for unauthenticated GET, got {r_get.status_code}"
    r_put = client.put("/api/admin/reports/1/status?status_val=Under%20Review")
    assert r_put.status_code == 401, f"Expected 401 for unauthenticated PUT, got {r_put.status_code}"
    print("  [PASS] Unauthenticated access blocked with HTTP 401 Unauthorized")

    # 2. Login with each standard role and verify HTTP 403 Forbidden
    print("\n2. Testing Gating Against Ordinary Roles (Job Seeker, Entrepreneur, Investor)...")
    
    # 2A. Job Seeker (Alex Rivera)
    r_login = client.post("/api/auth/login", json={"email": "alex.dev@gmail.com", "password": "password123"})
    assert r_login.status_code == 200, f"Job seeker login failed: {r_login.text}"
    jobseeker_token = r_login.json()["access_token"]
    js_headers = {"Authorization": f"Bearer {jobseeker_token}"}

    r_get_js = client.get("/api/admin/reports", headers=js_headers)
    assert r_get_js.status_code == 403, f"Expected 403 for Job Seeker GET, got {r_get_js.status_code}"
    r_put_js = client.put("/api/admin/reports/1/status?status_val=Under%20Review", headers=js_headers)
    assert r_put_js.status_code == 403, f"Expected 403 for Job Seeker PUT, got {r_put_js.status_code}"
    print("  [PASS] Job Seeker (alex.dev@gmail.com) rejected with HTTP 403 Forbidden")

    # 2B. Entrepreneur (Sarah Chen)
    r_login = client.post("/api/auth/login", json={"email": "founder@ecotrack.io", "password": "password123"})
    assert r_login.status_code == 200, f"Entrepreneur login failed: {r_login.text}"
    founder_token = r_login.json()["access_token"]
    founder_headers = {"Authorization": f"Bearer {founder_token}"}

    r_get_f = client.get("/api/admin/reports", headers=founder_headers)
    assert r_get_f.status_code == 403, f"Expected 403 for Entrepreneur GET, got {r_get_f.status_code}"
    r_put_f = client.put("/api/admin/reports/1/status?status_val=Under%20Review", headers=founder_headers)
    assert r_put_f.status_code == 403, f"Expected 403 for Entrepreneur PUT, got {r_put_f.status_code}"
    print("  [PASS] Entrepreneur (founder@ecotrack.io) rejected with HTTP 403 Forbidden")

    # 2C. Investor (Marcus Vance)
    r_login = client.post("/api/auth/login", json={"email": "marcus.vc@apexventures.com", "password": "password123"})
    assert r_login.status_code == 200, f"Investor login failed: {r_login.text}"
    investor_token = r_login.json()["access_token"]
    inv_headers = {"Authorization": f"Bearer {investor_token}"}

    r_get_inv = client.get("/api/admin/reports", headers=inv_headers)
    assert r_get_inv.status_code == 403, f"Expected 403 for Investor GET, got {r_get_inv.status_code}"
    r_put_inv = client.put("/api/admin/reports/1/status?status_val=Under%20Review", headers=inv_headers)
    assert r_put_inv.status_code == 403, f"Expected 403 for Investor PUT, got {r_put_inv.status_code}"
    print("  [PASS] Investor (marcus.vc@apexventures.com) rejected with HTTP 403 Forbidden")

    # 3. Test that regular users can still submit reports
    print("\n3. Testing Standard Report Submission by Ordinary User...")
    r_submit = client.post("/api/reports", json={
        "target_type": "Job",
        "target_id": 1,
        "reason": "Suspicious listing",
        "details": "Automated security test report."
    }, headers=js_headers)
    assert r_submit.status_code == 201, f"Report submission failed: {r_submit.text}"
    new_report_id = r_submit.json()["id"]
    print(f"  [PASS] Normal report submission works (Created Report #{new_report_id})")

    # 4. Authorized Admin Access
    print("\n4. Testing Authorized Platform Administrator Access...")
    r_login = client.post("/api/auth/login", json={"email": "admin@venturebridge.org", "password": "password123"})
    assert r_login.status_code == 200, f"Admin login failed: {r_login.text}"
    admin_token = r_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert r_login.json()["user"]["role"] == "admin"

    # Admin GET
    r_get_admin = client.get("/api/admin/reports", headers=admin_headers)
    assert r_get_admin.status_code == 200, f"Admin GET failed: {r_get_admin.text}"
    reports_list = r_get_admin.json()
    assert isinstance(reports_list, list), "Expected list of reports"
    assert any(r["id"] == new_report_id for r in reports_list), "Newly created report not found in admin queue"
    print(f"  [PASS] Admin GET /api/admin/reports returned HTTP 200 ({len(reports_list)} reports in queue)")

    # Admin PUT (Update Status)
    r_put_admin = client.put(f"/api/admin/reports/{new_report_id}/status?status_val=Under%20Review", headers=admin_headers)
    assert r_put_admin.status_code == 200, f"Admin PUT failed: {r_put_admin.text}"
    assert r_put_admin.json()["message"] == "Report status updated to 'Under Review'."
    print("  [PASS] Admin PUT /api/admin/reports/{id}/status successfully updated status to 'Under Review'")

    # Admin PUT (Resolve)
    r_resolve = client.put(f"/api/admin/reports/{new_report_id}/status?status_val=Resolved", headers=admin_headers)
    assert r_resolve.status_code == 200, f"Admin resolve failed: {r_resolve.text}"
    assert r_resolve.json()["message"] == "Report status updated to 'Resolved'."
    print("  [PASS] Admin PUT /api/admin/reports/{id}/status successfully resolved report")

    print("\n=======================================================")
    print("ALL ADMIN MODERATION SECURITY TESTS PASSED (100% SUCCESS)!")
    print("=======================================================")

if __name__ == "__main__":
    run_admin_security_tests()
