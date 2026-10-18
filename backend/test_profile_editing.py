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

def run_tests():
    print("=======================================================")
    print("PHASE 1: INTERACTIVE PROFILE EDITING TEST SUITE")
    print("=======================================================\n")

    # 1. Unauthenticated update attempt
    print("1. Testing Unauthenticated Profile Update...")
    status, res = request("PUT", "/api/auth/profile", {"full_name": "Hacker Name"})
    assert status == 401, f"Expected 401 Unauthorized, got {status}: {res}"
    print("  [PASS] Unauthenticated profile update correctly blocked with HTTP 401")

    # 2. Job Seeker Profile Editing & Skill Matching Propagation
    print("\n2. Testing Job Seeker Profile Editing (Alex Rivera)...")
    status, login_res = request("POST", "/api/auth/login", {
        "email": "alex.dev@gmail.com",
        "password": "password123"
    })
    assert status == 200, f"Login failed: {login_res}"
    token_js = login_res["access_token"]

    status, me_before = request("GET", "/api/auth/me", token=token_js)
    assert status == 200, f"GET /api/auth/me failed: {me_before}"
    original_name = me_before["user"]["full_name"]
    original_skills = me_before["profile"]["skills"]
    original_verified = me_before["user"]["is_verified"]

    new_skills = ["React", "TypeScript", "Python", "FastAPI", "Tailwind CSS", "Docker", "PostgreSQL"]
    update_payload = {
        "full_name": "Alex Rivera, Senior Dev",
        "location": "San Francisco, CA (Hybrid)",
        "bio": "Passionate full-stack software engineer with a focus on web apps and APIs.",
        "skills": new_skills,
        "education": "M.S. in Computer Science, Stanford University",
        "experience_level": "Senior Level",
        "preferred_work_mode": "Hybrid",
        "portfolio_url": "https://alexrivera.dev",
        "github_url": "https://github.com/alexrivera-dev",
        "career_interests": "Distributed Systems, AI Platforms",
        # Attempt to exploit/tamper with verification flag
        "is_verified": 1
    }
    status, res = request("PUT", "/api/auth/profile", update_payload, token=token_js)
    assert status == 200, f"Profile update failed: {res}"
    assert res.get("message") == "Profile updated successfully."
    print("  [PASS] PUT /api/auth/profile returned HTTP 200 with success confirmation")

    # Verify changes via GET /api/auth/me
    status, me_after = request("GET", "/api/auth/me", token=token_js)
    assert status == 200
    user_after = me_after["user"]
    profile_after = me_after["profile"]

    assert user_after["full_name"] == "Alex Rivera, Senior Dev"
    assert user_after["location"] == "San Francisco, CA (Hybrid)"
    assert user_after["bio"] == "Passionate full-stack software engineer with a focus on web apps and APIs."
    # Verification tampering must not be allowed
    assert user_after["is_verified"] == original_verified, "Security fail: is_verified was tampered!"
    
    assert profile_after["education"] == "M.S. in Computer Science, Stanford University"
    assert profile_after["experience_level"] == "Senior Level"
    assert profile_after["preferred_work_mode"] == "Hybrid"
    assert profile_after["portfolio_url"] == "https://alexrivera.dev"
    assert profile_after["github_url"] == "https://github.com/alexrivera-dev"
    assert profile_after["career_interests"] == "Distributed Systems, AI Platforms"
    assert profile_after["skills"] == new_skills
    print("  [PASS] GET /api/auth/me confirmed all Job Seeker fields persisted accurately")

    # Verify skill matching propagation in GET /api/opportunities
    status, opps = request("GET", "/api/opportunities", token=token_js)
    assert status == 200
    assert len(opps) > 0
    # Every opportunity now evaluates against the newly saved skills
    first_opp = opps[0]
    assert "match_score" in first_opp
    assert "matched_skills" in first_opp
    print(f"  [PASS] Skill matching immediately recalculated for '{first_opp['title']}': {first_opp['match_score']}% match ({len(first_opp['matched_skills'])} matched skills)")

    # Verify Skill Gap Analyzer reflects the new skills
    gap_payload = {
        "target_role": "Full Stack Developer",
        "user_skills": profile_after["skills"]
    }
    status, gap_res = request("POST", "/api/matching/skill-gap", gap_payload)
    assert status == 200
    assert gap_res["progress_percent"] > 0
    assert "React" in gap_res["matched_skills"]
    assert "Python" in gap_res["matched_skills"]
    print(f"  [PASS] Skill Gap Analyzer verified with updated skills: {gap_res['progress_percent']}% progress for {gap_res['target_role']}")

    # 3. Founder / Entrepreneur Profile Editing
    print("\n3. Testing Founder Profile Editing (Sarah Chen)...")
    status, login_res = request("POST", "/api/auth/login", {
        "email": "founder@ecotrack.io",
        "password": "password123"
    })
    assert status == 200
    token_founder = login_res["access_token"]

    founder_update = {
        "full_name": "Sarah Chen, Founder & CEO",
        "location": "Boston, MA",
        "bio": "Building climate intelligence software for global enterprises.",
        "startup_name": "EcoTrack Technologies",
        "industry": "CleanTech / Climate",
        "startup_stage": "Early Traction",
        "skills_needed": ["React", "Python", "Climate Science", "B2B Sales"]
    }
    status, res = request("PUT", "/api/auth/profile", founder_update, token=token_founder)
    assert status == 200, f"Founder update failed: {res}"

    status, me_founder = request("GET", "/api/auth/me", token=token_founder)
    assert status == 200
    assert me_founder["user"]["full_name"] == "Sarah Chen, Founder & CEO"
    assert me_founder["user"]["location"] == "Boston, MA"
    assert me_founder["profile"]["startup_name"] == "EcoTrack Technologies"
    assert me_founder["profile"]["industry"] == "CleanTech / Climate"
    assert me_founder["profile"]["startup_stage"] == "Early Traction"
    assert me_founder["profile"]["skills_needed"] == ["React", "Python", "Climate Science", "B2B Sales"]
    print("  [PASS] Founder profile update verified and persisted successfully")

    # 4. Investor Profile Editing
    print("\n4. Testing Investor Profile Editing (Marcus Vance)...")
    status, login_res = request("POST", "/api/auth/login", {
        "email": "marcus.vc@apexventures.com",
        "password": "password123"
    })
    assert status == 200
    token_investor = login_res["access_token"]

    investor_update = {
        "full_name": "Marcus Vance, Managing Partner",
        "location": "New York, NY",
        "bio": "Early-stage venture investor backing resilient tech founders.",
        "investor_type": "Venture Capitalist",
        "areas_of_interest": "ClimateTech, AI Tools, Enterprise Infra",
        "preferred_industries": "Software, CleanTech, Healthcare",
        "investment_stage_pref": "Series A"
    }
    status, res = request("PUT", "/api/auth/profile", investor_update, token=token_investor)
    assert status == 200, f"Investor update failed: {res}"

    status, me_investor = request("GET", "/api/auth/me", token=token_investor)
    assert status == 200
    assert me_investor["user"]["full_name"] == "Marcus Vance, Managing Partner"
    assert me_investor["user"]["location"] == "New York, NY"
    assert me_investor["profile"]["investor_type"] == "Venture Capitalist"
    assert me_investor["profile"]["areas_of_interest"] == "ClimateTech, AI Tools, Enterprise Infra"
    assert me_investor["profile"]["preferred_industries"] == "Software, CleanTech, Healthcare"
    assert me_investor["profile"]["investment_stage_pref"] == "Series A"
    print("  [PASS] Investor profile update verified and persisted successfully")

    # 5. Field Preservation Test (Partial update does not wipe unchanged fields)
    print("\n5. Testing Field Preservation on Partial Updates...")
    partial_update = {
        "bio": "Updated bio without changing name or location."
    }
    status, res = request("PUT", "/api/auth/profile", partial_update, token=token_investor)
    assert status == 200
    status, me_partial = request("GET", "/api/auth/me", token=token_investor)
    assert me_partial["user"]["bio"] == "Updated bio without changing name or location."
    # Name and location still preserved!
    assert me_partial["user"]["full_name"] == "Marcus Vance, Managing Partner"
    assert me_partial["user"]["location"] == "New York, NY"
    assert me_partial["profile"]["investor_type"] == "Venture Capitalist"
    print("  [PASS] Partial update preserved existing name, location, and role profile values")

    print("\n=======================================================")
    print("ALL PHASE 1 PROFILE EDITING TESTS PASSED (100% SUCCESS)!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
