import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Bookmark,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  AlertTriangle,
  AlertCircle,
  Send,
  ShieldCheck,
  X,
  ExternalLink
} from 'lucide-react';
import { Opportunity } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustBadge } from '../components/TrustBadge';
import { ReportModal } from '../components/ReportModal';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface OpportunitiesPageProps {
  setCurrentPage?: (page: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ setCurrentPage }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [workModeFilter, setWorkModeFilter] = useState<string>('All');
  const [experienceFilter, setExperienceFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Apply Modal
  const [selectedOppForApply, setSelectedOppForApply] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: number; name: string } | null>(null);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOpportunities({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        work_mode: workModeFilter !== 'All' ? workModeFilter : undefined,
        experience_level: experienceFilter !== 'All' ? experienceFilter : undefined,
        q: searchQuery || undefined,
      });
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [categoryFilter, workModeFilter, experienceFilter, searchQuery]);

  const handleToggleSave = async (oppId: number) => {
    if (!user) {
      alert('Please log in to save opportunities.');
      return;
    }
    try {
      await api.toggleSaveOpportunity(oppId);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in as a job seeker to submit applications.');
      return;
    }
    if (!selectedOppForApply) return;
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      const res = await api.applyToOpportunity(selectedOppForApply.id, {
        cover_letter: coverLetter,
        resume_url: resumeUrl,
      });
      setApplyFeedback(res.message);
      fetchOpportunities();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Opportunities Board</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.exploreOpportunities}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {t.opportunitiesDesc}
          </p>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-2 self-start md:self-auto font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Verified demo positions for evaluation</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchOpportunities}
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
            <option value="Full-time Jobs">Full-time Jobs</option>
            <option value="Part-time Jobs">Part-time Jobs</option>
            <option value="Internships">Internships</option>
            <option value="Freelance Projects">Freelance Projects</option>
            <option value="Remote Jobs">Remote Jobs</option>
            <option value="Entry-level Jobs">Entry-level Jobs</option>
            <option value="Teaching and Tutoring">Teaching and Tutoring</option>
            <option value="Senior-friendly & Mentorship">Senior-friendly & Mentorship</option>
          </select>

          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllWorkModes}</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllExperience}</option>
            <option value="Entry-level">Entry-level</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Experienced">Experienced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-900">No matching opportunities found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {opp.category}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Demo Listing
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrustBadge status={opp.verification_status} size="sm" />
                    <button
                      onClick={() => handleToggleSave(opp.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        opp.is_saved
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                      title={t.savedJobs}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900">{opp.title}</h3>
                  <p className="text-xs text-slate-500">
                    {opp.company} · {opp.location} · {opp.work_mode} · {opp.experience_level}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {opp.description}
                </p>

                {/* SKILL MATCH BOX IF LOGGED IN CANDIDATE */}
                {user?.role === 'job_seeker' && opp.match_score !== null && opp.match_score !== undefined && (
                  <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                    opp.match_score >= 50
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {opp.match_score >= 50 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t.eligibleThreshold} ({opp.match_score}% Match)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t.belowThreshold} ({opp.match_score}%)</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] font-medium opacity-90">
                        {opp.matched_skills?.length} of {opp.required_skills?.length} matched
                      </span>
                    </div>

                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-current/15">
                      <div
                        className={`h-full rounded-full transition-all ${
                          opp.match_score >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${opp.match_score}%` }}
                      />
                    </div>

                    <div className="text-[10px] leading-tight">
                      {opp.match_explanation}
                    </div>

                    {/* Missing Skills with YouTube Tutorials */}
                    {opp.missing_skills && opp.missing_skills.length > 0 && (
                      <div className="pt-2 border-t border-current/10 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-700">
                          <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
                          <span>{t.learnMissingSkills}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.missing_skills.map((skill, i) => (
                            <a
                              key={i}
                              href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}+tutorial`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition-colors shadow-2xs"
                              title={`Watch ${skill} tutorials on YouTube`}
                            >
                              <YoutubeIcon className="w-3 h-3 text-red-600" />
                              <span>{skill}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-red-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Required Skills tags */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t.requiredSkills}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opp.required_skills?.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">{t.compensation}: </span>
                  <span className="font-bold text-slate-900">{opp.compensation || 'Disclosed upon interview'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportTarget({ id: opp.id, name: `${opp.title} at ${opp.company}` })}
                    className="text-slate-400 hover:text-amber-700 p-1"
                    title="Report opportunity"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>

                  {opp.is_applied ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.applied}</span>
                    </span>
                  ) : user?.role === 'job_seeker' ? (
                    <button
                      disabled={opp.match_score !== null && opp.match_score !== undefined && opp.match_score < 50}
                      onClick={() => {
                        setSelectedOppForApply(opp);
                        setCoverLetter('');
                        setResumeUrl(user.profile_url || '');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 ${
                        opp.match_score !== null && opp.match_score !== undefined && opp.match_score < 50
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]'
                      }`}
                      title={
                        opp.match_score !== null && opp.match_score !== undefined && opp.match_score < 50
                          ? 'Application locked: Match score is below 50%'
                          : 'Submit application'
                      }
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.applyNow}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedOppForApply(opp);
                        setCoverLetter('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.applyNow}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK APPLY MODAL */}
      {selectedOppForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">{t.applyNow}</h3>
                <p className="text-xs text-slate-500">
                  {selectedOppForApply.title} at {selectedOppForApply.company}
                </p>
              </div>
              <button
                onClick={() => setSelectedOppForApply(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {applyFeedback ? (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold">
                ✓ {applyFeedback}
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Resume or Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/yourhandle or portfolio link"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Cover Note / Relevant Highlights
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe how your skills align with this position..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  <strong>Application Policy:</strong> Submissions are processed through our deterministic skill match validator.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedOppForApply(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-2xs"
                  >
                    {isApplying ? 'Submitting...' : t.applyNow}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REPORT SUSPICIOUS MODAL */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          targetType="Job"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
