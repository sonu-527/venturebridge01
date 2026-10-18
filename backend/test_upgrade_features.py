import os
import sys
import json

# Ensure current directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app, parse_currency_amount
from auth import create_access_token
from seed_data import ensure_extended_demo_data
import database

client = TestClient(app)

def get_auth_header(user_id: int, email: str, role: str):
    token = create_access_token({"sub": str(user_id), "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}

def run_tests():
    print("=== VentureBridge Feature Upgrade Test Suite ===")
    database.init_db()
    ensure_extended_demo_data()

    investor_headers = get_auth_header(7, "marcus.vc@apexventures.com", "investor")
    founder_headers = get_auth_header(1, "founder@ecotrack.io", "entrepreneur")
    seeker_headers = get_auth_header(4, "alex.dev@gmail.com", "job_seeker")

    print("\n--- 1. Testing parse_currency_amount helper ---")
    assert parse_currency_amount("₹ 25,00,000") == 2500000.0, "Failed INR parsing"
    assert parse_currency_amount("$ 500,000") == 500000.0, "Failed USD parsing"
    assert parse_currency_amount(150000) == 150000.0, "Failed numeric passthrough"
    assert parse_currency_amount("invalid") == 0.0, "Failed invalid fallback"
    print("  [PASS] Currency amount parsing verified.")

    print("\n--- 2. Testing 1-5 Star Ratings & Validation ---")
    res = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "founder", "target_id": 1, "rating": 5, "review_text": "Visionary founder with great execution!"}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["user_rating"] == 5
    assert data["average_rating"] >= 1.0

    # Out of range rating (> 5)
    res_bad = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "founder", "target_id": 1, "rating": 6, "review_text": "Too good"}
    )
    assert res_bad.status_code == 400, f"Expected 400 for rating > 5, got {res_bad.status_code}"

    # Out of range rating (< 1)
    res_bad_low = client.post(
        "/api/ratings",
        headers=investor_headers,
        json={"target_type": "founder", "target_id": 1, "rating": 0}
    )
    assert res_bad_low.status_code == 400, f"Expected 400 for rating < 1, got {res_bad_low.status_code}"

    # Fetch ratings
    res_get = client.get("/api/ratings/founder/1")
    assert res_get.status_code == 200
    get_data = res_get.json()
    assert get_data["total_ratings"] >= 1
    assert get_data["average_rating"] >= 1.0
    print(f"  [PASS] Ratings validated: avg={get_data['average_rating']}, total={get_data['total_ratings']}")

    print("\n--- 3. Testing Startup Comments & Experience Verification ---")
    comment_payload = {
        "comment_text": "Worked on the IoT dashboard here. Excellent team culture and rapid sprint cycles.",
        "pros": "Great mentorship, agile velocity.",
        "cons": "Fast pacing.",
        "role_title": "Frontend Intern"
    }
    res_comment = client.post("/api/startups/1/comments", headers=seeker_headers, json=comment_payload)
    assert res_comment.status_code == 201, f"Failed posting comment: {res_comment.text}"
    comment_data = res_comment.json()
    assert "id" in comment_data
    assert "is_verified_employee" in comment_data

    res_comments = client.get("/api/startups/1/comments")
    assert res_comments.status_code == 200
    comments = res_comments.json()
    assert len(comments) >= 1
    assert any(c["id"] == comment_data["id"] and c["comment_text"] == comment_payload["comment_text"] for c in comments)
    print(f"  [PASS] Comments verified: {len(comments)} comment(s) found on EcoTrack.")

    print("\n--- 4. Testing Investor Top 10 Curated Startups & Google Meet Links ---")
    res_top = client.get("/api/startups/top10?criteria=all", headers=investor_headers)
    assert res_top.status_code == 200, f"Expected 200, got {res_top.status_code}: {res_top.text}"
    top_data = res_top.json()
    assert "startups" in top_data
    assert len(top_data["startups"]) <= 10
    if len(top_data["startups"]) > 0:
        first = top_data["startups"][0]
        assert "google_meet_url" in first
        assert "meet.google.com" in first["google_meet_url"]
        assert "founder_rating" in first
        print(f"  [PASS] Top startup: {first['name']} (Category: {first.get('category')}, Rating: {first['founder_rating']})")

    res_profit = client.get("/api/startups/top10?criteria=high_profit", headers=investor_headers)
    assert res_profit.status_code == 200, f"Expected 200 for high_profit, got {res_profit.status_code}: {res_profit.text}"
    print(f"  [PASS] Filter 'high_profit' returned {len(res_profit.json()['startups'])} startups.")

    print("\n--- 5. Testing Candidate Shortlisting with 80/20 Formula ---")
    res_match = client.get("/api/matching/top-candidates/1", headers=founder_headers)
    assert res_match.status_code == 200, f"Candidate matching failed: {res_match.text}"
    match_data = res_match.json()
    assert "0.80" in match_data["formula"]
    assert "0.20" in match_data["formula"]
    assert "top_candidates" in match_data
    assert len(match_data["top_candidates"]) <= 10
    for cand in match_data["top_candidates"]:
        expected = round(cand["skill_match_score"] * 0.8 + cand["education_score"] * 0.2, 1)
        assert abs(cand["composite_score"] - expected) <= 0.1
        assert cand["is_eligible_under_50_rule"] == (cand["skill_match_score"] >= 50.0)
    top_cand = match_data["top_candidates"][0]
    print(f"  [PASS] 80/20 Formula verified! Top Candidate: {top_cand['full_name']} - Score: {top_cand['composite_score']}% (Skills: {top_cand['skill_match_score']}%, Education: {top_cand['education_score']}%)")

    print("\n--- 6. Testing Group Discussion Scheduler & Google Meet Integration ---")
    gd_payload = {
        "opportunity_id": 1,
        "title": "EcoTrack Firmware Engineering Group Discussion",
        "agenda": "Discuss C++ embedded architectures and system design.",
        "scheduled_at": "2026-10-25T14:30:00Z",
        "google_meet_url": "https://meet.google.com/eco-gd-test",
        "candidate_ids": [4]
    }
    res_gd = client.post("/api/meetings/group-discussion", headers=founder_headers, json=gd_payload)
    assert res_gd.status_code == 201, f"Failed scheduling GD: {res_gd.text}"
    gd_info = res_gd.json()
    assert gd_info["google_meet_url"] == gd_payload["google_meet_url"]

    res_my_gd = client.get("/api/meetings/my", headers=seeker_headers)
    assert res_my_gd.status_code == 200
    my_meetings = res_my_gd.json()
    assert any(m["id"] == gd_info["id"] for m in my_meetings)
    print("  [PASS] Group Discussion scheduled and retrieved by candidate.")

    print("\n--- 7. Testing Startup Idea and Financials Editing ---")
    new_sales = [
        {"month": "Jul 2026", "revenue": 1400000, "orders": 310},
        {"month": "Aug 2026", "revenue": 1650000, "orders": 360}
    ]
    new_unit_economics = {
        "cac": 800,
        "cogs": 1800,
        "logistics": 400,
        "gross_margin": 2400,
        "net_margin": 1200
    }
    res_idea = client.put(
        "/api/ideas/1",
        headers=founder_headers,
        json={
            "title": "EcoTrack Next-Gen IoT",
            "monthly_sales": new_sales,
            "unit_economics": new_unit_economics
        }
    )
    assert res_idea.status_code == 200, f"Failed updating idea: {res_idea.text}"
    assert res_idea.json()["title"] == "EcoTrack Next-Gen IoT"

    res_fin = client.put(
        "/api/startups/1/financials",
        headers=founder_headers,
        json={
            "monthly_sales": new_sales,
            "unit_economics": new_unit_economics,
            "financials_visibility": "INVESTOR_ONLY"
        }
    )
    assert res_fin.status_code == 200
    print("  [PASS] Startup Idea and Financials updated successfully.")

    print("\n--- 8. Testing Negotiation Rooms & Auto-Fundraising Balance Deduction ---")
    create_room = {
        "startup_id": 1,
        "investor_id": 7,
        "proposed_amount": 1500000.0,
        "currency": "INR",
        "proposed_valuation": 12000000.0,
        "proposed_equity": 12.5,
        "milestones": "MVP beta launch",
        "notes": "Interested in leading your pre-series A round at 12M INR valuation."
    }
    res_room = client.post("/api/negotiations/rooms", headers=investor_headers, json=create_room)
    assert res_room.status_code in [200, 201], f"Failed room creation: {res_room.text}"
    room = res_room.json()
    room_id = room["id"]

    # Founder Counter-offer
    res_counter = client.post(
        f"/api/negotiations/rooms/{room_id}/counter-offer",
        headers=founder_headers,
        json={
            "proposed_amount": 1500000.0,
            "currency": "INR",
            "proposed_valuation": 15000000.0,
            "proposed_equity": 10.0,
            "notes": "We can offer 10% equity for 15 Lakhs INR ticket size given our recent Q3 growth."
        }
    )
    assert res_counter.status_code == 200
    assert res_counter.json()["proposed_valuation"] == 15000000.0

    # Room Chat
    res_msg = client.post(
        f"/api/negotiations/rooms/{room_id}/messages",
        headers=investor_headers,
        json={"content": "Agreed to 10% equity at 15M valuation. Let's seal the term sheet!"}
    )
    assert res_msg.status_code == 201

    # Check fundraising command center before
    res_cmd_before = client.get("/api/startups/1/fundraising-command-center", headers=founder_headers)
    assert res_cmd_before.status_code == 200, f"Command center before failed: {res_cmd_before.text}"
    raised_before = res_cmd_before.json()["total_raised"]

    # Deal Acceptance
    res_accept = client.put(
        f"/api/negotiations/rooms/{room_id}/status?status_val=Accepted",
        headers=investor_headers,
        json={"notes": "Term sheet executed successfully."}
    )
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "Accepted"

    # Check fundraising command center after
    res_cmd_after = client.get("/api/startups/1/fundraising-command-center", headers=founder_headers)
    assert res_cmd_after.status_code == 200
    raised_after = res_cmd_after.json()["total_raised"]
    assert raised_after >= raised_before + 1500000.0, f"Expected raised >= {raised_before + 1500000.0}, got {raised_after}"
    print(f"  [PASS] Negotiation deal closed! Funding raised automatically updated from {raised_before} to {raised_after} INR.")

    print("\n--- 9. Testing Monthly Progress Reports & 30-Day Reminders ---")
    res_rep = client.post(
        "/api/reports/monthly-progress",
        headers=founder_headers,
        json={
            "startup_id": 1,
            "investor_id": 7,
            "reporting_month": "October 2026",
            "revenue": 1750000.0,
            "expenses": 450000.0,
            "milestones_achieved": "Launched enterprise dashboard, secured 5 new pilots.",
            "challenges": "Component supply lead times.",
            "next_month_goals": "Expand sales team and initiate ISO 27001 audit.",
            "notes": "Introductions to European clean-tech logistics fleets requested."
        }
    )
    assert res_rep.status_code == 201, f"Failed progress report: {res_rep.text}"
    print("  [PASS] Monthly progress report logged.")

    res_reminders = client.get("/api/reports/monthly-progress/reminders", headers=founder_headers)
    assert res_reminders.status_code == 200
    assert "reminders" in res_reminders.json()
    print("  [PASS] Monthly progress reminders verified.")

    print("\n=== ALL VENTUREBRIDGE FEATURE UPGRADE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
