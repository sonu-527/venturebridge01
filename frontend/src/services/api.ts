import {
  User,
  Startup,
  StartupIdea,
  Opportunity,
  Application,
  Connection,
  Message,
  Mentor,
  MentorshipRequest,
  InvestorInterest,
  Report,
  Candidate,
  SkillGapResponse,
  IdeaAnalysis,
  RatingStats,
  StartupComment,
  Top10Startup,
  CandidateShortlistResponse,
  GroupMeeting,
  NegotiationRoom,
  NegotiationMessage,
  MonthlyProgressReport,
  MonthlyReminder,
  FundraisingCommandCenterData,
  MeetingRequest
} from '../types';

// Resolve API base URL:
// In local Vite dev, defaults to '/api' (proxied via vite.config.ts to 127.0.0.1:8000).
// In production on Vercel, reads VITE_API_BASE_URL (e.g. 'https://venturebridge-api.onrender.com').
const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
const trimmedBase = rawBase.replace(/\/+$/, '');
export const API_BASE = trimmedBase.endsWith('/api')
  ? trimmedBase
  : (trimmedBase === '' ? '/api' : `${trimmedBase}/api`);

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('vb_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithSafeErrors(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (err instanceof TypeError || (err.message && err.message.toLowerCase().includes('fetch'))) {
      throw new Error(
        'Unable to reach backend server. If Render free tier was idle, the service may take 30-50 seconds to spin up. Please wait a moment and retry.'
      );
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = 'An unexpected error occurred';
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const err = await res.json();
        errMessage = err.detail || err.message || errMessage;
      } else {
        const text = await res.text();
        if (res.status === 404) {
          errMessage = 'Backend endpoint not found (HTTP 404). If deployed on Vercel, please verify that VITE_API_BASE_URL is set in your Vercel project environment variables to your Render backend URL (e.g. https://<backend-app>.onrender.com).';
        } else if (res.status === 502 || res.status === 503) {
          errMessage = 'Backend service is starting up (Render free tier spin-up). Please wait 30 seconds and retry.';
        } else {
          errMessage = `Server error (HTTP ${res.status}): ${text.slice(0, 150) || res.statusText}`;
        }
      }
    } catch {
      errMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ access_token: string; user: User }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data: any): Promise<{ access_token: string; user: User; profile: any }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User; profile: any; connections_count: number }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(data: any): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getUsers(params: { role?: string; q?: string; skill?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.q) query.append('q', params.q);
    if (params.skill) query.append('skill', params.skill);
    const res = await fetchWithSafeErrors(`${API_BASE}/auth/users?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Startups
  async getStartups(params: { category?: string; industry?: string; stage?: string; verification?: string; q?: string } = {}): Promise<Startup[]> {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.industry) query.append('industry', params.industry);
    if (params.stage) query.append('stage', params.stage);
    if (params.verification) query.append('verification', params.verification);
    if (params.q) query.append('q', params.q);
    const res = await fetchWithSafeErrors(`${API_BASE}/startups?${query.toString()}`);
    return handleResponse(res);
  },

  async getStartup(id: number): Promise<Startup> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${id}`);
    return handleResponse(res);
  },

  async createStartup(data: any): Promise<{ id: number; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStartup(id: number, data: any): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteStartup(id: number): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMyStartups(): Promise<Startup[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/my/list`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Ideas
  async getIdeas(q?: string): Promise<StartupIdea[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getIdea(id: number): Promise<StartupIdea> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async shareIdea(data: any): Promise<{ id: number; message: string; analysis: IdeaAnalysis }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteIdea(id: number): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async analyzeIdeaPreview(data: any): Promise<IdeaAnalysis> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Opportunities
  async getOpportunities(params: { category?: string; work_mode?: string; experience_level?: string; q?: string } = {}): Promise<Opportunity[]> {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.work_mode) query.append('work_mode', params.work_mode);
    if (params.experience_level) query.append('experience_level', params.experience_level);
    if (params.q) query.append('q', params.q);
    const res = await fetchWithSafeErrors(`${API_BASE}/opportunities?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createOpportunity(data: any): Promise<{ id: number; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async toggleSaveOpportunity(oppId: number): Promise<{ saved: boolean; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/opportunities/${oppId}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMySavedOpportunities(): Promise<Opportunity[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/opportunities/saved/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async applyToOpportunity(oppId: number, data: { cover_letter?: string; resume_url?: string }): Promise<{ id: number; status: string; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/opportunities/${oppId}/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyApplications(): Promise<Application[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/applications/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getOpportunityApplications(oppId: number): Promise<Application[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/applications/opportunity/${oppId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateApplicationStatus(appId: number, status: string): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/applications/${appId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Matching & Skills
  async analyzeSkillGap(targetRole: string, userSkills: string[]): Promise<SkillGapResponse> {
    const res = await fetchWithSafeErrors(`${API_BASE}/matching/skill-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_role: targetRole, user_skills: userSkills }),
    });
    return handleResponse(res);
  },

  async findCofounders(params: { target_skill?: string; preferred_mode?: string } = {}): Promise<Candidate[]> {
    const query = new URLSearchParams();
    if (params.target_skill) query.append('target_skill', params.target_skill);
    if (params.preferred_mode) query.append('preferred_mode', params.preferred_mode);
    const res = await fetchWithSafeErrors(`${API_BASE}/matching/find-cofounders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Investors
  async toggleSaveStartup(startupId: number): Promise<{ saved: boolean; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/investors/saved-startups/${startupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getInvestorSavedStartups(): Promise<Startup[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/investors/saved-startups`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async expressInterest(startupId: number, message: string): Promise<{ id: number; status: string; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/investors/interests/${startupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async getMySentInterests(): Promise<InvestorInterest[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/investors/my-interests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getStartupInterests(startupId: number): Promise<InvestorInterest[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${startupId}/interests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async respondToInterest(
    interestId: number,
    status: 'Accepted' | 'Declined' | 'Investment Proposed' | 'Investment Confirmed' | 'Active Partnership'
  ): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/investors/interests/${interestId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async askChatbot(params: {
    message: string;
    target_role?: string;
    missing_skills?: string[];
    user_skills?: string[];
  }): Promise<{
    reply: string;
    target_role: string;
    missing_skills: string[];
    resources: Array<{ skill: string; importance: string; youtube_url: string; practice_project: string }>;
    is_ai_fallback: boolean;
  }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/learning/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Connections
  async sendConnectionRequest(receiverId: number, message?: string): Promise<{ id: number; status: string; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/connections/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ receiver_id: receiverId, message }),
    });
    return handleResponse(res);
  },

  async getConnections(): Promise<{ accepted: Connection[]; incoming: Connection[]; outgoing: Connection[] }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/connections`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async respondToConnection(connectionId: number, status: 'Accepted' | 'Rejected'): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/connections/${connectionId}/respond`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Messages
  async getMessages(peerId: number): Promise<Message[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/messages/${peerId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async sendMessage(peerId: number, content: string): Promise<Message> {
    const res = await fetchWithSafeErrors(`${API_BASE}/messages/${peerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },

  // Mentors (NO FEEDBACK)
  async getMentors(params: { industry?: string; q?: string } = {}): Promise<Mentor[]> {
    const query = new URLSearchParams();
    if (params.industry) query.append('industry', params.industry);
    if (params.q) query.append('q', params.q);
    const res = await fetchWithSafeErrors(`${API_BASE}/mentors?${query.toString()}`);
    return handleResponse(res);
  },

  async getMentor(id: number): Promise<Mentor> {
    const res = await fetchWithSafeErrors(`${API_BASE}/mentors/${id}`);
    return handleResponse(res);
  },

  async requestGuidance(mentorId: number, data: { topic: string; message: string }): Promise<{ id: number; message: string; mentor_name: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/mentors/${mentorId}/request-guidance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyMentorshipRequests(): Promise<MentorshipRequest[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/mentors/my/requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Trust & Reports
  async submitReport(data: { target_type: 'Job' | 'Profile' | 'Startup'; target_id: number; reason: string; details?: string }): Promise<{ id: number; status: string; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyReports(): Promise<Report[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/reports/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminReports(): Promise<Report[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateReportStatus(reportId: number, statusVal: string): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/admin/reports/${reportId}/status?status_val=${encodeURIComponent(statusVal)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Ratings & Reviews
  async submitRating(data: { target_type: 'founder' | 'investor'; target_id: number; rating: number; review_text?: string }): Promise<{ message: string; average_rating: number; total_ratings: number; user_rating: number }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getRatings(targetType: 'founder' | 'investor', targetId: number): Promise<RatingStats> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ratings/${targetType}/${targetId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Startup Comments
  async submitStartupComment(startupId: number, data: { comment_text: string; pros?: string; cons?: string; role_title?: string }): Promise<{ id: number; message: string; employment_status: string; is_verified_employee: boolean }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${startupId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getStartupComments(startupId: number): Promise<StartupComment[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${startupId}/comments`);
    return handleResponse(res);
  },

  async deleteStartupComment(commentId: number): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Top 10 Curated Startups for Investors
  async getTop10Startups(criteria: string = 'all', stage?: string, industry?: string): Promise<{ criteria: string; total_matches: number; startups: Top10Startup[] }> {
    let url = `${API_BASE}/startups/top10?criteria=${encodeURIComponent(criteria)}`;
    if (stage && stage !== 'All') url += `&stage=${encodeURIComponent(stage)}`;
    if (industry && industry !== 'All') url += `&industry=${encodeURIComponent(industry)}`;
    const res = await fetchWithSafeErrors(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Employer 80/20 Shortlist
  async getTopCandidatesForOpportunity(opportunityId: number): Promise<CandidateShortlistResponse> {
    const res = await fetchWithSafeErrors(`${API_BASE}/matching/top-candidates/${opportunityId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Group Discussion Scheduler
  async scheduleGroupMeeting(data: { opportunity_id?: number; title: string; agenda?: string; scheduled_at: string; google_meet_url: string; candidate_ids: number[] }): Promise<GroupMeeting> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/group-discussion`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyGroupMeetings(): Promise<GroupMeeting[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/group/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Two-Party Google Meet Requests & Approvals
  async createMeetingRequest(data: {
    recipient_id: number;
    title: string;
    purpose?: string;
    meeting_date: string;
    start_time: string;
    duration_minutes?: number;
    time_zone?: string;
    agenda?: string;
    google_meet_url?: string;
  }): Promise<{ id: number; status: string; message: string; scheduled_at: string; google_meet_url?: string; conflict_warning?: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyMeetings(statusFilter?: string): Promise<MeetingRequest[]> {
    const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/my${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMeetingDetails(meetingId: number): Promise<MeetingRequest> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/${meetingId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async respondToMeetingRequest(
    meetingId: number,
    status: 'Approved' | 'Rejected',
    googleMeetUrl?: string
  ): Promise<{ message: string; status: string; google_meet_url?: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/${meetingId}/respond`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, google_meet_url: googleMeetUrl }),
    });
    return handleResponse(res);
  },

  async cancelMeetingRequest(meetingId: number): Promise<{ message: string; status: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/${meetingId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateMeetingDetails(
    meetingId: number,
    data: {
      title?: string;
      purpose?: string;
      meeting_date?: string;
      start_time?: string;
      duration_minutes?: number;
      time_zone?: string;
      agenda?: string;
    }
  ): Promise<{ message: string; status: string; renewed_approval_required: boolean }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/${meetingId}/details`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateMeetingLink(
    meetingId: number,
    googleMeetUrl: string
  ): Promise<{ message: string; google_meet_url: string; can_join: boolean }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/meetings/${meetingId}/link`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ google_meet_url: googleMeetUrl }),
    });
    return handleResponse(res);
  },

  // Startup Financials & Idea Editing
  async updateStartupIdea(ideaId: number, data: any): Promise<{ message: string; id: number; title: string; analysis: any }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/ideas/${ideaId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStartupFinancials(startupId: number, data: any): Promise<{ message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${startupId}/financials`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Real-Time Negotiation Rooms
  async createNegotiationRoom(data: { startup_id: number; investor_id: number; proposed_amount: number; currency?: string; proposed_valuation: number; proposed_equity: number; milestones?: string; google_meet_link?: string; notes?: string }): Promise<{ id: number; message: string; google_meet_link?: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyNegotiationRooms(): Promise<NegotiationRoom[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/my-rooms`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getNegotiationRoom(roomId: number): Promise<NegotiationRoom> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/rooms/${roomId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async submitCounterOffer(roomId: number, data: { proposed_amount: number; currency?: string; proposed_valuation: number; proposed_equity: number; notes?: string }): Promise<{ message: string; status: string; proposed_amount: number; proposed_valuation: number; proposed_equity: number }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/rooms/${roomId}/counter-offer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateNegotiationStatus(roomId: number, statusVal: string, notes?: string): Promise<{ message: string; status: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/rooms/${roomId}/status?status_val=${encodeURIComponent(statusVal)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    return handleResponse(res);
  },

  async sendNegotiationMessage(roomId: number, content: string, messageType: string = 'text'): Promise<{ id: number; message: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/negotiations/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, message_type: messageType }),
    });
    return handleResponse(res);
  },

  // Monthly Progress Reports & Reminders
  async submitMonthlyProgressReport(data: { startup_id: number; investor_id: number; reporting_month: string; revenue: number; expenses: number; milestones_achieved?: string; challenges?: string; next_month_goals?: string; notes?: string }): Promise<MonthlyProgressReport> {
    const res = await fetchWithSafeErrors(`${API_BASE}/reports/monthly-progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyProgressReports(): Promise<MonthlyProgressReport[]> {
    const res = await fetchWithSafeErrors(`${API_BASE}/reports/monthly-progress/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMonthlyProgressReminders(): Promise<{ reminders: MonthlyReminder[]; current_month: string }> {
    const res = await fetchWithSafeErrors(`${API_BASE}/reports/monthly-progress/reminders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Fundraising Command Center
  async getFundraisingCommandCenter(startupId: number): Promise<FundraisingCommandCenterData> {
    const res = await fetchWithSafeErrors(`${API_BASE}/startups/${startupId}/fundraising-command-center`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async checkHealth(): Promise<{ status: string; app?: string }> {
    const baseWithoutApi = API_BASE.replace(/\/api$/, '');
    const res = await fetchWithSafeErrors(`${baseWithoutApi}/health`);
    return handleResponse(res);
  },
};
