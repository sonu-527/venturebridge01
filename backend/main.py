import os
import json
import urllib.parse
import re
from datetime import datetime
from typing import List, Optional, Any, Union, Tuple
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db, init_db
from seed_data import seed_all, ensure_admin
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
    try:
        ensure_admin()
    except Exception as e:
        print(f"Startup notice: Admin ensure check completed ({e})")

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

class ChatbotRequest(BaseModel):
    message: str
    target_role: Optional[str] = "Frontend Developer"
    missing_skills: Optional[List[str]] = []
    user_skills: Optional[List[str]] = []

class RatingSubmitRequest(BaseModel):
    target_type: str  # 'founder', 'investor'
    target_id: int
    rating: float
    review_text: Optional[str] = ""

class StartupCommentSubmitRequest(BaseModel):
    comment_text: str
    pros: Optional[str] = ""
    cons: Optional[str] = ""
    role_title: Optional[str] = "Team Member"

class NegotiationRoomCreateRequest(BaseModel):
    startup_id: int
    investor_id: int
    proposed_amount: float
    currency: Optional[str] = "INR"  # 'INR', 'USD'
    proposed_valuation: float
    proposed_equity: float
    milestones: Optional[str] = ""
    google_meet_link: Optional[str] = ""
    notes: Optional[str] = ""

class NegotiationCounterOfferRequest(BaseModel):
    proposed_amount: float
    currency: Optional[str] = "INR"
    proposed_valuation: float
    proposed_equity: float
    notes: Optional[str] = ""

class NegotiationMessageRequest(BaseModel):
    content: str
    message_type: Optional[str] = "text"

class GroupMeetingCreateRequest(BaseModel):
    opportunity_id: Optional[int] = None
    title: str
    agenda: Optional[str] = ""
    scheduled_at: str
    google_meet_url: str
    candidate_ids: List[int]

class MonthlyProgressReportRequest(BaseModel):
    startup_id: int
    investor_id: int
    reporting_month: str
    revenue: float = 0.0
    expenses: float = 0.0
    milestones_achieved: Optional[str] = ""
    challenges: Optional[str] = ""
    next_month_goals: Optional[str] = ""
    notes: Optional[str] = ""

class StartupFinancialsUpdateRequest(BaseModel):
    monthly_sales: Optional[List[dict]] = []
    unit_economics: Optional[dict] = {}
    financials_visibility: Optional[str] = "PUBLIC"  # 'PUBLIC', 'INVESTOR_ONLY'
    funding_currency: Optional[str] = "INR"

