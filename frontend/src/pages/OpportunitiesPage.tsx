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
  Send,
  ShieldCheck,
  X
} from 'lucide-react';
import { Opportunity } from '../types';
import { api } from '../services/api';
import { TrustBadge } from '../components/TrustBadge';
import { ReportModal } from '../components/ReportModal';
import { useAuth } from '../context/AuthContext';

export const OpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Opportunities Board</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          Explore Jobs, Internships & Projects
        </h1>
        <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
          Transparent listings featuring deterministic skill matching. Clearly identified demo opportunities for hackathon presentation.
        </p>
      </div>

      {/* Demo Data Disclaimer Banner */}
      <div className="p-3.5 bg-[#EAF7EF]/70 border border-[#138A4B]/20 rounded-2xl flex items-center justify-between gap-4 text-xs text-[#08663A]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#138A4B] shrink-0" />
          <span>
            <strong>Demo Data Identification:</strong> All opportunities displayed are realistic simulated positions for student and early career demonstration.
          </span>
        </div>
        <span className="font-semibold shrink-0 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-[#138A4B]/20">
          Verified Demo Data
        </span>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#65736A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search title, skills, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Categories</option>
            <option value="Full-time Jobs">Full-time Jobs</option>
            <option value="Part-time Jobs">Part-time Jobs</option>
            <option value="Internships">Internships</option>
            <option value="Freelance Projects">Freelance Projects</option>
            <option value="Remote Jobs">Remote Jobs</option>
            <option value="Entry-level Jobs">Entry-level Jobs</option>
            <option value="Teaching and Tutoring">Teaching and Tutoring</option>
          </select>

          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Experience</option>
            <option value="Entry-level">Entry-level</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Experienced">Experienced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#65736A]">
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EAE5] p-8">
          <Briefcase className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-[#17211B]">No matching opportunities found</h3>
          <p className="text-xs text-[#65736A] mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs hover:border-[#138A4B]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF7EF] text-[#08663A]">
                      {opp.category}
                    </span>
                    <span className="text-[10px] font-semibold bg-gray-100 text-[#65736A] px-2 py-0.5 rounded">
                      Demo Listing
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                  <p className="text-xs text-[#65736A]">
                    {opp.company} · {opp.location} · {opp.work_mode} · {opp.experience_level}
                  </p>
                </div>

                <p className="text-xs text-[#65736A] leading-relaxed line-clamp-3">
                  {opp.description}
                </p>

                {/* SKILL MATCH BOX IF LOGGED IN CANDIDATE */}
                {user?.role === 'job_seeker' && opp.match_score !== null && opp.match_score !== undefined && (
                  <div className="p-3 bg-[#EAF7EF]/70 rounded-xl border border-[#138A4B]/20 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#08663A]">
                        Skill Match: {opp.match_score}%
                      </span>
                      <span className="text-[11px] text-[#08663A]">
                        {opp.matched_skills?.length} of {opp.required_skills?.length} matched
                      </span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#138A4B]/20">
                      <div
                        className="bg-[#138A4B] h-full rounded-full"
                        style={{ width: `${opp.match_score}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#08663A]">
                      {opp.match_explanation}
                    </div>
                  </div>
                )}

                {/* Required Skills tags */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-[#65736A] uppercase tracking-wider">
                    Required Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opp.required_skills?.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-[#F8FAF8] border border-[#E3EAE5] rounded text-[#17211B]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#65736A]">Compensation: </span>
                  <span className="font-bold text-[#17211B]">{opp.compensation || 'Disclosed upon interview'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportTarget({ id: opp.id, name: `${opp.title} at ${opp.company}` })}
                    className="text-[#65736A] hover:text-amber-700 p-1"
                    title="Report opportunity"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>

                  {opp.is_applied ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
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
                      Apply Now
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
                    Short Cover Note / Relevance
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how your background and skills match this position..."
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

      {/* REPORT MODAL */}
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
