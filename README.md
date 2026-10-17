# VentureBridge

> **Theme:** Entrepreneurship & Employment  
> *"Connecting Talent, Ideas, and Opportunities"*

VentureBridge is a modern, responsive full-stack platform built for students, startup founders, job seekers, and early-stage investors. It solves real-world friction points in hiring, founding team assembly, transparent skill gap analysis, and mission-driven venture discovery.

---

## 🌟 Key Features

1. **Role-Based Onboarding & Dashboards**:
   - **Entrepreneur**: Startup profiles, team recruiting, idea sharing with privacy controls, incoming investor inquiries.
   - **Job Seeker**: Personalized skill match scores, applications tracker, interactive Skill Gap Analyzer.
   - **Investor**: Startup discovery across Tech, Non-Tech, and Social Welfare ventures, confidential investor briefs, expression of interest memos.
2. **Deterministic Skill-Based Job Matching**:
   - Transparent formula: $\text{Match \%} = (\text{Matched Skills} / \text{Total Required Skills}) \times 100$.
   - Itemized breakdown of matched skills, missing skills, and clear disclaimers that match measures skill overlap only.
3. **Interactive Skill Gap Analyzer**:
   - Compare current competencies against industry benchmarks (Frontend Developer, Backend Developer, Full Stack, Data Analyst, UI/UX Designer, Product Manager, Mobile Developer).
   - Generates prioritized learning pathways.
4. **Startup Idea Sharing & Rule-Based Analysis**:
   - Choose between **PUBLIC** visibility or **INVESTOR_ONLY** visibility (strictly enforced on the backend).
   - Instant structured checklist evaluating problem clarity, beachhead audience, proposed solution, competencies, and risk headwinds.
5. **Dedicated Social Welfare Startup Discovery**:
   - Filter specifically for mission-driven, circular economy, and community welfare initiatives.
6. **Mentors Directory & Guidance Requests**:
   - View verified industry leaders and submit formal requests for strategic guidance.
   - *Strict Compliance*: Zero mentor feedback forms, tables, or endpoints.
7. **Trust & Fraud Prevention**:
   - Verified, Review Pending, and Unverified badges.
   - Reporting console for jobs, profiles, or startups with status workflow (`Pending Review`, `Under Review`, `Resolved`).
8. **Networking & Direct Messaging**:
   - Connection requests with persistent in-database chat between accepted peers.

---

## 🎨 Design System & Palette

- **Primary Green:** `#138A4B` (Brand primary, CTAs, highlight badges)
- **Dark Green:** `#08663A` (Hover states, section badges)
- **Light Green:** `#EAF7EF` (Pill backgrounds, score cards)
- **Background:** `#F8FAF8` (Clean, spacious app canvas)
- **White:** `#FFFFFF` (Surface cards, modals, navigation)
- **Primary Text:** `#17211B` (High-contrast typography)
- **Secondary Text:** `#65736A` (Readable metadata and captions)
- **Borders:** `#E3EAE5` (Crisp, subtle dividers and card frames)

---

## 📁 Project Structure

```
EntEmp/
├── backend/
│   ├── main.py                  # FastAPI application with all REST endpoints
│   ├── database.py              # SQLite schema, connection pool & row factory
│   ├── auth.py                  # Password hashing (PBKDF2), JWT & role auth
│   ├── seed_data.py             # Realistic fictional demo data seeder
│   ├── test_integration.py      # Automated 9-suite integration test script
│   └── venturebridge.db         # SQLite persistent database
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Responsive nav with instant demo switcher
│   │   │   ├── Footer.tsx               # Footer with policy & trust modals
│   │   │   ├── TrustBadge.tsx           # Verified / Pending / Unverified pills
│   │   │   ├── ReportModal.tsx          # Trust & fraud reporting modal
│   │   │   ├── GuidanceRequestModal.tsx # Mentor guidance request modal
│   │   │   ├── IdeaAnalysisModal.tsx    # Rule-based checklist modal
│   │   │   └── MessagingDrawer.tsx      # Persistent chat between peers
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # User state, JWT storage & quick login
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Responsive landing page
│   │   │   ├── AuthPage.tsx             # 3 selectable role cards & forms
│   │   │   ├── EntrepreneurDashboard.tsx# Startups, ideas, investor inquiries
│   │   │   ├── JobSeekerDashboard.tsx   # Skill match, gap analyzer, applications
│   │   │   ├── InvestorDashboard.tsx    # Discover, saved, investor-only briefs
│   │   │   ├── StartupsPage.tsx         # Directory with Social Welfare filter
│   │   │   ├── OpportunitiesPage.tsx    # Jobs, internships, freelance board
│   │   │   ├── FindPeoplePage.tsx       # Co-founder & candidate discovery
│   │   │   ├── MentorsPage.tsx          # Mentor directory (guidance only)
│   │   │   └── AdminReportsPage.tsx     # Trust & fraud review console
│   │   ├── services/
│   │   │   └── api.ts                   # Centralized API fetch service
│   │   ├── types.ts                     # TypeScript data interfaces
│   │   ├── App.tsx                      # App root router
│   │   └── index.css                    # Tailwind CSS v4 design tokens
│   ├── package.json
│   └── vite.config.ts                   # Tailwind plugin and API proxy
└── README.md
```

