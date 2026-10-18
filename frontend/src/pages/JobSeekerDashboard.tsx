import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Bookmark,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  MessageSquare,
  AlertCircle,
  BarChart2,
  Search,
  ExternalLink,
  Edit3,
  BookOpen,
  Play,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Opportunity, Application, Connection, SkillGapResponse, GroupMeeting } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { MessagingDrawer } from '../components/MessagingDrawer';
import { EditProfileModal } from '../components/EditProfileModal';
import { ThinkAndGrowChatbot } from '../components/ThinkAndGrowChatbot';
import { MeetingManagementSection } from '../components/MeetingManagementSection';
import { useLanguage } from '../context/LanguageContext';

interface JobSeekerDashboardProps {
  setCurrentPage: (page: string) => void;
}

export const JobSeekerDashboard: React.FC<JobSeekerDashboardProps> = ({ setCurrentPage }) => {
  const { user, profile, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [groupMeetings, setGroupMeetings] = useState<GroupMeeting[]>([]);
  const [connections, setConnections] = useState<{ accepted: Connection[]; incoming: Connection[] }>({
    accepted: [],
    incoming: [],
  });

  const [activeTab, setActiveTab] = useState<'recommended' | 'applications' | 'saved' | 'skillgap' | 'network' | 'meetings'>('recommended');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Skill Gap Analyzer state
  const [targetRole, setTargetRole] = useState<string>('Frontend Developer');
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResponse | null>(null);
  const [isAnalyzingGap, setIsAnalyzingGap] = useState<boolean>(false);

  // Edit Profile Modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  // Quick Apply Modal state
  const [selectedOppForApply, setSelectedOppForApply] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>(profile?.portfolio_url || '');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // Active chat
  const [activeChatConnection, setActiveChatConnection] = useState<Connection | null>(null);

  // Think & Grow learning states
  const [showLearnAllModal, setShowLearnAllModal] = useState<boolean>(false);
  const [skillUpdateFeedback, setSkillUpdateFeedback] = useState<string | null>(null);

  const handleQuickAcquireSkill = async (skillToAdd: string) => {
    try {
      const currentSkills = profile?.skills || [];
      if (currentSkills.map((s: string) => s.toLowerCase()).includes(skillToAdd.toLowerCase())) {
        return;
      }
      const updatedSkills = [...currentSkills, skillToAdd];
      await api.updateProfile({ skills: updatedSkills });
      await refreshUser();
      setSkillUpdateFeedback(`Skill "${skillToAdd}" added to your profile! Recalculating readiness...`);
      await handleRunSkillGap(targetRole);
      setTimeout(() => setSkillUpdateFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile skills');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOpps, savedOpps, apps, conns, meData, meetings] = await Promise.all([
        api.getOpportunities(),
        api.getMySavedOpportunities(),
        api.getMyApplications(),
        api.getConnections(),
        api.getMe(),
        api.getMyGroupMeetings().catch(() => []),
      ]);

      setOpportunities(allOpps);
      setSavedOpportunities(savedOpps);
      setMyApplications(apps);
      setGroupMeetings(meetings || []);
      setConnections({
        accepted: conns.accepted,
        incoming: conns.incoming,
      });

      // Auto-run initial skill gap analysis with fresh user skills
      const currentSkills = meData.profile?.skills || profile?.skills || [];
      const gapRes = await api.analyzeSkillGap(targetRole || 'Frontend Developer', currentSkills);
      setSkillGapResult(gapRes);
    } catch (err) {
      console.error('Error loading job seeker data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSkillGap = async (roleName: string) => {
    setTargetRole(roleName);
    setIsAnalyzingGap(true);
    try {
      const meData = await api.getMe();
      const currentSkills = meData.profile?.skills || profile?.skills || [];
      const res = await api.analyzeSkillGap(roleName, currentSkills);
      setSkillGapResult(res);
    } catch (err) {
      console.error('Failed to run skill gap:', err);
    } finally {
      setIsAnalyzingGap(false);
    }
  };

  const handleToggleSave = async (oppId: number) => {
    try {
      await api.toggleSaveOpportunity(oppId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForApply) return;
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      const res = await api.applyToOpportunity(selectedOppForApply.id, {
        cover_letter: coverLetter,
        resume_url: resumeUrl,
      });
      setApplyFeedback(res.message);
      loadData();
      setTimeout(() => {
        setSelectedOppForApply(null);
        setCoverLetter('');
        setApplyFeedback(null);
      }, 2000);
    } catch (err: any) {
      setApplyFeedback(err.message || 'Failed to submit application.');
    } finally {
      setIsApplying(false);
    }
  };

  const userSkills = profile?.skills || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. COMPACT ELEGANT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] border border-[#1D4ED8]/20">
              <Briefcase className="w-3.5 h-3.5" />
              Candidate Hub
            </span>
            {user?.is_verified ? (
              <span className="text-[11px] font-medium text-[#1E3A8A] bg-[#EFF6FF] px-2 py-0.5 rounded">
                Verified Profile
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-[#64748B] max-w-xl">
            Explore transparent role matches, review applications, and track skill readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('skillgap')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#d6f0df] active:scale-[0.99] transition-all border border-[#1D4ED8]/20 flex items-center gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Skill Gap Analyzer</span>
          </button>
          <button
            onClick={() => setCurrentPage('opportunities')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Browse Opportunities</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT SUMMARY METRICS ROW (4 Aligned Minimal Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span>Registered Skills</span>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="text-[11px] font-semibold text-[#1D4ED8] hover:text-[#1E3A8A]"
            >
              Edit
            </button>
          </div>
          <div className="text-xl font-bold text-[#0F172A]">{userSkills.length}</div>
          <div className="flex flex-wrap gap-1 pt-1.5">
            {userSkills.slice(0, 3).map((sk: string, i: number) => (
              <span key={i} className="px-1.5 py-0.5 text-[10px] font-medium bg-[#EFF6FF] text-[#1E3A8A] rounded">
                {sk}
              </span>
            ))}
            {userSkills.length > 3 && (
              <span className="text-[10px] text-[#64748B] pt-0.5">+{userSkills.length - 3}</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs text-[#64748B] mb-1">Matched Positions</div>
          <div className="text-xl font-bold text-[#0F172A]">{opportunities.length}</div>
          <div className="text-[11px] text-[#64748B] pt-1.5">Based on skill overlap</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs text-[#64748B] mb-1">Active Applications</div>
          <div className="text-xl font-bold text-[#0F172A]">{myApplications.length}</div>
          <div className="text-[11px] text-[#64748B] pt-1.5">{savedOpportunities.length} saved listings</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs text-[#64748B] mb-1">Preferences</div>
          <div className="text-sm font-bold text-[#0F172A] truncate">{profile?.preferred_work_mode || 'Hybrid'}</div>
          <div className="text-[11px] text-[#64748B] pt-1 truncate">{profile?.experience_level || 'Entry Level'}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'recommended' ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Matched Opportunities ({opportunities.length})
          {activeTab === 'recommended' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'applications' ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          My Applications ({myApplications.length})
          {activeTab === 'applications' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'saved' ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Saved ({savedOpportunities.length})
          {activeTab === 'saved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('skillgap')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'skillgap' ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Skill Gap Analyzer
          {activeTab === 'skillgap' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'network' ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Connections ({connections.accepted.length})
          {activeTab === 'network' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative cursor-pointer ${
            activeTab === 'meetings' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Group Discussions & Meet ({groupMeetings.length})
          {activeTab === 'meetings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* TAB 1: MATCHED OPPORTUNITIES WITH TRANSPARENT MATCH FORMULA */}
      {activeTab === 'recommended' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#EFF6FF]/60 border border-[#1D4ED8]/20 rounded-2xl flex items-start gap-3 text-xs text-[#1E3A8A]">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#1D4ED8]" />
            <div>
              <strong>Transparent Skill Match Formula:</strong> Matches are calculated using exact set overlap:{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#1D4ED8]/20">
                (Matched Required Skills / Total Required Skills) × 100
              </span>. This measures skill overlap only and does not guarantee job placement.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#F8FAF8] border border-[#E2E8F0] text-[#0F172A] rounded-lg">
                      {opp.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <TrustBadge status={opp.verification_status} size="sm" />
                      <button
                        onClick={() => handleToggleSave(opp.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          opp.is_saved
                            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                            : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-gray-50'
                        }`}
                        title="Save opportunity"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#0F172A]">{opp.title}</h3>
                    <p className="text-xs text-[#64748B]">{opp.company} · {opp.location}</p>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>

                  {/* DETERMINISTIC MATCH SCORE BADGE */}
                  {opp.match_score !== null && opp.match_score !== undefined ? (
                    <div className="p-3 bg-[#EFF6FF]/70 rounded-xl border border-[#1D4ED8]/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1E3A8A]">
                          Skill Match: {opp.match_score}%
                        </span>
                        <span className="text-[11px] text-[#1E3A8A]">
                          {opp.matched_skills?.length} of {opp.required_skills?.length} skills
                        </span>
                      </div>
                      <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#1D4ED8]/20">
                        <div
                          className="bg-[#1D4ED8] h-full rounded-full transition-all duration-300"
                          style={{ width: `${opp.match_score}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-[#1E3A8A]/90">
                        {opp.match_explanation}
                      </div>

                      {/* Itemized Matched vs Missing */}
                      <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                        {opp.matched_skills?.map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                        {opp.missing_skills?.map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            Missing: {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-[#64748B]">
                      Match score unavailable
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {opp.compensation || 'Competitive'}
                  </span>

                  {opp.is_applied ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  ) : opp.match_score !== null && opp.match_score !== undefined && opp.match_score < 50 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        Below 50% Threshold
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOppForApply(opp);
                          setCoverLetter('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                      >
                        Check Requirements
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedOppForApply(opp);
                        setCoverLetter('');
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A] transition-colors shadow-xs"
                    >
                      Quick Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS WITH REAL STORED STATUSES */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">My Submitted Applications</h2>
            <p className="text-xs text-[#64748B]">
              Application statuses are stored and updated securely on the backend server.
            </p>
          </div>

          {myApplications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] p-8">
              <Briefcase className="w-12 h-12 text-[#64748B]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#0F172A]">No applications submitted yet</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Browse our recommended opportunities and apply using your verified profile.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#0F172A]">{app.job_title}</h3>
                      <span className="text-xs text-[#64748B]">at {app.company}</span>
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {app.work_mode} · {app.location} · Compensation: {app.compensation || 'Disclosed on interview'}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-[#0F172A]/80 italic mt-1 max-w-xl">
                        "{app.cover_letter}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'Shortlisted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Under Review'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : app.status === 'Rejected'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      Status: {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED OPPORTUNITIES */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Saved Opportunities</h2>
            <p className="text-xs text-[#64748B]">Bookmarked listings you want to revisit or research.</p>
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] p-8">
              <Bookmark className="w-12 h-12 text-[#64748B]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#0F172A]">No saved opportunities</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Click the bookmark icon on any opportunity card to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">{opp.title}</h3>
                    <p className="text-xs text-[#64748B]">{opp.company} · {opp.location}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSave(opp.id)}
                    className="text-xs text-red-500 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SKILL GAP ANALYZER (SECTION 11) */}
      {activeTab === 'skillgap' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A]">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Career Benchmark Analysis</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                Interactive Skill Gap Analyzer
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Select your target career track. We compare your registered competencies against industry benchmark requirements and outline prioritized learning pathways.
              </p>
            </div>

            {/* Target Role Selector Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Select Target Role:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Frontend Developer',
                  'Backend Developer',
                  'Full Stack Developer',
                  'Data Analyst / Scientist',
                  'UI/UX Designer',
                  'Product Manager',
                  'Mobile App Developer',
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRunSkillGap(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      targetRole === role
                        ? 'bg-[#1D4ED8] text-white shadow-xs'
                        : 'bg-[#F8FAF8] text-[#0F172A] border border-[#E2E8F0] hover:bg-gray-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Box */}
            {skillGapResult && (
              <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
                {/* Progress bar */}
                <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sm text-[#0F172A]">
                      Role Readiness for {skillGapResult.target_role}: {skillGapResult.progress_percent}%
                    </span>
                    <span className="text-[#64748B]">
                      {skillGapResult.matched_skills.length} of {skillGapResult.total_benchmark_skills} skills verified
                    </span>
                  </div>
                  <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-[#E2E8F0]">
                    <div
                      className="bg-[#1D4ED8] h-full rounded-full transition-all duration-500"
                      style={{ width: `${skillGapResult.progress_percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] italic">
                    {skillGapResult.disclaimer}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched Skills */}
                  <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white space-y-2">
                    <div className="flex items-center gap-2 text-[#1E3A8A] font-semibold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />
                      <span>Skills Already Matched ({skillGapResult.matched_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillGapResult.matched_skills.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] rounded-lg border border-[#1D4ED8]/20"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Skills to Acquire ({skillGapResult.missing_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillGapResult.missing_skills.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded-lg"
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prioritized Learning Action Plan */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                        Prioritized Learning Pathways & YouTube Tutorials
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Acquiring missing skills automatically boosts your job eligibility across VentureBridge.
                      </p>
                    </div>

                    {skillGapResult.missing_skills.length > 0 && (
                      <button
                        onClick={() => setShowLearnAllModal(true)}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#d6f0df] flex items-center gap-1.5 transition-colors border border-[#1D4ED8]/20"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Curated Learning Guide</span>
                      </button>
                    )}
                  </div>

                  {skillUpdateFeedback && (
                    <div className="p-3 bg-[#EFF6FF] text-[#1E3A8A] border border-[#1D4ED8]/20 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{skillUpdateFeedback}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {skillGapResult.recommended_priorities.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl border border-[#E2E8F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-[#1D4ED8]/40 transition-colors"
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0F172A]">{rec.skill}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.priority === 'High Priority'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {rec.priority}
                            </span>
                          </div>
                          {rec.importance && (
                            <p className="text-xs text-[#0F172A]/90 font-medium leading-relaxed">
                              {rec.importance}
                            </p>
                          )}
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {rec.suggested_action}
                          </p>
                          {rec.practice_project && (
                            <div className="text-[11px] text-[#1E3A8A] bg-[#EFF6FF]/60 px-2.5 py-1 rounded-md inline-block mt-0.5">
                              <strong>Suggested Practice:</strong> {rec.practice_project}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                          {rec.youtube_url && (
                            <a
                              href={rec.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1.5 transition-colors border border-red-200"
                              title="Watch recommended beginner tutorial on YouTube"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleQuickAcquireSkill(rec.skill)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#d6f0df] flex items-center gap-1.5 transition-colors border border-[#1D4ED8]/20"
                            title="Add this skill to your registered profile and recalculate job matches"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Learned</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NETWORKING & CONNECTIONS */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">My Professional Connections</h2>
              <p className="text-xs text-[#64748B]">Founders and peers you are connected with.</p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A]"
            >
              Discover More People
            </button>
          </div>

          {connections.accepted.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] p-8">
              <MessageSquare className="w-12 h-12 text-[#64748B]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#0F172A]">No accepted connections yet</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Explore the Find People directory to connect with founders and innovators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connections.accepted.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">{conn.peer_name}</h4>
                    <p className="text-xs text-[#64748B]">{conn.peer_role}</p>
                  </div>
                  <button
                    onClick={() => setActiveChatConnection(conn)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#d6f0df] flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GROUP DISCUSSIONS & GOOGLE MEET INTERVIEWS */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <span className="text-lg">📅</span>
            <div>
              <strong>Employer Group Discussions (GD) & Video Interviews:</strong> You have been shortlisted by startup founders based on your 80/20 candidate score! Connect with hiring teams directly on Google Meet at the scheduled times below.
            </div>
          </div>

          {groupMeetings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="text-3xl block mb-2">📹</span>
              <p className="text-sm font-semibold text-slate-700">No Group Discussions scheduled yet</p>
              <p className="text-xs text-slate-400 mt-1">When an employer shortlists your profile using the 80/20 formula, your Google Meet interview invite will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupMeetings.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        GD Interview Invite
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(m.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                    {m.agenda && (
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold">Agenda:</span> {m.agenda}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Organized by {m.creator_name || 'Founder / Employer'}
                    </p>
                  </div>

                  <a
                    href={m.google_meet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>📹</span> Join Google Meet Session
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* TWO-PARTY ONE-ON-ONE MEETINGS & INTERVIEWS */}
          <div className="pt-2">
            <MeetingManagementSection title="One-on-One Syncs & Employer Interviews" />
          </div>
        </div>
      )}

      {/* QUICK APPLY MODAL */}
      {selectedOppForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  Apply: {selectedOppForApply.title}
                </h3>
                <p className="text-xs text-[#64748B]">{selectedOppForApply.company}</p>
              </div>
              <button
                onClick={() => setSelectedOppForApply(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            {selectedOppForApply.match_score !== null &&
            selectedOppForApply.match_score !== undefined &&
            selectedOppForApply.match_score < 50 ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Application Blocked — Below 50% Threshold</span>
                  </div>
                  <p className="leading-relaxed">
                    Your current job-specific skill match is{' '}
                    <strong>{selectedOppForApply.match_score}%</strong> (you matched{' '}
                    {selectedOppForApply.matched_skills?.length || 0} of{' '}
                    {selectedOppForApply.required_skills?.length || 0} required skills).
                    VentureBridge strictly requires at least <strong>50%</strong> verified skill match to apply.
                  </p>
                  <div className="pt-1">
                    <div className="font-semibold text-amber-950 mb-1.5">Missing Skills to Acquire:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOppForApply.missing_skills?.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white border border-amber-300 font-semibold text-amber-900"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOppForApply(null)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-gray-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOppForApply(null);
                      setActiveTab('skillgap');
                    }}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A] rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Learn Missing Skills (Think & Grow)</span>
                  </button>
                </div>
              </div>
            ) : applyFeedback ? (
              <div className="p-4 bg-[#EFF6FF] text-[#1E3A8A] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{applyFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {selectedOppForApply.match_score !== null && selectedOppForApply.match_score !== undefined && (
                  <div className="p-3 bg-[#EFF6FF] border border-[#1D4ED8]/20 rounded-xl text-xs text-[#1E3A8A] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Eligible to apply! Your skill match is <strong>{selectedOppForApply.match_score}%</strong> ({selectedOppForApply.matched_skills?.length || 0} of {selectedOppForApply.required_skills?.length || 0} skills matched).
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#64748B] mb-1">
                    Short Introduction / Cover Note
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe why you are excited about this role and how your skills directly support their goals..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#64748B] mb-1">
                    Resume or Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://mywebsite.com/resume.pdf"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOppForApply(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-5 py-2 text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A] rounded-xl disabled:opacity-50 shadow-xs"
                  >
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LEARN ALL MISSING SKILLS ROADMAP MODAL */}
      {showLearnAllModal && skillGapResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAF8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    Curated Learning Roadmap: {targetRole}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Step-by-step verified resources to bridge all {skillGapResult.missing_skills.length} missing competency gaps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLearnAllModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {skillGapResult.learning_resources && skillGapResult.learning_resources.length > 0 ? (
                <div className="space-y-3">
                  {skillGapResult.learning_resources.map((res, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAF8]/60 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-bold text-sm text-[#0F172A]">{res.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={res.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1 border border-red-200"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>YouTube Course</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <button
                            onClick={() => {
                              handleQuickAcquireSkill(res.skill);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#d6f0df] flex items-center gap-1 border border-[#1D4ED8]/20"
                          >
                            <Check className="w-3 h-3" />
                            <span>Add to Profile</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#0F172A]/90 font-medium">{res.importance}</p>
                      <div className="text-[11px] text-[#1E3A8A] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                        <strong>Practice Task:</strong> {res.practice_project}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">All benchmark skills acquired!</p>
              )}
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAF8] border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                Learning is self-paced. Update your profile once completed to unlock applications.
              </span>
              <button
                onClick={() => setShowLearnAllModal(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E3A8A] rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
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
        onProfileUpdated={loadData}
      />

      {/* THINK & GROW CAREER AI CHATBOT */}
      <ThinkAndGrowChatbot
        targetRole={targetRole}
        missingSkills={skillGapResult?.missing_skills || []}
        userSkills={userSkills}
      />
    </div>
  );
};
