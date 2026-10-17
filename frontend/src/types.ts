export type UserRole = 'entrepreneur' | 'job_seeker' | 'investor' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  location?: string;
  profile_image?: string;
  bio?: string;
  is_verified?: number | boolean;
  created_at?: string;
}

export interface EntrepreneurProfile {
  id?: number;
  user_id?: number;
  startup_name?: string;
  industry?: string;
  startup_stage?: string;
  skills_needed?: string[];
}

export interface JobSeekerProfile {
  id?: number;
  user_id?: number;
  education?: string;
  skills?: string[];
  experience_level?: string;
  preferred_work_mode?: string;
  portfolio_url?: string;
  github_url?: string;
  career_interests?: string;
}

export interface InvestorProfile {
  id?: number;
  user_id?: number;
  investor_type?: string;
  areas_of_interest?: string;
  preferred_industries?: string;
  investment_stage_pref?: string;
}

export interface Startup {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  problem: string;
  solution: string;
  category: 'Tech Startups' | 'Non-Tech Startups' | 'Social Welfare Startups';
  industry: string;
  stage: string;
  location: string;
  website?: string;
  required_skills: string[];
  team_size: number;
  funding_stage?: string;
  funding_requirement?: string;
  verification_status: 'Verified' | 'Verification Pending' | 'Unverified';
  owner_name?: string;
  owner_email?: string;
  owner_image?: string;
  owner_location?: string;
  open_opportunities?: Opportunity[];
  created_at?: string;
}

export interface StartupIdea {
  id: number;
  user_id: number;
  title: string;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  industry: string;
  required_skills: string[];
  required_team_members?: string;
  startup_stage: string;
  funding_requirements?: string;
  visibility: 'PUBLIC' | 'INVESTOR_ONLY';
  analysis?: IdeaAnalysis;
  author_name?: string;
  author_email?: string;
  author_image?: string;
  created_at?: string;
}

export interface IdeaAnalysis {
  problem_clarity: string;
  target_customers: string;
  proposed_solution: string;
  required_skills: string[];
  possible_challenges: string[];
  team_requirements: string;
  analysis_type: string;
  disclaimer: string;
}

export interface Opportunity {
  id: number;
  creator_id: number;
  startup_id?: number;
  title: string;
  company: string;
  description: string;
  category: string;
  required_skills: string[];
  experience_level: string;
  work_mode: 'Remote' | 'On-site' | 'Hybrid';
  location: string;
  compensation?: string;
  verification_status: 'Verified' | 'Verification Pending' | 'Unverified';
  is_demo?: number;
  created_at?: string;
  creator_name?: string;
  is_saved?: boolean;
  is_applied?: boolean;
  match_score?: number | null;
  matched_skills?: string[];
  missing_skills?: string[];
  match_explanation?: string;
}

export interface Application {
  id: number;
  opportunity_id: number;
  user_id: number;
  cover_letter?: string;
  resume_url?: string;
  status: 'Submitted' | 'Under Review' | 'Shortlisted' | 'Rejected';
  created_at?: string;
  job_title?: string;
  company?: string;
  category?: string;
  work_mode?: string;
  location?: string;
  compensation?: string;
  required_skills?: string[];
  applicant_name?: string;
  applicant_email?: string;
  education?: string;
  skills?: string[];
}

export interface Connection {
  id: number;
  sender_id: number;
  receiver_id: number;
  message?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  peer_id?: number;
  peer_name?: string;
  peer_email?: string;
  peer_role?: string;
  peer_image?: string;
  peer_location?: string;
  sender_name?: string;
  sender_email?: string;
  sender_role?: string;
  sender_image?: string;
  receiver_name?: string;
  created_at?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name?: string;
}

export interface Mentor {
  id: number;
  name: string;
  area_of_expertise: string;
  industry: string;
  experience: string;
  areas_of_guidance: string;
  availability_status: 'Available' | 'Limited' | 'Busy';
  bio?: string;
  avatar_url?: string;
}

export interface MentorshipRequest {
  id: number;
  user_id: number;
  mentor_id: number;
  topic: string;
  message: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  mentor_name?: string;
  area_of_expertise?: string;
  avatar_url?: string;
  created_at: string;
}

export interface InvestorInterest {
  id: number;
  investor_id: number;
  startup_id: number;
  message: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  created_at?: string;
  startup_name?: string;
  category?: string;
  industry?: string;
  stage?: string;
  funding_requirement?: string;
  founder_name?: string;
  investor_name?: string;
  investor_email?: string;
  investor_image?: string;
  investor_type?: string;
}

export interface Report {
  id: number;
  reporter_id: number;
  target_type: 'Job' | 'Profile' | 'Startup';
  target_id: number;
  reason: string;
  details?: string;
  status: 'Pending Review' | 'Under Review' | 'Resolved';
  reporter_name?: string;
  reporter_email?: string;
  created_at?: string;
}

export interface Candidate {
  id: number;
  role: string;
  full_name: string;
  location?: string;
  profile_image?: string;
  bio?: string;
  is_verified?: boolean;
  education?: string;
  skills: string[];
  experience_level?: string;
  preferred_work_mode?: string;
  portfolio_url?: string;
  github_url?: string;
  career_interests?: string;
  match_score?: number;
  match_reason?: string;
}

export interface SkillGapResponse {
  target_role: string;
  total_benchmark_skills: number;
  matched_skills: string[];
  missing_skills: string[];
  progress_percent: number;
  recommended_priorities: Array<{
    skill: string;
    priority: string;
    suggested_action: string;
  }>;
  disclaimer: string;
}
