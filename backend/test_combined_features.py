import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== VENTUREBRIDGE COMBINED FEATURE TEST SUITE ===")

    # 1. Authenticate users
    res_founder = client.post("/api/auth/login", json={"email": "founder@ecotrack.io", "password": "password123"})
    assert res_founder.status_code == 200, f"Founder login failed: {res_founder.text}"
    founder_token = res_founder.json()["access_token"]
    founder_user = res_founder.json()["user"]
    founder_headers = {"Authorization": f"Bearer {founder_token}"}

    res_investor = client.post("/api/auth/login", json={"email": "marcus.vc@apexventures.com", "password": "password123"})
    assert res_investor.status_code == 200, f"Investor login failed: {res_investor.text}"
    investor_token = res_investor.json()["access_token"]
    investor_user = res_investor.json()["user"]
    investor_headers = {"Authorization": f"Bearer {investor_token}"}

    res_seeker = client.post("/api/auth/login", json={"email": "alex.dev@gmail.com", "password": "password123"})
    assert res_seeker.status_code == 200, f"Job seeker login failed: {res_seeker.text}"
    seeker_token = res_seeker.json()["access_token"]
    seeker_user = res_seeker.json()["user"]
    seeker_headers = {"Authorization": f"Bearer {seeker_token}"}

    print("  [PASS] All test personas authenticated successfully.")

    # ========================================================
    # FEATURE 1: RATING AND REVIEW PERMISSIONS
    # ========================================================
    print("\n--- FEATURE 1: Rating and Review Permissions ---")

    # 1. Investor cannot rate their own investor profile (by user ID)
    res_self_inv = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "investor", "target_id": investor_user["id"], "rating": 5.0, "review_text": "Self rating"}
    )
    assert res_self_inv.status_code == 403, f"Expected 403 for investor self-rating, got {res_self_inv.status_code}"
    print("  [PASS] Investor cannot rate their own investor profile by user ID (HTTP 403).")

    # 2. Investor cannot rate their own investor profile (by profile ID)
    res_self_prof = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "investor", "target_id": 1, "rating": 5.0, "review_text": "Self rating by profile ID"}
    )
    assert res_self_prof.status_code in [403, 404], f"Expected 403/404 for investor self-rating by profile ID, got {res_self_prof.status_code}"
    print("  [PASS] Investor cannot rate their own investor profile by profile ID.")

    # 3. Investor CAN view startup ratings, count, and comments
    res_view_ratings = client.get("/api/ratings/founder/1", headers=investor_headers)
    assert res_view_ratings.status_code == 200
    assert "average_rating" in res_view_ratings.json()
    assert "breakdown" in res_view_ratings.json()
    print("  [PASS] Investor can view startup ratings and breakdown.")

    res_view_comments = client.get("/api/startups/1/comments", headers=investor_headers)
    assert res_view_comments.status_code == 200
    assert isinstance(res_view_comments.json(), list)
    print("  [PASS] Investor can view startup workplace comments.")

    # 4. Investor CANNOT submit startup ratings or comments (read-only enforcement)
    res_inv_comment = client.post(
        "/api/startups/1/comments",
        headers=investor_headers,
        json={"comment_text": "Investor trying to review workplace", "role_title": "Investor"}
    )
    assert res_inv_comment.status_code == 403, f"Expected 403 for investor comment, got {res_inv_comment.status_code}"
    print("  [PASS] Investor cannot submit startup workplace comments (HTTP 403).")

    res_inv_startup_rating = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "startup", "target_id": 1, "rating": 4.5, "review_text": "Investor startup rating"}
    )
    assert res_inv_startup_rating.status_code == 403, f"Expected 403 for investor startup rating, got {res_inv_startup_rating.status_code}"
    print("  [PASS] Investor cannot submit startup ratings (HTTP 403).")

    # 5. Founder cannot rate their own profile
    res_self_founder = client.post(
        "/api/ratings",
        headers=founder_headers,
        json={"target_type": "founder", "target_id": founder_user["id"], "rating": 5.0}
    )
    assert res_self_founder.status_code == 403, f"Expected 403 for founder self-rating, got {res_self_founder.status_code}"
    print("  [PASS] Founder cannot rate their own profile (HTTP 403).")

    # 6. Eligible roles can rate each other and comment
    res_eligible_rating = client.post(
        "/api/ratings",
        headers=founder_headers,
        json={"target_type": "investor", "target_id": investor_user["id"], "rating": 4.9, "review_text": "Great collaboration and quick term sheet turnarounds."}
    )
    assert res_eligible_rating.status_code == 200
    print("  [PASS] Founder can legitimately rate an investor.")

    res_eligible_comment = client.post(
        "/api/startups/1/comments",
        headers=seeker_headers,
        json={"comment_text": "Transparent engineering culture and modern tech stack.", "pros": "Great autonomy", "cons": "Fast paced", "role_title": "Full Stack Intern"}
    )
    assert res_eligible_comment.status_code == 201
    comment_id = res_eligible_comment.json()["id"]
    print("  [PASS] Job seeker can submit workplace experience comment.")

    # 7. Investor cannot delete comments or ratings on their profile
    res_inv_del_comment = client.delete(f"/api/startups/comments/{comment_id}", headers=investor_headers)
    assert res_inv_del_comment.status_code == 403
    print("  [PASS] Investor cannot delete comments (HTTP 403).")

    # ========================================================
    # FEATURE 2: STARTUP MONTHLY SALES & OPTIONAL UNIT ECONOMICS
    # ========================================================
    print("\n--- FEATURE 2: Startup Monthly Sales & Optional Unit Economics ---")

    # 1. Founder can add and persist monthly sales records
    sales_data = [
        {"month": "May 2026", "revenue": 180000.0, "profit": 55000.0, "orders": 120, "currency": "INR"},
        {"month": "Jun 2026", "revenue": 240000.0, "profit": 75000.0, "orders": 160, "currency": "INR"},
        {"month": "Jul 2026", "revenue": 310000.0, "profit": 105000.0, "orders": 210, "currency": "INR"}
    ]
    res_fin_add = client.put(
        "/api/startups/1/financials",
        headers=founder_headers,
        json={"monthly_sales": sales_data, "financials_visibility": "PUBLIC", "funding_currency": "INR"}
    )
    assert res_fin_add.status_code == 200, f"Failed updating financials: {res_fin_add.text}"
    assert len(res_fin_add.json()["monthly_sales"]) == 3
    print("  [PASS] Founder added 3 monthly sales records.")

    # 2. Duplicate month/year updates rather than cluttering with duplicates
    updated_sales = sales_data + [{"month": "Jul 2026", "revenue": 350000.0, "profit": 120000.0, "orders": 240, "currency": "INR"}]
    res_dedup = client.put(
        "/api/startups/1/financials",
        headers=founder_headers,
        json={"monthly_sales": updated_sales, "financials_visibility": "PUBLIC"}
    )
    assert res_dedup.status_code == 200
    saved_sales = res_dedup.json()["monthly_sales"]
    assert len(saved_sales) == 3, f"Expected deduplication to keep 3 items, got {len(saved_sales)}"
    jul_rec = next(s for s in saved_sales if "Jul" in s["month"])
    assert jul_rec["revenue"] == 350000.0
    print("  [PASS] Duplicate month record updated cleanly without duplicate rows.")

    # 3. Unit economics is completely optional
    res_no_econ = client.put(
        "/api/startups/1/financials",
        headers=founder_headers,
        json={"monthly_sales": saved_sales, "unit_economics": None, "financials_visibility": "PUBLIC"}
    )
    assert res_no_econ.status_code == 200
    assert res_no_econ.json()["unit_economics"] is None
    print("  [PASS] Unit economics is optional and can be left empty.")

    # 4. Valid unit economics persists with correct component distinctions
    valid_econ = {
        "cac": 4200.0,
        "cogs": 3100.0,
        "logistics": 1500.0,
        "revenue_per_unit": 12500.0,
        "gross_margin": 62.0,
        "net_margin": 29.6,
        "currency": "INR",
        "notes": "Direct-to-consumer circular packaging subscription model"
    }
    res_with_econ = client.put(
        "/api/startups/1/financials",
        headers=founder_headers,
        json={"monthly_sales": saved_sales, "unit_economics": valid_econ, "financials_visibility": "INVESTOR_ONLY"}
    )
    assert res_with_econ.status_code == 200
    assert res_with_econ.json()["unit_economics"]["cac"] == 4200.0
    print("  [PASS] Valid unit economics saved with distinct cost and revenue fields.")

    # 5. Unauthorized users cannot modify financials
    res_unauth_fin = client.put(
        "/api/startups/1/financials",
        headers=seeker_headers,
        json={"monthly_sales": []}
    )
    assert res_unauth_fin.status_code == 403
    print("  [PASS] Job seeker blocked from modifying startup financials (HTTP 403).")

    # 6. Investor-only visibility protects private financials
    res_seeker_fin = client.get("/api/startups/1/financials", headers=seeker_headers)
    assert res_seeker_fin.status_code == 403, f"Expected 403 for investor-only financials, got {res_seeker_fin.status_code}"
    print("  [PASS] Investor-only financials protected against non-investors (HTTP 403).")

    res_inv_fin = client.get("/api/startups/1/financials", headers=investor_headers)
    assert res_inv_fin.status_code == 200
    assert len(res_inv_fin.json()["monthly_sales"]) == 3
    print("  [PASS] Verified investor can view protected financials (HTTP 200).")

    # ========================================================
    # FEATURE 3: TWO-PARTY GOOGLE MEET REQUEST & APPROVAL WORKFLOW
    # ========================================================
    print("\n--- FEATURE 3: Two-Party Google Meet Requests & Approvals ---")

    # Future date next week
    future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    # 1. Past date is rejected
    res_past = client.post(
        "/api/meetings/requests",
        headers=investor_headers,
        json={
            "recipient_id": founder_user["id"],
            "title": "Past Meeting",
            "meeting_date": "2020-01-01",
            "start_time": "10:00",
            "duration_minutes": 30
        }
    )
    assert res_past.status_code == 400, f"Expected 400 for past date, got {res_past.status_code}"
    print("  [PASS] Meeting request with past date rejected (HTTP 400).")

    # 2. Invalid Google Meet URL is rejected
    res_bad_url = client.post(
        "/api/meetings/requests",
        headers=investor_headers,
        json={
            "recipient_id": founder_user["id"],
            "title": "Bad URL Meeting",
            "meeting_date": future_date,
            "start_time": "14:00",
            "duration_minutes": 30,
            "google_meet_url": "https://invalid-meeting-site.com/xyz"
        }
    )
    assert res_bad_url.status_code == 400, f"Expected 400 for invalid Meet URL, got {res_bad_url.status_code}"
    print("  [PASS] Invalid Google Meet URL rejected (HTTP 400).")

    # 3. Valid meeting request created with status Pending
    valid_meet_link = "https://meet.google.com/abc-defg-hij"
    res_create_mtg = client.post(
        "/api/meetings/requests",
        headers=investor_headers,
        json={
            "recipient_id": founder_user["id"],
            "title": "Pre-Seed Valuation & Terms Discussion",
            "purpose": "Discuss scaling strategy and Q4 milestone funding",
            "meeting_date": future_date,
            "start_time": "15:30",
            "duration_minutes": 45,
            "time_zone": "IST",
            "agenda": "1. Traction Review\n2. Capital Allocation\n3. Board Governance",
            "google_meet_url": valid_meet_link
        }
    )
    assert res_create_mtg.status_code == 201, f"Failed creating meeting: {res_create_mtg.text}"
    mtg_id = res_create_mtg.json()["id"]
    assert res_create_mtg.json()["status"] == "Pending"
    print(f"  [PASS] Meeting request #{mtg_id} created with status 'Pending'.")

    # 4. Requester CANNOT approve their own request
    res_self_approve = client.put(
        f"/api/meetings/{mtg_id}/respond",
        headers=investor_headers,
        json={"status": "Approved"}
    )
    assert res_self_approve.status_code == 403, f"Expected 403 for requester self-approval, got {res_self_approve.status_code}"
    print("  [PASS] Requester cannot approve their own meeting request (HTTP 403).")

    # 5. Unauthorized user cannot view or respond to private meeting
    res_unauth_view = client.get(f"/api/meetings/{mtg_id}", headers=seeker_headers)
    assert res_unauth_view.status_code == 403
    res_unauth_resp = client.put(f"/api/meetings/{mtg_id}/respond", headers=seeker_headers, json={"status": "Approved"})
    assert res_unauth_resp.status_code == 403
    print("  [PASS] Unauthorized third party blocked from viewing and responding (HTTP 403).")

    # 6. Recipient can approve the meeting request
    res_approve = client.put(
        f"/api/meetings/{mtg_id}/respond",
        headers=founder_headers,
        json={"status": "Approved"}
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "Approved"
    print("  [PASS] Designated recipient successfully approved meeting (status: 'Approved').")

    # 7. Check my meetings list confirms can_join is True when approved and link exists
    res_my_mtgs = client.get("/api/meetings/my", headers=investor_headers)
    assert res_my_mtgs.status_code == 200
    my_mtg = next(m for m in res_my_mtgs.json() if m["id"] == mtg_id)
    assert my_mtg["status"] == "Approved"
    assert my_mtg["can_join"] is True
    print("  [PASS] Approved meeting with valid link is marked joinable (can_join: True).")

    # 8. Modifying date/time on an approved meeting resets status to Pending (renewed approval)
    new_future_date = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
    res_resched = client.put(
        f"/api/meetings/{mtg_id}/details",
        headers=investor_headers,
        json={"meeting_date": new_future_date, "start_time": "16:00"}
    )
    assert res_resched.status_code == 200
    assert res_resched.json()["status"] == "Pending"
    assert res_resched.json()["renewed_approval_required"] is True
    print("  [PASS] Rescheduling approved meeting resets status to 'Pending' requiring renewed approval.")

    # 9. Cancelled meeting is marked Cancelled
    res_cancel = client.put(f"/api/meetings/{mtg_id}/cancel", headers=founder_headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "Cancelled"
    print("  [PASS] Meeting marked as 'Cancelled'.")

    print("\n=== ALL COMBINED FEATURE TESTS PASSED SUCCESSFULLY (100%)! ===")

if __name__ == "__main__":
    run_tests()
