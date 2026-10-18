import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Bookmark,
  Send,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Rocket,
  Edit3,
  Award,
  Video,
  Handshake,
  DollarSign,
  BarChart3,
  Calendar,
  MessageCircle,
  Star,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Startup,
  StartupIdea,
  InvestorInterest,
  Top10Startup,
  NegotiationRoom,
  MonthlyProgressReport
} from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { IdeaAnalysisModal } from '../components/IdeaAnalysisModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { StarRating } from '../components/StarRating';
import { StartupReviewsModal } from '../components/StartupReviewsModal';
import { NegotiationRoomModal } from '../components/NegotiationRoomModal';
import { MeetingRequestModal } from '../components/MeetingRequestModal';
import { MeetingManagementSection } from '../components/MeetingManagementSection';

interface InvestorDashboardProps {
  setCurrentPage: (page: string) => void;
  onSelectStartup?: (startupId: number) => void;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ setCurrentPage, onSelectStartup }) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [savedStartups, setSavedStartups] = useState<Startup[]>([]);
  const [sentInterests, setSentInterests] = useState<InvestorInterest[]>([]);
  const [investorOnlyIdeas, setInvestorOnlyIdeas] = useState<StartupIdea[]>([]);

  // Top 10 Curated Startups
  const [top10Startups, setTop10Startups] = useState<Top10Startup[]>([]);
  const [top10Filter, setTop10Filter] = useState<string>('all');
  const [isLoadingTop10, setIsLoadingTop10] = useState<boolean>(false);

  // Negotiation Rooms
  const [negotiationRooms, setNegotiationRooms] = useState<NegotiationRoom[]>([]);
  const [activeNegotiationRoom, setActiveNegotiationRoom] = useState<NegotiationRoom | null>(null);

  // New Deal Room Creation Modal
  const [showCreateDealModal, setShowCreateDealModal] = useState<boolean>(false);
  const [selectedStartupForDeal, setSelectedStartupForDeal] = useState<{ id: number; name: string } | null>(null);
  const [dealForm, setDealForm] = useState({
    proposed_amount: 5000000,
    currency: 'INR',
    proposed_valuation: 50000000,
    proposed_equity: 10,
    milestones: 'Q1: MVP Launch, Q2: 1,000 Paid Customers',
    notes: 'Initial term sheet offer based on platform review.',
  });

  // Monthly Portfolio Progress Reports
  const [progressReports, setProgressReports] = useState<MonthlyProgressReport[]>([]);

  // Startup Reviews Modal
  const [selectedStartupForReviews, setSelectedStartupForReviews] = useState<{ id: number; name: string } | null>(null);

  // Google Meet Request Modal
  const [showMeetingModal, setShowMeetingModal] = useState<boolean>(false);
  const [selectedRecipientForMeeting, setSelectedRecipientForMeeting] = useState<{
    id: number;
    name: string;
    role?: string;
    title?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'top10' | 'discover' | 'negotiations' | 'meetings' | 'private_ideas' | 'interests' | 'saved' | 'reports'>('top10');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters for General Discover
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Express Interest Modal
  const [selectedStartupForInterest, setSelectedStartupForInterest] = useState<Startup | null>(null);
  const [interestMemo, setInterestMemo] = useState<string>('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState<boolean>(false);
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null);

  // Idea analysis modal
  const [selectedIdeaAnalysis, setSelectedIdeaAnalysis] = useState<{ title: string; analysis: any } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStartups, saved, interests, ideas] = await Promise.all([
        api.getStartups({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          stage: stageFilter !== 'All' ? stageFilter : undefined,
          q: searchQuery || undefined,
        }),
        api.getInvestorSavedStartups(),
        api.getMySentInterests(),
        api.getIdeas(),
      ]);

      setStartups(allStartups);
      setSavedStartups(saved);
      setSentInterests(interests);
      setInvestorOnlyIdeas(ideas.filter((i) => i.visibility === 'INVESTOR_ONLY'));

      // Fetch negotiation rooms
      try {
        const rooms = await api.getMyNegotiationRooms();
        setNegotiationRooms(rooms || []);
      } catch (e) {
        console.warn('Could not load negotiation rooms', e);
      }

      // Fetch monthly progress reports
      try {
        const reports = await api.getMyProgressReports();
        setProgressReports(reports || []);
      } catch (e) {
        console.warn('Could not load monthly reports', e);
      }
    } catch (err) {
      console.error('Failed to load investor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTop10 = async (criteria: string) => {
    setIsLoadingTop10(true);
    try {
      const res = await api.getTop10Startups(criteria);
      setTop10Startups(res.startups || []);
    } catch (err) {
      console.error('Failed to load top 10 startups:', err);
    } finally {
      setIsLoadingTop10(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, stageFilter, searchQuery]);

  useEffect(() => {
    loadTop10(top10Filter);
  }, [top10Filter]);

  const handleToggleSave = async (startupId: number) => {
    try {
      await api.toggleSaveStartup(startupId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle save startup:', err);
    }
  };

  const handleExpressInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartupForInterest) return;
    setIsSubmittingInterest(true);
    setInterestSuccess(null);
    try {
      const res = await api.expressInterest(selectedStartupForInterest.id, interestMemo);
      setInterestSuccess(res.message);
      loadData();
      setTimeout(() => {
        setSelectedStartupForInterest(null);
        setInterestMemo('');
        setInterestSuccess(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit interest');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleInitiateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartupForDeal || !user) return;
    try {
      const res = await api.createNegotiationRoom({
        startup_id: selectedStartupForDeal.id,
        investor_id: user.id,
        proposed_amount: dealForm.proposed_amount,
        currency: dealForm.currency,
        proposed_valuation: dealForm.proposed_valuation,
        proposed_equity: dealForm.proposed_equity,
        milestones: dealForm.milestones,
        notes: dealForm.notes,
      });

      setShowCreateDealModal(false);
      // Fetch room and open modal
      const newRoom = await api.getNegotiationRoom(res.id);
      setActiveNegotiationRoom(newRoom);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create negotiation room');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. COMPACT ELEGANT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              {t.investorPortal}
            </span>
            {user?.is_verified ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                ✓ {t.verifiedInvestor}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.welcomeBack}, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {t.investorSubtitle}
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.editProfile}</span>
          </button>
          <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <strong>MVP Notice:</strong> Platform negotiation demo. No real fund transfers.
          </div>
        </div>
      </div>

      {/* 2. INVESTOR PROFILE & RATINGS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t.investorType}</span>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              {t.editProfile}
            </button>
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {profile?.investor_type || 'Angel Investor'}
          </div>
          <div className="text-[11px] text-slate-500 pt-1 truncate">
            {user?.location || 'Global'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.preferredStage}</div>
          <div className="text-base font-bold text-slate-900">
            {profile?.investment_stage_pref || 'Seed / Series A'}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">{profile?.areas_of_interest || 'All sectors'}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.negotiationRooms}</div>
          <div className="text-xl font-bold text-slate-900">{negotiationRooms.length}</div>
          <div className="text-[11px] text-slate-500 pt-1">{t.activeDealRooms}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">{t.investorRating}</div>
          <StarRating
            targetType="investor"
            targetId={user?.id || 1}
            title=""
            readOnly={true}
            size="sm"
          />
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('top10')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'top10' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>{t.top10Startups}</span>
          {activeTab === 'top10' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'discover' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.discoverStartups} ({startups.length})
          {activeTab === 'discover' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('negotiations')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'negotiations' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Handshake className="w-4 h-4 text-blue-600" />
          <span>{t.negotiationRooms} ({negotiationRooms.length})</span>
          {activeTab === 'negotiations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'meetings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Video className="w-4 h-4 text-blue-600" />
          <span>Scheduled Meets</span>
          {activeTab === 'meetings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('private_ideas')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'private_ideas' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-purple-700" />
          <span>{t.investorOnlyBriefs} ({investorOnlyIdeas.length})</span>
          {activeTab === 'private_ideas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('interests')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'interests' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.sentInterestRequests} ({sentInterests.length})
          {activeTab === 'interests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'saved' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.savedStartups} ({savedStartups.length})
          {activeTab === 'saved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'reports' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>{t.monthlyPortfolioReports} ({progressReports.length})</span>
          {activeTab === 'reports' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* TAB 1: TOP 10 CURATED STARTUPS WITH GOOGLE MEET & DEAL ROOM INITIATION */}
      {activeTab === 'top10' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 via-amber-50/50 to-indigo-50/50 rounded-2xl border border-blue-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                  TOP 10 CURATED
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {t.top10Startups}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                {t.top10Desc}
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: t.filterAll },
                { id: 'high_profit', label: t.filterHighProfit },
                { id: 'social_welfare', label: t.filterSocialWelfare },
                { id: 'student_led', label: t.filterStudentLed },
                { id: 'deep_tech', label: t.filterDeepTech },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setTop10Filter(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    top10Filter === chip.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingTop10 ? (
            <div className="text-center py-16 text-xs text-slate-500">
              Loading top 10 curated startups...
            </div>
          ) : top10Startups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No curated startups for this filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try switching to "All" or "High Profit".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {top10Startups.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-extrabold shadow-xs ${
                      st.rank === 1
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                        : st.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : st.rank === 3
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      <span className="text-[10px] font-bold leading-none">RANK</span>
                      <span className="text-lg leading-tight">#{st.rank}</span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {st.category}
                        </span>
                        <TrustBadge status={st.verification_status || 'Verified'} size="sm" />
                        {st.is_student_run && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            🎓 {t.filterStudentLed}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">· {st.industry}</span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900">{st.name}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{st.description}</p>

                      {/* Business Metrics Row */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                        {st.annual_profit ? (
                          <div>
                            <span className="text-slate-400">{t.annualProfit}: </span>
                            <span className="font-bold text-emerald-600">₹{st.annual_profit.toLocaleString()}</span>
                          </div>
                        ) : null}
                        {st.profit_margin_pct ? (
                          <div>
                            <span className="text-slate-400">{t.profitMargin}: </span>
                            <span className="font-bold text-blue-700">{st.profit_margin_pct}%</span>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-slate-400">{t.fundingStage}: </span>
                          <span className="font-bold text-slate-800">{st.funding_stage || 'Pre-Seed'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t.rating}: </span>
                          <span className="font-bold text-amber-600">★ {st.average_rating ? st.average_rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Google Meet & Term Sheet */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setSelectedStartupForReviews({ id: st.id, name: st.name })}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                      title={t.workplaceExperienceReviews}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.workplaceExperienceReviews}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRecipientForMeeting({
                          id: st.owner_id || (st as any).user_id || 1,
                          name: st.owner_name || st.name,
                          role: 'Founder & CEO',
                          title: `Pre-Seed Investment Discussion with ${st.name}`
                        });
                        setShowMeetingModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Request Google Meet</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStartupForDeal({ id: st.id, name: st.name });
                        setShowCreateDealModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-colors"
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

      {/* TAB 2: DISCOVER STARTUPS (GENERAL) */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.searchStartups}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="All">{t.filterAllCategories}</option>
                <option value="Tech Startups">Tech Startups</option>
                <option value="Non-Tech Startups">Non-Tech Startups</option>
                <option value="Social Welfare Startups">Social Welfare Startups</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="All">{t.filterAllStages}</option>
                <option value="Idea Phase">Idea Phase</option>
                <option value="MVP / Prototype">MVP / Prototype</option>
                <option value="Early Traction">Early Traction</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
          </div>

          {/* Startups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startups.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {st.category}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 mt-1.5">{st.name}</h3>
                      <p className="text-xs text-slate-500">{st.industry} · {st.stage}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrustBadge status={st.verification_status} size="sm" />
                      <button
                        onClick={() => handleToggleSave(st.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                        title={t.savedStartups}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {st.description}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div><strong className="text-slate-900">{t.problem}:</strong> {st.problem}</div>
                    <div><strong className="text-slate-900">{t.solution}:</strong> {st.solution}</div>
                  </div>

                  {/* Star Rating on Card */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <StarRating
                      targetType="founder"
                      targetId={st.user_id || 1}
                      title=""
                      readOnly={true}
                      size="sm"
                    />
                    <button
                      onClick={() => setSelectedStartupForReviews({ id: st.id, name: st.name })}
                      className="text-xs text-amber-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{t.workplaceExperienceReviews}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">{t.location}: {st.location}</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {t.target}: {st.funding_requirement || 'Flexible'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedStartupForDeal({ id: st.id, name: st.name });
                      setShowCreateDealModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1 shadow-2xs"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>{t.openNegotiationRoom}</span>
                  </button>

                  <button
                    onClick={() => setSelectedStartupForInterest(st)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.expressInterest}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NEGOTIATION ROOMS */}
      {activeTab === 'negotiations' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-blue-600" />
              <span>{t.interactiveNegotiationRooms}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {t.legalSavingsBanner}
            </p>
          </div>

          {negotiationRooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noActiveNegotiationRooms}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Discover a startup and click "Open Negotiation Room" to propose investment terms.
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
                        {room.startup_name}
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
            title="Scheduled Google Meets"
            onRequestNewMeeting={() => {
              if (top10Startups.length > 0) {
                const first = top10Startups[0];
                setSelectedRecipientForMeeting({
                  id: first.owner_id || 1,
                  name: first.owner_name || first.name,
                  role: 'Founder & CEO',
                  title: `Pre-Seed Investment Discussion with ${first.name}`
                });
                setShowMeetingModal(true);
              } else {
                setSelectedRecipientForMeeting({
                  id: 1,
                  name: 'Sarah Chen',
                  role: 'EcoTrack Founder',
                  title: 'Introductory Discussion'
                });
                setShowMeetingModal(true);
              }
            }}
          />
        </div>
      )}

      {/* TAB 4: INVESTOR-ONLY BRIEFS */}
      {activeTab === 'private_ideas' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <h2 className="text-base font-bold text-purple-950 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-700" />
              <span>{t.investorOnlyBriefs}</span>
            </h2>
            <p className="text-xs text-purple-800 mt-1">
              {t.protectedPitchBriefs}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investorOnlyIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-2xl border border-purple-100 p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>INVESTOR ONLY</span>
                    </span>
                    <span className="text-xs text-slate-400">{idea.industry}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{idea.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{idea.problem_statement}</p>

                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs">
                    <span className="font-semibold text-purple-950">{t.targetAudience}: </span>
                    <span className="text-slate-600">{idea.target_audience}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (idea.analysis) {
                        setSelectedIdeaAnalysis({ title: idea.title, analysis: idea.analysis });
                      }
                    }}
                    className="font-semibold text-purple-700 hover:underline flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.viewChecklist}</span>
                  </button>
                  <span className="text-xs text-slate-400">{idea.funding_requirements || 'Funding TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SENT INTERESTS */}
      {activeTab === 'interests' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t.sentInterestRequests}</h2>
          {sentInterests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noInterestsSent}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.expressInterestDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInterests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{req.startup_name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">"{req.message}"</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(req.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SAVED STARTUPS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t.savedStartups}</h2>
          {savedStartups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noSavedStartups}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.bookmarkToTrack}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedStartups.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                      <p className="text-xs text-slate-500">{st.industry} · {st.stage}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSave(st.id)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{st.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: MONTHLY PORTFOLIO REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{t.monthlyPortfolioReports}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {t.automatedProgressDesc}
            </p>
          </div>

          {progressReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">{t.noReportsYet}</h3>
              <p className="text-xs text-slate-500 mt-1">
                When confirmed portfolio ventures submit their 30-day updates, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        Month: {report.reporting_month}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-1">Startup #{report.startup_id} Progress Update</h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      Submitted: {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t.revenue}</div>
                      <div className="text-sm font-bold text-emerald-600">₹{report.revenue?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t.expenses}</div>
                      <div className="text-sm font-bold text-red-600">₹{report.expenses?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">{t.netMargin}</div>
                      <div className="text-sm font-bold text-blue-700">
                        ₹{(report.revenue - report.expenses).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {report.milestones_achieved && (
                    <div className="text-xs">
                      <strong className="text-slate-900">{t.milestonesAchieved}: </strong>
                      <span className="text-slate-600">{report.milestones_achieved}</span>
                    </div>
                  )}

                  {report.next_month_goals && (
                    <div className="text-xs">
                      <strong className="text-slate-900">{t.nextMonthGoals}: </strong>
                      <span className="text-slate-600">{report.next_month_goals}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE DEAL ROOM MODAL */}
      {showCreateDealModal && selectedStartupForDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">{t.initiateDealRoom}</h3>
                <p className="text-xs text-slate-500">{selectedStartupForDeal.name}</p>
              </div>
              <button
                onClick={() => setShowCreateDealModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateDealSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                    {t.currency}
                  </label>
                  <select
                    value={dealForm.currency}
                    onChange={(e) => setDealForm({ ...dealForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                    {t.investmentAmount} *
                  </label>
                  <input
                    type="number"
                    required
                    value={dealForm.proposed_amount}
                    onChange={(e) => setDealForm({ ...dealForm, proposed_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                    {t.valuation} *
                  </label>
                  <input
                    type="number"
                    required
                    value={dealForm.proposed_valuation}
                    onChange={(e) => setDealForm({ ...dealForm, proposed_valuation: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                    {t.equity} (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={dealForm.proposed_equity}
                    onChange={(e) => setDealForm({ ...dealForm, proposed_equity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Key Milestones
                </label>
                <input
                  type="text"
                  value={dealForm.milestones}
                  onChange={(e) => setDealForm({ ...dealForm, milestones: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateDealModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-2xs"
                >
                  {t.launchDealRoom}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPRESS INTEREST MODAL */}
      {selectedStartupForInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">{t.expressInterest}</h3>
                <p className="text-xs text-slate-500">{selectedStartupForInterest.name}</p>
              </div>
              <button
                onClick={() => setSelectedStartupForInterest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {interestSuccess ? (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold">
                ✓ {interestSuccess}
              </div>
            ) : (
              <form onSubmit={handleExpressInterestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Introduction Memo *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your investment thesis, check size, and why you are interested in this venture..."
                    value={interestMemo}
                    onChange={(e) => setInterestMemo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedStartupForInterest(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInterest}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-2xs"
                  >
                    {isSubmittingInterest ? 'Sending...' : t.sendInterest}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE NEGOTIATION ROOM MODAL */}
      {activeNegotiationRoom && (
        <NegotiationRoomModal
          isOpen={true}
          room={activeNegotiationRoom}
          onClose={() => setActiveNegotiationRoom(null)}
          onRoomUpdated={() => {
            loadData();
          }}
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

      {/* IDEA ANALYSIS MODAL */}
      {selectedIdeaAnalysis && (
        <IdeaAnalysisModal
          isOpen={true}
          ideaTitle={selectedIdeaAnalysis.title}
          analysis={selectedIdeaAnalysis.analysis}
          onClose={() => setSelectedIdeaAnalysis(null)}
        />
      )}

      {/* EDIT PROFILE MODAL */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={loadData}
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
