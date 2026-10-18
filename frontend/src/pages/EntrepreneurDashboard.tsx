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
  MessageSquare,
  Edit3,
  Calendar,
  DollarSign,
  Handshake,
  Star,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Video
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Startup,
  StartupIdea,
  InvestorInterest,
  Connection,
  IdeaAnalysis,
  MonthlyReminder,
  NegotiationRoom,
  Opportunity
} from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { IdeaAnalysisModal } from '../components/IdeaAnalysisModal';
import { MessagingDrawer } from '../components/MessagingDrawer';
import { EditProfileModal } from '../components/EditProfileModal';
import { EditStartupModal } from '../components/EditStartupModal';
import { StarRating } from '../components/StarRating';
import { StartupReviewsModal } from '../components/StartupReviewsModal';
import { FinancialCharts } from '../components/FinancialCharts';
import { CandidateShortlistModal } from '../components/CandidateShortlistModal';
import { NegotiationRoomModal } from '../components/NegotiationRoomModal';
import { MonthlyProgressModal } from '../components/MonthlyProgressModal';
import { EditIdeaModal } from '../components/EditIdeaModal';
import { FundraisingCommandCenter } from '../components/FundraisingCommandCenter';
import { MeetingManagementSection } from '../components/MeetingManagementSection';
import { MeetingRequestModal } from '../components/MeetingRequestModal';

interface EntrepreneurDashboardProps {
  setCurrentPage: (page: string) => void;
}

