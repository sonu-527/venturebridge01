import sqlite3
import os
import json
import logging
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime

logger = logging.getLogger("venturebridge.database")

# Database URL support for deployment (e.g. Render PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# SQLite fallback path (can be overridden with SQLITE_DB_PATH for persistent disks)
DEFAULT_SQLITE_PATH = Path(__file__).parent / "venturebridge.db"
SQLITE_DB_PATH = Path(os.getenv("SQLITE_DB_PATH", str(DEFAULT_SQLITE_PATH)))

# Determine engine
IS_POSTGRES = bool(DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")))

if IS_POSTGRES and DATABASE_URL.startswith("postgres://"):
    # SQLAlchemy and psycopg2 require postgresql:// rather than postgres://
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

class PostgresCompatCursor:
    """Wrapper around psycopg2 cursor that adapts SQLite-style '?' placeholders to '%s'."""
    def __init__(self, raw_cursor):
        self._cursor = raw_cursor

    def execute(self, query, params=None):
        adapted_query = query.replace("?", "%s")
        if params is not None:
            return self._cursor.execute(adapted_query, params)
        return self._cursor.execute(adapted_query)

    def executemany(self, query, params_list):
        adapted_query = query.replace("?", "%s")
        return self._cursor.executemany(adapted_query, params_list)

    def fetchone(self):
        row = self._cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self):
        rows = self._cursor.fetchall()
        return [dict(r) for r in rows] if rows else []

    @property
    def lastrowid(self):
        # In PostgreSQL, last inserted ID via cursor
        try:
            self._cursor.execute("SELECT LASTVAL();")
            res = self._cursor.fetchone()
            if res:
                return list(res.values())[0] if isinstance(res, dict) else res[0]
        except Exception:
            pass
        return getattr(self._cursor, "lastrowid", None)

    @property
    def rowcount(self):
        return self._cursor.rowcount

class PostgresCompatConnection:
    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        from psycopg2.extras import RealDictCursor
        raw_cur = self._conn.cursor(cursor_factory=RealDictCursor)
        return PostgresCompatCursor(raw_cur)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def execute(self, query, params=None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur

@contextmanager
def get_db():
    if IS_POSTGRES:
        try:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            wrapped_conn = PostgresCompatConnection(conn)
            try:
                yield wrapped_conn
                wrapped_conn.commit()
            except Exception:
                wrapped_conn.rollback()
                raise
            finally:
                wrapped_conn.close()
            return
        except Exception as e:
            logger.warning("PostgreSQL connection failed (%s). Falling back to SQLite at %s", e, SQLITE_DB_PATH)

    # SQLite mode
    conn = sqlite3.connect(SQLITE_DB_PATH)
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
    """Initializes tables for SQLite or PostgreSQL."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT NOT NULL,
            location TEXT,
            profile_image TEXT,
            bio TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
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
            skills_needed TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS entrepreneur_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL,
            startup_name TEXT,
            industry TEXT,
            startup_stage TEXT,
            skills_needed TEXT,
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
            skills TEXT,
            experience_level TEXT,
            preferred_work_mode TEXT,
            portfolio_url TEXT,
            github_url TEXT,
            career_interests TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS job_seeker_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL,
            education TEXT,
            skills TEXT,
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
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS investor_profiles (
            id SERIAL PRIMARY KEY,
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
            category TEXT NOT NULL,
            industry TEXT NOT NULL,
            stage TEXT NOT NULL,
            location TEXT NOT NULL,
            website TEXT,
            required_skills TEXT,
            team_size INTEGER DEFAULT 1,
            funding_stage TEXT,
            funding_requirement TEXT,
            verification_status TEXT DEFAULT 'Unverified',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS startups (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            problem TEXT NOT NULL,
            solution TEXT NOT NULL,
            category TEXT NOT NULL,
            industry TEXT NOT NULL,
            stage TEXT NOT NULL,
            location TEXT NOT NULL,
            website TEXT,
            required_skills TEXT,
            team_size INTEGER DEFAULT 1,
            funding_stage TEXT,
            funding_requirement TEXT,
            verification_status TEXT DEFAULT 'Unverified',
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
            required_skills TEXT,
            required_team_members TEXT,
            startup_stage TEXT NOT NULL,
            funding_requirements TEXT,
            visibility TEXT NOT NULL DEFAULT 'PUBLIC',
            analysis_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS startup_ideas (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            problem_statement TEXT NOT NULL,
            proposed_solution TEXT NOT NULL,
            target_audience TEXT NOT NULL,
            industry TEXT NOT NULL,
            required_skills TEXT,
            required_team_members TEXT,
            startup_stage TEXT NOT NULL,
            funding_requirements TEXT,
            visibility TEXT NOT NULL DEFAULT 'PUBLIC',
            analysis_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 7. Opportunities
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creator_id INTEGER NOT NULL,
            startup_id INTEGER,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            required_skills TEXT NOT NULL,
            experience_level TEXT NOT NULL,
            work_mode TEXT NOT NULL,
            location TEXT NOT NULL,
            compensation TEXT,
            verification_status TEXT DEFAULT 'Unverified',
            is_demo INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE SET NULL
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS opportunities (
            id SERIAL PRIMARY KEY,
            creator_id INTEGER NOT NULL,
            startup_id INTEGER,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            required_skills TEXT NOT NULL,
            experience_level TEXT NOT NULL,
            work_mode TEXT NOT NULL,
            location TEXT NOT NULL,
            compensation TEXT,
            verification_status TEXT DEFAULT 'Unverified',
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
            status TEXT DEFAULT 'Submitted',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(opportunity_id, user_id)
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
            opportunity_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            cover_letter TEXT,
            resume_url TEXT,
            status TEXT DEFAULT 'Submitted',
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
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS saved_opportunities (
            id SERIAL PRIMARY KEY,
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
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS saved_startups (
            id SERIAL PRIMARY KEY,
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
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
            UNIQUE(investor_id, startup_id)
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS investor_interests (
            id SERIAL PRIMARY KEY,
            investor_id INTEGER NOT NULL,
            startup_id INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending',
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
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS connections (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending',
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
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
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
            availability_status TEXT DEFAULT 'Available',
            bio TEXT,
            avatar_url TEXT,
            created_at TEXT NOT NULL
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS mentors (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            area_of_expertise TEXT NOT NULL,
            industry TEXT NOT NULL,
            experience TEXT NOT NULL,
            areas_of_guidance TEXT NOT NULL,
            availability_status TEXT DEFAULT 'Available',
            bio TEXT,
            avatar_url TEXT,
            created_at TEXT NOT NULL
        );
        """)

        # 15. Mentorship Requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mentorship_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS mentorship_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
        );
        """)

        # 16. Reports
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            details TEXT,
            status TEXT DEFAULT 'Pending Review',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """ if not IS_POSTGRES else """
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            reporter_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            details TEXT,
            status TEXT DEFAULT 'Pending Review',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
