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
  IdeaAnalysis
} from '../types';

const API_BASE = '/api';

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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = 'An unexpected error occurred';
    try {
      const err = await res.json();
      errMessage = err.detail || err.message || errMessage;
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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data: any): Promise<{ access_token: string; user: User; profile: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User; profile: any; connections_count: number }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(data: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
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
    const res = await fetch(`${API_BASE}/auth/users?${query.toString()}`, {
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
    const res = await fetch(`${API_BASE}/startups?${query.toString()}`);
    return handleResponse(res);
  },

  async getStartup(id: number): Promise<Startup> {
    const res = await fetch(`${API_BASE}/startups/${id}`);
    return handleResponse(res);
  },

  async createStartup(data: any): Promise<{ id: number; message: string }> {
    const res = await fetch(`${API_BASE}/startups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStartup(id: number, data: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/startups/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteStartup(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/startups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMyStartups(): Promise<Startup[]> {
    const res = await fetch(`${API_BASE}/startups/my/list`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Ideas
  async getIdeas(q?: string): Promise<StartupIdea[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await fetch(`${API_BASE}/ideas${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getIdea(id: number): Promise<StartupIdea> {
    const res = await fetch(`${API_BASE}/ideas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async shareIdea(data: any): Promise<{ id: number; message: string; analysis: IdeaAnalysis }> {
    const res = await fetch(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteIdea(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/ideas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async analyzeIdeaPreview(data: any): Promise<IdeaAnalysis> {
    const res = await fetch(`${API_BASE}/ideas/analyze`, {
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
    const res = await fetch(`${API_BASE}/opportunities?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createOpportunity(data: any): Promise<{ id: number; message: string }> {
    const res = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async toggleSaveOpportunity(oppId: number): Promise<{ saved: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/opportunities/${oppId}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMySavedOpportunities(): Promise<Opportunity[]> {
    const res = await fetch(`${API_BASE}/opportunities/saved/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async applyToOpportunity(oppId: number, data: { cover_letter?: string; resume_url?: string }): Promise<{ id: number; status: string; message: string }> {
    const res = await fetch(`${API_BASE}/opportunities/${oppId}/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyApplications(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/applications/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getOpportunityApplications(oppId: number): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/applications/opportunity/${oppId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateApplicationStatus(appId: number, status: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Matching & Skills
  async analyzeSkillGap(targetRole: string, userSkills: string[]): Promise<SkillGapResponse> {
    const res = await fetch(`${API_BASE}/matching/skill-gap`, {
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
    const res = await fetch(`${API_BASE}/matching/find-cofounders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Investors
  async toggleSaveStartup(startupId: number): Promise<{ saved: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/investors/saved-startups/${startupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getInvestorSavedStartups(): Promise<Startup[]> {
    const res = await fetch(`${API_BASE}/investors/saved-startups`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async expressInterest(startupId: number, message: string): Promise<{ id: number; status: string; message: string }> {
    const res = await fetch(`${API_BASE}/investors/interests/${startupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async getMySentInterests(): Promise<InvestorInterest[]> {
    const res = await fetch(`${API_BASE}/investors/my-interests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getStartupInterests(startupId: number): Promise<InvestorInterest[]> {
    const res = await fetch(`${API_BASE}/startups/${startupId}/interests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async respondToInterest(interestId: number, status: 'Accepted' | 'Declined'): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/investors/interests/${interestId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Connections
  async sendConnectionRequest(receiverId: number, message?: string): Promise<{ id: number; status: string; message: string }> {
    const res = await fetch(`${API_BASE}/connections/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ receiver_id: receiverId, message }),
    });
    return handleResponse(res);
  },

  async getConnections(): Promise<{ accepted: Connection[]; incoming: Connection[]; outgoing: Connection[] }> {
    const res = await fetch(`${API_BASE}/connections`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async respondToConnection(connectionId: number, status: 'Accepted' | 'Rejected'): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/connections/${connectionId}/respond`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Messages
  async getMessages(peerId: number): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/messages/${peerId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async sendMessage(peerId: number, content: string): Promise<Message> {
    const res = await fetch(`${API_BASE}/messages/${peerId}`, {
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
    const res = await fetch(`${API_BASE}/mentors?${query.toString()}`);
    return handleResponse(res);
  },

  async getMentor(id: number): Promise<Mentor> {
    const res = await fetch(`${API_BASE}/mentors/${id}`);
    return handleResponse(res);
  },

  async requestGuidance(mentorId: number, data: { topic: string; message: string }): Promise<{ id: number; message: string; mentor_name: string }> {
    const res = await fetch(`${API_BASE}/mentors/${mentorId}/request-guidance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyMentorshipRequests(): Promise<MentorshipRequest[]> {
    const res = await fetch(`${API_BASE}/mentors/my/requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Trust & Reports
  async submitReport(data: { target_type: 'Job' | 'Profile' | 'Startup'; target_id: number; reason: string; details?: string }): Promise<{ id: number; status: string; message: string }> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMyReports(): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/reports/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminReports(): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateReportStatus(reportId: number, statusVal: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}/status?status_val=${encodeURIComponent(statusVal)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
