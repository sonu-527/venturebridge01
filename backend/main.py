import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db, init_db
from seed_data import seed_all
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
    require_role
)

app = FastAPI(
    title="VentureBridge API",
    description="Connecting Talent, Ideas, and Opportunities — Backend REST API",
    version="1.0.0"
)

# Configure CORS: allow production Vercel domain, Vercel preview deploys, local dev, and env overrides
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
frontend_url_env = os.getenv("FRONTEND_URL", "")

origins = [
    "https://venturebridge01.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

for extra in [frontend_url_env, allowed_origins_env]:
    if extra:
        for u in extra.split(","):
            cleaned = u.strip().rstrip("/")
            if cleaned and cleaned not in origins:
                origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Auto-seed if AUTO_SEED is enabled (default true to ensure demo personas work on fresh deploys)
    auto_seed_env = os.getenv("AUTO_SEED", "true").lower()
    if auto_seed_env in ("true", "1", "yes"):
        try:
            seed_all()
        except Exception as e:
            print(f"Startup notice: Seeding check completed ({e})")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "VentureBridge API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "VentureBridge API",
        "timestamp": datetime.now().isoformat()
    }

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str  # 'entrepreneur', 'job_seeker', 'investor'
    full_name: str
    location: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    # Entrepreneur specific
    startup_name: Optional[str] = None
    industry: Optional[str] = None
    startup_stage: Optional[str] = None
    skills_needed: Optional[List[str]] = []
    # Job Seeker specific
    education: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_level: Optional[str] = None
    preferred_work_mode: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    career_interests: Optional[str] = None
    # Investor specific
    investor_type: Optional[str] = None
    areas_of_interest: Optional[str] = None
    preferred_industries: Optional[str] = None
    investment_stage_pref: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    # Specific fields
    startup_name: Optional[str] = None
    industry: Optional[str] = None
    startup_stage: Optional[str] = None
    skills_needed: Optional[List[str]] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    preferred_work_mode: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    career_interests: Optional[str] = None
    investor_type: Optional[str] = None
    areas_of_interest: Optional[str] = None
    preferred_industries: Optional[str] = None
    investment_stage_pref: Optional[str] = None

class StartupCreateRequest(BaseModel):
    name: str
    description: str
    problem: str
    solution: str
    category: str  # 'Tech Startups', 'Non-Tech Startups', 'Social Welfare Startups'
    industry: str
    stage: str
    location: str
    website: Optional[str] = None
    required_skills: List[str] = []
    team_size: Optional[int] = 1
    funding_stage: Optional[str] = None
    funding_requirement: Optional[str] = None

class StartupIdeaCreateRequest(BaseModel):
    title: str
    problem_statement: str
    proposed_solution: str
    target_audience: str
    industry: str
    required_skills: List[str] = []
    required_team_members: Optional[str] = ""
    startup_stage: str
    funding_requirements: Optional[str] = ""
    visibility: str = "PUBLIC"  # 'PUBLIC', 'INVESTOR_ONLY'

class OpportunityCreateRequest(BaseModel):
    title: str
    company: str
    description: str
    category: str
    required_skills: List[str]
    experience_level: str
    work_mode: str
    location: str
    compensation: Optional[str] = None
    startup_id: Optional[int] = None

class ApplicationSubmitRequest(BaseModel):
    cover_letter: Optional[str] = ""
    resume_url: Optional[str] = ""

class ApplicationStatusUpdateRequest(BaseModel):
    status: str  # 'Submitted', 'Under Review', 'Shortlisted', 'Rejected'

class InvestorInterestRequest(BaseModel):
    message: str

class InvestorInterestStatusRequest(BaseModel):
    status: str  # 'Accepted', 'Declined'

class ConnectionRequestPayload(BaseModel):
    receiver_id: int
    message: Optional[str] = "I'd like to connect with you on VentureBridge."

class ConnectionRespondPayload(BaseModel):
    status: str  # 'Accepted', 'Rejected'

class MessagePayload(BaseModel):
    content: str

class MentorshipRequestPayload(BaseModel):
    topic: str
    message: str

class ReportSubmitRequest(BaseModel):
    target_type: str  # 'Job', 'Profile', 'Startup'
    target_id: int
    reason: str
    details: Optional[str] = ""

class SkillGapRequest(BaseModel):
    target_role: str
    user_skills: List[str]

# ==========================================
# RULE-BASED IDEA ANALYZER HELPER
# ==========================================

def perform_rule_based_idea_analysis(title: str, problem: str, solution: str, audience: str, skills: List[str], stage: str) -> dict:
    # 1. Problem Clarity Evaluation
    prob_len = len(problem.split())
    if prob_len < 10:
        prob_clarity = "Needs Detail: The problem statement is very brief. Provide concrete metrics, customer pain points, or quantifiable daily friction."
    elif prob_len < 25:
        prob_clarity = "Moderate Clarity: Problem identified. Stating who experiences this daily and existing poor workarounds will sharpen investor interest."
    else:
        prob_clarity = f"High Clarity ({prob_len} words): Clear description of systemic problem, affected users, and scope."

    # 2. Target Customers
    aud_len = len(audience.split())
    if aud_len < 5:
        target_eval = "Broad Target: Define a specific early-adopter beachhead niche before expanding to mass market."
    else:
        target_eval = f"Well-Defined Beachhead: Focused on '{audience}'. Early customer validation interviews are recommended."

    # 3. Proposed Solution
    sol_len = len(solution.split())
    if sol_len < 12:
        sol_eval = "Needs Elaboration: Clearly distinguish how this solution outperforms existing free tools or incumbent legacy software."
    else:
        sol_eval = "Differentiated Value Proposition: Articulates key mechanism and direct benefits to end users."

    # 4. Required Skills
    if not skills:
        skills_eval = ["Technical/Domain expertise needs to be mapped to build this prototype."]
    else:
        skills_eval = skills

    # 5. Possible Challenges
    challenges = []
    if "AI" in title or "AI" in solution or "LLM" in solution:
        challenges.append("Model hallucination risk, compute inference costs, and edge data privacy compliance.")
    if "Social" in title or "Welfare" in title or "Recycle" in solution:
        challenges.append("Sustained community volunteer engagement and securing municipal or philanthropic grants.")
    if "Hardware" in solution or "IoT" in solution:
        challenges.append("Hardware tooling lead times, device repair logistics, and sensor component availability.")
    challenges.append("Customer acquisition cost (CAC) versus lifetime value (LTV) during initial bootstrap phase.")
    challenges.append("User switching inertia from established manual spreadsheets or legacy alternatives.")

    # 6. Team Requirements
    team_req = f"For the '{stage}' stage, a balanced core team typically requires 1 technical lead ({', '.join(skills[:2]) if skills else 'Product Builder'}) and 1 growth/domain specialist for user interviews."

    return {
        "problem_clarity": prob_clarity,
        "target_customers": target_eval,
        "proposed_solution": sol_eval,
        "required_skills": skills_eval,
        "possible_challenges": challenges,
        "team_requirements": team_req,
        "analysis_type": "Deterministic Rule-Based MVP Evaluation (No AI speculation)",
        "disclaimer": "This analysis is an automated rule-based checklist for MVP validation and does not guarantee market success or investment."
    }

