import sqlite3
import os
import json
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime

DB_PATH = Path(__file__).parent / "venturebridge.db"

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL, -- 'entrepreneur', 'job_seeker', 'investor', 'admin'
            full_name TEXT NOT NULL,
            location TEXT,
            profile_image TEXT,
            bio TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """)

        # 2. Entrepreneur Profiles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS entrepreneur_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            startup_name TEXT,
            industry TEXT,
            startup_stage TEXT,
            skills_needed TEXT, -- JSON array
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 3. Job Seeker Profiles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_seeker_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            education TEXT,
            skills TEXT, -- JSON array
            experience_level TEXT,
            preferred_work_mode TEXT,
            portfolio_url TEXT,
            github_url TEXT,
            career_interests TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 4. Investor Profiles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS investor_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            investor_type TEXT,
            areas_of_interest TEXT,
            preferred_industries TEXT,
            investment_stage_pref TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 5. Startups
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS startups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            problem TEXT NOT NULL,
            solution TEXT NOT NULL,
            category TEXT NOT NULL, -- 'Tech Startups', 'Non-Tech Startups', 'Social Welfare Startups'
            industry TEXT NOT NULL,
            stage TEXT NOT NULL, -- 'Idea Phase', 'MVP / Prototype', 'Early Traction', 'Scaling'
            location TEXT NOT NULL,
            website TEXT,
            required_skills TEXT, -- JSON array
            team_size INTEGER DEFAULT 1,
            funding_stage TEXT,
            funding_requirement TEXT,
            verification_status TEXT DEFAULT 'Unverified', -- 'Verified', 'Verification Pending', 'Unverified'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 6. Startup Ideas
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS startup_ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            problem_statement TEXT NOT NULL,
            proposed_solution TEXT NOT NULL,
            target_audience TEXT NOT NULL,
            industry TEXT NOT NULL,
            required_skills TEXT, -- JSON array
            required_team_members TEXT,
            startup_stage TEXT NOT NULL,
            funding_requirements TEXT,
            visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC', 'INVESTOR_ONLY'
            analysis_json TEXT, -- Rule-based structured checklist
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 7. Opportunities (Jobs, Internships, Projects, etc.)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creator_id INTEGER NOT NULL,
            startup_id INTEGER,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL, -- 'Full-time Jobs', 'Part-time Jobs', 'Internships', 'Freelance Projects', 'Remote Jobs', 'On-site Jobs', 'Hybrid Jobs', 'Entry-level Jobs', 'Teaching and Tutoring'
            required_skills TEXT NOT NULL, -- JSON array
            experience_level TEXT NOT NULL,
            work_mode TEXT NOT NULL, -- 'Remote', 'On-site', 'Hybrid'
            location TEXT NOT NULL,
            compensation TEXT,
            verification_status TEXT DEFAULT 'Unverified', -- 'Verified', 'Verification Pending', 'Unverified'
            is_demo INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE SET NULL
        );
        """)

        # 8. Applications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opportunity_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            cover_letter TEXT,
            resume_url TEXT,
            status TEXT DEFAULT 'Submitted', -- 'Submitted', 'Under Review', 'Shortlisted', 'Rejected'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(opportunity_id, user_id)
        );
        """)

        # 9. Saved Opportunities
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            opportunity_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
            UNIQUE(user_id, opportunity_id)
        );
        """)

        # 10. Saved Startups
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_startups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            startup_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
            UNIQUE(user_id, startup_id)
        );
        """)

        # 11. Investor Interest Requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS investor_interests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            investor_id INTEGER NOT NULL,
            startup_id INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Declined'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
            UNIQUE(investor_id, startup_id)
        );
        """)

        # 12. Connections
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Rejected'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 13. Messages
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 14. Mentors (Notice: NO mentor feedback tables!)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mentors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            area_of_expertise TEXT NOT NULL,
            industry TEXT NOT NULL,
            experience TEXT NOT NULL,
            areas_of_guidance TEXT NOT NULL,
            availability_status TEXT DEFAULT 'Available', -- 'Available', 'Limited', 'Busy'
            bio TEXT,
            avatar_url TEXT,
            created_at TEXT NOT NULL
        );
        """)

        # 15. Mentorship Requests (Guidance request only)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mentorship_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Declined'
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
        );
        """)

        # 16. Reports (Trust & Fraud Prevention)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER NOT NULL,
            target_type TEXT NOT NULL, -- 'Job', 'Profile', 'Startup'
            target_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            details TEXT,
            status TEXT DEFAULT 'Pending Review', -- 'Pending Review', 'Under Review', 'Resolved'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