---

## 🚀 Startup Instructions

### 1. Backend Startup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. (Optional) Run the database seed script to populate demo data:
   ```bash
   python seed_data.py
   ```
3. Launch the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   *The backend will be live at `http://127.0.0.1:8000`.*  
   *Interactive API documentation is available at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Startup

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` (or `http://localhost:5174`).*

---

## 👥 Demo Accounts (Password for all: `password123`)

| Persona | Role | Email | Highlights |
| :--- | :--- | :--- | :--- |
| **Sarah Chen** | Entrepreneur | `founder@ecotrack.io` | Founder of EcoTrack Solutions (Social Welfare Startup). Managing jobs, investor inquiries, and shared ideas. |
| **Alex Rivera** | Job Seeker | `alex.dev@gmail.com` | Junior Full Stack Dev (React, Python, Tailwind). High skill match on EcoTrack and HealthPulse openings. |
| **Marcus Vance** | Investor | `marcus.vc@apexventures.com` | Partner at Apex Seed Capital. Has access to confidential `INVESTOR_ONLY` startup briefs. |
| **Priya Patel** | Entrepreneur | `priya@healthpulse.ai` | MedTech engineer behind HealthPulse Diagnostics. |
| **Clara Sterling**| Investor | `clara.angel@horizon.com` | Angel investor focused on social impact and student ventures. |

> **Pro Tip:** In the top navigation bar, use the **"Demo Personas"** dropdown button to instantly switch between Sarah (Founder), Alex (Developer), and Marcus (Investor) without retyping credentials.

---

## ☁️ Production Deployment Guide

VentureBridge is pre-configured for continuous deployment with **Render** (FastAPI backend) and **Vercel** (Vite frontend).

### 1. Backend Deployment on Render

1. **Sign in to Render**: Navigate to [dashboard.render.com](https://dashboard.render.com) and click **New + > Web Service**.
2. **Connect Repository**: Select `sonu-527/venturebridge01` (Branch: `main`).
3. **Configure Service Settings**:
   - **Name**: `venturebridge-api` (or your choice)
   - **Region**: Closest to your users (e.g., Oregon, Frankfurt)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Configure Environment Variables**:
   In **Environment Variables**, add:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `JWT_SECRET` | *(Generate a 32+ character random string)* | Secret for signing JWT authentication tokens |
   | `ALLOWED_ORIGINS` | `https://venturebridge01.vercel.app` | Comma-separated list of allowed frontend origins |
   | `AUTO_SEED` | `true` | Automatically seeds demo personas & startups if DB is empty |
   | `DATABASE_URL` | *(Optional, see Database Persistence below)* | Connection string for Render PostgreSQL |
5. **Health Check Path**:
   Set Health Check Path to: `/health` (or `/api/health`).
6. **Deploy**: Click **Create Web Service**. Once deployed, copy your Render service URL (e.g., `https://venturebridge-api.onrender.com`).

#### 🗄️ Database Persistence on Render
- **Default (SQLite)**: By default, the application runs on SQLite (`venturebridge.db`). Note that Render Free web services have ephemeral storage, meaning changes are reset when the service restarts.
- **Production Persistence (PostgreSQL)**:
  1. In Render, click **New + > PostgreSQL**.
  2. Set database name (e.g., `venturebridge_db`).
  3. Copy the **Internal Database URL** (if backend is on Render) or **External Database URL**.
  4. Paste it as `DATABASE_URL` in your Web Service environment variables.
  5. The backend automatically detects PostgreSQL, sets up the full schema, and seeds demo personas on first launch!

---

### 2. Frontend Deployment on Vercel

The frontend is already linked to Vercel at `https://venturebridge01.vercel.app`.

To ensure the frontend communicates with your Render backend (fixing the demo login HTTP 404):

1. **Open Vercel Project**: Go to [vercel.com](https://vercel.com) and open your `venturebridge01` project.
2. **Project Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   Under **Settings > Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-render-backend-name>.onrender.com` (replace with your actual Render URL, without trailing slash)
   - Apply to: **Production**, **Preview**, and **Development**
4. **Redeploy**: Go to **Deployments > ... > Redeploy** to bake the new `VITE_API_BASE_URL` into the production build.

> **Why Demo Login Returned 404 Previously:**
> The frontend was previously requesting `/api/auth/login` on the Vercel domain (`https://venturebridge01.vercel.app/api/auth/login`), where no backend proxy existed. Setting `VITE_API_BASE_URL` directs all authentication and API calls to your live Render backend, while the new `frontend/vercel.json` SPA rewrite rule prevents client-side routing 404s on page refresh.

---

## 🧪 Testing & Verification

Run the automated integration test suite against the local or remote backend:
```bash
cd backend
python test_integration.py
```
Expected output:
```
==========================================
VENTUREBRIDGE COMPREHENSIVE INTEGRATION TEST
==========================================

0. Testing Health Checks and CORS Configuration...
  [PASS] Root endpoint '/' returned online status
  [PASS] Health check '/health' returned healthy status
  [PASS] Proxy health check '/api/health' returned healthy status
  [PASS] CORS preflight for 'https://venturebridge01.vercel.app' verified

...

==========================================
ALL 9 INTEGRATION TEST SUITES PASSED (100% SUCCESS)!
==========================================
```