# Benchmark roles for Skill Gap Analyzer
ROLE_BENCHMARKS = {
    "Frontend Developer": [
        "HTML", "CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "Git", "REST APIs", "Responsive Design"
    ],
    "Backend Developer": [
        "Python", "FastAPI", "SQL", "Database Design", "REST APIs", "Docker", "Git", "Authentication & Security", "PostgreSQL/SQLite"
    ],
    "Full Stack Developer": [
        "React", "TypeScript", "Python", "FastAPI", "SQL", "Tailwind CSS", "Git", "REST APIs", "State Management"
    ],
    "Data Analyst / Scientist": [
        "Python", "SQL", "Pandas", "NumPy", "Data Visualization", "Tableau", "Statistics", "Machine Learning", "Git"
    ],
    "UI/UX Designer": [
        "Figma", "UI/UX", "User Research", "Wireframing", "Prototyping", "Design Systems", "HTML", "CSS", "Accessibility"
    ],
    "Product Manager": [
        "User Research", "Wireframing", "MVP Scoping", "Agile / Scrum", "Data Analytics", "Roadmapping", "Communication", "Market Analysis"
    ],
    "Mobile App Developer": [
        "React Native", "TypeScript", "JavaScript", "Mobile UX", "REST APIs", "State Management", "Git", "App Store Deployment"
    ]
}

