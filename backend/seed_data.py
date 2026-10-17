import json
from datetime import datetime
from database import get_db, init_db
from auth import hash_password

def seed_all():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] > 0:
            print("Database already contains data. Skipping seeding.")
            return

        now = datetime.now().isoformat()

        # 1. USERS
        users_data = [
            # Entrepreneurs
            ("founder@ecotrack.io", "password123", "entrepreneur", "Sarah Chen", "San Francisco, CA", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", "Founder of EcoTrack Solutions. Passionate about climate tech, circular economy, and building sustainable community impact.", 1),
            ("priya@healthpulse.ai", "password123", "entrepreneur", "Priya Patel", "Boston, MA", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", "MedTech engineer and founder of HealthPulse. Developing edge AI diagnostics for rural clinics.", 1),
            ("david@craftroot.org", "password123", "entrepreneur", "David Miller", "Austin, TX", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "Social entrepreneur leading CraftRoot Collective to empower rural indigenous artisans with fair supply chains.", 1),
            
            # Job Seekers
            ("alex.dev@gmail.com", "password123", "job_seeker", "Alex Rivera", "Seattle, WA", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "Junior Full-Stack Developer specializing in React, TypeScript, and Python. Recent CS graduate eager to contribute to high-impact products.", 1),
            ("emma.design@gmail.com", "password123", "job_seeker", "Emma Watson", "New York, NY", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "Product designer focused on user research, intuitive design systems, and mobile accessibility.", 1),
            ("liam.data@gmail.com", "password123", "job_seeker", "Liam Johnson", "Chicago, IL", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "Aspiring Data Analyst proficient in SQL, Python, Pandas, and building interactive business intelligence dashboards.", 0),
            
            # Investors
            ("marcus.vc@apexventures.com", "password123", "investor", "Marcus Vance", "San Francisco, CA", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80", "Managing Partner at Apex Seed Capital. Investing in early-stage climate tech, health systems, and high-traction B2B SaaS.", 1),
            ("clara.angel@horizon.com", "password123", "investor", "Clara Sterling", "New York, NY", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "Angel Investor & former CTO backing student founders and mission-driven social welfare enterprises.", 1)
        ]

        user_ids = {}
        for email, pwd, role, name, loc, img, bio, is_ver in users_data:
            cursor.execute("""
            INSERT INTO users (email, password_hash, role, full_name, location, profile_image, bio, is_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (email, hash_password(pwd), role, name, loc, img, bio, is_ver, now, now))
            user_ids[email] = cursor.lastrowid

        # 2. PROFILES
        # Entrepreneur profiles
        cursor.execute("""
        INSERT INTO entrepreneur_profiles (user_id, startup_name, industry, startup_stage, skills_needed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_ids["founder@ecotrack.io"], "EcoTrack Solutions", "CleanTech & Sustainability", "MVP / Prototype", json.dumps(["React", "Python", "GIS", "IoT", "Data Analytics"]), now, now))

        cursor.execute("""
        INSERT INTO entrepreneur_profiles (user_id, startup_name, industry, startup_stage, skills_needed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_ids["priya@healthpulse.ai"], "HealthPulse Diagnostics", "MedTech & AI", "Early Traction", json.dumps(["Python", "Machine Learning", "FastAPI", "React", "Docker"]), now, now))

        cursor.execute("""
        INSERT INTO entrepreneur_profiles (user_id, startup_name, industry, startup_stage, skills_needed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_ids["david@craftroot.org"], "CraftRoot Collective", "Fair Trade & E-Commerce", "MVP / Prototype", json.dumps(["Shopify", "Supply Chain", "Marketing", "UI/UX", "Logistics"]), now, now))

        # Job Seeker profiles
        cursor.execute("""
        INSERT INTO job_seeker_profiles (user_id, education, skills, experience_level, preferred_work_mode, portfolio_url, github_url, career_interests, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["alex.dev@gmail.com"],
            "B.S. in Computer Science, University of Washington (2025)",
            json.dumps(["React", "JavaScript", "TypeScript", "Python", "HTML", "CSS", "Tailwind CSS", "Git"]),
            "Entry Level",
            "Hybrid",
            "https://alexrivera.dev",
            "https://github.com/alexrivera-dev",
            "Full Stack Web Development, Sustainable Tech, Early-stage Startups",
            now, now
        ))

        cursor.execute("""
        INSERT INTO job_seeker_profiles (user_id, education, skills, experience_level, preferred_work_mode, portfolio_url, github_url, career_interests, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["emma.design@gmail.com"],
            "B.Des in Interaction Design, RISD (2024)",
            json.dumps(["Figma", "UI/UX", "User Research", "Wireframing", "Prototyping", "HTML", "CSS"]),
            "Junior",
            "Remote",
            "https://emmawatson.design",
            "https://github.com/emma-ux",
            "Design Systems, Mobile UX, HealthTech Accessibility",
            now, now
        ))

        cursor.execute("""
        INSERT INTO job_seeker_profiles (user_id, education, skills, experience_level, preferred_work_mode, portfolio_url, github_url, career_interests, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["liam.data@gmail.com"],
            "B.S. in Applied Statistics & Data Science, UIUC (2025)",
            json.dumps(["Python", "SQL", "Pandas", "NumPy", "Data Visualization", "Tableau", "Machine Learning"]),
            "Entry Level",
            "Remote",
            "https://liamjohnson.data",
            "https://github.com/liam-analytics",
            "Data Analytics, AI Applications, Cleantech Logistics",
            now, now
        ))

        # Investor profiles
        cursor.execute("""
        INSERT INTO investor_profiles (user_id, investor_type, areas_of_interest, preferred_industries, investment_stage_pref, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["marcus.vc@apexventures.com"],
            "Venture Capital",
            "Scalable B2B SaaS, HealthTech hardware/software combinations, CleanTech infrastructure",
            "CleanTech, HealthTech, Enterprise Software",
            "Pre-Seed & Seed",
            now, now
        ))

        cursor.execute("""
        INSERT INTO investor_profiles (user_id, investor_type, areas_of_interest, preferred_industries, investment_stage_pref, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["clara.angel@horizon.com"],
            "Angel Investor",
            "Social impact ventures, community empowerment, educational equity, female-founded startups",
            "Social Welfare, EdTech, Fair Trade & Consumer",
            "Pre-Seed",
            now, now
        ))

        # 3. STARTUPS (Fictional Tech, Non-Tech, and Social Welfare Startups)
        startups_data = [
            (
                user_ids["founder@ecotrack.io"],
                "EcoTrack Solutions",
                "Hyperlocal community recycling infrastructure and circular packaging tracking platform.",
                "Urban areas face a 73% recycling contamination rate because residents lack clear visibility into local processing protocols and drop-off points.",
                "EcoTrack provides smart drop-off stations with computer vision verification and gives residents instant community micro-credits.",
                "Social Welfare Startups",
                "CleanTech & Circular Economy",
                "MVP / Prototype",
                "San Francisco, CA",
                "https://ecotrack-demo.internal",
                json.dumps(["React", "Python", "Computer Vision", "Tailwind CSS", "IoT"]),
                4,
                "Pre-Seed",
                "$250,000",
                "Verified"
            ),
            (
                user_ids["priya@healthpulse.ai"],
                "HealthPulse Diagnostics",
                "Edge AI telemetry device providing rapid cardiovascular risk assessments in remote clinics.",
                "Over 45 million rural patients live more than 90 miles from a board-certified cardiologist, causing delayed diagnoses in critical cardiac conditions.",
                "A battery-operated 6-lead ECG scanner connected to an on-device lightweight AI neural model that generates clinical insights within 45 seconds.",
                "Tech Startups",
                "Healthcare & Medical AI",
                "Early Traction",
                "Boston, MA",
                "https://healthpulse-demo.internal",
                json.dumps(["Python", "Machine Learning", "FastAPI", "React", "Docker", "Embedded C"]),
                6,
                "Seed",
                "$750,000",
                "Verified"
            ),
            (
                user_ids["david@craftroot.org"],
                "CraftRoot Collective",
                "Direct fair-trade supply chain network connecting traditional artisans with ethical retail partners.",
                "Traditional handicraft makers lose 80% of wholesale margin to intermediary brokers, driving younger generations away from heritage crafts.",
                "A verified collective supply platform managing direct batch logistics, export certifications, and transparent blockchain receipts for artisans.",
                "Non-Tech Startups",
                "Fair Trade & Artisan Commerce",
                "MVP / Prototype",
                "Austin, TX",
                "https://craftroot-demo.internal",
                json.dumps(["Supply Chain", "Marketing", "E-Commerce", "Operations", "Logistics"]),
                3,
                "Bootstrapped",
                "$100,000",
                "Verification Pending"
            ),
            (
                user_ids["founder@ecotrack.io"],
                "SolarShuttle Transit",
                "Subsidized zero-emission community school transit network for underserved educational districts.",
                "High student absenteeism correlates directly with unsafe or non-existent public transit connections in low-income school catchments.",
                "Fleet of 100% solar-charged electric minibuses with route-optimization software and real-time parent tracking alerts.",
                "Social Welfare Startups",
                "Green Mobility & Public Good",
                "Idea Phase",
                "Oakland, CA",
                "https://solarshuttle-demo.internal",
                json.dumps(["Fleet Logistics", "Route Optimization", "Community Outreach", "Mobile App Dev"]),
                2,
                "Pre-Seed",
                "$300,000",
                "Unverified"
            ),
            (
                user_ids["priya@healthpulse.ai"],
                "AgriSense Microfarms",
                "Low-cost microclimate sensor modules for urban hydroponic greenhouse farmers.",
                "Indoor vertical and hydroponic farmers lose up to 30% of high-value yields due to undetected micro-variations in reservoir pH and canopy humidity.",
                "Plug-and-play wireless sensor nodes with automated nutrient dosing valve triggers and predictive harvest timing.",
                "Tech Startups",
                "AgriTech & Smart Farming",
                "MVP / Prototype",
                "Denver, CO",
                "https://agrisense-demo.internal",
                json.dumps(["IoT Hardware", "Python", "Data Analytics", "React"]),
                3,
                "Pre-Seed",
                "$180,000",
                "Verified"
            )
        ]

        startup_ids = []
        for owner_id, name, desc, prob, sol, cat, ind, stg, loc, web, req_sk, t_sz, f_stg, f_req, v_st in startups_data:
            cursor.execute("""
            INSERT INTO startups (owner_id, name, description, problem, solution, category, industry, stage, location, website, required_skills, team_size, funding_stage, funding_requirement, verification_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (owner_id, name, desc, prob, sol, cat, ind, stg, loc, web, req_sk, t_sz, f_stg, f_req, v_st, now, now))
            startup_ids.append(cursor.lastrowid)

        # 4. STARTUP IDEAS (PUBLIC & INVESTOR_ONLY)
        ideas_data = [
            (
                user_ids["founder@ecotrack.io"],
                "EduLoop: Peer Micro-Tutoring Exchange",
                "University students struggle to find immediate 15-minute concept explanations for complex STEM problem sets, while senior students have spare hours but no easy way to monetize short tips.",
                "A campus-gated micro-tutoring marketplace with 1-on-1 whiteboard sessions and student token incentives.",
                "Undergraduate engineering and science students worldwide.",
                "EdTech",
                json.dumps(["WebRTC", "React", "Node.js", "Redis"]),
                "Technical Co-founder with WebRTC experience, Student Campus Lead",
                "Idea Phase",
                "$50,000 proof-of-concept grant",
                "PUBLIC",
                json.dumps({
                    "problem_clarity": "High - clearly articulated student friction point in higher education STEM courses.",
                    "target_customers": "Undergraduate engineering students, teaching assistants, and university honor societies.",
                    "proposed_solution": "Real-time micro-sessions under 20 minutes with integrated canvas drawing and automated matching.",
                    "required_skills": ["WebRTC", "React", "Node.js", "Redis"],
                    "possible_challenges": ["Campus network restrictions", "Quality control on explanations", "Exam policy compliance"],
                    "team_requirements": "Requires 1 technical architect and 2 campus student community coordinators."
                })
            ),
            (
                user_ids["priya@healthpulse.ai"],
                "NeuroScribe: HIPAA-Compliant Voice Charting Engine",
                "Primary care physicians spend an average of 2.1 hours every evening manually inputting patient diagnostic notes into EHR software, leading to severe clinical burnout.",
                "A local on-device small language model paired with speech-to-text that converts ambient clinical dialogues into structured FHIR records with zero cloud data transmission.",
                "Outpatient clinics, regional hospital groups, and independent general practitioners.",
                "HealthTech & AI",
                json.dumps(["Speech-to-Text", "Python", "Local LLM Optimization", "HIPAA Compliance", "FastAPI"]),
                "AI/ML Research Engineer, Clinical Workflow Specialist",
                "MVP / Prototype",
                "$500,000 for clinical pilot trials and FDA 510(k) pre-submission",
                "INVESTOR_ONLY",
                json.dumps({
                    "problem_clarity": "Exceptional - widespread clinical documentation overhead with measurable dollar savings per physician hour.",
                    "target_customers": "Hospital systems, ambulatory surgical centers, and private family medicine practices.",
                    "proposed_solution": "Offline edge processing hardware unit that plugs directly into existing electronic health record terminals.",
                    "required_skills": ["Speech-to-Text", "Python", "Local LLM Optimization", "HIPAA Compliance", "FastAPI"],
                    "possible_challenges": ["Diverse medical accents and dialects", "Strict HIPAA security certifications", "Lengthy enterprise sales cycles"],
                    "team_requirements": "Looking for medical informatics co-founder and senior PyTorch/C++ inference specialist."
                })
            ),
            (
                user_ids["david@craftroot.org"],
                "FreshBite: Hyperlocal Food Rescue Grid",
                "Small bakeries and independent grocery markets discard over $2B of consumable shelf-life inventory daily, while local food pantries lack dynamic visibility.",
                "Automated end-of-day dispatch platform notifying nearby emergency kitchens with pre-arranged zero-emission cargo bicycle collection routes.",
                "Urban independent grocery retailers, artisan bakeries, and soup kitchen coordinators.",
                "Social Welfare & Logistics",
                json.dumps(["React Native", "Mapbox", "Logistics Optimization", "Community Management"]),
                "Operations Coordinator, Mobile App Developer",
                "Idea Phase",
                "$75,000 community impact funding",
                "PUBLIC",
                json.dumps({
                    "problem_clarity": "Very High - direct alignment with urban food waste reduction and anti-poverty community initiatives.",
                    "target_customers": "Independent neighborhood grocers, community food hubs, and shelter volunteers.",
                    "proposed_solution": "Instant batch dispatch notifications triggered at closing hour with volunteer courier route routing.",
                    "required_skills": ["React Native", "Mapbox", "Logistics Optimization", "Community Management"],
                    "possible_challenges": ["Cold-chain food safety handling laws", "Volunteer driver reliability", "Short pickup windows"],
                    "team_requirements": "Lead mobile app developer and community food pantry liaison."
                })
            ),
            (
                user_ids["founder@ecotrack.io"],
                "GridBalance: Microgrid Energy Arbitrage Protocol",
                "Commercial buildings with rooftop solar waste up to 34% of generated surplus power during peak generation hours due to low feed-in tariffs.",
                "Intelligent battery pack controller that calculates local spot electricity tariffs in real-time and sells power back during peak demand windows.",
                "Commercial property managers and clean energy industrial parks.",
                "CleanTech Energy",
                json.dumps(["Smart Grid Protocols", "Embedded Systems", "Time Series Forecasting", "Python"]),
                "Hardware Systems Architect, Clean Energy Regulatory Advisor",
                "Early Traction",
                "$1,200,000 Series Seed",
                "INVESTOR_ONLY",
                json.dumps({
                    "problem_clarity": "High - substantial commercial savings on peak power charges and demand response credits.",
                    "target_customers": "Commercial real estate owners, logistics distribution warehouses, and microgrid cooperatives.",
                    "proposed_solution": "Turnkey hardware gateway and cloud dashboard connecting building battery storage with utility demand response programs.",
                    "required_skills": ["Smart Grid Protocols", "Embedded Systems", "Time Series Forecasting", "Python"],
                    "possible_challenges": ["Utility interconnect approval delays", "High battery capital expenditures", "Regional grid tariff disparities"],
                    "team_requirements": "Needs enterprise sales executive and electrical power systems engineer."
                })
            )
        ]

        for u_id, title, prob, sol, aud, ind, r_sk, r_tm, stg, fund, vis, ana in ideas_data:
            cursor.execute("""
            INSERT INTO startup_ideas (user_id, title, problem_statement, proposed_solution, target_audience, industry, required_skills, required_team_members, startup_stage, funding_requirements, visibility, analysis_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (u_id, title, prob, sol, aud, ind, r_sk, r_tm, stg, fund, vis, ana, now, now))

        # 5. OPPORTUNITIES (Jobs, Internships, Freelance, Remote, Teaching)
        opps_data = [
            (
                user_ids["founder@ecotrack.io"],
                startup_ids[0],
                "Frontend Developer Intern",
                "EcoTrack Solutions",
                "Join our core team to build responsive dashboards, interactive city waste collection maps, and user reward tracking portals. You will collaborate directly with our founding engineer and product lead.",
                "Internships",
                json.dumps(["React", "JavaScript", "HTML", "CSS", "Tailwind CSS"]),
                "Entry-level",
                "Hybrid",
                "San Francisco, CA (or Remote)",
                "$28 - $35 / hr",
                "Verified",
                1
            ),
            (
                user_ids["priya@healthpulse.ai"],
                startup_ids[1],
                "Junior Full Stack Engineer",
                "HealthPulse Diagnostics",
                "We are seeking an ambitious software engineer to develop web portals for rural clinic doctors. You will work on real-time biometric visualization components and secure backend API integrations.",
                "Full-time Jobs",
                json.dumps(["React", "TypeScript", "Python", "FastAPI", "Tailwind CSS", "Git"]),
                "Entry-level",
                "Remote",
                "Boston, MA / Remote",
                "$85,000 - $105,000 / yr + Equity",
                "Verified",
                1
            ),
            (
                user_ids["david@craftroot.org"],
                startup_ids[2],
                "E-Commerce & Supply Chain Coordinator",
                "CraftRoot Collective",
                "Help us manage inventory flow from artisan workshops across the Southwest, coordinate retail shipments, and optimize our digital marketplace listings.",
                "Full-time Jobs",
                json.dumps(["Supply Chain", "E-Commerce", "Operations", "Communication", "Marketing"]),
                "Intermediate",
                "On-site",
                "Austin, TX",
                "$55,000 - $68,000 / yr",
                "Verification Pending",
                1
            ),
            (
                user_ids["founder@ecotrack.io"],
                startup_ids[0],
                "UI/UX Design Contractor - Citizen App",
                "EcoTrack Solutions",
                "Design mobile-first wireframes and high-fidelity prototypes for our resident recycling reward app. Focus on accessibility, clean typography, and delightful micro-interactions.",
                "Freelance Projects",
                json.dumps(["Figma", "UI/UX", "User Research", "Wireframing", "Prototyping"]),
                "Intermediate",
                "Remote",
                "Remote",
                "$4,500 fixed contract (6 weeks)",
                "Verified",
                1
            ),
            (
                user_ids["priya@healthpulse.ai"],
                startup_ids[4],
                "Data Science & Analytics Intern",
                "AgriSense Microfarms",
                "Analyze environmental sensor time-series datasets from greenhouse testbeds. Build automated anomaly detection models to alert growers about rapid humidity and temperature spikes.",
                "Internships",
                json.dumps(["Python", "SQL", "Pandas", "NumPy", "Data Visualization", "Machine Learning"]),
                "Entry-level",
                "Remote",
                "Denver, CO / Remote",
                "$26 - $32 / hr",
                "Verified",
                1
            ),
            (
                user_ids["david@craftroot.org"],
                startup_ids[2],
                "Part-time Graphic & Packaging Designer",
                "CraftRoot Collective",
                "Create sustainable, minimalist packaging labels and storytelling inserts for handmade artisan home decor products shipped to international boutique retailers.",
                "Part-time Jobs",
                json.dumps(["Figma", "Graphic Design", "Branding", "Adobe Illustrator"]),
                "Intermediate",
                "Remote",
                "Remote",
                "$35 / hr (15-20 hrs/week)",
                "Verification Pending",
                1
            ),
            (
                user_ids["founder@ecotrack.io"],
                startup_ids[3],
                "Community Outreach & Route Planner",
                "SolarShuttle Transit",
                "Engage with parent-teacher associations, survey community transportation needs, and assist our operations director in optimizing clean school minibus routes.",
                "Entry-level Jobs",
                json.dumps(["Community Outreach", "Route Optimization", "Communication", "Spreadsheets"]),
                "Entry-level",
                "On-site",
                "Oakland, CA",
                "$24 / hr",
                "Unverified",
                1
            ),
            (
                user_ids["priya@healthpulse.ai"],
                None,
                "Web & Python Student Tutor / Mentor",
                "MedTech Student Bridge",
                "Conduct interactive 1-on-1 tutoring sessions for undergraduate students learning Python algorithms and React frontend fundamentals. Help learners build confidence.",
                "Teaching and Tutoring",
                json.dumps(["Python", "JavaScript", "React", "Teaching", "Git"]),
                "All Levels",
                "Remote",
                "Remote",
                "$40 / hr flexible",
                "Verified",
                1
            )
        ]

        opp_ids = []
        for cr_id, st_id, title, comp, desc, cat, req_sk, exp_lv, w_mode, loc, compen, v_st, is_dm in opps_data:
            cursor.execute("""
            INSERT INTO opportunities (creator_id, startup_id, title, company, description, category, required_skills, experience_level, work_mode, location, compensation, verification_status, is_demo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (cr_id, st_id, title, comp, desc, cat, req_sk, exp_lv, w_mode, loc, compen, v_st, is_dm, now))
            opp_ids.append(cursor.lastrowid)

        # 6. MENTORS (Notice: NO mentor feedback tables or columns!)
        mentors_data = [
            (
                "Dr. Aris Thorne",
                "Distributed Systems & Cloud Architecture",
                "Enterprise Tech & Infrastructure",
                "18+ years (Ex-VP Engineering at CloudScale, Author)",
                "Scalable System Architecture, Engineering Team Leadership, Tech Stack Selection, API Design",
                "Available",
                "Passionate about mentoring early-career engineers and student founders building resilient, high-throughput cloud architectures.",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"
            ),
            (
                "Elena Rostova",
                "Seed Fundraising & Venture Pitching",
                "Venture Capital & Startups",
                "14+ years (2x Exited Founder, Angel Investor)",
                "Pitch Deck Storytelling, Cap Table Strategy, Early Customer Validation, Investor Diligence",
                "Limited",
                "Helping pre-seed founders clarify value propositions, avoid common cap table pitfalls, and conduct persuasive investor presentations.",
                "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80"
            ),
            (
                "Tunde Adebayo",
                "Product Discovery & MVP Scoping",
                "B2B SaaS & Product Management",
                "11+ years (Principal Product Manager at FinGlobal)",
                "MVP Feature Prioritization, Customer Discovery Interviews, Metric Definition, User Journey Mapping",
                "Available",
                "Dedicated to preventing startup feature bloat. I guide founders to launch lean experiments that prove real market demand quickly.",
                "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80"
            ),
            (
                "Maya Lin",
                "Social Welfare Strategy & Circular Economy",
                "Sustainability & Non-Profit Leadership",
                "16+ years (Director at EcoFuture Institute)",
                "Grant Writing, Social Impact Metrics, Community Stakeholder Buy-in, Ethical Governance",
                "Available",
                "Guiding social entrepreneurs to balance sustainable revenue models with genuine, measurable community welfare impact.",
                "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
            )
        ]

        for name, exp_area, ind, exp_yrs, guid_areas, avail, bio, av_url in mentors_data:
            cursor.execute("""
            INSERT INTO mentors (name, area_of_expertise, industry, experience, areas_of_guidance, availability_status, bio, avatar_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, exp_area, ind, exp_yrs, guid_areas, avail, bio, av_url, now))

        # 7. SAMPLE APPLICATION
        cursor.execute("""
        INSERT INTO applications (opportunity_id, user_id, cover_letter, resume_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            opp_ids[0], # EcoTrack Frontend Intern
            user_ids["alex.dev@gmail.com"],
            "Hi Sarah, I am excited about EcoTrack's mission to combat urban recycling contamination. I built a community waste sorting project during university using React and Tailwind CSS and would love to contribute to your client portal.",
            "https://alexrivera.dev/resume.pdf",
            "Under Review",
            now, now
        ))

        cursor.execute("""
        INSERT INTO applications (opportunity_id, user_id, cover_letter, resume_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            opp_ids[1], # HealthPulse Junior Full Stack
            user_ids["alex.dev@gmail.com"],
            "Dear HealthPulse team, my background in React and Python matches your clinic visualization requirements. I care deeply about healthcare accessibility in underserved regions.",
            "https://alexrivera.dev/resume.pdf",
            "Submitted",
            now, now
        ))

        # 8. SAVED OPPORTUNITIES & STARTUPS
        cursor.execute("""
        INSERT INTO saved_opportunities (user_id, opportunity_id, created_at)
        VALUES (?, ?, ?)
        """, (user_ids["alex.dev@gmail.com"], opp_ids[1], now))

        cursor.execute("""
        INSERT INTO saved_startups (user_id, startup_id, created_at)
        VALUES (?, ?, ?)
        """, (user_ids["marcus.vc@apexventures.com"], startup_ids[0], now))

        cursor.execute("""
        INSERT INTO saved_startups (user_id, startup_id, created_at)
        VALUES (?, ?, ?)
        """, (user_ids["marcus.vc@apexventures.com"], startup_ids[1], now))

        # 9. INVESTOR INTEREST REQUEST
        cursor.execute("""
        INSERT INTO investor_interests (investor_id, startup_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_ids["marcus.vc@apexventures.com"],
            startup_ids[0],
            "Hello Sarah, we've reviewed EcoTrack's urban recycling model at Apex Seed Capital. We would like to schedule a 30-minute intro call to discuss your pre-seed round milestones.",
            "Accepted",
            now, now
        ))

        cursor.execute("""
        INSERT INTO investor_interests (investor_id, startup_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_ids["clara.angel@horizon.com"],
            startup_ids[2],
            "Hi David, CraftRoot's direct artisan model aligns with my angel thesis on ethical trade and indigenous empowerment. Let's connect.",
            "Pending",
            now, now
        ))

        # 10. CONNECTIONS
        cursor.execute("""
        INSERT INTO connections (sender_id, receiver_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_ids["alex.dev@gmail.com"],
            user_ids["founder@ecotrack.io"],
            "Hi Sarah! I am a junior full-stack developer passionate about EcoTrack's green mission. Would love to stay connected.",
            "Accepted",
            now, now
        ))

        cursor.execute("""
        INSERT INTO connections (sender_id, receiver_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_ids["emma.design@gmail.com"],
            user_ids["founder@ecotrack.io"],
            "Hi Sarah, I saw your freelance design opportunity. I would love to connect and share some portfolio samples.",
            "Pending",
            now, now
        ))

        # 11. MESSAGES (between accepted connections)
        cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?)
        """, (
            user_ids["alex.dev@gmail.com"],
            user_ids["founder@ecotrack.io"],
            "Hi Sarah! Thank you for accepting my connection request. Looking forward to hearing your thoughts on my application.",
            now
        ))

        cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?)
        """, (
            user_ids["founder@ecotrack.io"],
            user_ids["alex.dev@gmail.com"],
            "Welcome Alex! Your background in React and Tailwind is a strong match. I am reviewing your code portfolio today.",
            now
        ))

        # 12. SAMPLE TRUST REPORT
        cursor.execute("""
        INSERT INTO reports (reporter_id, target_type, target_id, reason, details, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_ids["alex.dev@gmail.com"],
            "Job",
            opp_ids[6], # SolarShuttle
            "Unverified recruiter contact info",
            "Listing provides an external contact form that asks for personal phone number before showing job scope.",
            "Under Review",
            now, now
        ))

        print("Database seeded successfully with rich demo data!")

if __name__ == "__main__":
    seed_all()
