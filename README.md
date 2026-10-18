# 🚀 VentureBridge
### Connecting Talent, Startups & Capital

VentureBridge is a platform designed to connect **job seekers, startup founders, and investors** in one integrated ecosystem. It helps users discover employment opportunities, improve their skills, explore startups, connect with investors, and collaborate on new ventures.

Our vision is to bridge the gap between talent, entrepreneurship, and capital through a unified, interactive platform.

---

## 🏆 HackShift 2026 — IIIT Delhi

**Hackathon:** HackShift 2026  
**Institution:** Indraprastha Institute of Information Technology Delhi (IIIT Delhi)  
**Team Name:** NEXUSFORGE  
**Project:** VentureBridge

VentureBridge was developed by Team NEXUSFORGE as a hackathon project focused on employment discovery, startup growth, skill development, and investor-founder collaboration.

### 👥 Team NEXUSFORGE

| Team Member | Responsibility |
|---|---|
| **Nitin Kumar** | Team Leader |
| **Keshav Choudhary** | Frontend Development |
| **Palak Sharma** | AI & Ranking |
| **Sonu Kumar Mandal** | Backend & Data |
| **Surabhi Pathak** | UI/UX & Testing |

---

## ✨ Key Features

### 👨‍💻 1. Job Seeker Platform
- Discover job opportunities using search and filters.
- View job-specific skill-match percentages.
- Identify matched and missing skills.
- Save jobs and track applications.
- Edit profile information, education, and skills.
- Use the Skill Gap Analyzer to assess career readiness.
- Access relevant YouTube learning resources through Think & Grow.
- Improve skills with targeted learning recommendations.

### 🚀 2. Startup Founder Dashboard
- Create and manage startup profiles.
- Share startup ideas and explore structured, rule-based analysis.
- Discover potential team members and investors.
- Manage investor inquiries and connection requests.
- Edit startup details and business information.
- Enter monthly sales and revenue data where supported.
- Optionally provide unit economics.
- Track fundraising and business progress where implemented.

### 💼 3. Investor Discovery
- Discover startups across categories and industries.
- Explore startup details and available business metrics.
- Save interesting startups.
- Express investment interest.
- View startup ratings and experience comments according to permissions.
- Coordinate meetings with founders.
- Track investment-related discussions and milestones where supported.

### 🌱 4. Think & Grow — Skill Development
- Analyze missing skills for target roles.
- View matched skills and skill gaps.
- Access relevant YouTube learning links.
- Explore learning roadmaps and practice suggestions.
- Improve job readiness through targeted learning.

### ⭐ 5. Ratings & Experience
- Five-star rating system where enabled.
- Startup experience comments subject to eligibility and permissions.
- Role-based access controls for rating and review actions.
- Protection against unauthorized rating and review operations.

### 📊 6. Startup Analytics
- Monthly sales/revenue graph based on saved data.
- Optional unit economics breakdown.
- Editable business information.
- Financial details displayed according to access permissions.

### 🤝 7. Meetings & Collaboration
- Meeting requests between authorized participants.
- Proposed meeting dates and times.
- Approval and rejection workflows.
- Google Meet links when supplied or supported by the configured integration.
- Founder-investor collaboration and negotiation workflows where implemented.

### 💰 8. Fundraising & Progress Tracking
- Funding target and fundraising progress where supported.
- Investor interest and negotiation status.
- Investment milestone tracking.
- Founder progress updates for investors where implemented.

### 👥 9. People & Mentorship
- Discover potential collaborators.
- Send connection requests.
- Communicate through available messaging features.
- Discover mentors and request guidance.

### 🌐 10. Hindi & English Interface
- English and Hindi interface support.
- Consistent navigation across supported languages.

### 🎨 11. Modern User Experience
- Responsive dashboards and reusable components.
- Blue-and-yellow visual identity.
- Interactive forms and navigation.
- Loading, validation, and feedback states.

> Feature availability may depend on the current implementation, configuration, and external integrations. Do not interpret planned or partially implemented features as production-ready.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS and project styles |
| Backend | Python, FastAPI |
| API Communication | REST APIs |
| Authentication | Existing authentication and authorization system |
| Data Visualization | Existing charting components/libraries |
| Version Control | Git and GitHub |

---

## 🏗️ Project Structure

```text
VentureBridge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── main.py
│   ├── auth.py
│   └── ...
├── README.md
└── .gitignore
```

*Illustrative structure. The actual repository may contain additional files and folders.*

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)
- Git

### 1. Clone the repository

Replace the URL below with your actual GitHub repository URL.

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies using the dependency file included in the repository. If `requirements.txt` exists:

```bash
pip install -r requirements.txt
```

Configure the required environment variables using the project's environment example. Never commit secrets, passwords, or API keys.

Start the FastAPI server:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

API documentation, when enabled, is generally available at:

- `http://127.0.0.1:8000/docs`

Use the health-check endpoint configured in the actual backend.

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, commonly:

`http://localhost:5173`

If Vite selects another port, use the URL printed in the terminal.

### 4. Configure frontend-backend communication

Verify that the frontend's API configuration and Vite proxy point to the correct backend.

Use the existing configuration and environment variable names. Do not expose secrets in frontend code or commit private `.env` files.

---

## 🔐 Security

- Keep API keys and credentials out of source control.
- Enforce authorization on the backend.
- Protect investor-only startup information.
- Restrict financial records and meeting details to authorized users.
- Validate user input on both frontend and backend.
- Do not treat proposed investments as confirmed investments.
- Do not claim government verification unless it is genuinely integrated.

---

## 🧪 Testing

Run the frontend production build:

```bash
cd frontend
npm run build
```

Run backend tests using the commands and framework configured in the repository. For a pytest-based project:

```bash
python -m pytest
```

Verify authentication, role permissions, startup workflows, job applications, skill matching, financial data, and meeting approval workflows against the current implementation.

---

## 🚀 Future Scope

Potential improvements include:
- Smarter talent-to-startup matching.
- Expanded career learning pathways.
- Improved startup discovery and transparent ranking.
- More comprehensive bilingual support.
- Authorized Google Calendar/Meet integration.
- Richer startup analytics and milestone tracking.
- Enhanced collaboration and notification features.

---

## 🎯 Our Mission

VentureBridge aims to connect **talent, entrepreneurship, and capital** by helping people discover opportunities, founders build stronger ventures, and investors explore promising startups.

**Discover opportunities. Build ventures. Grow together.**

---

## 📄 License

No license has been specified yet. Add a `LICENSE` file before distributing the project under an open-source license.