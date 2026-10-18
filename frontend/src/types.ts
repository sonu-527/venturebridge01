export type UserRole = 'entrepreneur' | 'job_seeker' | 'investor' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  location?: string;
  profile_image?: string;
  profile_url?: string;
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
  cgpa?: number;
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
  user_id?: number;
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
  funding_raised?: number;
  annual_profit?: number;
  profit_margin_pct?: number;
  is_student_run?: boolean | number;
  founder_meet_link?: string;
  average_rating?: number;
  total_ratings?: number;
  monthly_sales?: MonthlySalesData;
  unit_economics?: UnitEconomicsData;
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
  monthly_sales?: MonthlySalesData;
  unit_economics?: UnitEconomicsData;
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
  status: 'Pending' | 'Accepted' | 'Declined' | 'Investment Proposed' | 'Investment Confirmed' | 'Active Partnership';
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
  cgpa?: number;
  match_score?: number;
  match_reason?: string;
}

export interface SkillLearningResource {
  skill: string;
  importance: string;
  youtube_url: string;
  practice_project: string;
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
    importance?: string;
    youtube_url?: string;
    practice_project?: string;
  }>;
  learning_resources?: SkillLearningResource[];
  disclaimer: string;
}

export interface ChatbotResponse {
  reply: string;
  target_role: string;
  missing_skills: string[];
  resources: SkillLearningResource[];
  is_ai_fallback: boolean;
}

export interface RatingStats {
  target_type: 'founder' | 'investor';
  target_id: number;
  average_rating: number;
  total_ratings: number;
  display: string;
  breakdown: Record<number, number>;
  user_rating?: number | null;
  recent_reviews: Array<{
    id: number;
    rating: number;
    review_text?: string;
    rater_name: string;
    rater_role: string;
    created_at: string;
  }>;
}

export interface StartupComment {
  id: number;
  startup_id: number;
  user_id: number;
  comment_text: string;
  pros?: string;
  cons?: string;
  role_title?: string;
  employment_status: string;
  is_verified_employee: boolean | number;
  author_name: string;
  author_role: string;
  author_image?: string;
  created_at: string;
}

export interface MonthlySalesData {
  month: string;
  revenue: number;
  profit?: number;
  orders?: number;
  currency?: string;
}

export interface UnitEconomicsData {
  cac?: number;
  cogs?: number;
  logistics?: number;
  revenue_per_unit?: number;
  gross_margin?: number;
  net_margin?: number;
  currency?: string;
  notes?: string;
  [key: string]: any;
}

export interface MeetingRequest {
  id: number;
  requester_id: number;
  recipient_id: number;
  title: string;
  purpose?: string;
  meeting_date: string;
  start_time: string;
  scheduled_at: string;
  duration_minutes: number;
  time_zone: string;
  agenda?: string;
  google_meet_url?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
  created_at: string;
  updated_at: string;
  requester_name?: string;
  requester_role?: string;
  requester_image?: string;
  requester_email?: string;
  recipient_name?: string;
  recipient_role?: string;
  recipient_image?: string;
  recipient_email?: string;
  is_requester?: boolean;
  is_recipient?: boolean;
  link_pending?: boolean;
  can_join?: boolean;
}

export interface Top10Startup {
  id: number;
  owner_id?: number;
  user_id?: number;
  name: string;
  description?: string;
  rank: number;
  ranking_score: number;
  ranking_reason: string;
  ranking_evidence: string;
  is_reported_metric: boolean;
  google_meet_url: string;
  founder_meet_link?: string;
  verification_status?: 'Verified' | 'Verification Pending' | 'Unverified';
  is_student_run?: boolean | number;
  annual_profit?: number;
  profit_margin_pct?: number;
  funding_stage?: string;
  average_rating?: number;
  monthly_sales?: MonthlySalesData[];
  unit_economics?: UnitEconomicsData;
  latest_monthly_revenue?: number;
  latest_monthly_profit?: number;
  founder_rating?: number;
  founder_ratings_count?: number;
  category: string;
  industry: string;
  stage: string;
  location: string;
  owner_name: string;
  owner_email: string;
  owner_image?: string;
  owner_bio?: string;
  funding_raised?: number;
  funding_currency?: string;
  funding_requirement?: string;
  required_skills: string[];
}

export interface ShortlistedCandidate {
  id: number;
  full_name: string;
  email: string;
  profile_image?: string;
  location?: string;
  education?: string;
  skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  skill_match_score: number;
  education_score: number;
  composite_score: number;
  education_status: string;
  has_academic_data: boolean;
  is_eligible_under_50_rule: boolean;
  explanation: string;
  cgpa?: number;
  academic_percentage?: number;
  rank?: number;
}

export interface CandidateShortlistResponse {
  opportunity_id: number;
  opportunity_title: string;
  required_skills: string[];
  formula: string;
  top_candidates: ShortlistedCandidate[];
}

export interface GroupMeeting {
  id: number;
  opportunity_id?: number;
  creator_id: number;
  title: string;
  agenda?: string;
  scheduled_at: string;
  google_meet_url: string;
  candidate_ids: number[];
  creator_name?: string;
  created_at?: string;
}

export interface NegotiationMessage {
  id: number;
  room_id: number;
  sender_id: number;
  message_type: string;
  content: string;
  proposed_amount?: number;
  proposed_equity?: number;
  proposed_valuation?: number;
  sender_name?: string;
  sender_role?: string;
  created_at: string;
}

export interface NegotiationRoom {
  id: number;
  startup_id: number;
  founder_id: number;
  investor_id: number;
  status: 'Draft' | 'Proposed' | 'Countered' | 'Accepted' | 'Rejected' | 'Closed';
  proposed_amount: number;
  currency: string;
  proposed_valuation: number;
  proposed_equity: number;
  milestones?: string;
  google_meet_link: string;
  notes?: string;
  startup_name?: string;
  startup_industry?: string;
  founder_name?: string;
  founder_email?: string;
  investor_name?: string;
  investor_email?: string;
  messages?: NegotiationMessage[];
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyProgressReport {
  id: number;
  startup_id: number;
  investor_id: number;
  reporting_month: string;
  revenue: number;
  expenses: number;
  milestones_achieved?: string;
  challenges?: string;
  next_month_goals?: string;
  notes?: string;
  startup_name?: string;
  founder_name?: string;
  investor_name?: string;
  created_at: string;
}

export interface MonthlyReminder {
  startup_id: number;
  startup_name: string;
  investor_id: number;
  investor_name: string;
  reporting_month: string;
  reminder_text: string;
  due_date: string;
}

export interface FundraisingCommandCenterData {
  startup_id: number;
  startup_name: string;
  funding_currency: string;
  target_funding_goal: number;
  total_raised: number;
  remaining_needed: number;
  progress_percentage: number;
  confirmed_investments: Array<{
    id: number;
    amount: number;
    currency: string;
    source_type: string;
    investor_name: string;
    investor_email: string;
    created_at: string;
  }>;
  pending_proposals: Array<{
    id: number;
    proposed_amount: number;
    currency: string;
    proposed_equity: number;
    proposed_valuation: number;
    status: string;
    investor_name: string;
    updated_at: string;
  }>;
  is_owner: boolean;
}

