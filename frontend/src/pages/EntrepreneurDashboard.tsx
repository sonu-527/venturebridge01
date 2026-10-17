import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Plus,
  Users,
  Lightbulb,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Lock,
  Globe,
  Trash2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Startup, StartupIdea, InvestorInterest, Connection, IdeaAnalysis } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { IdeaAnalysisModal } from '../components/IdeaAnalysisModal';
import { MessagingDrawer } from '../components/MessagingDrawer';

interface EntrepreneurDashboardProps {
  setCurrentPage: (page: string) => void;
}

export const EntrepreneurDashboard: React.FC<EntrepreneurDashboardProps> = ({ setCurrentPage }) => {
  const { user } = useAuth();

  // State
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [myIdeas, setMyIdeas] = useState<StartupIdea[]>([]);
  const [interestRequests, setInterestRequests] = useState<InvestorInterest[]>([]);
  const [connections, setConnections] = useState<{ accepted: Connection[]; incoming: Connection[] }>({
    accepted: [],
    incoming: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'startups' | 'ideas' | 'interests' | 'team'>('startups');

  // Startup creation modal
  const [showCreateStartupModal, setShowCreateStartupModal] = useState<boolean>(false);
  const [startupForm, setStartupForm] = useState({
    name: '',
    description: '',
    problem: '',
    solution: '',
    category: 'Tech Startups',
    industry: 'Enterprise Software',
    stage: 'MVP / Prototype',
    location: user?.location || 'San Francisco, CA',
    website: '',
    required_skills: 'React, Python, Tailwind CSS',
    team_size: 2,
    funding_stage: 'Pre-Seed',
    funding_requirement: '$150,000',
  });

  // Share Idea modal
  const [showShareIdeaModal, setShowShareIdeaModal] = useState<boolean>(false);
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    problem_statement: '',
    proposed_solution: '',
    target_audience: '',
    industry: 'CleanTech',
    required_skills: 'React, Python, GIS',
    required_team_members: 'Lead Software Engineer, Marketing Co-founder',
    startup_stage: 'Idea Phase',
    funding_requirements: '$50,000 grant',
    visibility: 'PUBLIC' as 'PUBLIC' | 'INVESTOR_ONLY',
  });

  // Selected idea for rule-based analysis view
  const [selectedIdeaAnalysis, setSelectedIdeaAnalysis] = useState<{ title: string; analysis: IdeaAnalysis } | null>(null);

  // Active chat connection
  const [activeChatConnection, setActiveChatConnection] = useState<Connection | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [startups, ideas, conns] = await Promise.all([
        api.getMyStartups(),
        api.getIdeas(),
        api.getConnections(),
      ]);

      setMyStartups(startups);
      // Filter ideas authored by current user
      const userIdeas = ideas.filter((i) => i.user_id === user?.id);
      setMyIdeas(userIdeas);

      setConnections({
        accepted: conns.accepted,
        incoming: conns.incoming,
      });

      // If user has a startup, fetch interests for the first startup
      if (startups.length > 0) {
        const interests = await api.getStartupInterests(startups[0].id);
        setInterestRequests(interests);
      }
    } catch (err) {
      console.error('Error loading entrepreneur dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStartup({
        ...startupForm,
        required_skills: startupForm.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setShowCreateStartupModal(false);
      setFeedbackMessage('Startup created and submitted for verification badge review!');
      loadDashboardData();
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create startup');
    }
  };

  const handleShareIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.shareIdea({
        ...ideaForm,
        required_skills: ideaForm.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setShowShareIdeaModal(false);
      setFeedbackMessage(`Idea shared with ${ideaForm.visibility} visibility. Rule-based analysis generated!`);
      loadDashboardData();
      // Show analysis modal immediately!
      setSelectedIdeaAnalysis({ title: ideaForm.title, analysis: res.analysis });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to share idea');
    }
  };

  const handleDeleteIdea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this startup idea?')) return;
    try {
      await api.deleteIdea(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete idea');
    }
  };

  const handleRespondToInterest = async (interestId: number, statusVal: 'Accepted' | 'Declined') => {
    try {
      await api.respondToInterest(interestId, statusVal);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update interest status');
    }
  };

  const handleRespondToConnection = async (connId: number, statusVal: 'Accepted' | 'Rejected') => {
    try {
      await api.respondToConnection(connId, statusVal);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update connection');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-white border border-[#E3EAE5] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
            <Rocket className="w-3.5 h-3.5" />
            <span>Entrepreneur Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211B] tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-[#65736A] max-w-xl">
            Manage your startup profiles, share ideas with permission controls, review investor interest, and assemble your founding team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowShareIdeaModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E3EAE5] text-[#17211B] hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4 text-[#138A4B]" />
            <span>Share Startup Idea</span>
          </button>
          <button
            onClick={() => setShowCreateStartupModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Startup</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-[#EAF7EF] border border-[#138A4B]/30 rounded-xl text-xs text-[#08663A] font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs">
          <div className="text-xs text-[#65736A] font-medium">My Active Startups</div>
          <div className="text-2xl font-bold text-[#17211B] mt-1">{myStartups.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs">
          <div className="text-xs text-[#65736A] font-medium">Shared Ideas</div>
          <div className="text-2xl font-bold text-[#17211B] mt-1">{myIdeas.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs">
          <div className="text-xs text-[#65736A] font-medium">Investor Inquiries</div>
          <div className="text-2xl font-bold text-[#17211B] mt-1">{interestRequests.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs">
          <div className="text-xs text-[#65736A] font-medium">Connections</div>
          <div className="text-2xl font-bold text-[#17211B] mt-1">{connections.accepted.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3EAE5] gap-6 text-sm">
        <button
          onClick={() => setActiveTab('startups')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'startups' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          My Startups ({myStartups.length})
          {activeTab === 'startups' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ideas')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'ideas' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Startup Ideas & Analysis ({myIdeas.length})
          {activeTab === 'ideas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'interests' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Investor Interest Requests ({interestRequests.length})
          {activeTab === 'interests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 font-semibold transition-colors relative ${
            activeTab === 'team' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Connection Requests ({connections.incoming.length})
          {activeTab === 'team' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
      </div>

      {/* TAB 1: MY STARTUPS */}
      {activeTab === 'startups' && (
        <div className="space-y-6">
          {myStartups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <Rocket className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No startups published yet</h3>
              <p className="text-xs text-[#65736A] mt-1 max-w-sm mx-auto">
                Create your first startup profile to recruit team members, post jobs, and gain visibility with investors.
              </p>
              <button
                onClick={() => setShowCreateStartupModal(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A]"
              >
                Create Startup
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myStartups.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#08663A] bg-[#EAF7EF] px-2 py-0.5 rounded-md">
                        {st.category}
                      </span>
                      <h3 className="font-bold text-lg text-[#17211B] mt-1.5">{st.name}</h3>
                      <p className="text-xs text-[#65736A]">{st.industry} · {st.stage}</p>
                    </div>
                    <TrustBadge status={st.verification_status} size="sm" />
                  </div>

                  <p className="text-xs text-[#17211B]/80 leading-relaxed">
                    {st.description}
                  </p>

                  <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-[#17211B]">Problem: </span>
                      <span className="text-[#65736A] line-clamp-2">{st.problem}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#17211B]">Solution: </span>
                      <span className="text-[#65736A] line-clamp-2">{st.solution}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {st.required_skills?.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-white border border-[#E3EAE5] text-[#17211B] rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                    <span className="text-[#65736A]">
                      Funding: {st.funding_requirement || 'Bootstrapped'} ({st.funding_stage || 'Pre-Seed'})
                    </span>
                    <button
                      onClick={() => setCurrentPage('startups')}
                      className="font-semibold text-[#138A4B] hover:underline flex items-center gap-1"
                    >
                      <span>Public Directory</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STARTUP IDEAS & ANALYSIS */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#17211B]">My Startup Ideas</h2>
              <p className="text-xs text-[#65736A]">
                Rule-based checklist analysis validates each submitted concept. Visibility rules are enforced on the backend.
              </p>
            </div>
            <button
              onClick={() => setShowShareIdeaModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share New Idea</span>
            </button>
          </div>

          {myIdeas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <Lightbulb className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No startup ideas shared yet</h3>
              <p className="text-xs text-[#65736A] mt-1 max-w-sm mx-auto">
                Share an early concept. You can keep it strictly INVESTOR-ONLY or make it PUBLIC to find co-founders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          idea.visibility === 'INVESTOR_ONLY'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20'
                        }`}
                      >
                        {idea.visibility === 'INVESTOR_ONLY' ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>INVESTOR ONLY</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>PUBLIC IDEA</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-[#65736A] font-medium">
                        {idea.industry} · {idea.startup_stage}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#17211B]">{idea.title}</h3>
                    <p className="text-xs text-[#65736A] leading-relaxed line-clamp-3">
                      {idea.problem_statement}
                    </p>

                    <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] text-xs">
                      <span className="font-semibold text-[#17211B]">Target Audience: </span>
                      <span className="text-[#65736A]">{idea.target_audience}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {idea.required_skills?.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] bg-white border border-[#E3EAE5] rounded text-[#17211B]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        if (idea.analysis) {
                          setSelectedIdeaAnalysis({ title: idea.title, analysis: idea.analysis });
                        }
                      }}
                      className="font-semibold text-[#138A4B] hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Structured Checklist</span>
                    </button>
                    <button
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete idea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVESTOR INTERESTS */}
      {activeTab === 'interests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#17211B]">Investor Inquiries & Intent</h2>
            <p className="text-xs text-[#65736A]">
              Investors reviewing your startups can express interest. You can Accept or Decline their introduction memo.
            </p>
          </div>

          {interestRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <TrendingUp className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No investor inquiries yet</h3>
              <p className="text-xs text-[#65736A] mt-1 max-w-sm mx-auto">
                As investors browse your verified startups or investor-only briefings, their interest requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interestRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#17211B]">
                        {req.investor_name}
                      </span>
                      <span className="text-[10px] font-semibold text-[#08663A] bg-[#EAF7EF] px-2 py-0.5 rounded-full">
                        {req.investor_type || 'Investor'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#65736A]">{req.investor_email}</p>
                    <p className="text-xs text-[#17211B] bg-[#F8FAF8] p-3 rounded-xl border border-[#E3EAE5] mt-2">
                      "{req.message}"
                    </p>
                  </div>

                  {req.status === 'Pending' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Accepted')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A]"
                      >
                        Accept Intro
                      </button>
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Declined')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#65736A] hover:bg-gray-200"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-[#65736A]">
                      Marked as {req.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONNECTIONS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#17211B]">Network & Connection Requests</h2>
              <p className="text-xs text-[#65736A]">
                Candidate and co-founder connection requests. Accepted connections unlock persistent messaging.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A]"
            >
              Search Candidates
            </button>
          </div>

          {/* Incoming Pending Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B]">
              Pending Requests ({connections.incoming.length})
            </h3>
            {connections.incoming.length === 0 ? (
              <p className="text-xs text-[#65736A] bg-white p-4 rounded-xl border border-[#E3EAE5]">
                No pending requests. Use "Search Candidates" to find potential team members.
              </p>
            ) : (
              connections.incoming.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-[#E3EAE5] p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-[#17211B]">{req.sender_name}</h4>
                    <p className="text-[11px] text-[#65736A]">{req.sender_role} · {req.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondToConnection(req.id, 'Accepted')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#138A4B] text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToConnection(req.id, 'Rejected')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-[#65736A]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accepted Connections with Messaging */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B]">
              Accepted Connections ({connections.accepted.length})
            </h3>
            {connections.accepted.length === 0 ? (
              <p className="text-xs text-[#65736A] bg-white p-4 rounded-xl border border-[#E3EAE5]">
                No accepted connections yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connections.accepted.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-xl border border-[#E3EAE5] p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-[#17211B]">{conn.peer_name}</h4>
                      <p className="text-[11px] text-[#65736A]">{conn.peer_role}</p>
                    </div>
                    <button
                      onClick={() => setActiveChatConnection(conn)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EAF7EF] text-[#08663A] hover:bg-[#d6f0df] flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE STARTUP MODAL */}
      {showCreateStartupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E3EAE5]">
              <h3 className="font-bold text-lg text-[#17211B]">Create Startup Profile</h3>
              <button
                onClick={() => setShowCreateStartupModal(false)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStartup} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Startup Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={startupForm.name}
                    onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Category *
                  </label>
                  <select
                    value={startupForm.category}
                    onChange={(e) => setStartupForm({ ...startupForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  >
                    <option value="Tech Startups">Tech Startups</option>
                    <option value="Non-Tech Startups">Non-Tech Startups</option>
                    <option value="Social Welfare Startups">Social Welfare Startups</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Industry *
                  </label>
                  <input
                    type="text"
                    required
                    value={startupForm.industry}
                    onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Startup Stage *
                  </label>
                  <select
                    value={startupForm.stage}
                    onChange={(e) => setStartupForm({ ...startupForm, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  >
                    <option value="Idea Phase">Idea Phase</option>
                    <option value="MVP / Prototype">MVP / Prototype</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                  Elevator Pitch / Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={startupForm.description}
                  onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Problem Being Solved *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={startupForm.problem}
                    onChange={(e) => setStartupForm({ ...startupForm, problem: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Proposed Solution *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={startupForm.solution}
                    onChange={(e) => setStartupForm({ ...startupForm, solution: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={startupForm.required_skills}
                    onChange={(e) => setStartupForm({ ...startupForm, required_skills: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Funding Stage (Optional)
                  </label>
                  <input
                    type="text"
                    value={startupForm.funding_stage}
                    onChange={(e) => setStartupForm({ ...startupForm, funding_stage: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Funding Requirement (Optional)
                  </label>
                  <input
                    type="text"
                    value={startupForm.funding_requirement}
                    onChange={(e) => setStartupForm({ ...startupForm, funding_requirement: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E3EAE5]">
                <button
                  type="button"
                  onClick={() => setShowCreateStartupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#65736A] hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] rounded-xl"
                >
                  Save & Publish Startup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE STARTUP IDEA MODAL */}
      {showShareIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E3EAE5]">
              <h3 className="font-bold text-lg text-[#17211B]">Share Startup Idea</h3>
              <button
                onClick={() => setShowShareIdeaModal(false)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShareIdea} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                  Idea Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EduLoop: Peer Micro-Tutoring Exchange"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                />
              </div>

              {/* VISIBILITY TOGGLE (ENFORCED ON BACKEND) */}
              <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] space-y-2">
                <label className="block text-xs font-bold uppercase text-[#17211B]">
                  Visibility Settings (Backend Enforced)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setIdeaForm({ ...ideaForm, visibility: 'PUBLIC' })}
                    className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      ideaForm.visibility === 'PUBLIC'
                        ? 'bg-[#EAF7EF] border-[#138A4B] text-[#08663A] font-bold'
                        : 'bg-white border-[#E3EAE5] text-[#65736A]'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <div>
                      <div>PUBLIC</div>
                      <div className="text-[10px] font-normal">Visible to eligible users</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setIdeaForm({ ...ideaForm, visibility: 'INVESTOR_ONLY' })}
                    className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      ideaForm.visibility === 'INVESTOR_ONLY'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold'
                        : 'bg-white border-[#E3EAE5] text-[#65736A]'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-purple-700" />
                    <div>
                      <div>INVESTOR ONLY</div>
                      <div className="text-[10px] font-normal">Restricted to investor accounts</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                  Problem Statement *
                </label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.problem_statement}
                  onChange={(e) => setIdeaForm({ ...ideaForm, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                  Proposed Solution *
                </label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.proposed_solution}
                  onChange={(e) => setIdeaForm({ ...ideaForm, proposed_solution: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Target Beachhead Audience *
                  </label>
                  <input
                    type="text"
                    required
                    value={ideaForm.target_audience}
                    onChange={(e) => setIdeaForm({ ...ideaForm, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={ideaForm.industry}
                    onChange={(e) => setIdeaForm({ ...ideaForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={ideaForm.required_skills}
                    onChange={(e) => setIdeaForm({ ...ideaForm, required_skills: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Required Team Members
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Co-founder, Growth Lead"
                    value={ideaForm.required_team_members}
                    onChange={(e) => setIdeaForm({ ...ideaForm, required_team_members: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E3EAE5]">
                <button
                  type="button"
                  onClick={() => setShowShareIdeaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#65736A] hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] rounded-xl"
                >
                  Submit & Run Rule Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IDEA ANALYSIS MODAL */}
      {selectedIdeaAnalysis && (
        <IdeaAnalysisModal
          isOpen={true}
          ideaTitle={selectedIdeaAnalysis.title}
          analysis={selectedIdeaAnalysis.analysis}
          onClose={() => setSelectedIdeaAnalysis(null)}
        />
      )}

      {/* MESSAGING DRAWER */}
      {activeChatConnection && (
        <MessagingDrawer
          isOpen={true}
          activeConnection={activeChatConnection}
          onClose={() => setActiveChatConnection(null)}
        />
      )}
    </div>
  );
};