export const EntrepreneurDashboard: React.FC<EntrepreneurDashboardProps> = ({ setCurrentPage }) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  // State
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [startupToEdit, setStartupToEdit] = useState<Startup | null>(null);
  const [showEditStartupModal, setShowEditStartupModal] = useState<boolean>(false);
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [myIdeas, setMyIdeas] = useState<StartupIdea[]>([]);
  const [interestRequests, setInterestRequests] = useState<InvestorInterest[]>([]);
  const [connections, setConnections] = useState<{ accepted: Connection[]; incoming: Connection[] }>({
    accepted: [],
    incoming: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'startups' | 'ideas' | 'shortlist' | 'negotiations' | 'meetings' | 'interests' | 'team'>('startups');

  // Google Meet modal state
  const [showMeetingModal, setShowMeetingModal] = useState<boolean>(false);
  const [selectedRecipientForMeeting, setSelectedRecipientForMeeting] = useState<{
    id: number;
    name: string;
    role?: string;
    title?: string;
  } | null>(null);

  // New Features State
  const [reminders, setReminders] = useState<MonthlyReminder[]>([]);
  const [showMonthlyProgressModal, setShowMonthlyProgressModal] = useState<boolean>(false);
  const [selectedStartupForProgress, setSelectedStartupForProgress] = useState<{ id: number; name: string } | null>(null);

  const [showCandidateShortlistModal, setShowCandidateShortlistModal] = useState<boolean>(false);
  const [selectedOpportunityForShortlist, setSelectedOpportunityForShortlist] = useState<{ id: number; title: string } | null>(null);
  const [availableOpportunities, setAvailableOpportunities] = useState<Opportunity[]>([]);

  const [negotiationRooms, setNegotiationRooms] = useState<NegotiationRoom[]>([]);
  const [activeNegotiationRoom, setActiveNegotiationRoom] = useState<NegotiationRoom | null>(null);

  const [ideaToEdit, setIdeaToEdit] = useState<StartupIdea | null>(null);
  const [showEditIdeaModal, setShowEditIdeaModal] = useState<boolean>(false);

  const [selectedStartupForReviews, setSelectedStartupForReviews] = useState<{ id: number; name: string } | null>(null);

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
      const [startups, ideas, conns, opps] = await Promise.all([
        api.getMyStartups(),
        api.getIdeas(),
        api.getConnections(),
        api.getOpportunities(),
      ]);

      setMyStartups(startups);
      const userIdeas = ideas.filter((i) => i.user_id === user?.id);
      setMyIdeas(userIdeas);
      setAvailableOpportunities(opps);

      setConnections({
        accepted: conns.accepted,
        incoming: conns.incoming,
      });

      // If user has a startup, fetch interests
      if (startups.length > 0) {
        const interests = await api.getStartupInterests(startups[0].id);
        setInterestRequests(interests);
      }

      // Fetch monthly reminders and negotiation rooms
      try {
        const reminderRes = await api.getMonthlyProgressReminders();
        if (reminderRes && reminderRes.reminders) {
          setReminders(reminderRes.reminders);
        }
      } catch (e) {
        console.warn('Could not load monthly reminders', e);
      }

      try {
        const rooms = await api.getMyNegotiationRooms();
        setNegotiationRooms(rooms || []);
      } catch (e) {
        console.warn('Could not load negotiation rooms', e);
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

  const handleDeleteStartup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this startup? This will remove associated opportunities.')) return;
    try {
      await api.deleteStartup(id);
      setFeedbackMessage('Startup deleted successfully.');
      loadDashboardData();
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete startup');
    }
  };

  const handleRespondToInterest = async (
    interestId: number,
    statusVal: 'Accepted' | 'Declined' | 'Investment Proposed' | 'Investment Confirmed' | 'Active Partnership'
  ) => {
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

  const primaryStartup = myStartups.length > 0 ? myStartups[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. COMPACT ELEGANT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Rocket className="w-3.5 h-3.5 text-blue-600" />
              {t.founderConsole}
            </span>
            {user?.is_verified ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                ✓ {t.verifiedFounder}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.welcomeBack}, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {t.manageVentures}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.editProfile}</span>
          </button>
          <button
            onClick={() => setShowShareIdeaModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.shareIdea}</span>
          </button>
          <button
            onClick={() => setShowCreateStartupModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createStartup}</span>
          </button>
        </div>
      </div>

      {/* 2. AUTOMATED 30-DAY MONTHLY REMINDER NOTICE BANNER */}
      {primaryStartup && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-amber-50/60 rounded-2xl border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{t.monthlyRemindersTitle}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  {reminders.length > 0 ? `${reminders.length} ${t.dueThisMonth}` : t.onTrack}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {t.monthlyReminderDesc}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedStartupForProgress({ id: primaryStartup.id, name: primaryStartup.name });
              setShowMonthlyProgressModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 shadow-2xs flex items-center justify-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t.submitReport}</span>
          </button>
        </div>
      )}

      {/* 3. FUNDRAISING COMMAND CENTER (Dual Currency ₹ / $) */}
      {primaryStartup ? (
        <FundraisingCommandCenter
          startupId={primaryStartup.id}
          startupName={primaryStartup.name}
          onFundraisingUpdated={loadDashboardData}
        />
      ) : (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <Rocket className="w-8 h-8 text-blue-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">{t.createFirstStartup}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t.createStartupToUnlock}
          </p>
          <button
            onClick={() => setShowCreateStartupModal(true)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            {t.createStartup}
          </button>
        </div>
      )}

      {/* 4. SUMMARY METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.myStartups}</div>
          <div className="text-xl font-bold text-slate-900">{myStartups.length}</div>
          <div className="text-[11px] text-slate-500 pt-1">{t.activeVentures}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.sharedIdeas}</div>
          <div className="text-xl font-bold text-slate-900">{myIdeas.length}</div>
          <div className="text-[11px] text-slate-500 pt-1">{t.withRuleAnalysis}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.negotiationRooms}</div>
          <div className="text-xl font-bold text-slate-900">{negotiationRooms.length}</div>
          <div className="text-[11px] text-slate-500 pt-1">{t.interactiveDealRooms}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.inquiriesAndTeam}</div>
          <div className="text-xl font-bold text-slate-900">{interestRequests.length + connections.accepted.length}</div>
          <div className="text-[11px] text-slate-500 pt-1">{t.activeInteractions}</div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 5. TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('startups')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'startups' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.myStartups} ({myStartups.length})
          {activeTab === 'startups' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('ideas')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'ideas' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.startupIdeasAndAnalysis} ({myIdeas.length})
          {activeTab === 'ideas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('shortlist')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative flex items-center gap-1.5 ${
            activeTab === 'shortlist' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.candidateShortlist} (80/20 & GDs)</span>
          {activeTab === 'shortlist' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('negotiations')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative flex items-center gap-1.5 ${
            activeTab === 'negotiations' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Handshake className="w-3.5 h-3.5 text-blue-600" />
          <span>{t.negotiationRooms} ({negotiationRooms.length})</span>
          {activeTab === 'negotiations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative flex items-center gap-1.5 ${
            activeTab === 'meetings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-blue-600" />
          <span>Google Meets</span>
          {activeTab === 'meetings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('interests')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'interests' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.investorInquiries} ({interestRequests.length})
          {activeTab === 'interests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'team' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.teamAndConnections} ({connections.incoming.length})
          {activeTab === 'team' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* TAB 1: MY STARTUPS */}
      {activeTab === 'startups' && (
        <div className="space-y-6">
          {myStartups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noStartupsYet}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t.createFirstStartup}
              </p>
              <button
                onClick={() => setShowCreateStartupModal(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                {t.createStartup}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myStartups.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        {st.category}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 mt-1.5">{st.name}</h3>
                      <p className="text-xs text-slate-500">{st.industry} · {st.stage}</p>
                    </div>
                    <TrustBadge status={st.verification_status} size="sm" />
                  </div>

                  {/* 1-5 Star Ratings on Startup */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <StarRating
                      targetType="founder"
                      targetId={user?.id || 1}
                      title={`${st.name} ${t.founderRating}`}
                      readOnly={true}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {st.description}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{t.problem}: </span>
                      <span className="text-slate-600 line-clamp-2">{st.problem}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{t.solution}: </span>
                      <span className="text-slate-600 line-clamp-2">{st.solution}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {st.required_skills?.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* Reviews & Metrics Action Bar */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setSelectedStartupForReviews({ id: st.id, name: st.name })}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.workplaceExperienceReviews}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setStartupToEdit(st);
                          setShowEditStartupModal(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {t.editProfile}
                      </button>
                      <button
                        onClick={() => handleDeleteStartup(st.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete startup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage('startups')}
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>{t.viewDetails}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STARTUP IDEAS & FINANCIAL METRICS */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.myStartupIdeas}</h2>
              <p className="text-xs text-slate-500">
                {t.ruleBasedChecklistDesc}
              </p>
            </div>
            <button
              onClick={() => setShowShareIdeaModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.shareNewIdea}</span>
            </button>
          </div>

          {myIdeas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noStartupIdeas}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t.shareEarlyConcept}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {myIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            idea.visibility === 'INVESTOR_ONLY'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {idea.visibility === 'INVESTOR_ONLY' ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>{t.investorOnly}</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3" />
                              <span>{t.publicIdea}</span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {idea.industry} · {idea.startup_stage}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{idea.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIdeaToEdit(idea);
                          setShowEditIdeaModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.editIdeaMetrics}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {idea.problem_statement}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-900">{t.targetAudience}: </span>
                    <span className="text-slate-600">{idea.target_audience}</span>
                  </div>

                  {/* VISUAL BUSINESS METRICS (Monthly Sales + Unit Economics) */}
                  <div className="pt-2">
                    <FinancialCharts
                      monthlySales={idea.monthly_sales}
                      unitEconomics={idea.unit_economics}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        if (idea.analysis) {
                          setSelectedIdeaAnalysis({ title: idea.title, analysis: idea.analysis });
                        }
                      }}
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.viewChecklist}</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">
                      ID #{idea.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 80/20 CANDIDATE SHORTLIST & GD SCHEDULER */}
      {activeTab === 'shortlist' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{t.candidateShortlist} & {t.groupDiscussions}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {t.shortlistFormulaBanner}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">{t.selectOpportunity}</h3>
            <p className="text-xs text-slate-500">
              {t.selectOpportunityDesc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {availableOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      {opp.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{opp.title}</h4>
                    <p className="text-xs text-slate-500">{opp.company} · {opp.location} ({opp.work_mode})</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {opp.required_skills?.length || 0} {t.requiredSkills}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOpportunityForShortlist({ id: opp.id, title: opp.title });
                        setShowCandidateShortlistModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>{t.run8020Shortlist}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE NEGOTIATION ROOMS */}
      {activeTab === 'negotiations' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Handshake className="w-5 h-5 text-blue-600" />
                <span>{t.interactiveNegotiationRooms}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {t.legalSavingsBanner}
              </p>
            </div>
          </div>

          {negotiationRooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noActiveNegotiationRooms}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t.negotiationRoomDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {negotiationRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-blue-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Room #{room.id}: {room.startup_name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        room.status === 'Accepted'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : room.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.investmentAmount}</div>
                        <div className="text-xs font-bold text-blue-700">
                          {room.currency === 'INR' ? '₹' : '$'}{room.proposed_amount?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.valuation}</div>
                        <div className="text-xs font-bold text-slate-800">
                          {room.currency === 'INR' ? '₹' : '$'}{room.proposed_valuation?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{t.equity}</div>
                        <div className="text-xs font-bold text-amber-600">
                          {room.proposed_equity}%
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Investor:</strong> {room.investor_name} ({room.investor_email})
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Updated: {new Date(room.updated_at || '').toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setActiveNegotiationRoom(room)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-2xs"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      <span>{t.openNegotiationRoom}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: GOOGLE MEET DISCUSSIONS */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <MeetingManagementSection
            title="Founder Google Meet Schedule"
            onRequestNewMeeting={() => {
              setSelectedRecipientForMeeting({
                id: 7,
                name: 'Marcus Vance',
                role: 'Investor (Apex Ventures)',
                title: 'Venture Traction & Funding Discussion'
              });
              setShowMeetingModal(true);
            }}
          />
        </div>
      )}

      {/* TAB 5: INVESTOR INTERESTS */}
      {activeTab === 'interests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.investorInquiries}</h2>
            <p className="text-xs text-slate-500">
              {t.investorsReviewingDesc}
            </p>
          </div>

          {interestRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noInvestorInquiries}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t.investorInquiriesWillAppear}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interestRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {req.investor_name}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {req.investor_type || 'Investor'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          req.status === 'Accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'Investment Proposed'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : req.status === 'Investment Confirmed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : req.status === 'Active Partnership'
                            ? 'bg-blue-600 text-white'
                            : req.status === 'Declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{req.investor_email}</p>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                      "{req.message}"
                    </p>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Accepted')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        {t.acceptIntro}
                      </button>
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Declined')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        {t.decline}
                      </button>
                    </div>
                  )}

                  {req.status === 'Accepted' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Investment Proposed')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        {t.proposeTerms}
                      </button>
                    </div>
                  )}

                  {req.status === 'Investment Proposed' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Investment Confirmed')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        {t.confirmMilestones}
                      </button>
                    </div>
                  )}

                  {req.status === 'Investment Confirmed' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInterest(req.id, 'Active Partnership')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        {t.activatePartnership}
                      </button>
                    </div>
                  )}

                  {req.status === 'Active Partnership' && (
                    <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                      ✓ {t.activeCollaboration}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TEAM & CONNECTIONS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.networkAndConnections}</h2>
              <p className="text-xs text-slate-500">
                {t.candidateConnectionDesc}
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              {t.searchCandidates}
            </button>
          </div>

          {/* Incoming Pending Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t.pendingRequests} ({connections.incoming.length})
            </h3>
            {connections.incoming.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
                {t.noPendingRequests}
              </p>
            ) : (
              connections.incoming.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">{req.sender_name}</h4>
                    <p className="text-[11px] text-slate-500">{req.sender_role} · {req.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondToConnection(req.id, 'Accepted')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white"
                    >
                      {t.accept}
                    </button>
                    <button
                      onClick={() => handleRespondToConnection(req.id, 'Rejected')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600"
                    >
                      {t.reject}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accepted Connections with Messaging */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t.acceptedConnections} ({connections.accepted.length})
            </h3>
            {connections.accepted.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
                {t.noAcceptedConnections}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connections.accepted.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900">{conn.peer_name}</h4>
                      <p className="text-[11px] text-slate-500">{conn.peer_role}</p>
                    </div>
                    <button
                      onClick={() => setActiveChatConnection(conn)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t.chat}</span>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">{t.createStartupProfile}</h3>
              <button
                onClick={() => setShowCreateStartupModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStartup} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.startupName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={startupForm.name}
                    onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.category} *
                  </label>
                  <select
                    value={startupForm.category}
                    onChange={(e) => setStartupForm({ ...startupForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Tech Startups">Tech Startups</option>
                    <option value="Non-Tech Startups">Non-Tech Startups</option>
                    <option value="Social Welfare Startups">Social Welfare Startups</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.industry} *
                  </label>
                  <input
                    type="text"
                    required
                    value={startupForm.industry}
                    onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.stage} *
                  </label>
                  <select
                    value={startupForm.stage}
                    onChange={(e) => setStartupForm({ ...startupForm, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Idea Phase">Idea Phase</option>
                    <option value="MVP / Prototype">MVP / Prototype</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Elevator Pitch / Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={startupForm.description}
                  onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.problemBeingSolved} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={startupForm.problem}
                    onChange={(e) => setStartupForm({ ...startupForm, problem: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.proposedSolution} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={startupForm.solution}
                    onChange={(e) => setStartupForm({ ...startupForm, solution: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.requiredSkills}
                  </label>
                  <input
                    type="text"
                    value={startupForm.required_skills}
                    onChange={(e) => setStartupForm({ ...startupForm, required_skills: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Funding Stage
                  </label>
                  <input
                    type="text"
                    value={startupForm.funding_stage}
                    onChange={(e) => setStartupForm({ ...startupForm, funding_stage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Funding Requirement
                  </label>
                  <input
                    type="text"
                    value={startupForm.funding_requirement}
                    onChange={(e) => setStartupForm({ ...startupForm, funding_requirement: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateStartupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
                >
                  {t.savePublishStartup}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE STARTUP IDEA MODAL */}
      {showShareIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">{t.shareStartupIdea}</h3>
              <button
                onClick={() => setShowShareIdeaModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShareIdea} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Idea Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EduLoop: Peer Micro-Tutoring Exchange"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-900">
                  Visibility Settings (Backend Enforced)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setIdeaForm({ ...ideaForm, visibility: 'PUBLIC' })}
                    className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      ideaForm.visibility === 'PUBLIC'
                        ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>{t.publicIdea}</div>
                      <div className="text-[10px] font-normal">Visible to eligible users</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setIdeaForm({ ...ideaForm, visibility: 'INVESTOR_ONLY' })}
                    className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      ideaForm.visibility === 'INVESTOR_ONLY'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-purple-700" />
                    <div>
                      <div>{t.investorOnly}</div>
                      <div className="text-[10px] font-normal">Restricted to investor accounts</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Problem Statement *
                </label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.problem_statement}
                  onChange={(e) => setIdeaForm({ ...ideaForm, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Proposed Solution *
                </label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.proposed_solution}
                  onChange={(e) => setIdeaForm({ ...ideaForm, proposed_solution: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Target Beachhead Audience *
                  </label>
                  <input
                    type="text"
                    required
                    value={ideaForm.target_audience}
                    onChange={(e) => setIdeaForm({ ...ideaForm, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={ideaForm.industry}
                    onChange={(e) => setIdeaForm({ ...ideaForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={ideaForm.required_skills}
                    onChange={(e) => setIdeaForm({ ...ideaForm, required_skills: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Required Team Members
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Co-founder, Growth Lead"
                    value={ideaForm.required_team_members}
                    onChange={(e) => setIdeaForm({ ...ideaForm, required_team_members: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowShareIdeaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
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

      {/* EDIT IDEA & FINANCIAL METRICS MODAL */}
      {showEditIdeaModal && ideaToEdit && (
        <EditIdeaModal
          isOpen={showEditIdeaModal}
          idea={ideaToEdit}
          onClose={() => {
            setShowEditIdeaModal(false);
            setIdeaToEdit(null);
          }}
          onIdeaUpdated={loadDashboardData}
        />
      )}

      {/* WORKPLACE EXPERIENCE REVIEWS MODAL */}
      {selectedStartupForReviews && (
        <StartupReviewsModal
          isOpen={true}
          startupId={selectedStartupForReviews.id}
          startupName={selectedStartupForReviews.name}
          onClose={() => setSelectedStartupForReviews(null)}
        />
      )}

      {/* 80/20 CANDIDATE SHORTLIST MODAL */}
      {showCandidateShortlistModal && selectedOpportunityForShortlist && (
        <CandidateShortlistModal
          isOpen={showCandidateShortlistModal}
          opportunityId={selectedOpportunityForShortlist.id}
          opportunityTitle={selectedOpportunityForShortlist.title}
          onClose={() => {
            setShowCandidateShortlistModal(false);
            setSelectedOpportunityForShortlist(null);
          }}
        />
      )}

      {/* INTERACTIVE NEGOTIATION ROOM MODAL */}
      {activeNegotiationRoom && (
        <NegotiationRoomModal
          isOpen={true}
          room={activeNegotiationRoom}
          onClose={() => setActiveNegotiationRoom(null)}
          onRoomUpdated={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* MONTHLY PROGRESS UPDATE MODAL */}
      {showMonthlyProgressModal && selectedStartupForProgress && (
        <MonthlyProgressModal
          isOpen={showMonthlyProgressModal}
          startupId={selectedStartupForProgress.id}
          startupName={selectedStartupForProgress.name}
          onClose={() => {
            setShowMonthlyProgressModal(false);
            setSelectedStartupForProgress(null);
          }}
          onSubmitted={loadDashboardData}
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

      {/* EDIT PROFILE MODAL */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={loadDashboardData}
      />

      {/* EDIT STARTUP MODAL */}
      <EditStartupModal
        startup={startupToEdit}
        isOpen={showEditStartupModal}
        onClose={() => {
          setShowEditStartupModal(false);
          setStartupToEdit(null);
        }}
        onSuccess={loadDashboardData}
      />

      {/* TWO-PARTY GOOGLE MEET REQUEST MODAL */}
      {showMeetingModal && selectedRecipientForMeeting && (
        <MeetingRequestModal
          isOpen={true}
          recipientId={selectedRecipientForMeeting.id}
          recipientName={selectedRecipientForMeeting.name}
          recipientRole={selectedRecipientForMeeting.role}
          defaultTitle={selectedRecipientForMeeting.title}
          onClose={() => {
            setShowMeetingModal(false);
            setSelectedRecipientForMeeting(null);
          }}
          onSuccess={() => {
            setActiveTab('meetings');
          }}
        />
      )}
    </div>
  );
};
