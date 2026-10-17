import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"raw": err_body}

def check_cors_and_health():
    print("\n0. Testing Health Checks and CORS Configuration...")
    # Root
    status, res = request("GET", "/")
    assert status == 200, f"Root endpoint failed: {res}"
    assert res.get("status") == "online"
    print("  [PASS] Root endpoint '/' returned online status")

    # /health
    status, res = request("GET", "/health")
    assert status == 200, f"/health endpoint failed: {res}"
    assert res.get("status") == "healthy"
    print("  [PASS] Health check '/health' returned healthy status")

    # /api/health
    status, res = request("GET", "/api/health")
    assert status == 200, f"/api/health endpoint failed: {res}"
    assert res.get("status") == "healthy"
    print("  [PASS] Proxy health check '/api/health' returned healthy status")

    # CORS preflight with Vercel origin
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        headers={
            "Origin": "https://venturebridge01.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        },
        method="OPTIONS"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        headers_dict = dict(resp.headers)
        allow_origin = headers_dict.get("access-control-allow-origin") or headers_dict.get("Access-Control-Allow-Origin")
        assert allow_origin == "https://venturebridge01.vercel.app", f"CORS allow origin mismatch: {allow_origin}"
        print(f"  [PASS] CORS preflight for 'https://venturebridge01.vercel.app' verified ({allow_origin})")

def run_tests():
    print("==========================================")
    print("VENTUREBRIDGE COMPREHENSIVE INTEGRATION TEST")
    print("==========================================")

    # 0. Health & CORS
    check_cors_and_health()

    # 1. Login with demo accounts
    print("\n1. Testing Login for 3 Roles...")
    # Entrepreneur
    status, res = request("POST", "/api/auth/login", {"email": "founder@ecotrack.io", "password": "password123"})
    assert status == 200, f"Entrepreneur login failed: {res}"
    founder_token = res["access_token"]
    assert res["user"]["role"] == "entrepreneur"
    print("  [PASS] Entrepreneur login verified (Sarah Chen)")

    # Job Seeker
    status, res = request("POST", "/api/auth/login", {"email": "alex.dev@gmail.com", "password": "password123"})
    assert status == 200, f"Job seeker login failed: {res}"
    jobseeker_token = res["access_token"]
    assert res["user"]["role"] == "job_seeker"
    print("  [PASS] Job Seeker login verified (Alex Rivera)")

    # Investor
    status, res = request("POST", "/api/auth/login", {"email": "marcus.vc@apexventures.com", "password": "password123"})
    assert status == 200, f"Investor login failed: {res}"
    investor_token = res["access_token"]
    assert res["user"]["role"] == "investor"
    print("  [PASS] Investor login verified (Marcus Vance)")

    # 2. Registration with new user
    print("\n2. Testing Registration with Dynamic Role Profile...")
    import time
    test_email = f"newstudent_{int(time.time())}@venturebridge.test"
    status, res = request("POST", "/api/auth/register", {
        "email": test_email,
        "password": "SecurePassword123!",
        "role": "job_seeker",
        "full_name": "Jordan Smith",
        "location": "Austin, TX",
        "education": "B.S. in Software Engineering",
        "skills": ["React", "FastAPI", "SQL", "Docker"],
        "experience_level": "Entry Level",
        "preferred_work_mode": "Remote"
    })
    assert status in (201, 200), f"Registration failed: {res}"
    new_user_token = res["access_token"]
    print("  [PASS] New user registration and role profile creation successful")

    # 3. Startup Creation
    print("\n3. Testing Startup Creation...")
    status, res = request("POST", "/api/startups", {
        "name": "OceanFilter Autonomous",
        "description": "Marine micro-plastic collection drones with solar charging.",
        "problem": "Harbors accumulate 8 metric tons of microplastics annually.",
        "solution": "Autonomous acoustic-guided filtration buoys.",
        "category": "Social Welfare Startups",
        "industry": "CleanTech & Ocean Conservation",
        "stage": "MVP / Prototype",
        "location": "San Diego, CA",
        "required_skills": ["Robotics", "Python", "Computer Vision"],
        "team_size": 2,
        "funding_stage": "Pre-Seed",
        "funding_requirement": "$120,000"
    }, token=founder_token)
    assert status == 201, f"Startup creation failed: {res}"
    new_startup_id = res["id"]
    print(f"  [PASS] Startup created successfully (ID: {new_startup_id}, Verification Pending)")

    # 4. Idea Sharing with INVESTOR_ONLY visibility
    print("\n4. Testing Idea Sharing & Server-Side Permissions...")
    status, res = request("POST", "/api/ideas", {
        "title": "Confidential Grid Algorithm",
        "problem_statement": "Commercial power systems lose efficiency during microgrid peak load switching.",
        "proposed_solution": "Low-latency predictive voltage stabilization algorithm running on smart inverters.",
        "target_audience": "Utility operators and industrial commercial microgrids.",
        "industry": "CleanTech Energy",
        "required_skills": ["Python", "Embedded C", "Power Systems"],
        "required_team_members": "Power electronics co-founder",
        "startup_stage": "Idea Phase",
        "funding_requirements": "$200,000 pilot development grant",
        "visibility": "INVESTOR_ONLY"
    }, token=founder_token)
    assert status == 201, f"Idea sharing failed: {res}"
    confidential_idea_id = res["id"]
    assert "problem_clarity" in res["analysis"], "Analysis missing"
    print("  [PASS] Confidential INVESTOR_ONLY idea created with rule-based checklist")

    # Verify Job Seeker CANNOT see investor-only idea
    status, res = request("GET", f"/api/ideas/{confidential_idea_id}", token=jobseeker_token)
    assert status == 403, f"Job seeker was able to access investor-only idea! Status: {status}"
    print("  [PASS] Backend server-side security confirmed: Job Seeker received HTTP 403 Forbidden")

    # Verify Investor CAN see investor-only idea
    status, res = request("GET", f"/api/ideas/{confidential_idea_id}", token=investor_token)
    assert status == 200, f"Investor could not access investor-only idea: {status}"
    print("  [PASS] Backend authorization confirmed: Investor received HTTP 200 OK")

    # 5. Opportunities & Transparent Skill Match
    print("\n5. Testing Opportunities & Transparent Skill Matching...")
    status, opps = request("GET", "/api/opportunities", token=jobseeker_token)
    assert status == 200
    assert len(opps) > 0
    # Check that match scores are populated deterministically
    matched_opp = next((o for o in opps if o["title"] == "Frontend Developer Intern"), None)
    assert matched_opp is not None, "Frontend intern opp not found"
    assert "match_score" in matched_opp
    assert matched_opp["match_score"] is not None
    print(f"  [PASS] Deterministic skill match verified for Alex: {matched_opp['match_score']}% ({matched_opp['match_explanation']})")

    # 6. Skill Gap Analyzer
    print("\n6. Testing Skill Gap Analyzer API...")
    status, gap = request("POST", "/api/matching/skill-gap", {
        "target_role": "Full Stack Developer",
        "user_skills": ["React", "JavaScript", "HTML", "CSS"]
    })
    assert status == 200
    assert "progress_percent" in gap
    assert "recommended_priorities" in gap
    print(f"  [PASS] Skill Gap Analyzer verified: {gap['progress_percent']}% readiness with {len(gap['recommended_priorities'])} priorities")

    # 7. Mentors Directory & Strict Absence of Mentor Feedback
    print("\n7. Testing Mentors Directory & Strict Verification...")
    status, mentors = request("GET", "/api/mentors")
    assert status == 200
    assert len(mentors) > 0
    # Submit guidance request
    mentor_id = mentors[0]["id"]
    status, res = request("POST", f"/api/mentors/{mentor_id}/request-guidance", {
        "topic": "System architecture review",
        "message": "We are preparing for our pre-seed launch and would value 20 minutes of architecture advice."
    }, token=founder_token)
    assert status == 201
    print(f"  [PASS] Guidance request submitted to {mentors[0]['name']}")

    # Verify that mentor feedback endpoints do NOT exist (Strict requirement!)
    status, _ = request("GET", "/api/mentors/feedback")
    assert status in (404, 405, 422), f"Mentor feedback endpoint should NOT exist, got {status}!"
    status, _ = request("POST", f"/api/mentors/{mentor_id}/feedback", {})
    assert status in (404, 405, 422), f"Mentor feedback POST endpoint should NOT exist, got {status}!"
    print("  [PASS] Strict requirement verified: Zero mentor feedback endpoints exist")

    # 8. Trust & Fraud Prevention Report
    print("\n8. Testing Trust & Fraud Prevention Reporting...")
    status, res = request("POST", "/api/reports", {
        "target_type": "Job",
        "target_id": 1,
        "reason": "Requests upfront fee or personal payment",
        "details": "Listing requests fee for starter kit before interview."
    }, token=jobseeker_token)
    assert status == 201
    report_id = res["id"]
    assert res["status"] == "Pending Review"
    print(f"  [PASS] Report #{report_id} successfully submitted with status 'Pending Review'")

    # Admin review status update
    status, res = request("PUT", f"/api/admin/reports/{report_id}/status?status_val=Under%20Review", token=founder_token)
    assert status == 200
    print("  [PASS] Report audit status successfully updated to 'Under Review'")

    # 9. Connections & Persistent Direct Messaging
    print("\n9. Testing Connections & Direct Messaging...")
    status, conns = request("GET", "/api/connections", token=founder_token)
    assert status == 200
    assert len(conns["accepted"]) > 0
    peer_id = conns["accepted"][0]["peer_id"]
    # Send message
    status, res = request("POST", f"/api/messages/{peer_id}", {"content": "Integration test verified ping!"}, token=founder_token)
    assert status == 201
    # Retrieve messages
    status, msgs = request("GET", f"/api/messages/{peer_id}", token=founder_token)
    assert status == 200
    assert any(m["content"] == "Integration test verified ping!" for m in msgs)
    print("  [PASS] Persistent direct messaging between accepted connections confirmed")

    print("\n==========================================")
    print("ALL 9 INTEGRATION TEST SUITES PASSED (100% SUCCESS)!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
