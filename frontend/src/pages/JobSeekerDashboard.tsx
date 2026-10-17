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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Opportunity, Application, Connection, SkillGapResponse } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { MessagingDrawer } from '../components/MessagingDrawer';

interface JobSeekerDashboardProps {
  setCurrentPage: (page: string) => void;
}

export const JobSeekerDashboard: React.FC<JobSeekerDashboardProps> = ({ setCurrentPage }) => {
  const { user, profile, refreshUser } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [connections, setConnections] = useState<{ accepted: Connection[]; incoming: Connection[] }>({
    accepted: [],
    incoming: [],
  });

  const [activeTab, setActiveTab] = useState<'recommended' | 'applications' | 'saved' | 'skillgap' | 'network'>('recommended');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Skill Gap Analyzer state
  const [targetRole, setTargetRole] = useState<string>('Frontend Developer');
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResponse | null>(null);
  const [isAnalyzingGap, setIsAnalyzingGap] = useState<boolean>(false);

  // Quick Apply Modal state
  const [selectedOppForApply, setSelectedOppForApply] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>(profile?.portfolio_url || '');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // Active chat
  const [activeChatConnection, setActiveChatConnection] = useState<Connection | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOpps, savedOpps, apps, conns] = await Promise.all([
        api.getOpportunities(),
        api.getMySavedOpportunities(),
        api.getMyApplications(),
        api.getConnections(),
      ]);

      setOpportunities(allOpps);
      setSavedOpportunities(savedOpps);
      setMyApplications(apps);
      setConnections({
        accepted: conns.accepted,
        incoming: conns.incoming,
      });

      // Auto-run initial skill gap analysis with user skills
      const userSkills = profile?.skills || ['React', 'JavaScript', 'HTML', 'CSS'];
      const gapRes = await api.analyzeSkillGap('Frontend Developer', userSkills);
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
      const userSkills = profile?.skills || ['React', 'JavaScript', 'HTML', 'CSS'];
      const res = await api.analyzeSkillGap(roleName, userSkills);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-white border border-[#E3EAE5] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Seeker & Candidate Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211B] tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-[#65736A] max-w-xl">
            Explore personalized role recommendations based on your verified skills, track your submitted applications, and optimize your qualifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('skillgap')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#EAF7EF] text-[#08663A] hover:bg-[#d6f0df] transition-colors border border-[#138A4B]/20 flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Skill Gap Analyzer</span>
          </button>
          <button
            onClick={() => setCurrentPage('opportunities')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors flex items-center gap-2 shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Browse Opportunities</span>
          </button>
        </div>
      </div>

      {/* Skills & Profile Summary Bar */}
      <div className="p-5 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#17211B] mb-1">
            My Registered Skills ({userSkills.length})
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {userSkills.map((sk: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs font-semibold bg-[#EAF7EF] text-[#08663A] rounded-lg border border-[#138A4B]/20"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#65736A] md:text-right border-t md:border-t-0 md:border-l border-[#E3EAE5] pt-3 md:pt-0 md:pl-6 shrink-0">
          <div><strong className="text-[#17211B]">Education:</strong> {profile?.education || 'Not specified'}</div>
          <div><strong className="text-[#17211B]">Preferred Mode:</strong> {profile?.preferred_work_mode || 'Hybrid'}</div>
          <div><strong className="text-[#17211B]">Level:</strong> {profile?.experience_level || 'Entry Level'}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E3EAE5] gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'recommended' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Matched Opportunities ({opportunities.length})
          {activeTab === 'recommended' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'applications' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          My Applications ({myApplications.length})
          {activeTab === 'applications' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'saved' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Saved ({savedOpportunities.length})
          {activeTab === 'saved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('skillgap')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'skillgap' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Skill Gap Analyzer
          {activeTab === 'skillgap' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'network' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Connections ({connections.accepted.length})
          {activeTab === 'network' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
      </div>

      {/* TAB 1: MATCHED OPPORTUNITIES WITH TRANSPARENT MATCH FORMULA */}
      {activeTab === 'recommended' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#EAF7EF]/60 border border-[#138A4B]/20 rounded-2xl flex items-start gap-3 text-xs text-[#08663A]">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#138A4B]" />
            <div>
              <strong>Transparent Skill Match Formula:</strong> Matches are calculated using exact set overlap:{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#138A4B]/20">
                (Matched Required Skills / Total Required Skills) × 100
              </span>. This measures skill overlap only and does not guarantee job placement.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#F8FAF8] border border-[#E3EAE5] text-[#17211B] rounded-lg">
                      {opp.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <TrustBadge status={opp.verification_status} size="sm" />
                      <button
                        onClick={() => handleToggleSave(opp.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          opp.is_saved
                            ? 'bg-[#138A4B] text-white border-[#138A4B]'
                            : 'bg-white text-[#65736A] border-[#E3EAE5] hover:bg-gray-50'
                        }`}
                        title="Save opportunity"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#17211B]">{opp.title}</h3>
                    <p className="text-xs text-[#65736A]">{opp.company} · {opp.location}</p>
                  </div>

                  <p className="text-xs text-[#65736A] leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>

                  {/* DETERMINISTIC MATCH SCORE BADGE */}
                  {opp.match_score !== null && opp.match_score !== undefined ? (
                    <div className="p-3 bg-[#EAF7EF]/70 rounded-xl border border-[#138A4B]/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#08663A]">
                          Skill Match: {opp.match_score}%
                        </span>
                        <span className="text-[11px] text-[#08663A]">
                          {opp.matched_skills?.length} of {opp.required_skills?.length} skills
                        </span>
                      </div>
                      <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#138A4B]/20">
                        <div
                          className="bg-[#138A4B] h-full rounded-full transition-all duration-300"
                          style={{ width: `${opp.match_score}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-[#08663A]/90">
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
                    <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-[#65736A]">
                      Match score unavailable
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#17211B]">
                    {opp.compensation || 'Competitive'}
                  </span>

                  {opp.is_applied ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedOppForApply(opp);
                        setCoverLetter('');
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors"
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
            <h2 className="text-base font-bold text-[#17211B]">My Submitted Applications</h2>
            <p className="text-xs text-[#65736A]">
              Application statuses are stored and updated securely on the backend server.
            </p>
          </div>

          {myApplications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <Briefcase className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No applications submitted yet</h3>
              <p className="text-xs text-[#65736A] mt-1">
                Browse our recommended opportunities and apply using your verified profile.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#17211B]">{app.job_title}</h3>
                      <span className="text-xs text-[#65736A]">at {app.company}</span>
                    </div>
                    <div className="text-xs text-[#65736A]">
                      {app.work_mode} · {app.location} · Compensation: {app.compensation || 'Disclosed on interview'}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-[#17211B]/80 italic mt-1 max-w-xl">
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
            <h2 className="text-base font-bold text-[#17211B]">Saved Opportunities</h2>
            <p className="text-xs text-[#65736A]">Bookmarked listings you want to revisit or research.</p>
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <Bookmark className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No saved opportunities</h3>
              <p className="text-xs text-[#65736A] mt-1">
                Click the bookmark icon on any opportunity card to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-5 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#17211B]">{opp.title}</h3>
                    <p className="text-xs text-[#65736A]">{opp.company} · {opp.location}</p>
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
          <div className="rounded-3xl bg-white border border-[#E3EAE5] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A]">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Career Benchmark Analysis</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#17211B]">
                Interactive Skill Gap Analyzer
              </h2>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Select your target career track. We compare your registered competencies against industry benchmark requirements and outline prioritized learning pathways.
              </p>
            </div>

            {/* Target Role Selector Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#17211B]">
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
                        ? 'bg-[#138A4B] text-white shadow-xs'
                        : 'bg-[#F8FAF8] text-[#17211B] border border-[#E3EAE5] hover:bg-gray-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Box */}
            {skillGapResult && (
              <div className="space-y-6 pt-4 border-t border-[#E3EAE5]">
                {/* Progress bar */}
                <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#E3EAE5] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sm text-[#17211B]">
                      Role Readiness for {skillGapResult.target_role}: {skillGapResult.progress_percent}%
                    </span>
                    <span className="text-[#65736A]">
                      {skillGapResult.matched_skills.length} of {skillGapResult.total_benchmark_skills} skills verified
                    </span>
                  </div>
                  <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-[#E3EAE5]">
                    <div
                      className="bg-[#138A4B] h-full rounded-full transition-all duration-500"
                      style={{ width: `${skillGapResult.progress_percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#65736A] italic">
                    {skillGapResult.disclaimer}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched Skills */}
                  <div className="p-5 rounded-2xl border border-[#E3EAE5] bg-white space-y-2">
                    <div className="flex items-center gap-2 text-[#08663A] font-semibold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#138A4B]" />
                      <span>Skills Already Matched ({skillGapResult.matched_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillGapResult.matched_skills.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#EAF7EF] text-[#08663A] rounded-lg border border-[#138A4B]/20"
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#17211B]">
                    Recommended Learning Priorities
                  </h4>
                  <div className="space-y-2">
                    {skillGapResult.recommended_priorities.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-[#E3EAE5] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#17211B]">{rec.skill}</span>
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
                          <p className="text-xs text-[#65736A] mt-0.5">{rec.suggested_action}</p>
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
              <h2 className="text-base font-bold text-[#17211B]">My Professional Connections</h2>
              <p className="text-xs text-[#65736A]">Founders and peers you are connected with.</p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A]"
            >
              Discover More People
            </button>
          </div>

          {connections.accepted.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <MessageSquare className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No accepted connections yet</h3>
              <p className="text-xs text-[#65736A] mt-1">
                Explore the Find People directory to connect with founders and innovators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connections.accepted.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#17211B]">{conn.peer_name}</h4>
                    <p className="text-xs text-[#65736A]">{conn.peer_role}</p>
                  </div>
                  <button
                    onClick={() => setActiveChatConnection(conn)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EAF7EF] text-[#08663A] hover:bg-[#d6f0df] flex items-center gap-1.5"
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

      {/* QUICK APPLY MODAL */}
      {selectedOppForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE5]">
              <div>
                <h3 className="font-bold text-base text-[#17211B]">
                  Apply: {selectedOppForApply.title}
                </h3>
                <p className="text-xs text-[#65736A]">{selectedOppForApply.company}</p>
              </div>
              <button
                onClick={() => setSelectedOppForApply(null)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            {applyFeedback ? (
              <div className="p-4 bg-[#EAF7EF] text-[#08663A] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{applyFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Short Introduction / Cover Note
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe why you are excited about this role and how your skills directly support their goals..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Resume or Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://mywebsite.com/resume.pdf"
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOppForApply(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#65736A] hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-5 py-2 text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] rounded-xl disabled:opacity-50"
                  >
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
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
    </div>
  );
};
