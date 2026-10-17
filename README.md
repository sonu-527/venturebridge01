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

## 🧪 Testing

Run the automated integration test suite to verify all 9 core subsystems:
```bash
cd backend
python test_integration.py
```
Expected output:
```
ALL 9 INTEGRATION TEST SUITES PASSED (100% SUCCESS)!
```