class StartupIdeaUpdateRequest(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    target_audience: Optional[str] = None
    industry: Optional[str] = None
    required_skills: Optional[List[str]] = None
    required_team_members: Optional[str] = None
    startup_stage: Optional[str] = None
    funding_requirements: Optional[str] = None
    visibility: Optional[str] = None
    monthly_sales: Optional[List[dict]] = None
    unit_economics: Optional[dict] = None

class MeetingCreateRequest(BaseModel):
    recipient_id: int
    title: str
    purpose: Optional[str] = ""
    meeting_date: str  # "YYYY-MM-DD"
    start_time: str    # "HH:MM"
    duration_minutes: Optional[int] = 30
    time_zone: Optional[str] = "UTC"
    agenda: Optional[str] = ""
    google_meet_url: Optional[str] = None

class MeetingRespondRequest(BaseModel):
    status: str  # 'Approved' or 'Rejected'
    google_meet_url: Optional[str] = None
    response_note: Optional[str] = ""

class MeetingUpdateDetailsRequest(BaseModel):
    title: Optional[str] = None
    purpose: Optional[str] = None
    meeting_date: Optional[str] = None
    start_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    time_zone: Optional[str] = None
    agenda: Optional[str] = None
    google_meet_url: Optional[str] = None

class MeetingLinkRequest(BaseModel):
    google_meet_url: str

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

SKILL_IMPORTANCE_MAP = {
    "React": "Core frontend UI library for building reactive, component-driven web interfaces.",
    "TypeScript": "Enforces static typing to eliminate runtime bugs and improve codebase scalability.",
    "Python": "Standard backend language for rapid API development, data pipelines, and automation.",
    "FastAPI": "High-performance Python web framework for async REST APIs with automatic OpenAPI docs.",
    "SQL": "Foundational relational query language for structured database persistence and indexing.",
    "Tailwind CSS": "Modern utility-first CSS framework for clean, responsive design systems.",
    "Git": "Essential distributed version control system for branch management and pull requests.",
    "REST APIs": "Standard architectural protocol for client-server JSON communication and HTTP methods.",
    "State Management": "Crucial for predictable shared state across multi-step reactive web components.",
    "Database Design": "Ensures normalized data schemas, relational integrity, and indexing performance.",
    "Docker": "Containerization platform ensuring identical dev, staging, and production environments.",
    "Authentication & Security": "Secures credentials with PBKDF2/bcrypt hashing and safeguards routes via JWT.",
    "Pandas": "High-performance data manipulation and analysis library for structured tabular datasets.",
    "NumPy": "Fundamental package for scientific computing, N-dimensional arrays, and vector math.",
    "Data Visualization": "Communicates complex data trends through interactive charts, graphs, and dashboards.",
    "Figma": "Collaborative interface design tool for wireframes, component design systems, and prototypes.",
    "UI/UX": "Applies user-centered design, usability heuristics, typography, and accessibility standards.",
    "User Research": "Validates market assumptions through qualitative interviews and usability observations.",
    "Responsive Design": "Ensures visual hierarchy and fluid layouts render cleanly across all device widths.",
    "PostgreSQL/SQLite": "Relational database engines providing ACID transaction safety and query reliability."
}

SKILL_PROJECT_MAP = {
    "React": "Build a responsive task management board with filter tabs and local storage persistence.",
    "TypeScript": "Refactor a vanilla JavaScript utility library to use strict typed interfaces and generics.",
    "Python": "Build a command-line automated scraper or batch data processing script with logging.",
    "FastAPI": "Develop a lightweight REST API with Pydantic schemas, validation, and JWT authentication.",
    "SQL": "Design an e-commerce schema with foreign keys and write multi-table aggregate JOIN queries.",
    "Tailwind CSS": "Design a clean, minimal marketing landing page with responsive breakpoints.",
    "Git": "Create a repository with feature branches, descriptive commit messages, and a clean rebase.",
    "REST APIs": "Implement and document endpoints supporting GET, POST, PUT, and DELETE operations.",
    "Docker": "Containerize a web app with a multi-stage Dockerfile and run it locally with docker-compose."
}

def get_skill_learning_resource(skill: str, target_role: str = "Software Developer") -> dict:
    clean_skill = skill.strip()
    encoded_query = urllib.parse.quote_plus(f"learn {clean_skill} tutorial for beginners {target_role}")
    youtube_url = f"https://www.youtube.com/results?search_query={encoded_query}"
    importance = SKILL_IMPORTANCE_MAP.get(
        clean_skill,
        f"Key competency for {target_role} roles, enabling robust implementation and industry best practices."
    )
    practice_project = SKILL_PROJECT_MAP.get(
        clean_skill,
        f"Build a focused hands-on portfolio feature demonstrating practical use of {clean_skill}."
    )
    return {
        "skill": clean_skill,
        "importance": importance,
        "youtube_url": youtube_url,
        "practice_project": practice_project
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

@app.get("/api/startups/top10")
def get_top_10_startups(
    criteria: str = Query("all", pattern="^(all|high_profit|social_welfare|student_led|deep_tech)$"),
    stage: Optional[str] = None,
    industry: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, u.full_name as owner_name, u.email as owner_email, u.profile_image as owner_image, u.bio as owner_bio,
                   (SELECT AVG(rating) FROM ratings WHERE target_type = 'founder' AND target_id = s.owner_id) as founder_rating,
                   (SELECT COUNT(*) FROM ratings WHERE target_type = 'founder' AND target_id = s.owner_id) as founder_ratings_count
            FROM startups s
            JOIN users u ON s.owner_id = u.id
            WHERE 1=1
        """)
        rows = cursor.fetchall()

        ranked_list = []
        for r in rows:
            r["required_skills"] = json.loads(r["required_skills"]) if r.get("required_skills") else []
            r["monthly_sales"] = json.loads(r["monthly_sales_json"]) if r.get("monthly_sales_json") else []
            r["unit_economics"] = json.loads(r["unit_economics_json"]) if r.get("unit_economics_json") else None

            # Calculate latest monthly revenue / profit
            latest_revenue = 0.0
            latest_profit = 0.0
            if r["monthly_sales"]:
                latest = r["monthly_sales"][-1]
                latest_revenue = float(latest.get("revenue", 0))
                latest_profit = float(latest.get("profit", 0))

            r["latest_monthly_revenue"] = latest_revenue
            r["latest_monthly_profit"] = latest_profit

            # Filter stages / industry if provided
            if stage and stage != "All" and r.get("stage") != stage:
                continue
            if industry and industry != "All" and r.get("industry") != industry:
                continue

            # Evaluate match against selected criteria
            score = 50.0
            ranking_reason = "Strong candidate startup evaluated across operational traction and stage readiness."
            evidence = f"Stage: {r.get('stage')}, Industry: {r.get('industry')}"
            is_reported = bool(r["monthly_sales"])

            if criteria == "high_profit":
                if latest_profit > 0 or latest_revenue > 0:
                    score = 70.0 + min(30.0, (latest_profit / 10000.0))
                    ranking_reason = f"Reported monthly profit of ₹{int(latest_profit):,} on monthly revenue of ₹{int(latest_revenue):,}."
                    evidence = f"Reported historical sales metrics ({len(r['monthly_sales'])} months verified)."
                else:
                    score = 40.0
                    ranking_reason = "Early-stage prototype with unit economics targeting high gross margins."
                    evidence = "Targeted financial model from startup pitch."
            elif criteria == "social_welfare":
                is_social = r.get("category") == "Social Welfare Startups" or any(w in (r.get("industry") + r.get("description")).lower() for w in ["clean", "eco", "waste", "rural", "health", "farm", "community"])
                if is_social:
                    score = 90.0 + (len(r["required_skills"]) * 1.5)
                    ranking_reason = "Mission-aligned with sustainable community development, social equity, or ecological impact."
                    evidence = f"Categorized under {r.get('category')} / {r.get('industry')}."
                else:
                    continue  # Only social welfare startups
            elif criteria == "student_led":
                is_student = "student" in (r.get("description") + r.get("owner_bio", "")).lower() or r.get("stage") in ["Idea Phase", "MVP / Prototype"]
                if is_student:
                    score = 85.0
                    ranking_reason = "Founded by university students or recent graduates with rapid prototype iteration."
                    evidence = "Founder background verified from registered academic profile."
                else:
                    score = 45.0
                    ranking_reason = "Early-stage startup with entry-level team size."
                    evidence = f"Team size: {r.get('team_size', 1)}."
            elif criteria == "deep_tech":
                deep_skills = ["ai", "machine learning", "iot", "python", "fastapi", "gis", "embedded", "robotics"]
                matches = [s for s in r["required_skills"] if any(d in s.lower() for d in deep_skills)]
                if matches:
                    score = 75.0 + (len(matches) * 5)
                    ranking_reason = f"Proprietary deep-tech architecture utilizing {', '.join(matches[:3])}."
                    evidence = f"Verified deep-tech competency requirements: {', '.join(matches)}."
                else:
                    score = 50.0
                    ranking_reason = "Standard software product stack."
                    evidence = f"Skills: {', '.join(r['required_skills'][:3])}."
            else: # 'all'
                score = 60.0 + (r.get("funding_raised", 0) / 50000.0) + (r["founder_rating"] or 0) * 5

            r["ranking_score"] = round(score, 1)
            r["ranking_reason"] = ranking_reason
            r["ranking_evidence"] = evidence
            r["is_reported_metric"] = is_reported

            # Clean Google Meet link for investor
            slug = re.sub(r"[^\w-]", "", r["name"].lower().replace(" ", "-"))[:15]
            r["google_meet_url"] = f"https://meet.google.com/vb-{slug}-{r['id']}"

            ranked_list.append(r)

        # Sort descending by ranking_score and take top 10
        ranked_list.sort(key=lambda x: x["ranking_score"], reverse=True)
        top10 = ranked_list[:10]

        for idx, item in enumerate(top10, 1):
            item["rank"] = idx

        return {
            "criteria": criteria,
            "total_matches": len(ranked_list),
            "startups": top10
        }

@app.get("/api/startups/{startup_id}")
def get_startup_details(
    startup_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
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

        # Parse financials
        sales = json.loads(startup["monthly_sales_json"]) if startup.get("monthly_sales_json") else []
        econ = json.loads(startup["unit_economics_json"]) if startup.get("unit_economics_json") else None

        # Check visibility protection
        vis = startup.get("financials_visibility") or "PUBLIC"
        is_owner = current_user and current_user["id"] == startup["owner_id"]
        is_investor_or_admin = current_user and current_user["role"] in ["investor", "admin"]

        if vis == "INVESTOR_ONLY" and not (is_owner or is_investor_or_admin):
            startup["monthly_sales"] = []
            startup["unit_economics"] = None
            startup["financials_restricted"] = True
        else:
            startup["monthly_sales"] = sales
            startup["unit_economics"] = econ
            startup["financials_restricted"] = False

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
        # Verify opportunity exists
        cursor.execute("SELECT * FROM opportunities WHERE id = ?", (opp_id,))
        opp = cursor.fetchone()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found.")

        # Check for duplicate application
        cursor.execute("SELECT id FROM applications WHERE opportunity_id = ? AND user_id = ?", (opp_id, user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You have already submitted an application for this opportunity.")

        # Mandatory 50% Skill-Match Eligibility Rule
        req_skills = json.loads(opp["required_skills"]) if opp.get("required_skills") else []
        if req_skills:
            cursor.execute("SELECT skills FROM job_seeker_profiles WHERE user_id = ?", (user_id,))
            jsp = cursor.fetchone()
            user_skills = []
            if jsp and jsp.get("skills"):
                user_skills = [s.strip().lower() for s in json.loads(jsp["skills"])]
            
            total_req = len(req_skills)
            matched = [s for s in req_skills if s.strip().lower() in user_skills]
            missing = [s for s in req_skills if s.strip().lower() not in user_skills]
            match_percent = round((len(matched) / total_req) * 100) if total_req > 0 else 100

            # Strictly enforce: Below 50% job-specific skill match rejected; exactly 50% and above allowed
            if match_percent < 50:
                missing_str = ", ".join(missing) if missing else "None"
                raise HTTPException(
                    status_code=400,
                    detail=f"Application blocked: Your job-specific skill match is {match_percent}%, which is below the mandatory 50% threshold. You matched {len(matched)} of {total_req} required skills. Missing skills: {missing_str}. Please improve your skills via Think & Grow before applying."
                )

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
    
    # Priority recommendations with YouTube resources and practice projects
    recommendations = []
    for skill in missing[:3]:
        res = get_skill_learning_resource(skill, payload.target_role)
        recommendations.append({
            "skill": skill,
            "priority": "High Priority",
            "suggested_action": f"Build a focused portfolio project demonstrating practical use of {skill}.",
            "importance": res["importance"],
            "youtube_url": res["youtube_url"],
            "practice_project": res["practice_project"]
        })
    for skill in missing[3:5]:
        res = get_skill_learning_resource(skill, payload.target_role)
        recommendations.append({
            "skill": skill,
            "priority": "Medium Priority",
            "suggested_action": f"Review documentation, best practices, and complete hands-on tutorials for {skill}.",
            "importance": res["importance"],
            "youtube_url": res["youtube_url"],
            "practice_project": res["practice_project"]
        })

    # Curated resources for all missing skills
    learning_resources = [get_skill_learning_resource(skill, payload.target_role) for skill in missing]

    return {
        "target_role": payload.target_role,
        "total_benchmark_skills": total,
        "matched_skills": matched,
        "missing_skills": missing,
        "progress_percent": progress_pct,
        "recommended_priorities": recommendations,
        "learning_resources": learning_resources,
        "disclaimer": "This analysis measures skill overlap against standard industry benchmarks. It is an educational tool and does not guarantee employment."
    }

@app.post("/api/learning/chatbot")
def think_and_grow_chatbot(payload: ChatbotRequest):
    """
    Think & Grow AI Career Assistant.
    Provides targeted guidance on missing skills, learning roadmaps, practice tasks, and YouTube resources.
    Uses AI provider if configured in environment, with guaranteed deterministic fallback.
    """
    user_msg = payload.message.strip()
    target_role = payload.target_role or "Full Stack Developer"
    missing = payload.missing_skills or []
    user_skills = payload.user_skills or []

    # High-quality deterministic fallback response
    msg_lower = user_msg.lower()
    
    if "roadmap" in msg_lower or "sequence" in msg_lower or "order" in msg_lower or "start" in msg_lower:
        plan_steps = []
        for idx, sk in enumerate(missing[:4], 1):
            resource = get_skill_learning_resource(sk, target_role)
            plan_steps.append(
                f"**Step {idx}: {sk}**\n- *Why it matters:* {resource['importance']}\n- *Practice task:* {resource['practice_project']}\n- [Watch Tutorial on YouTube]({resource['youtube_url']})"
            )
        reply = (
            f"### Recommended Learning Roadmap for {target_role}\n\n"
            f"Here is your structured beginner-to-advanced sequence to bridge your {len(missing)} missing skill(s):\n\n"
            + "\n\n".join(plan_steps if plan_steps else ["You have already mastered all benchmark skills for this track!"]) +
            "\n\n> **Tip:** After practicing each skill, update your profile skills. When your match reaches 50% or above on specific job listings, your applications will unlock automatically!"
        )
    elif "project" in msg_lower or "practice" in msg_lower or "task" in msg_lower:
        projects = []
        for sk in missing[:3]:
            res = get_skill_learning_resource(sk, target_role)
            projects.append(f"• **{sk} Project**: {res['practice_project']} ([Tutorials]({res['youtube_url']}))")
        if not projects:
            projects.append(f"• **Capstone Project**: Build an end-to-end MVP showcasing {', '.join(user_skills[:3]) if user_skills else 'your core skills'}.")
        reply = (
            f"### Hands-On Portfolio Projects for {target_role}\n\n"
            "The fastest way to demonstrate competency to founders is with small, focused deliverables:\n\n"
            + "\n".join(projects) +
            "\n\nOnce completed, add the repo link to your profile portfolio to strengthen your applications."
        )
    else:
        resources_list = []
        for sk in missing[:3]:
            res = get_skill_learning_resource(sk, target_role)
            resources_list.append(f"• **{sk}**: {res['importance']} — [YouTube Learning Link]({res['youtube_url']})")
        reply = (
            f"### Think & Grow Learning Insights for {target_role}\n\n"
            f"To increase your qualification for {target_role} roles, focus on these top priority skills:\n\n"
            + ("\n".join(resources_list) if resources_list else f"You currently match key requirements for {target_role}! Continue building projects.") +
            f"\n\n**Key Rule:** VentureBridge requires a **50% deterministic skill match** on your registered profile before applications can be submitted. This guarantees founders receive qualified candidates while helping you grow systematically."
        )

    return {
        "reply": reply,
        "target_role": target_role,
        "missing_skills": missing,
        "resources": [get_skill_learning_resource(sk, target_role) for sk in missing[:5]],
        "is_ai_fallback": True
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
    current_user: dict = Depends(require_role("entrepreneur", "investor", "admin"))
):
    allowed_statuses = ["Accepted", "Declined", "Investment Proposed", "Investment Confirmed", "Active Partnership"]
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(allowed_statuses)}.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT ii.id, ii.investor_id, s.owner_id
        FROM investor_interests ii
        JOIN startups s ON ii.startup_id = s.id
        WHERE ii.id = ?
        """, (interest_id,))
        interest = cursor.fetchone()
        if not interest:
            raise HTTPException(status_code=404, detail="Interest request not found.")

        is_owner = current_user["id"] == interest["owner_id"]
        is_investor = current_user["id"] == interest["investor_id"]
        is_admin = current_user["role"] == "admin"

        if not (is_owner or is_investor or is_admin):
            raise HTTPException(status_code=403, detail="Unauthorized.")

        if not is_owner and not is_admin and payload.status in ["Accepted", "Declined"]:
            raise HTTPException(status_code=403, detail="Only the startup founder can Accept or Decline initial interest requests.")

        cursor.execute("UPDATE investor_interests SET status = ?, updated_at = ? WHERE id = ?", (payload.status, now, interest_id))
    return {"status": payload.status, "message": f"Interest request marked as {payload.status}."}

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
def get_admin_reports(current_user: dict = Depends(require_role("admin"))):
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
    current_user: dict = Depends(require_role("admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?", (status_val, now, report_id))
    return {"message": f"Report status updated to '{status_val}'."}

# ========================================================
# UPGRADE FEATURES: RATINGS, REVIEWS, TOP-10, NEGOTIATION,
# FINANCIALS, GROUP MEETINGS, PROGRESS REPORTS & FUNDRAISING
# ========================================================

def parse_currency_amount(val_str: Any) -> float:
    """Safely extracts numeric monetary amount from text strings like '$250,000' or '₹15,00,000' or numeric inputs."""
    if val_str is None:
        return 0.0
    if isinstance(val_str, (int, float)):
        return float(val_str)
    import re
    cleaned = re.sub(r"[^\d.]", "", str(val_str))
    try:
        val = float(cleaned)
        return val if val > 0 else 0.0
    except Exception:
        return 0.0

def record_confirmed_investment(startup_id: int, investor_id: int, source_type: str, source_id: int, amount: float, currency: str = "INR"):
    """Idempotently records a confirmed investment and increments startup funding raised."""
    if amount <= 0:
        return
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM confirmed_investments WHERE source_type = ? AND source_id = ?", (source_type, source_id))
        if cursor.fetchone():
            return  # Already recorded, strictly avoid double counting!
        
        cursor.execute("""
            INSERT INTO confirmed_investments (startup_id, investor_id, source_type, source_id, amount, currency, confirmed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (startup_id, investor_id, source_type, source_id, amount, currency, now))
        
        cursor.execute("""
            UPDATE startups
            SET funding_raised = COALESCE(funding_raised, 0.0) + ?,
                funding_currency = ?,
                updated_at = ?
            WHERE id = ?
        """, (amount, currency, now, startup_id))

# --------------------------------------------------------
# 1. FOUNDER & INVESTOR RATINGS
# --------------------------------------------------------

@app.post("/api/ratings")
def submit_rating(
    payload: RatingSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    if payload.target_type not in ["founder", "investor", "startup"]:
        raise HTTPException(status_code=400, detail="Target type must be 'founder', 'investor', or 'startup'.")
    if payload.rating < 1.0 or payload.rating > 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0 stars.")

    # Rule 4: Investor access to startup reviews must be read-only!
    if current_user["role"] == "investor" and payload.target_type == "startup":
        raise HTTPException(status_code=403, detail="Investors have read-only access to startup reviews and cannot submit ratings.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        target_user = None

        if payload.target_type == "investor":
            # Check users table first
            cursor.execute("SELECT id, role, full_name FROM users WHERE id = ?", (payload.target_id,))
            target_user = cursor.fetchone()
            # If not found or not investor, check investor_profiles table by ID
            if not target_user or target_user["role"] != "investor":
                cursor.execute("SELECT user_id FROM investor_profiles WHERE id = ?", (payload.target_id,))
                ip_row = cursor.fetchone()
                if ip_row:
                    cursor.execute("SELECT id, role, full_name FROM users WHERE id = ?", (ip_row["user_id"],))
                    target_user = cursor.fetchone()
            if not target_user:
                raise HTTPException(status_code=404, detail="Target investor not found.")
            target_user_id = target_user["id"]

            # Rule 1: Investors must not be able to rate their own investor profiles!
            if current_user["role"] == "investor" and target_user_id == current_user["id"]:
                raise HTTPException(status_code=403, detail="Investors cannot rate their own investor profile.")
            if current_user["id"] == target_user_id or current_user["id"] == payload.target_id:
                raise HTTPException(status_code=403, detail="You cannot rate your own profile.")

        elif payload.target_type == "founder":
            cursor.execute("SELECT id, role, full_name FROM users WHERE id = ?", (payload.target_id,))
            target_user = cursor.fetchone()
            if not target_user or target_user["role"] != "entrepreneur":
                cursor.execute("SELECT user_id FROM entrepreneur_profiles WHERE id = ?", (payload.target_id,))
                ep_row = cursor.fetchone()
                if ep_row:
                    cursor.execute("SELECT id, role, full_name FROM users WHERE id = ?", (ep_row["user_id"],))
                    target_user = cursor.fetchone()
            if not target_user:
                raise HTTPException(status_code=404, detail="Target founder not found.")
            target_user_id = target_user["id"]

            if current_user["id"] == target_user_id or current_user["id"] == payload.target_id:
                raise HTTPException(status_code=403, detail="You cannot rate your own profile.")

        else: # startup
            cursor.execute("SELECT id, owner_id FROM startups WHERE id = ?", (payload.target_id,))
            st_target = cursor.fetchone()
            if not st_target:
                raise HTTPException(status_code=404, detail="Target startup not found.")
            if current_user["id"] == st_target["owner_id"]:
                raise HTTPException(status_code=403, detail="Founders cannot rate their own startups.")
            target_user_id = payload.target_id

        # Upsert rating
        cursor.execute("""
            SELECT id FROM ratings WHERE rater_id = ? AND target_type = ? AND target_id = ?
        """, (current_user["id"], payload.target_type, target_user_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("""
                UPDATE ratings
                SET rating = ?, review_text = ?, updated_at = ?
                WHERE id = ?
            """, (payload.rating, payload.review_text, now, existing["id"]))
        else:
            cursor.execute("""
                INSERT INTO ratings (rater_id, target_type, target_id, rating, review_text, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (current_user["id"], payload.target_type, target_user_id, payload.rating, payload.review_text, now, now))

        # Calculate new average
        cursor.execute("""
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_count
            FROM ratings
            WHERE target_type = ? AND target_id = ?
        """, (payload.target_type, target_user_id))
        stats = cursor.fetchone()
        avg_rating = round(float(stats["avg_rating"]), 1) if stats["avg_rating"] is not None else 0.0
        total_count = stats["total_count"]

    return {
        "message": "Rating submitted successfully.",
        "average_rating": avg_rating,
        "total_ratings": total_count,
        "user_rating": payload.rating
    }

@app.delete("/api/ratings/{rating_id}")
def delete_rating(
    rating_id: int,
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ratings WHERE id = ?", (rating_id,))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Rating not found.")

        # Target profile owner (investor or founder) CANNOT delete ratings left on their profile!
        if r["rater_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: You can only delete ratings that you submitted. Profile owners cannot delete reviews on their own profile."
            )

        cursor.execute("DELETE FROM ratings WHERE id = ?", (rating_id,))

    return {"message": "Rating deleted successfully."}

@app.get("/api/ratings/{target_type}/{target_id}")
def get_user_ratings(
    target_type: str,
    target_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    if target_type not in ["founder", "investor", "startup"]:
        raise HTTPException(status_code=400, detail="Target type must be 'founder', 'investor', or 'startup'.")

    with get_db() as conn:
        cursor = conn.cursor()
        # Resolve target_id if needed
        real_target_id = target_id
        if target_type == "investor":
            cursor.execute("SELECT user_id FROM investor_profiles WHERE id = ?", (target_id,))
            ip = cursor.fetchone()
            if ip:
                real_target_id = ip["user_id"]
        elif target_type == "founder":
            cursor.execute("SELECT user_id FROM entrepreneur_profiles WHERE id = ?", (target_id,))
            ep = cursor.fetchone()
            if ep:
                real_target_id = ep["user_id"]

        cursor.execute("""
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_count
            FROM ratings
            WHERE target_type = ? AND (target_id = ? OR target_id = ?)
        """, (target_type, target_id, real_target_id))
        stats = cursor.fetchone()

        avg_rating = round(float(stats["avg_rating"]), 1) if stats and stats["avg_rating"] is not None else 0.0
        total_count = stats["total_count"] if stats else 0

        # Star breakdown
        cursor.execute("""
            SELECT CAST(ROUND(rating) as INTEGER) as star, COUNT(*) as cnt
            FROM ratings
            WHERE target_type = ? AND (target_id = ? OR target_id = ?)
            GROUP BY star
        """, (target_type, target_id, real_target_id))
        breakdown_rows = cursor.fetchall()
        breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for b in breakdown_rows:
            st = int(b["star"])
            if st in breakdown:
                breakdown[st] = b["cnt"]

        # User's own rating if authenticated
        user_rating = None
        if current_user:
            cursor.execute("""
                SELECT rating, review_text FROM ratings
                WHERE rater_id = ? AND target_type = ? AND (target_id = ? OR target_id = ?)
            """, (current_user["id"], target_type, target_id, real_target_id))
            user_row = cursor.fetchone()
            if user_row:
                user_rating = user_row["rating"]

        # Fetch recent reviews
        cursor.execute("""
            SELECT r.id, r.rating, r.review_text, r.created_at, u.full_name as rater_name, u.role as rater_role
            FROM ratings r
            JOIN users u ON r.rater_id = u.id
            WHERE r.target_type = ? AND (r.target_id = ? OR r.target_id = ?)
            ORDER BY r.id DESC LIMIT 10
        """, (target_type, target_id, real_target_id))
        reviews = cursor.fetchall()

    return {
        "target_type": target_type,
        "target_id": target_id,
        "average_rating": avg_rating,
        "total_ratings": total_count,
        "display": f"{avg_rating} / 5.0" if total_count > 0 else "Not yet rated",
        "breakdown": breakdown,
        "user_rating": user_rating,
        "recent_reviews": reviews
    }

# --------------------------------------------------------
# 2. EMPLOYEE EXPERIENCE COMMENTS ON STARTUPS
# --------------------------------------------------------

@app.post("/api/startups/{startup_id}/comments", status_code=status.HTTP_201_CREATED)
def submit_startup_comment(
    startup_id: int,
    payload: StartupCommentSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    # Rule 4: Investor access to startup reviews must be read-only!
    if current_user["role"] == "investor":
        raise HTTPException(
            status_code=403,
            detail="Investors have read-only access to startup reviews and cannot submit experience comments."
        )

    clean_text = payload.comment_text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        # Verify startup exists
        cursor.execute("SELECT id, owner_id FROM startups WHERE id = ?", (startup_id,))
        startup = cursor.fetchone()
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found.")

        # Determine verification status:
        cursor.execute("""
            SELECT a.id FROM applications a
            JOIN opportunities o ON a.opportunity_id = o.id
            WHERE o.startup_id = ? AND a.user_id = ?
        """, (startup_id, current_user["id"]))
        has_applied = cursor.fetchone() is not None

        cursor.execute("""
            SELECT id FROM connections
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
              AND status = 'Accepted'
        """, (current_user["id"], startup["owner_id"], startup["owner_id"], current_user["id"]))
        is_connected = cursor.fetchone() is not None

        if has_applied or is_connected or current_user["id"] == startup["owner_id"]:
            is_verified = 1
            status_label = "Verified Employment / Candidate"
        else:
            is_verified = 0
            status_label = "Unverified Community Experience"

        cursor.execute("""
            INSERT INTO startup_comments (startup_id, user_id, comment_text, pros, cons, role_title, employment_status, is_verified_employee, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            startup_id, current_user["id"], clean_text,
            payload.pros.strip() if payload.pros else "",
            payload.cons.strip() if payload.cons else "",
            payload.role_title.strip() if payload.role_title else "Team Member",
            status_label, is_verified, now, now
        ))
        new_id = cursor.lastrowid

    return {
        "id": new_id,
        "message": "Experience review submitted successfully.",
        "employment_status": status_label,
        "is_verified_employee": bool(is_verified)
    }

@app.get("/api/startups/{startup_id}/comments")
def get_startup_comments(startup_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.full_name as author_name, u.role as author_role, u.profile_image as author_image
            FROM startup_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.startup_id = ?
            ORDER BY c.id DESC
        """, (startup_id,))
        return cursor.fetchall()

@app.delete("/api/startups/comments/{comment_id}")
def delete_startup_comment(
    comment_id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "investor":
        raise HTTPException(
            status_code=403,
            detail="Investors have read-only access to startup reviews and cannot delete comments."
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM startup_comments WHERE id = ?", (comment_id,))
        comment = cursor.fetchone()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found.")
        if comment["user_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Only the comment author or platform administrator can delete this comment."
            )
        cursor.execute("DELETE FROM startup_comments WHERE id = ?", (comment_id,))
    return {"message": "Comment deleted successfully."}


# --------------------------------------------------------
# 4. EMPLOYER TOP-10 CANDIDATE SHORTLIST (80/20 FORMULA)
# --------------------------------------------------------

@app.get("/api/matching/top-candidates/{opportunity_id}")
def get_top_candidates_for_opportunity(
    opportunity_id: int,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM opportunities WHERE id = ?", (opportunity_id,))
        opp = cursor.fetchone()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found.")

        req_skills = json.loads(opp["required_skills"]) if opp.get("required_skills") else []
        req_skills_lower = [s.strip().lower() for s in req_skills]

        # Fetch all job seekers with profiles
        cursor.execute("""
            SELECT u.id, u.full_name, u.email, u.profile_image, u.location, u.is_verified,
                   jp.education, jp.skills, jp.experience_level, jp.preferred_work_mode,
                   jp.portfolio_url, jp.github_url, jp.cgpa, jp.academic_percentage
            FROM users u
            JOIN job_seeker_profiles jp ON u.id = jp.user_id
            WHERE u.role = 'job_seeker'
        """)
        candidates = cursor.fetchall()

        ranked_candidates = []
        for c in candidates:
            c_skills = json.loads(c["skills"]) if c.get("skills") else []
            c_skills_lower = [s.strip().lower() for s in c_skills]

            # 1. 80% Skill Match Calculation
            total_req = len(req_skills_lower)
            matched = [s for s in req_skills if s.strip().lower() in c_skills_lower]
            missing = [s for s in req_skills if s.strip().lower() not in c_skills_lower]
            skill_match_pct = round((len(matched) / total_req) * 100) if total_req > 0 else 100

            # 2. 20% Education Score Normalization (0 - 100)
            cgpa = c.get("cgpa")
            academic_pct = c.get("academic_percentage")
            has_academic_data = True

            if cgpa is not None and cgpa > 0:
                # CGPA scale out of 10
                education_score = min(100.0, round((float(cgpa) / 10.0) * 100.0, 1))
                education_status = f"Verified CGPA: {cgpa} / 10"
            elif academic_pct is not None and academic_pct > 0:
                education_score = min(100.0, round(float(academic_pct), 1))
                education_status = f"Reported Academic Score: {academic_pct}%"
            else:
                has_academic_data = False
                education_score = 50.0  # Explicit documented neutral fallback
                education_status = "Education data incomplete"

            # 3. Exact 80% Skills + 20% Education Formula:
            # Candidate Score = (0.80 × Skills Match %) + (0.20 × Education Score %)
            composite_score = round((0.80 * skill_match_pct) + (0.20 * education_score), 1)

            c["skills"] = c_skills
            c["matched_skills"] = matched
            c["missing_skills"] = missing
            c["skill_match_score"] = skill_match_pct
            c["education_score"] = education_score
            c["composite_score"] = composite_score
            c["education_status"] = education_status
            c["has_academic_data"] = has_academic_data
            c["is_eligible_under_50_rule"] = skill_match_pct >= 50
            c["explanation"] = f"Composite Score: (80% × {skill_match_pct}%) + (20% × {education_score}%) = {composite_score}% ({education_status})."

            ranked_candidates.append(c)

        # Sort descending by composite_score
        ranked_candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        top10 = ranked_candidates[:10]
        for idx, item in enumerate(top10, 1):
            item["rank"] = idx

        return {
            "opportunity_id": opportunity_id,
            "opportunity_title": opp["title"],
            "required_skills": req_skills,
            "formula": "Candidate Score = (0.80 × Skills Match %) + (0.20 × Education Score %)",
            "top_candidates": top10
        }

# --------------------------------------------------------
# 5. GROUP DISCUSSION (GD) MEETINGS FOR EMPLOYERS
# --------------------------------------------------------

@app.post("/api/meetings/group-discussion", status_code=status.HTTP_201_CREATED)
def schedule_group_meeting(
    payload: GroupMeetingCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Meeting title is required.")
    if not payload.google_meet_url.strip():
        raise HTTPException(status_code=400, detail="Google Meet URL is required.")
    if not payload.candidate_ids:
        raise HTTPException(status_code=400, detail="Please select at least one candidate for the group discussion.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO group_meetings (employer_id, opportunity_id, title, agenda, scheduled_at, google_meet_url, candidate_ids_json, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
        """, (
            current_user["id"],
            payload.opportunity_id,
            payload.title.strip(),
            payload.agenda.strip() if payload.agenda else "",
            payload.scheduled_at,
            payload.google_meet_url.strip(),
            json.dumps(payload.candidate_ids),
            now
        ))
        new_id = cursor.lastrowid

    return {
        "id": new_id,
        "message": f"Group Discussion scheduled with {len(payload.candidate_ids)} candidates.",
        "google_meet_url": payload.google_meet_url.strip(),
        "scheduled_at": payload.scheduled_at
    }

@app.get("/api/meetings/group/my")
def get_my_group_meetings(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*, u.full_name as employer_name, u.email as employer_email, o.title as opportunity_title
            FROM group_meetings m
            JOIN users u ON m.employer_id = u.id
            LEFT JOIN opportunities o ON m.opportunity_id = o.id
            ORDER BY m.id DESC
        """)
        rows = cursor.fetchall()
        my_meetings = []
        for r in rows:
            c_ids = json.loads(r["candidate_ids_json"]) if r.get("candidate_ids_json") else []
            if r["employer_id"] == user_id or user_id in c_ids or current_user["role"] == "admin":
                r["candidate_ids"] = c_ids
                my_meetings.append(r)
        return my_meetings

# --------------------------------------------------------
# 6. STARTUP FINANCIALS & IDEA EDITING
# --------------------------------------------------------

@app.put("/api/ideas/{idea_id}")
def update_startup_idea(
    idea_id: int,
    payload: StartupIdeaUpdateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM startup_ideas WHERE id = ?", (idea_id,))
        idea = cursor.fetchone()
        if not idea:
            raise HTTPException(status_code=404, detail="Startup idea not found.")
        if idea["user_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to edit this startup idea.")

        new_title = payload.title if payload.title is not None else idea["title"]
        new_problem = payload.problem_statement if payload.problem_statement is not None else idea["problem_statement"]
        new_solution = payload.proposed_solution if payload.proposed_solution is not None else idea["proposed_solution"]
        new_audience = payload.target_audience if payload.target_audience is not None else idea["target_audience"]
        new_industry = payload.industry if payload.industry is not None else idea["industry"]
        new_skills = payload.required_skills if payload.required_skills is not None else (json.loads(idea["required_skills"]) if idea.get("required_skills") else [])
        new_team = payload.required_team_members if payload.required_team_members is not None else idea["required_team_members"]
        new_stage = payload.startup_stage if payload.startup_stage is not None else idea["startup_stage"]
        new_funding = payload.funding_requirements if payload.funding_requirements is not None else idea["funding_requirements"]
        new_visibility = payload.visibility if payload.visibility is not None else idea["visibility"]

        new_analysis = perform_rule_based_idea_analysis(
            title=new_title,
            problem=new_problem,
            solution=new_solution,
            audience=new_audience,
            skills=new_skills,
            stage=new_stage
        )

        cursor.execute("""
            UPDATE startup_ideas
            SET title = ?, problem_statement = ?, proposed_solution = ?, target_audience = ?, industry = ?,
                required_skills = ?, required_team_members = ?, startup_stage = ?, funding_requirements = ?,
                visibility = ?, analysis_json = ?,
                monthly_sales_json = COALESCE(?, monthly_sales_json),
                unit_economics_json = COALESCE(?, unit_economics_json),
                updated_at = ?
            WHERE id = ?
        """, (
            new_title, new_problem, new_solution, new_audience, new_industry,
            json.dumps(new_skills), new_team, new_stage, new_funding,
            new_visibility, json.dumps(new_analysis),
            json.dumps(payload.monthly_sales) if payload.monthly_sales is not None else None,
            json.dumps(payload.unit_economics) if payload.unit_economics is not None else None,
            now, idea_id
        ))

    return {
        "message": "Startup idea updated successfully.",
        "id": idea_id,
        "title": new_title,
        "analysis": new_analysis
    }

@app.get("/api/startups/{startup_id}/financials")
def get_startup_financials(
    startup_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, owner_id, name, monthly_sales_json, unit_economics_json, financials_visibility, funding_currency FROM startups WHERE id = ?", (startup_id,))
        st = cursor.fetchone()
        if not st:
            raise HTTPException(status_code=404, detail="Startup not found.")

        vis = st.get("financials_visibility") or "PUBLIC"
        is_owner = current_user and current_user["id"] == st["owner_id"]
        is_investor_or_admin = current_user and current_user["role"] in ["investor", "admin"]

        if vis == "INVESTOR_ONLY" and not (is_owner or is_investor_or_admin):
            raise HTTPException(status_code=403, detail="These financials are investor-only. Please log in as a verified investor to view.")

        sales = json.loads(st["monthly_sales_json"]) if st.get("monthly_sales_json") else []
        econ = json.loads(st["unit_economics_json"]) if st.get("unit_economics_json") else None

        return {
            "startup_id": startup_id,
            "startup_name": st["name"],
            "monthly_sales": sales,
            "unit_economics": econ,
            "financials_visibility": vis,
            "currency": st.get("funding_currency") or "INR",
            "is_restricted": False
        }

@app.put("/api/startups/{startup_id}/financials")
def update_startup_financials(
    startup_id: int,
    payload: StartupFinancialsUpdateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM startups WHERE id = ?", (startup_id,))
        st = cursor.fetchone()
        if not st:
            raise HTTPException(status_code=404, detail="Startup not found.")
        if st["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to edit financials for this startup.")

        # Clean and deduplicate monthly sales records by month and year
        cleaned_sales = []
        seen_keys = set()
        incoming = payload.monthly_sales or []

        for item in incoming:
            month_str = str(item.get("month", "")).strip()
            if not month_str:
                continue
            rev = float(item.get("revenue", 0.0) or 0.0)
            if rev < 0:
                raise HTTPException(status_code=400, detail="Sales revenue must be a non-negative number.")

            norm_key = month_str.lower().replace(" ", "")
            if norm_key in seen_keys:
                # Update existing record rather than duplicate!
                for idx, s in enumerate(cleaned_sales):
                    if s["month"].lower().replace(" ", "") == norm_key:
                        cleaned_sales[idx] = {
                            "month": month_str,
                            "revenue": rev,
                            "profit": float(item.get("profit", 0.0) or 0.0),
                            "orders": int(item.get("orders", 0) or 0),
                            "currency": item.get("currency") or payload.funding_currency or "INR"
                        }
            else:
                seen_keys.add(norm_key)
                cleaned_sales.append({
                    "month": month_str,
                    "revenue": rev,
                    "profit": float(item.get("profit", 0.0) or 0.0),
                    "orders": int(item.get("orders", 0) or 0),
                    "currency": item.get("currency") or payload.funding_currency or "INR"
                })

        # Process optional unit economics
        clean_econ = None
        if payload.unit_economics and isinstance(payload.unit_economics, dict) and any(payload.unit_economics.values()):
            ue = payload.unit_economics
            cac = max(0.0, float(ue.get("cac", 0.0) or 0.0))
            cogs = max(0.0, float(ue.get("cogs", 0.0) or 0.0))
            logistics = max(0.0, float(ue.get("logistics", 0.0) or 0.0))
            rev_unit = max(0.0, float(ue.get("revenue_per_unit", 0.0) or ue.get("average_order_value", 0.0) or 0.0))
            gross_m = float(ue.get("gross_margin", 0.0) or 0.0)
            net_m = float(ue.get("net_margin", 0.0) or 0.0)
            clean_econ = {
                "cac": cac,
                "cogs": cogs,
                "logistics": logistics,
                "revenue_per_unit": rev_unit,
                "gross_margin": gross_m,
                "net_margin": net_m,
                "currency": ue.get("currency") or payload.funding_currency or "INR",
                "notes": str(ue.get("notes", "") or "").strip()
            }

        cursor.execute("""
            UPDATE startups
            SET monthly_sales_json = ?,
                unit_economics_json = ?,
                financials_visibility = ?,
                funding_currency = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            json.dumps(cleaned_sales),
            json.dumps(clean_econ) if clean_econ is not None else None,
            payload.financials_visibility or "PUBLIC",
            payload.funding_currency or "INR",
            now, startup_id
        ))

    return {
        "message": "Startup financials and unit economics updated successfully.",
        "monthly_sales": cleaned_sales,
        "unit_economics": clean_econ,
        "financials_visibility": payload.financials_visibility or "PUBLIC"
    }

# --------------------------------------------------------
# 7. REAL-TIME INTERACTIVE NEGOTIATION ROOMS
# --------------------------------------------------------

@app.post("/api/negotiations/rooms", status_code=status.HTTP_201_CREATED)
def create_negotiation_room(
    payload: NegotiationRoomCreateRequest,
    current_user: dict = Depends(require_role("entrepreneur", "investor", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, owner_id, name FROM startups WHERE id = ?", (payload.startup_id,))
        st = cursor.fetchone()
        if not st:
            raise HTTPException(status_code=404, detail="Startup not found.")

        founder_id = st["owner_id"]
        investor_id = payload.investor_id

        # Access check
        if current_user["id"] not in [founder_id, investor_id] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only the startup founder or invited investor can create a negotiation room.")

        # Check existing active room
        cursor.execute("""
            SELECT id FROM negotiation_rooms
            WHERE startup_id = ? AND founder_id = ? AND investor_id = ? AND status NOT IN ('Accepted', 'Rejected', 'Closed')
        """, (payload.startup_id, founder_id, investor_id))
        existing = cursor.fetchone()
        if existing:
            return {"id": existing["id"], "message": "Active negotiation room already open."}

        slug = re.sub(r"[^\w-]", "", st["name"].lower().replace(" ", "-"))[:12]
        meet_link = payload.google_meet_link or f"https://meet.google.com/vb-deal-{slug}-{st['id']}"

        cursor.execute("""
            INSERT INTO negotiation_rooms (startup_id, founder_id, investor_id, status, proposed_amount, currency, proposed_valuation, proposed_equity, milestones, google_meet_link, notes, created_at, updated_at)
            VALUES (?, ?, ?, 'Proposed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.startup_id, founder_id, investor_id,
            payload.proposed_amount, payload.currency or "INR",
            payload.proposed_valuation, payload.proposed_equity,
            payload.milestones or "", meet_link, payload.notes or "",
            now, now
        ))
        room_id = cursor.lastrowid

        # Initial offer log message
        cursor.execute("""
            INSERT INTO negotiation_messages (room_id, sender_id, message_type, content, proposed_amount, proposed_equity, proposed_valuation, created_at)
            VALUES (?, ?, 'counter_offer', ?, ?, ?, ?, ?)
        """, (
            room_id, current_user["id"],
            f"Initial Term Sheet: {payload.currency} {payload.proposed_amount:,.0f} for {payload.proposed_equity}% equity (Valuation: {payload.currency} {payload.proposed_valuation:,.0f}).",
            payload.proposed_amount, payload.proposed_equity, payload.proposed_valuation, now
        ))

    return {
        "id": room_id,
        "message": "Negotiation room initialized.",
        "google_meet_link": meet_link
    }

@app.get("/api/negotiations/my-rooms")
def get_my_negotiation_rooms(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT nr.*, s.name as startup_name, s.industry as startup_industry,
                   f.full_name as founder_name, f.email as founder_email,
                   i.full_name as investor_name, i.email as investor_email
            FROM negotiation_rooms nr
            JOIN startups s ON nr.startup_id = s.id
            JOIN users f ON nr.founder_id = f.id
            JOIN users i ON nr.investor_id = i.id
            WHERE nr.founder_id = ? OR nr.investor_id = ? OR ? = 'admin'
            ORDER BY nr.id DESC
        """, (user_id, user_id, current_user["role"]))
        return cursor.fetchall()

@app.get("/api/negotiations/rooms/{room_id}")
def get_negotiation_room_details(
    room_id: int,
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT nr.*, s.name as startup_name, s.industry as startup_industry,
                   f.full_name as founder_name, f.email as founder_email,
                   i.full_name as investor_name, i.email as investor_email
            FROM negotiation_rooms nr
            JOIN startups s ON nr.startup_id = s.id
            JOIN users f ON nr.founder_id = f.id
            JOIN users i ON nr.investor_id = i.id
            WHERE nr.id = ?
        """, (room_id,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Negotiation room not found.")
        if current_user["id"] not in [room["founder_id"], room["investor_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized access to this private negotiation room.")

        cursor.execute("""
            SELECT m.*, u.full_name as sender_name, u.role as sender_role
            FROM negotiation_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.room_id = ?
            ORDER BY m.id ASC
        """, (room_id,))
        messages = cursor.fetchall()
        room["messages"] = messages
        return room

@app.post("/api/negotiations/rooms/{room_id}/counter-offer")
def submit_counter_offer(
    room_id: int,
    payload: NegotiationCounterOfferRequest,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM negotiation_rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Negotiation room not found.")
        if current_user["id"] not in [room["founder_id"], room["investor_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("""
            UPDATE negotiation_rooms
            SET proposed_amount = ?, currency = ?, proposed_valuation = ?, proposed_equity = ?, status = 'Countered', notes = ?, updated_at = ?
            WHERE id = ?
        """, (
            payload.proposed_amount, payload.currency or "INR",
            payload.proposed_valuation, payload.proposed_equity,
            payload.notes or "", now, room_id
        ))

        note_txt = f" - Notes: {payload.notes}" if payload.notes else ""
        content = f"Counter-Offer submitted: {payload.currency} {payload.proposed_amount:,.0f} for {payload.proposed_equity}% equity (Valuation: {payload.currency} {payload.proposed_valuation:,.0f}){note_txt}."

        cursor.execute("""
            INSERT INTO negotiation_messages (room_id, sender_id, message_type, content, proposed_amount, proposed_equity, proposed_valuation, created_at)
            VALUES (?, ?, 'counter_offer', ?, ?, ?, ?, ?)
        """, (room_id, current_user["id"], content, payload.proposed_amount, payload.proposed_equity, payload.proposed_valuation, now))

    return {
        "message": "Counter-offer registered successfully.",
        "status": "Countered",
        "proposed_amount": payload.proposed_amount,
        "proposed_valuation": payload.proposed_valuation,
        "proposed_equity": payload.proposed_equity
    }

@app.put("/api/negotiations/rooms/{room_id}/status")
def update_negotiation_room_status(
    room_id: int,
    status_val: Optional[str] = Query(None),
    payload: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    target_status = status_val
    if not target_status and payload and "status" in payload:
        target_status = payload["status"]
    if not target_status or target_status not in ["Draft", "Proposed", "Countered", "Accepted", "Rejected", "Closed"]:
        raise HTTPException(status_code=400, detail="Valid status required: Draft, Proposed, Countered, Accepted, Rejected, or Closed.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM negotiation_rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Negotiation room not found.")
        if current_user["id"] not in [room["founder_id"], room["investor_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("UPDATE negotiation_rooms SET status = ?, updated_at = ? WHERE id = ?", (target_status, now, room_id))

        cursor.execute("""
            INSERT INTO negotiation_messages (room_id, sender_id, message_type, content, created_at)
            VALUES (?, ?, 'status_change', ?, ?)
        """, (room_id, current_user["id"], f"Negotiation terms marked as '{target_status}'.", now))

    # Automatic fundraising update when deal transitions to Accepted!
    if target_status == "Accepted" and room.get("status") != "Accepted":
        record_confirmed_investment(
            startup_id=room["startup_id"],
            investor_id=room["investor_id"],
            source_type="negotiation_room",
            source_id=room_id,
            amount=room["proposed_amount"],
            currency=room["currency"]
        )

    return {"message": f"Negotiation status updated to '{target_status}'.", "status": target_status}

@app.post("/api/negotiations/rooms/{room_id}/messages", status_code=status.HTTP_201_CREATED)
def send_negotiation_message(
    room_id: int,
    payload: NegotiationMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    clean_txt = payload.content.strip()
    if not clean_txt:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT founder_id, investor_id FROM negotiation_rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()
        if not room:
            raise HTTPException(status_code=404, detail="Negotiation room not found.")
        if current_user["id"] not in [room["founder_id"], room["investor_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")

        cursor.execute("""
            INSERT INTO negotiation_messages (room_id, sender_id, message_type, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (room_id, current_user["id"], payload.message_type or "text", clean_txt, now))
        new_id = cursor.lastrowid

    return {"id": new_id, "message": "Message sent."}

# --------------------------------------------------------
# 8. MONTHLY FOUNDER PROGRESS REMINDERS & REPORTS
# --------------------------------------------------------

@app.post("/api/reports/monthly-progress", status_code=status.HTTP_201_CREATED)
def submit_monthly_progress_report(
    payload: MonthlyProgressReportRequest,
    current_user: dict = Depends(require_role("entrepreneur", "admin"))
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id FROM startups WHERE id = ?", (payload.startup_id,))
        st = cursor.fetchone()
        if not st:
            raise HTTPException(status_code=404, detail="Startup not found.")
        if st["owner_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only the startup owner can submit monthly progress reports.")

        cursor.execute("""
            INSERT INTO monthly_progress_reports (startup_id, founder_id, investor_id, reporting_month, revenue, expenses, milestones_achieved, challenges, next_month_goals, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.startup_id, current_user["id"], payload.investor_id,
            payload.reporting_month.strip(), payload.revenue, payload.expenses,
            payload.milestones_achieved.strip() if payload.milestones_achieved else "",
            payload.challenges.strip() if payload.challenges else "",
            payload.next_month_goals.strip() if payload.next_month_goals else "",
            payload.notes.strip() if payload.notes else "",
            now
        ))
        new_id = cursor.lastrowid

    return {"id": new_id, "message": "Monthly progress report submitted successfully to investor."}

@app.get("/api/reports/monthly-progress/my")
def get_my_monthly_progress_reports(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, s.name as startup_name, f.full_name as founder_name, i.full_name as investor_name
            FROM monthly_progress_reports r
            JOIN startups s ON r.startup_id = s.id
            JOIN users f ON r.founder_id = f.id
            JOIN users i ON r.investor_id = i.id
            WHERE r.founder_id = ? OR r.investor_id = ? OR ? = 'admin'
            ORDER BY r.id DESC
        """, (user_id, user_id, current_user["role"]))
        return cursor.fetchall()

@app.get("/api/reports/monthly-progress/reminders")
def get_monthly_progress_reminders(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    current_month_str = datetime.now().strftime("%B %Y")  # e.g. "October 2026"
    reminders = []
    with get_db() as conn:
        cursor = conn.cursor()
        # Find all startups owned by user with confirmed investments or active partnerships
        cursor.execute("""
            SELECT DISTINCT s.id as startup_id, s.name as startup_name, ci.investor_id, u.full_name as investor_name
            FROM startups s
            JOIN confirmed_investments ci ON s.id = ci.startup_id
            JOIN users u ON ci.investor_id = u.id
            WHERE s.owner_id = ?
        """, (user_id,))
        confirmed_deals = cursor.fetchall()

        for d in confirmed_deals:
            cursor.execute("""
                SELECT id FROM monthly_progress_reports
                WHERE startup_id = ? AND investor_id = ? AND reporting_month = ?
            """, (d["startup_id"], d["investor_id"], current_month_str))
            if not cursor.fetchone():
                reminders.append({
                    "startup_id": d["startup_id"],
                    "startup_name": d["startup_name"],
                    "investor_id": d["investor_id"],
                    "investor_name": d["investor_name"],
                    "reporting_month": current_month_str,
                    "reminder_text": f"Time to submit your {current_month_str} Business Progress & Metrics report for {d['investor_name']} ({d['startup_name']}).",
                    "due_date": f"End of {current_month_str}"
                })

    return {"reminders": reminders, "current_month": current_month_str}

# --------------------------------------------------------
# 9. FUNDRAISING COMMAND CENTER
# --------------------------------------------------------

@app.get("/api/startups/{startup_id}/fundraising-command-center")
def get_fundraising_command_center(
    startup_id: int,
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, u.full_name as owner_name
            FROM startups s
            JOIN users u ON s.owner_id = u.id
            WHERE s.id = ?
        """, (startup_id,))
        st = cursor.fetchone()
        if not st:
            raise HTTPException(status_code=404, detail="Startup not found.")

        # Access check
        if st["owner_id"] != current_user["id"] and current_user["role"] not in ["investor", "admin"]:
            raise HTTPException(status_code=403, detail="Unauthorized to view fundraising command center for this startup.")

        # Goal parsing
        target_goal = parse_currency_amount(st.get("funding_requirement"))
        raised_total = float(st.get("funding_raised") or 0.0)
        currency = st.get("funding_currency") or "INR"
        remaining_needed = max(0.0, target_goal - raised_total)
        progress_pct = min(100.0, round((raised_total / target_goal) * 100.0, 1)) if target_goal > 0 else 0.0

        # Confirmed investments list
        cursor.execute("""
            SELECT ci.*, u.full_name as investor_name, u.email as investor_email
            FROM confirmed_investments ci
            JOIN users u ON ci.investor_id = u.id
            WHERE ci.startup_id = ?
            ORDER BY ci.id DESC
        """, (startup_id,))
        confirmed_list = cursor.fetchall()

        # Pending proposals list
        cursor.execute("""
            SELECT nr.id, nr.proposed_amount, nr.currency, nr.proposed_equity, nr.proposed_valuation, nr.status, nr.updated_at,
                   u.full_name as investor_name
            FROM negotiation_rooms nr
            JOIN users u ON nr.investor_id = u.id
            WHERE nr.startup_id = ? AND nr.status IN ('Proposed', 'Countered', 'Draft')
            ORDER BY nr.id DESC
        """, (startup_id,))
        pending_negotiations = cursor.fetchall()

    return {
        "startup_id": startup_id,
        "startup_name": st["name"],
        "funding_currency": currency,
        "target_funding_goal": target_goal,
        "total_raised": raised_total,
        "remaining_needed": remaining_needed,
        "progress_percentage": progress_pct,
        "confirmed_investments": confirmed_list,
        "pending_proposals": pending_negotiations,
        "is_owner": st["owner_id"] == current_user["id"]
    }

# ========================================================
# 10. TWO-PARTY GOOGLE MEET REQUEST & APPROVAL WORKFLOW
# ========================================================

def validate_google_meet_url(url: Optional[str]) -> bool:
    """Validates that a provided URL matches the standard Google Meet URL format."""
    if not url or not url.strip():
        return True
    clean = url.strip()
    pattern = r"^(https?:\/\/)?meet\.google\.com\/[a-zA-Z0-9_\-]+(\?[a-zA-Z0-9_\-=&]*)?$"
    return bool(re.match(pattern, clean))

def parse_and_validate_future_datetime(meeting_date: str, start_time: str) -> Tuple[datetime, str]:
    """Parses date and time strings and strictly validates that the scheduled time is in the future."""
    combined_str = f"{meeting_date.strip()} {start_time.strip()}"
    dt = None
    formats = ["%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M:%S"]
    for fmt in formats:
        try:
            dt = datetime.strptime(combined_str, fmt)
            break
        except ValueError:
            continue

    if not dt:
        raise HTTPException(
            status_code=400,
            detail="Invalid date or time format. Please use YYYY-MM-DD for date and HH:MM for start time."
        )

    if dt <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="Proposed meeting time must be in the future. Past dates and times are not permitted."
        )

    return dt, dt.isoformat()

def verify_meeting_authorization(requester: dict, recipient: dict, conn) -> bool:
    """Verifies that the requester has authorized context to request a meeting with recipient."""
    req_id = requester["id"]
    rec_id = recipient["id"]
    cursor = conn.cursor()

    # 1. Platform Admin
    if requester.get("role") == "admin" or recipient.get("role") == "admin":
        return True

    # 2. Accepted Connection
    cursor.execute("""
        SELECT id FROM connections
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          AND status = 'Accepted'
    """, (req_id, rec_id, rec_id, req_id))
    if cursor.fetchone():
        return True

    # 3. Investor <-> Founder Interaction
    # Check investor interests
    cursor.execute("""
        SELECT ii.id FROM investor_interests ii
        JOIN startups s ON ii.startup_id = s.id
        WHERE (ii.investor_id = ? AND s.owner_id = ?) OR (ii.investor_id = ? AND s.owner_id = ?)
    """, (req_id, rec_id, rec_id, req_id))
    if cursor.fetchone():
        return True

    # Check active negotiation rooms
    cursor.execute("""
        SELECT id FROM negotiation_rooms
        WHERE (founder_id = ? AND investor_id = ?) OR (founder_id = ? AND investor_id = ?)
    """, (req_id, rec_id, rec_id, req_id))
    if cursor.fetchone():
        return True

    # Role compatibility: Investor discovering a Founder or vice-versa
    if (requester.get("role") == "investor" and recipient.get("role") == "entrepreneur") or \
       (requester.get("role") == "entrepreneur" and recipient.get("role") == "investor"):
        return True

    # 4. Employer <-> Candidate Interaction
    cursor.execute("""
        SELECT a.id FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE (a.user_id = ? AND o.employer_id = ?) OR (a.user_id = ? AND o.employer_id = ?)
    """, (req_id, rec_id, rec_id, req_id))
    if cursor.fetchone():
        return True

    return False

@app.post("/api/meetings/requests", status_code=status.HTTP_201_CREATED)
def create_meeting_request(
    payload: MeetingCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    requester_id = current_user["id"]
    recipient_id = payload.recipient_id

    if requester_id == recipient_id:
        raise HTTPException(status_code=400, detail="You cannot request a meeting with yourself.")

    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Meeting title or purpose is required.")

    dur = payload.duration_minutes if payload.duration_minutes is not None else 30
    if dur <= 0 or dur > 480:
        raise HTTPException(status_code=400, detail="Duration must be between 1 and 480 minutes.")

    # Validate future date and time
    sched_dt, sched_iso = parse_and_validate_future_datetime(payload.meeting_date, payload.start_time)

    # Validate Google Meet link format if supplied
    if payload.google_meet_url and not validate_google_meet_url(payload.google_meet_url):
        raise HTTPException(
            status_code=400,
            detail="Invalid Google Meet URL format. Link must be a valid https://meet.google.com/xxx-xxxx-xxx URL."
        )

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        # Verify recipient exists
        cursor.execute("SELECT id, full_name, email, role FROM users WHERE id = ?", (recipient_id,))
        recipient = cursor.fetchone()
        if not recipient:
            raise HTTPException(status_code=404, detail="Meeting recipient not found.")

        # Verify authorization between parties
        if not verify_meeting_authorization(current_user, recipient, conn):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to request a meeting with this user. Please connect or apply first."
            )

        # Detect conflicting approved meetings
        cursor.execute("""
            SELECT id, title, scheduled_at FROM meeting_requests
            WHERE (requester_id IN (?, ?) OR recipient_id IN (?, ?))
              AND status = 'Approved'
              AND scheduled_at = ?
        """, (requester_id, recipient_id, requester_id, recipient_id, sched_iso))
        conflict = cursor.fetchone()
        conflict_warning = None
        if conflict:
            conflict_warning = f"Notice: Participant has an existing confirmed meeting scheduled at {sched_iso}."

        clean_url = payload.google_meet_url.strip() if payload.google_meet_url and payload.google_meet_url.strip() else None

        cursor.execute("""
            INSERT INTO meeting_requests (
                requester_id, recipient_id, title, purpose, meeting_date, start_time,
                scheduled_at, duration_minutes, time_zone, agenda, google_meet_url,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
        """, (
            requester_id, recipient_id, payload.title.strip(),
            payload.purpose.strip() if payload.purpose else "",
            payload.meeting_date.strip(), payload.start_time.strip(),
            sched_iso, dur,
            payload.time_zone or "UTC",
            payload.agenda.strip() if payload.agenda else "",
            clean_url, now, now
        ))
        new_id = cursor.lastrowid

    return {
        "id": new_id,
        "status": "Pending",
        "message": f"Meeting request '{payload.title}' sent to {recipient['full_name']}. Awaiting recipient approval.",
        "scheduled_at": sched_iso,
        "google_meet_url": clean_url,
        "conflict_warning": conflict_warning
    }

@app.get("/api/meetings/my")
def get_my_meetings(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["id"])
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT m.*,
                   req.full_name as requester_name, req.role as requester_role, req.profile_image as requester_image, req.email as requester_email,
                   rec.full_name as recipient_name, rec.role as recipient_role, rec.profile_image as recipient_image, rec.email as recipient_email
            FROM meeting_requests m
            JOIN users req ON m.requester_id = req.id
            JOIN users rec ON m.recipient_id = rec.id
            WHERE (m.requester_id = ? OR m.recipient_id = ? OR ? = 'admin')
        """
        params = [user_id, user_id, current_user["role"]]
        if status_filter:
            query += " AND m.status = ?"
            params.append(status_filter)
        query += " ORDER BY m.scheduled_at ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            item = dict(r)
            item["is_requester"] = (r["requester_id"] == user_id)
            item["is_recipient"] = (r["recipient_id"] == user_id)
            # Meet link availability check:
            # If approved but link is empty, flag link_pending
            if r["status"] == "Approved" and not r.get("google_meet_url"):
                item["link_pending"] = True
                item["can_join"] = False
            elif r["status"] == "Approved" and r.get("google_meet_url"):
                item["link_pending"] = False
                item["can_join"] = True
            else:
                item["link_pending"] = False
                item["can_join"] = False
            results.append(item)

        # Include group discussions if not filtering for non-approved status
        if not status_filter or status_filter == "Approved":
            cursor.execute("""
                SELECT gm.*, u.full_name as employer_name, u.email as employer_email, o.title as opportunity_title
                FROM group_meetings gm
                JOIN users u ON gm.employer_id = u.id
                LEFT JOIN opportunities o ON gm.opportunity_id = o.id
            """)
            gm_rows = cursor.fetchall()
            for gm in gm_rows:
                c_ids = json.loads(gm["candidate_ids_json"]) if gm.get("candidate_ids_json") else []
                if gm["employer_id"] == user_id or user_id in c_ids or current_user["role"] == "admin":
                    gm_dict = dict(gm)
                    gm_dict["candidate_ids"] = c_ids
                    gm_dict["is_requester"] = (gm["employer_id"] == user_id)
                    gm_dict["is_recipient"] = (user_id in c_ids)
                    gm_dict["status"] = "Approved"
                    gm_dict["can_join"] = bool(gm.get("google_meet_url"))
                    gm_dict["link_pending"] = not bool(gm.get("google_meet_url"))
                    gm_dict["meeting_date"] = gm.get("scheduled_at", "").split("T")[0] if "T" in gm.get("scheduled_at", "") else gm.get("scheduled_at", "")
                    gm_dict["requester_name"] = gm.get("employer_name")
                    gm_dict["requester_role"] = "employer"
                    results.append(gm_dict)

        return results

@app.get("/api/meetings/{meeting_id}")
def get_meeting_details(
    meeting_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*,
                   req.full_name as requester_name, req.role as requester_role, req.profile_image as requester_image, req.email as requester_email,
                   rec.full_name as recipient_name, rec.role as recipient_role, rec.profile_image as recipient_image, rec.email as recipient_email
            FROM meeting_requests m
            JOIN users req ON m.requester_id = req.id
            JOIN users rec ON m.recipient_id = rec.id
            WHERE m.id = ?
        """, (meeting_id,))
        meeting = cursor.fetchone()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found.")

        if current_user["id"] not in [meeting["requester_id"], meeting["recipient_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to view this meeting.")

        item = dict(meeting)
        item["is_requester"] = (meeting["requester_id"] == user_id)
        item["is_recipient"] = (meeting["recipient_id"] == user_id)
        item["can_join"] = bool(meeting["status"] == "Approved" and meeting.get("google_meet_url"))
        item["link_pending"] = bool(meeting["status"] == "Approved" and not meeting.get("google_meet_url"))
        return item

@app.put("/api/meetings/{meeting_id}/respond")
def respond_to_meeting_request(
    meeting_id: int,
    payload: MeetingRespondRequest,
    current_user: dict = Depends(get_current_user)
):
    target_status = payload.status.strip()
    if target_status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Response status must be 'Approved' or 'Rejected'.")

    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meeting_requests WHERE id = ?", (meeting_id,))
        meeting = cursor.fetchone()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting request not found.")

        # STRICT PERMISSION:
        # The requester must not be able to approve their own request!
        if meeting["requester_id"] == current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="Requesters cannot approve their own meeting requests. Only the designated recipient may approve or reject."
            )

        if meeting["recipient_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Only the designated recipient can approve or reject this meeting request."
            )

        if meeting["status"] not in ["Pending"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot respond to meeting currently in '{meeting['status']}' state. Only pending requests can be approved or rejected."
            )

        # Validate Google Meet link if provided by recipient during approval
        meet_url = meeting.get("google_meet_url")
        if payload.google_meet_url and payload.google_meet_url.strip():
            if not validate_google_meet_url(payload.google_meet_url):
                raise HTTPException(status_code=400, detail="Invalid Google Meet link format.")
            meet_url = payload.google_meet_url.strip()

        cursor.execute("""
            UPDATE meeting_requests
            SET status = ?, google_meet_url = ?, updated_at = ?
            WHERE id = ?
        """, (target_status, meet_url, now, meeting_id))

    return {
        "id": meeting_id,
        "status": target_status,
        "google_meet_url": meet_url,
        "message": f"Meeting request marked as '{target_status}'."
    }

@app.put("/api/meetings/{meeting_id}/cancel")
def cancel_meeting_request(
    meeting_id: int,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meeting_requests WHERE id = ?", (meeting_id,))
        meeting = cursor.fetchone()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting request not found.")

        if current_user["id"] not in [meeting["requester_id"], meeting["recipient_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to cancel this meeting.")

        cursor.execute("UPDATE meeting_requests SET status = 'Cancelled', updated_at = ? WHERE id = ?", (now, meeting_id))

    return {
        "id": meeting_id,
        "status": "Cancelled",
        "message": "Meeting successfully cancelled. Status updated."
    }

@app.put("/api/meetings/{meeting_id}/details")
def update_meeting_details(
    meeting_id: int,
    payload: MeetingUpdateDetailsRequest,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meeting_requests WHERE id = ?", (meeting_id,))
        meeting = cursor.fetchone()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found.")

        if current_user["id"] not in [meeting["requester_id"], meeting["recipient_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to edit details for this meeting.")

        new_date = payload.meeting_date.strip() if payload.meeting_date else meeting["meeting_date"]
        new_time = payload.start_time.strip() if payload.start_time else meeting["start_time"]
        sched_dt, sched_iso = parse_and_validate_future_datetime(new_date, new_time)

        new_duration = payload.duration_minutes if payload.duration_minutes is not None else meeting["duration_minutes"]
        if new_duration <= 0 or new_duration > 480:
            raise HTTPException(status_code=400, detail="Duration must be between 1 and 480 minutes.")

        new_title = payload.title.strip() if payload.title else meeting["title"]
        new_purpose = payload.purpose.strip() if payload.purpose is not None else meeting["purpose"]
        new_agenda = payload.agenda.strip() if payload.agenda is not None else meeting["agenda"]
        new_tz = payload.time_zone or meeting["time_zone"]

        new_url = meeting["google_meet_url"]
        if payload.google_meet_url is not None:
            if payload.google_meet_url and not validate_google_meet_url(payload.google_meet_url):
                raise HTTPException(status_code=400, detail="Invalid Google Meet URL format.")
            new_url = payload.google_meet_url.strip() if payload.google_meet_url else None

        # CRITICAL SPECIFICATION:
        # If date, time, duration, or essential details change on an already Approved meeting,
        # require renewed approval (status resets to Pending)!
        new_status = meeting["status"]
        renewed_approval_triggered = False
        if meeting["status"] == "Approved":
            if new_date != meeting["meeting_date"] or new_time != meeting["start_time"] or new_duration != meeting["duration_minutes"]:
                new_status = "Pending"
                renewed_approval_triggered = True

        cursor.execute("""
            UPDATE meeting_requests
            SET title = ?, purpose = ?, meeting_date = ?, start_time = ?,
                scheduled_at = ?, duration_minutes = ?, time_zone = ?,
                agenda = ?, google_meet_url = ?, status = ?, updated_at = ?
            WHERE id = ?
        """, (
            new_title, new_purpose, new_date, new_time, sched_iso,
            new_duration, new_tz, new_agenda, new_url, new_status, now, meeting_id
        ))

    msg = "Meeting details updated successfully."
    if renewed_approval_triggered:
        msg += " Because date/time/duration changed, renewed approval by recipient is required."

    return {
        "id": meeting_id,
        "status": new_status,
        "scheduled_at": sched_iso,
        "renewed_approval_required": renewed_approval_triggered,
        "message": msg
    }

@app.put("/api/meetings/{meeting_id}/link")
def update_meeting_link(
    meeting_id: int,
    payload: MeetingLinkRequest,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now().isoformat()
    if not validate_google_meet_url(payload.google_meet_url):
        raise HTTPException(status_code=400, detail="Invalid Google Meet link format.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meeting_requests WHERE id = ?", (meeting_id,))
        meeting = cursor.fetchone()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found.")

        if current_user["id"] not in [meeting["requester_id"], meeting["recipient_id"]] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized to update link for this meeting.")

        clean_url = payload.google_meet_url.strip()
        cursor.execute("UPDATE meeting_requests SET google_meet_url = ?, updated_at = ? WHERE id = ?", (clean_url, now, meeting_id))

    return {
        "id": meeting_id,
        "google_meet_url": clean_url,
        "message": "Google Meet link updated successfully."
    }