# ==========================================
# 1. AUTHENTICATION & PROFILE ENDPOINTS
# ==========================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    if payload.role not in ["entrepreneur", "job_seeker", "investor"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'entrepreneur', 'job_seeker', or 'investor'.")
    
    now = datetime.now().isoformat()
    pwd_hash = hash_password(payload.password)
    
    with get_db() as conn:
        cursor = conn.cursor()
        # Check existing user
        cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
        cursor.execute("""
        INSERT INTO users (email, password_hash, role, full_name, location, profile_image, bio, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        """, (payload.email.lower(), pwd_hash, payload.role, payload.full_name, payload.location, payload.profile_image, payload.bio, now, now))
        user_id = cursor.lastrowid
        
        # Create role specific profile
        if payload.role == "entrepreneur":
            cursor.execute("""
            INSERT INTO entrepreneur_profiles (user_id, startup_name, industry, startup_stage, skills_needed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, payload.startup_name, payload.industry, payload.startup_stage, json.dumps(payload.skills_needed or []), now, now))
        elif payload.role == "job_seeker":
            cursor.execute("""
            INSERT INTO job_seeker_profiles (user_id, education, skills, experience_level, preferred_work_mode, portfolio_url, github_url, career_interests, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, payload.education, json.dumps(payload.skills or []), payload.experience_level, payload.preferred_work_mode, payload.portfolio_url, payload.github_url, payload.career_interests, now, now))
        elif payload.role == "investor":
            cursor.execute("""
            INSERT INTO investor_profiles (user_id, investor_type, areas_of_interest, preferred_industries, investment_stage_pref, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, payload.investor_type, payload.areas_of_interest, payload.preferred_industries, payload.investment_stage_pref, now, now))

    token = create_access_token({"sub": str(user_id), "role": payload.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": payload.email.lower(),
            "role": payload.role,
            "full_name": payload.full_name,
            "location": payload.location,
            "profile_image": payload.profile_image,
            "bio": payload.bio,
            "is_verified": 0
        }
    }

@app.post("/api/auth/login")
def login(payload: LoginRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (payload.email.lower(),))
        user = cursor.fetchone()
        if not user or not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        user_id = user["id"]
        role = user["role"]
        profile_data = {}
        if role == "entrepreneur":
            cursor.execute("SELECT * FROM entrepreneur_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone() or {}
            if profile_data.get("skills_needed"):
                profile_data["skills_needed"] = json.loads(profile_data["skills_needed"])
        elif role == "job_seeker":
            cursor.execute("SELECT * FROM job_seeker_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone() or {}
            if profile_data.get("skills"):
                profile_data["skills"] = json.loads(profile_data["skills"])
        elif role == "investor":
            cursor.execute("SELECT * FROM investor_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone() or {}

    token = create_access_token({"sub": str(user_id), "role": role})
    user_sanitized = {k: v for k, v in user.items() if k != "password_hash"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_sanitized,
        "profile": profile_data
    }

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    role = current_user["role"]
    with get_db() as conn:
        cursor = conn.cursor()
        profile_data = {}
        if role == "entrepreneur":
            cursor.execute("SELECT * FROM entrepreneur_profiles WHERE user_id = ?", (user_id,))
            p = cursor.fetchone()
            if p:
                profile_data = p
                profile_data["skills_needed"] = json.loads(p["skills_needed"]) if p.get("skills_needed") else []
        elif role == "job_seeker":
            cursor.execute("SELECT * FROM job_seeker_profiles WHERE user_id = ?", (user_id,))
            p = cursor.fetchone()
            if p:
                profile_data = p
                profile_data["skills"] = json.loads(p["skills"]) if p.get("skills") else []
        elif role == "investor":
            cursor.execute("SELECT * FROM investor_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone() or {}

        # Counts
        cursor.execute("SELECT COUNT(*) as count FROM connections WHERE (sender_id = ? OR receiver_id = ?) AND status = 'Accepted'", (user_id, user_id))
        connections_count = cursor.fetchone()["count"]

    return {
        "user": current_user,
        "profile": profile_data,
        "connections_count": connections_count
    }

@app.put("/api/auth/profile")
def update_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    role = current_user["role"]
    now = datetime.now().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        # Update user base info if supplied
        user_updates = []
        user_params = []
        if payload.full_name is not None:
            user_updates.append("full_name = ?")
            user_params.append(payload.full_name)
        if payload.location is not None:
            user_updates.append("location = ?")
            user_params.append(payload.location)
        if payload.profile_image is not None:
            user_updates.append("profile_image = ?")
            user_params.append(payload.profile_image)
        if payload.bio is not None:
            user_updates.append("bio = ?")
            user_params.append(payload.bio)

        if user_updates:
            user_updates.append("updated_at = ?")
            user_params.append(now)
            user_params.append(user_id)
            cursor.execute(f"UPDATE users SET {', '.join(user_updates)} WHERE id = ?", tuple(user_params))

        # Update role-specific profile
        if role == "entrepreneur":
            cursor.execute("""
            UPDATE entrepreneur_profiles
            SET startup_name = COALESCE(?, startup_name),
                industry = COALESCE(?, industry),
                startup_stage = COALESCE(?, startup_stage),
                skills_needed = CASE WHEN ? IS NOT NULL THEN ? ELSE skills_needed END,
                updated_at = ?
            WHERE user_id = ?
            """, (
                payload.startup_name,
                payload.industry,
                payload.startup_stage,
                json.dumps(payload.skills_needed) if payload.skills_needed is not None else None,
                json.dumps(payload.skills_needed) if payload.skills_needed is not None else None,
                now,
                user_id
            ))
        elif role == "job_seeker":
            cursor.execute("""
            UPDATE job_seeker_profiles
            SET education = COALESCE(?, education),
                skills = CASE WHEN ? IS NOT NULL THEN ? ELSE skills END,
                experience_level = COALESCE(?, experience_level),
                preferred_work_mode = COALESCE(?, preferred_work_mode),
                portfolio_url = COALESCE(?, portfolio_url),
                github_url = COALESCE(?, github_url),
                career_interests = COALESCE(?, career_interests),
                updated_at = ?
            WHERE user_id = ?
            """, (
                payload.education,
                json.dumps(payload.skills) if payload.skills is not None else None,
                json.dumps(payload.skills) if payload.skills is not None else None,
                payload.experience_level,
                payload.preferred_work_mode,
                payload.portfolio_url,
                payload.github_url,
                payload.career_interests,
                now,
                user_id
            ))
        elif role == "investor":
            cursor.execute("""
            UPDATE investor_profiles
            SET investor_type = COALESCE(?, investor_type),
                areas_of_interest = COALESCE(?, areas_of_interest),
                preferred_industries = COALESCE(?, preferred_industries),
                investment_stage_pref = COALESCE(?, investment_stage_pref),
                updated_at = ?
            WHERE user_id = ?
            """, (
                payload.investor_type,
                payload.areas_of_interest,
                payload.preferred_industries,
                payload.investment_stage_pref,
                now,
                user_id
            ))

    return {"message": "Profile updated successfully."}

@app.get("/api/auth/users")
def get_users(
    role: Optional[str] = None,
    q: Optional[str] = None,
    skill: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
        SELECT u.id, u.email, u.role, u.full_name, u.location, u.profile_image, u.bio, u.is_verified,
               jp.education, jp.skills, jp.experience_level, jp.preferred_work_mode, jp.portfolio_url, jp.github_url, jp.career_interests,
               ep.startup_name, ep.industry as entrepreneur_industry, ep.startup_stage, ep.skills_needed,
               ip.investor_type, ip.areas_of_interest
        FROM users u
        LEFT JOIN job_seeker_profiles jp ON u.id = jp.user_id
        LEFT JOIN entrepreneur_profiles ep ON u.id = ep.user_id
        LEFT JOIN investor_profiles ip ON u.id = ip.user_id
        WHERE 1=1
        """
        params = []
        if role:
            query += " AND u.role = ?"
            params.append(role)
        if q:
            query += " AND (u.full_name LIKE ? OR u.bio LIKE ? OR jp.career_interests LIKE ? OR ep.startup_name LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard, wildcard])

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            # Don't show current logged in user in find candidate directory
            if current_user and r["id"] == current_user["id"]:
                continue
            skills_list = json.loads(r["skills"]) if r.get("skills") else []
            skills_needed_list = json.loads(r["skills_needed"]) if r.get("skills_needed") else []
            
            if skill and skill.lower() not in [s.lower() for s in skills_list]:
                continue

            results.append({
                "id": r["id"],
                "role": r["role"],
                "full_name": r["full_name"],
                "location": r["location"],
                "profile_image": r["profile_image"],
                "bio": r["bio"],
                "is_verified": bool(r["is_verified"]),
                "education": r["education"],
                "skills": skills_list,
                "experience_level": r["experience_level"],
                "preferred_work_mode": r["preferred_work_mode"],
                "portfolio_url": r["portfolio_url"],
                "github_url": r["github_url"],
                "career_interests": r["career_interests"],
                "startup_name": r["startup_name"],
                "entrepreneur_industry": r["entrepreneur_industry"],
                "startup_stage": r["startup_stage"],
                "skills_needed": skills_needed_list,
                "investor_type": r["investor_type"],
                "areas_of_interest": r["areas_of_interest"]
            })

        return results

# ==========================================
# 2. STARTUPS ENDPOINTS
# ==========================================

@app.get("/api/startups")
def get_startups(
    category: Optional[str] = None,
    industry: Optional[str] = None,
    stage: Optional[str] = None,
    verification: Optional[str] = None,
    q: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
        SELECT s.*, u.full_name as owner_name, u.email as owner_email, u.profile_image as owner_image
        FROM startups s
        JOIN users u ON s.owner_id = u.id
        WHERE 1=1
        """
        params = []
        if category and category != "All":
            query += " AND s.category = ?"
            params.append(category)
        if industry and industry != "All":
            query += " AND s.industry LIKE ?"
            params.append(f"%{industry}%")
        if stage and stage != "All":
            query += " AND s.stage = ?"
            params.append(stage)
        if verification and verification != "All":
            query += " AND s.verification_status = ?"
            params.append(verification)
        if q:
            query += " AND (s.name LIKE ? OR s.description LIKE ? OR s.problem LIKE ? OR s.solution LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard, wildcard])

        query += " ORDER BY s.id DESC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        startups = []
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
            startups.append(r)
        return startups

@app.get("/api/startups/{startup_id}")
def get_startup_details(startup_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT s.*, u.full_name as owner_name, u.email as owner_email, u.profile_image as owner_image, u.location as owner_location
        FROM startups s
        JOIN users u ON s.owner_id = u.id
        WHERE s.id = ?
        """, (startup_id,))
        startup = cursor.fetchone()
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found.")
        
        startup["required_skills"] = json.loads(startup["required_skills"]) if startup.get("required_skills") else []

        # Fetch open opportunities for this startup
        cursor.execute("SELECT * FROM opportunities WHERE startup_id = ?", (startup_id,))
        opps = cursor.fetchall()
        for o in opps:
            o["required_skills"] = json.loads(o["required_skills"]) if o.get("required_skills") else []
        startup["open_opportunities"] = opps

        return startup

@app.post("/api/startups", status_code=status.HTTP_201_CREATED)
def create_startup(
    payload: StartupCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO startups (owner_id, name, description, problem, solution, category, industry, stage, location, website, required_skills, team_size, funding_stage, funding_requirement, verification_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verification Pending', ?, ?)
        """, (
            current_user["id"],
            payload.name,
            payload.description,
            payload.problem,
            payload.solution,
            payload.category,
            payload.industry,
            payload.stage,
            payload.location,
            payload.website,
            json.dumps(payload.required_skills),
            payload.team_size or 1,
            payload.funding_stage,
            payload.funding_requirement,
            now, now
        ))
        new_id = cursor.lastrowid
    return {"id": new_id, "message": "Startup created successfully and submitted for verification."}

@app.put("/api/startups/{startup_id}")
def update_startup(
    startup_id: int,
    payload: StartupCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id FROM startups WHERE id = ?", (startup_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Startup not found.")
        if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to edit this startup.")
        
        cursor.execute("""
        UPDATE startups
        SET name = ?, description = ?, problem = ?, solution = ?, category = ?, industry = ?, stage = ?, location = ?, website = ?, required_skills = ?, team_size = ?, funding_stage = ?, funding_requirement = ?, updated_at = ?
        WHERE id = ?
        """, (
            payload.name, payload.description, payload.problem, payload.solution, payload.category, payload.industry, payload.stage, payload.location, payload.website, json.dumps(payload.required_skills), payload.team_size, payload.funding_stage, payload.funding_requirement, now, startup_id
        ))
    return {"message": "Startup updated successfully."}

@app.delete("/api/startups/{startup_id}")
def delete_startup(
    startup_id: int,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id FROM startups WHERE id = ?", (startup_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Startup not found.")
        if existing["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to delete this startup.")
        cursor.execute("DELETE FROM startups WHERE id = ?", (startup_id,))
    return {"message": "Startup deleted successfully."}

@app.get("/api/startups/my/list")
def get_my_startups(current_user: dict = Depends(require_role("entrepreneur", "admin"))):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM startups WHERE owner_id = ? ORDER BY id DESC", (current_user["id"],))
        rows = cursor.fetchall()
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
        return rows

# ==========================================
# 3. STARTUP IDEA SHARING & VISIBILITY
# ==========================================

@app.post("/api/ideas", status_code=status.HTTP_201_CREATED)
def share_idea(
    payload: StartupIdeaCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    if payload.visibility not in ["PUBLIC", "INVESTOR_ONLY"]:
        raise HTTPException(status_code=400, detail="Visibility must be either 'PUBLIC' or 'INVESTOR_ONLY'.")

    analysis = perform_rule_based_idea_analysis(
        title=payload.title,
        problem=payload.problem_statement,
        solution=payload.proposed_solution,
        audience=payload.target_audience,
        skills=payload.required_skills,
        stage=payload.startup_stage
    )

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO startup_ideas (user_id, title, problem_statement, proposed_solution, target_audience, industry, required_skills, required_team_members, startup_stage, funding_requirements, visibility, analysis_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user["id"],
            payload.title,
            payload.problem_statement,
            payload.proposed_solution,
            payload.target_audience,
            payload.industry,
            json.dumps(payload.required_skills),
            payload.required_team_members,
            payload.startup_stage,
            payload.funding_requirements,
            payload.visibility,
            json.dumps(analysis),
            now, now
        ))
        idea_id = cursor.lastrowid
    
    return {
        "id": idea_id,
        "message": "Startup idea saved successfully.",
        "analysis": analysis
    }

@app.get("/api/ideas")
def get_ideas(
    q: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Enforces server-side permissions:
    - PUBLIC ideas visible to all.
    - INVESTOR_ONLY ideas visible ONLY to investors, admins, or the idea author!
    """
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
        SELECT i.*, u.full_name as author_name, u.email as author_email, u.profile_image as author_image
        FROM startup_ideas i
        JOIN users u ON i.user_id = u.id
        WHERE 1=1
        """
        params = []
        if q:
            query += " AND (i.title LIKE ? OR i.problem_statement LIKE ? OR i.proposed_solution LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard])

        query += " ORDER BY i.id DESC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        filtered_ideas = []
        is_investor = current_user and (current_user.get("role") in ["investor", "admin"])
        user_id = current_user.get("id") if current_user else None

        for r in rows:
            # Backend visibility enforcement
            if r["visibility"] == "INVESTOR_ONLY":
                if not (is_investor or (user_id and r["user_id"] == user_id)):
                    continue  # Hidden on backend! Never leaked to unauthorized users

            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
            r["analysis"] = json.loads(r["analysis_json"]) if r.get("analysis_json") else None
            filtered_ideas.append(r)

        return filtered_ideas

@app.get("/api/ideas/{idea_id}")
def get_idea_details(
    idea_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT i.*, u.full_name as author_name, u.email as author_email, u.profile_image as author_image
        FROM startup_ideas i
        JOIN users u ON i.user_id = u.id
        WHERE i.id = ?
        """, (idea_id,))
        idea = cursor.fetchone()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found.")

        # Visibility check
        if idea["visibility"] == "INVESTOR_ONLY":
            is_investor = current_user and (current_user.get("role") in ["investor", "admin"])
            is_author = current_user and (current_user.get("id") == idea["user_id"])
            if not (is_investor or is_author):
                raise HTTPException(
                    status_code=403,
                    detail="This startup idea has INVESTOR-ONLY visibility. You must be an authorized investor to view this."
                )

        idea["required_skills"] = json.loads(idea["required_skills"]) if idea.get("required_skills") else []
        idea["analysis"] = json.loads(idea["analysis_json"]) if idea.get("analysis_json") else None
        return idea

@app.delete("/api/ideas/{idea_id}")
def delete_idea(
    idea_id: int,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM startup_ideas WHERE id = ?", (idea_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Idea not found.")
        if existing["user_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to delete this idea.")
        cursor.execute("DELETE FROM startup_ideas WHERE id = ?", (idea_id,))
    return {"message": "Startup idea deleted successfully."}

@app.post("/api/ideas/analyze")
def analyze_idea_preview(payload: StartupIdeaCreateRequest):
    return perform_rule_based_idea_analysis(
        title=payload.title,
        problem=payload.problem_statement,
        solution=payload.proposed_solution,
        audience=payload.target_audience,
        skills=payload.required_skills,
        stage=payload.startup_stage
    )

# ==========================================
# 4. OPPORTUNITIES & APPLICATIONS
# ==========================================

@app.get("/api/opportunities")
def get_opportunities(
    category: Optional[str] = None,
    work_mode: Optional[str] = None,
    experience_level: Optional[str] = None,
    q: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
        SELECT o.*, u.full_name as creator_name, u.email as creator_email
        FROM opportunities o
        JOIN users u ON o.creator_id = u.id
        WHERE 1=1
        """
        params = []
        if category and category != "All":
            query += " AND o.category = ?"
            params.append(category)
        if work_mode and work_mode != "All":
            query += " AND o.work_mode = ?"
            params.append(work_mode)
        if experience_level and experience_level != "All":
            query += " AND o.experience_level = ?"
            params.append(experience_level)
        if q:
            query += " AND (o.title LIKE ? OR o.company LIKE ? OR o.description LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard])

        query += " ORDER BY o.id DESC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        # Check candidate skills for transparent matching if user is job_seeker
        candidate_skills = []
        saved_opp_ids = set()
        applied_opp_ids = set()
        if current_user:
            cursor.execute("SELECT skills FROM job_seeker_profiles WHERE user_id = ?", (current_user["id"],))
            jsp = cursor.fetchone()
            if jsp and jsp["skills"]:
                candidate_skills = [s.strip().lower() for s in json.loads(jsp["skills"])]
            
            cursor.execute("SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?", (current_user["id"],))
            saved_opp_ids = {r["opportunity_id"] for r in cursor.fetchall()}

            cursor.execute("SELECT opportunity_id FROM applications WHERE user_id = ?", (current_user["id"],))
            applied_opp_ids = {r["opportunity_id"] for r in cursor.fetchall()}

        results = []
        for r in rows:
            req_skills = json.loads(r["required_skills"]) if r.get("required_skills") else []
            r["required_skills"] = req_skills
            r["is_saved"] = r["id"] in saved_opp_ids
            r["is_applied"] = r["id"] in applied_opp_ids

            # Transparent skill matching calculation
            if candidate_skills and req_skills:
                total_req = len(req_skills)
                matched = [s for s in req_skills if s.strip().lower() in candidate_skills]
                missing = [s for s in req_skills if s.strip().lower() not in candidate_skills]
                match_percent = round((len(matched) / total_req) * 100) if total_req > 0 else 0
                r["match_score"] = match_percent
                r["matched_skills"] = matched
                r["missing_skills"] = missing
                r["match_explanation"] = f"You match {len(matched)} of {total_req} required skills ({match_percent}% overlap)."
            elif not req_skills:
                r["match_score"] = None
                r["matched_skills"] = []
                r["missing_skills"] = []
                r["match_explanation"] = "Match score unavailable: opportunity does not specify skill requirements."
            else:
                r["match_score"] = None
                r["matched_skills"] = []
                r["missing_skills"] = []
                r["match_explanation"] = "Log in as a job seeker to see your personalized skill match."

            results.append(r)

        return results

@app.post("/api/opportunities", status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO opportunities (creator_id, startup_id, title, company, description, category, required_skills, experience_level, work_mode, location, compensation, verification_status, is_demo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verification Pending', 0, ?)
        """, (
            current_user["id"],
            payload.startup_id,
            payload.title,
            payload.company,
            payload.description,
            payload.category,
            json.dumps(payload.required_skills),
            payload.experience_level,
            payload.work_mode,
            payload.location,
            payload.compensation,
            now
        ))
        new_id = cursor.lastrowid
    return {"id": new_id, "message": "Opportunity posted successfully."}

@app.post("/api/opportunities/{opp_id}/save")
def toggle_save_opportunity(
    opp_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?", (user_id, opp_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("DELETE FROM saved_opportunities WHERE id = ?", (existing["id"],))
            return {"saved": False, "message": "Opportunity removed from saved list."}
        else:
            cursor.execute("INSERT INTO saved_opportunities (user_id, opportunity_id, created_at) VALUES (?, ?, ?)", (user_id, opp_id, now))
            return {"saved": True, "message": "Opportunity saved successfully."}

@app.get("/api/opportunities/saved/my")
def get_my_saved_opportunities(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT o.*, s.created_at as saved_at
        FROM saved_opportunities s
        JOIN opportunities o ON s.opportunity_id = o.id
        WHERE s.user_id = ?
        ORDER BY s.id DESC
        """, (current_user["id"],))
        rows = cursor.fetchall()
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
        return rows

@app.post("/api/opportunities/{opp_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_opportunity(
    opp_id: int,
    payload: ApplicationSubmitRequest,
    current_user: dict = Depends(require_role("job_seeker", "admin"))
):
    user_id = current_user["id"]
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM applications WHERE opportunity_id = ? AND user_id = ?", (opp_id, user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You have already submitted an application for this opportunity.")

        cursor.execute("""
        INSERT INTO applications (opportunity_id, user_id, cover_letter, resume_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'Submitted', ?, ?)
        """, (opp_id, user_id, payload.cover_letter, payload.resume_url, now, now))
        app_id = cursor.lastrowid

    return {"id": app_id, "status": "Submitted", "message": "Application submitted successfully."}

@app.get("/api/applications/my")
def get_my_applications(current_user: dict = Depends(require_role("job_seeker", "admin"))):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.*, o.title as job_title, o.company, o.category, o.work_mode, o.location, o.compensation, o.required_skills
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE a.user_id = ?
        ORDER BY a.id DESC
        """, (current_user["id"],))
        rows = cursor.fetchall()
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
        return rows

@app.get("/api/applications/opportunity/{opp_id}")
def get_opportunity_applications(
    opp_id: int,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT creator_id FROM opportunities WHERE id = ?", (opp_id,))
        opp = cursor.fetchone()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found.")
        if opp["creator_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to view applicants for this opportunity.")

        cursor.execute("""
        SELECT a.*, u.full_name as applicant_name, u.email as applicant_email, u.profile_image, u.location,
               jp.education, jp.skills, jp.experience_level, jp.portfolio_url, jp.github_url
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN job_seeker_profiles jp ON u.id = jp.user_id
        WHERE a.opportunity_id = ?
        ORDER BY a.id DESC
        """, (opp_id,))
        rows = cursor.fetchall()
        for r in rows:
            r["skills"] = json.loads(r["skills"]) if r.get("skills") else []
        return rows

@app.put("/api/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    payload: ApplicationStatusUpdateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    if payload.status not in ["Submitted", "Under Review", "Shortlisted", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.id, o.creator_id
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE a.id = ?
        """, (app_id,))
        app_item = cursor.fetchone()
        if not app_item:
            raise HTTPException(status_code=404, detail="Application not found.")
        if app_item["creator_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("UPDATE applications SET status = ?, updated_at = ? WHERE id = ?", (payload.status, now, app_id))
    return {"message": f"Application status updated to '{payload.status}'."}

# ==========================================
# 5. TRANSPARENT MATCHING & SKILL GAP ANALYZER
# ==========================================

@app.post("/api/matching/skill-gap")
def analyze_skill_gap(payload: SkillGapRequest):
    benchmarks = ROLE_BENCHMARKS.get(payload.target_role, [
        "Communication", "Problem Solving", "Git", "Project Management", "Technical Documentation"
    ])
    
    candidate_skills_lower = {s.strip().lower() for s in payload.user_skills}
    
    matched = [s for s in benchmarks if s.lower() in candidate_skills_lower]
    missing = [s for s in benchmarks if s.lower() not in candidate_skills_lower]
    
    total = len(benchmarks)
    progress_pct = round((len(matched) / total) * 100) if total > 0 else 0
    
    # Priority recommendations
    recommendations = []
    for skill in missing[:3]:
        recommendations.append({
            "skill": skill,
            "priority": "High Priority",
            "suggested_action": f"Build a focused portfolio project demonstrating practical use of {skill}."
        })
    for skill in missing[3:5]:
        recommendations.append({
            "skill": skill,
            "priority": "Medium Priority",
            "suggested_action": f"Review documentation, best practices, and complete hands-on tutorials for {skill}."
        })

    return {
        "target_role": payload.target_role,
        "total_benchmark_skills": total,
        "matched_skills": matched,
        "missing_skills": missing,
        "progress_percent": progress_pct,
        "recommended_priorities": recommendations,
        "disclaimer": "This analysis measures skill overlap against standard industry benchmarks. It is an educational tool and does not guarantee employment."
    }

@app.get("/api/matching/find-cofounders")
def find_cofounders_and_team(
    target_skill: Optional[str] = None,
    preferred_mode: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Ranks potential co-founders and team members with transparent matching rationale.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT u.id, u.full_name, u.location, u.profile_image, u.bio, u.is_verified,
               jp.education, jp.skills, jp.experience_level, jp.preferred_work_mode, jp.portfolio_url, jp.github_url, jp.career_interests
        FROM users u
        JOIN job_seeker_profiles jp ON u.id = jp.user_id
        WHERE u.role = 'job_seeker'
        """)
        candidates = cursor.fetchall()

        # If current user is an entrepreneur with required skills
        entrepreneur_skills_needed = []
        if current_user and current_user["role"] == "entrepreneur":
            cursor.execute("SELECT skills_needed FROM entrepreneur_profiles WHERE user_id = ?", (current_user["id"],))
            ep = cursor.fetchone()
            if ep and ep["skills_needed"]:
                entrepreneur_skills_needed = json.loads(ep["skills_needed"])

        ranked_candidates = []
        for c in candidates:
            if current_user and c["id"] == current_user["id"]:
                continue
            skills = json.loads(c["skills"]) if c.get("skills") else []
            c["skills"] = skills

            # Filter if requested
            if target_skill and target_skill.lower() not in [s.lower() for s in skills]:
                continue
            if preferred_mode and preferred_mode != "All" and c.get("preferred_work_mode") != preferred_mode:
                continue

            # Calculate match rationale
            overlap = []
            if entrepreneur_skills_needed:
                needed_lower = {s.lower(): s for s in entrepreneur_skills_needed}
                overlap = [s for s in skills if s.lower() in needed_lower]

            if overlap:
                score = round((len(overlap) / len(entrepreneur_skills_needed)) * 100)
                reason = f"Strong match: Candidate has demonstrated skills in {', '.join(overlap[:3])}, directly required for your startup."
            elif target_skill:
                score = 80
                reason = f"Relevant match: Candidate possesses your target filter skill '{target_skill}'."
            else:
                score = 50 + (len(skills) * 3)
                score = min(score, 90)
                reason = f"Candidate has verified proficiency in {len(skills)} skills ({', '.join(skills[:3])})."

            c["match_score"] = score
            c["match_reason"] = reason
            ranked_candidates.append(c)

        ranked_candidates.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_candidates

# ==========================================
# 6. INVESTOR DASHBOARD & INTEREST REQUESTS
# ==========================================

@app.post("/api/investors/saved-startups/{startup_id}")
def toggle_save_startup(
    startup_id: int,
    current_user: dict = Depends(require_role("investor", "admin"))
):
    user_id = current_user["id"]
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM saved_startups WHERE user_id = ? AND startup_id = ?", (user_id, startup_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("DELETE FROM saved_startups WHERE id = ?", (existing["id"],))
            return {"saved": False, "message": "Startup removed from saved list."}
        else:
            cursor.execute("INSERT INTO saved_startups (user_id, startup_id, created_at) VALUES (?, ?, ?)", (user_id, startup_id, now))
            return {"saved": True, "message": "Startup bookmarked successfully."}

@app.get("/api/investors/saved-startups")
def get_investor_saved_startups(current_user: dict = Depends(require_role("investor", "admin"))):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT s.*, ss.created_at as saved_at
        FROM saved_startups ss
        JOIN startups s ON ss.startup_id = s.id
        WHERE ss.user_id = ?
        ORDER BY ss.id DESC
        """, (current_user["id"],))
        rows = cursor.fetchall()
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
        return rows

@app.post("/api/investors/interests/{startup_id}", status_code=status.HTTP_201_CREATED)
def express_investor_interest(
    startup_id: int,
    payload: InvestorInterestRequest,
    current_user: dict = Depends(require_role("investor", "admin"))
):
    investor_id = current_user["id"]
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM startups WHERE id = ?", (startup_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Startup not found.")

        cursor.execute("SELECT id FROM investor_interests WHERE investor_id = ? AND startup_id = ?", (investor_id, startup_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You have already submitted an expression of interest for this startup.")

        cursor.execute("""
        INSERT INTO investor_interests (investor_id, startup_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Pending', ?, ?)
        """, (investor_id, startup_id, payload.message, now, now))
        new_id = cursor.lastrowid

    return {
        "id": new_id,
        "status": "Pending",
        "message": "Interest request sent to the startup founder."
    }

@app.get("/api/investors/my-interests")
def get_my_sent_interests(current_user: dict = Depends(require_role("investor", "admin"))):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT ii.*, s.name as startup_name, s.category, s.industry, s.stage, s.funding_requirement,
               u.full_name as founder_name, u.email as founder_email
        FROM investor_interests ii
        JOIN startups s ON ii.startup_id = s.id
        JOIN users u ON s.owner_id = u.id
        WHERE ii.investor_id = ?
        ORDER BY ii.id DESC
        """, (current_user["id"],))
        return cursor.fetchall()

@app.get("/api/startups/{startup_id}/interests")
def get_startup_interest_requests(
    startup_id: int,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id FROM startups WHERE id = ?", (startup_id,))
        startup = cursor.fetchone()
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found.")
        if startup["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to view interest requests for this startup.")

        cursor.execute("""
        SELECT ii.*, u.full_name as investor_name, u.email as investor_email, u.profile_image as investor_image,
               ip.investor_type, ip.areas_of_interest
        FROM investor_interests ii
        JOIN users u ON ii.investor_id = u.id
        LEFT JOIN investor_profiles ip ON u.id = ip.user_id
        WHERE ii.startup_id = ?
        ORDER BY ii.id DESC
        """, (startup_id,))
        return cursor.fetchall()

@app.put("/api/investors/interests/{interest_id}/status")
def respond_to_investor_interest(
    interest_id: int,
    payload: InvestorInterestStatusRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    if payload.status not in ["Accepted", "Declined"]:
        raise HTTPException(status_code=400, detail="Status must be 'Accepted' or 'Declined'.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT ii.id, s.owner_id
        FROM investor_interests ii
        JOIN startups s ON ii.startup_id = s.id
        WHERE ii.id = ?
        """, (interest_id,))
        interest = cursor.fetchone()
        if not interest:
            raise HTTPException(status_code=404, detail="Interest request not found.")
        if interest["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("UPDATE investor_interests SET status = ?, updated_at = ? WHERE id = ?", (payload.status, now, interest_id))
    return {"message": f"Interest request marked as {payload.status}."}

# ==========================================
# 7. CONNECTIONS & MESSAGING
# ==========================================

@app.post("/api/connections/request", status_code=status.HTTP_201_CREATED)
def send_connection_request(
    payload: ConnectionRequestPayload,
    current_user: dict = Depends(get_current_user)
):
    sender_id = current_user["id"]
    receiver_id = payload.receiver_id

    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="You cannot send a connection request to yourself.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, status FROM connections
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        """, (sender_id, receiver_id, receiver_id, sender_id))
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"A connection request already exists (status: {existing['status']}).")

        cursor.execute("""
        INSERT INTO connections (sender_id, receiver_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Pending', ?, ?)
        """, (sender_id, receiver_id, payload.message, now, now))
        new_id = cursor.lastrowid

    return {"id": new_id, "status": "Pending", "message": "Connection request sent successfully."}

@app.get("/api/connections")
def get_user_connections(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        # Accepted connections
        cursor.execute("""
        SELECT c.*,
               CASE WHEN c.sender_id = ? THEN u2.id ELSE u1.id END as peer_id,
               CASE WHEN c.sender_id = ? THEN u2.full_name ELSE u1.full_name END as peer_name,
               CASE WHEN c.sender_id = ? THEN u2.email ELSE u1.email END as peer_email,
               CASE WHEN c.sender_id = ? THEN u2.role ELSE u1.role END as peer_role,
               CASE WHEN c.sender_id = ? THEN u2.profile_image ELSE u1.profile_image END as peer_image,
               CASE WHEN c.sender_id = ? THEN u2.location ELSE u1.location END as peer_location
        FROM connections c
        JOIN users u1 ON c.sender_id = u1.id
        JOIN users u2 ON c.receiver_id = u2.id
        WHERE (c.sender_id = ? OR c.receiver_id = ?) AND c.status = 'Accepted'
        ORDER BY c.updated_at DESC
        """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        accepted = cursor.fetchall()

        # Incoming pending requests
        cursor.execute("""
        SELECT c.*, u.full_name as sender_name, u.email as sender_email, u.role as sender_role, u.profile_image as sender_image, u.location as sender_location
        FROM connections c
        JOIN users u ON c.sender_id = u.id
        WHERE c.receiver_id = ? AND c.status = 'Pending'
        ORDER BY c.id DESC
        """, (user_id,))
        incoming = cursor.fetchall()

        # Outgoing pending requests
        cursor.execute("""
        SELECT c.*, u.full_name as receiver_name, u.email as receiver_email, u.role as receiver_role, u.profile_image as receiver_image
        FROM connections c
        JOIN users u ON c.receiver_id = u.id
        WHERE c.sender_id = ? AND c.status = 'Pending'
        ORDER BY c.id DESC
        """, (user_id,))
        outgoing = cursor.fetchall()

    return {
        "accepted": accepted,
        "incoming": incoming,
        "outgoing": outgoing
    }

@app.put("/api/connections/{connection_id}/respond")
def respond_to_connection(
    connection_id: int,
    payload: ConnectionRespondPayload,
    current_user: dict = Depends(get_current_user)
):
    if payload.status not in ["Accepted", "Rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'Accepted' or 'Rejected'.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM connections WHERE id = ?", (connection_id,))
        conn_row = cursor.fetchone()
        if not conn_row:
            raise HTTPException(status_code=404, detail="Connection request not found.")
        if conn_row["receiver_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only respond to requests sent to you.")

        cursor.execute("UPDATE connections SET status = ?, updated_at = ? WHERE id = ?", (payload.status, now, connection_id))
    return {"message": f"Connection {payload.status.lower()}."}

@app.get("/api/messages/{peer_id}")
def get_messages(
    peer_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        # Verify they are accepted connections
        cursor.execute("""
        SELECT id FROM connections
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          AND status = 'Accepted'
        """, (user_id, peer_id, peer_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="You must be an accepted connection to exchange messages.")

        cursor.execute("""
        SELECT m.*, u.full_name as sender_name, u.profile_image as sender_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.id ASC
        """, (user_id, peer_id, peer_id, user_id))
        return cursor.fetchall()

@app.post("/api/messages/{peer_id}", status_code=status.HTTP_201_CREATED)
def send_message(
    peer_id: int,
    payload: MessagePayload,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id FROM connections
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          AND status = 'Accepted'
        """, (user_id, peer_id, peer_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="You must be an accepted connection to exchange messages.")

        cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?)
        """, (user_id, peer_id, payload.content, now))
        new_id = cursor.lastrowid
    return {"id": new_id, "content": payload.content, "created_at": now}

# ==========================================
# 8. MENTORS DIRECTORY & GUIDANCE REQUESTS
# (IMPORTANT: ZERO MENTOR FEEDBACK ENDPOINTS!)
# ==========================================

@app.get("/api/mentors")
def get_mentors(
    industry: Optional[str] = None,
    q: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM mentors WHERE 1=1"
        params = []
        if industry and industry != "All":
            query += " AND industry LIKE ?"
            params.append(f"%{industry}%")
        if q:
            query += " AND (name LIKE ? OR area_of_expertise LIKE ? OR areas_of_guidance LIKE ?)"
            wildcard = f"%{q}%"
            params.extend([wildcard, wildcard, wildcard])
        
        query += " ORDER BY id ASC"
        cursor.execute(query, tuple(params))
        return cursor.fetchall()

@app.get("/api/mentors/{mentor_id}")
def get_mentor_details(mentor_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM mentors WHERE id = ?", (mentor_id,))
        mentor = cursor.fetchone()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found.")
        return mentor

@app.post("/api/mentors/{mentor_id}/request-guidance", status_code=status.HTTP_201_CREATED)
def request_guidance(
    mentor_id: int,
    payload: MentorshipRequestPayload,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM mentors WHERE id = ?", (mentor_id,))
        mentor = cursor.fetchone()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found.")

        cursor.execute("""
        INSERT INTO mentorship_requests (user_id, mentor_id, topic, message, status, created_at)
        VALUES (?, ?, ?, ?, 'Pending', ?)
        """, (current_user["id"], mentor_id, payload.topic, payload.message, now))
        req_id = cursor.lastrowid

    return {
        "id": req_id,
        "status": "Pending",
        "mentor_name": mentor["name"],
        "message": f"Guidance request submitted to {mentor['name']}. They will be notified."
    }

@app.get("/api/mentors/my/requests")
def get_my_mentorship_requests(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT mr.*, m.name as mentor_name, m.area_of_expertise, m.avatar_url
        FROM mentorship_requests mr
        JOIN mentors m ON mr.mentor_id = m.id
        WHERE mr.user_id = ?
        ORDER BY mr.id DESC
        """, (current_user["id"],))
        return cursor.fetchall()

# ==========================================
# 9. TRUST & FRAUD PREVENTION (REPORTS)
# ==========================================

@app.post("/api/reports", status_code=status.HTTP_201_CREATED)
def submit_report(
    payload: ReportSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    if payload.target_type not in ["Job", "Profile", "Startup"]:
        raise HTTPException(status_code=400, detail="Invalid target type. Must be 'Job', 'Profile', or 'Startup'.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO reports (reporter_id, target_type, target_id, reason, details, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Pending Review', ?, ?)
        """, (current_user["id"], payload.target_type, payload.target_id, payload.reason, payload.details, now, now))
        report_id = cursor.lastrowid

    return {
        "id": report_id,
        "status": "Pending Review",
        "message": "Report submitted securely. Our trust & safety team will review it. Listings are cautiously verified before any action."
    }

@app.get("/api/reports/my")
def get_my_reports(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM reports WHERE reporter_id = ? ORDER BY id DESC
        """, (current_user["id"],))
        return cursor.fetchall()

@app.get("/api/admin/reports")
def get_admin_reports(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        ORDER BY r.id DESC
        """)
        return cursor.fetchall()

@app.put("/api/admin/reports/{report_id}/status")
def update_report_status(
    report_id: int,
    status_val: str = Query(..., pattern="^(Pending Review|Under Review|Resolved)$"),
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?", (status_val, now, report_id))
    return {"message": f"Report status updated to '{status_val}'."}
