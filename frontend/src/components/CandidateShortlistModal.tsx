import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShortlistedCandidate, CandidateShortlistResponse } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CandidateShortlistModalProps {
  opportunityId: number;
  opportunityTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateShortlistModal: React.FC<CandidateShortlistModalProps> = ({
  opportunityId,
  opportunityTitle,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<CandidateShortlistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showGDScheduler, setShowGDScheduler] = useState(false);

  // GD Scheduler form fields
  const [gdTitle, setGdTitle] = useState('');
  const [gdAgenda, setGdAgenda] = useState('');
  const [gdDateTime, setGdDateTime] = useState('');
  const [gdMeetUrl, setGdMeetUrl] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [gdSuccessMessage, setGdSuccessMessage] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.getTopCandidatesForOpportunity(opportunityId);
      setData(res);
      // Auto-prefill GD Title
      setGdTitle(`Group Discussion: ${res.opportunity_title}`);
      setGdAgenda(`Discussion on competencies: ${res.required_skills.slice(0, 3).join(', ')}.`);
      // Default auto-generated Google Meet URL
      const slug = res.opportunity_title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10);
      setGdMeetUrl(`https://meet.google.com/vb-gd-${slug}-${opportunityId}`);
    } catch (err) {
      console.error('Failed to load candidate shortlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
      setSelectedIds([]);
      setShowGDScheduler(false);
      setGdSuccessMessage(null);
    }
  }, [isOpen, opportunityId]);

  const toggleSelectCandidate = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!data) return;
    if (selectedIds.length === data.top_candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.top_candidates.map((c) => c.id));
    }
  };

  const handleScheduleGD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Please select at least one candidate for the Group Discussion.');
      return;
    }
    try {
      setScheduling(true);
      setGdSuccessMessage(null);
      await api.scheduleGroupMeeting({
        opportunity_id: opportunityId,
        title: gdTitle,
        agenda: gdAgenda,
        scheduled_at: gdDateTime || new Date(Date.now() + 86400000 * 2).toISOString(),
        google_meet_url: gdMeetUrl,
        candidate_ids: selectedIds,
      });
      setGdSuccessMessage(
        `Group Discussion scheduled successfully! Invitations & Google Meet link sent to ${selectedIds.length} candidate(s).`
      );
      setTimeout(() => {
        setShowGDScheduler(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule group meeting.');
    } finally {
      setScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 relative max-h-[90vh] flex flex-col my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            🎯
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('shortlist.title', 'Top 10 Candidate Shortlist (80/20 Scoring)')}
            </h3>
            <p className="text-xs text-slate-500">
              Role: <span className="font-semibold text-slate-700">{opportunityTitle}</span>
            </p>
          </div>
        </div>

        {/* 80/20 Formula Disclosure Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200/80 rounded-xl p-3.5 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                Official Employer Algorithm
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {t('shortlist.formula', 'Candidate Score = (0.80 × Skill Match %) + (0.20 × Academic/CGPA Score %)')}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Evaluates practical competency (80% weight) alongside normalized university CGPA / degree benchmarks (20% weight).
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                50% Application Threshold Preserved
              </span>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {loading ? (
            <p className="text-center py-8 text-xs text-slate-400">Evaluating candidate benchmarks...</p>
          ) : !data || data.top_candidates.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-700">No candidates available</p>
              <p className="text-xs text-slate-400 mt-1">Job seekers with relevant skills will appear here.</p>
            </div>
          ) : (
            data.top_candidates.map((c, index) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelectCandidate(c.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by div onClick
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 pointer-events-none"
                    />

                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{c.full_name}</span>
                        {c.education_status && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            🎓 {c.education_status}
                          </span>
                        )}
                        {!c.is_eligible_under_50_rule && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Under 50% threshold
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {c.explanation}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.matched_skills.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                            ✓ {s}
                          </span>
                        ))}
                        {c.missing_skills.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Composite Score Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-blue-700 font-mono">
                      {c.composite_score}%
                    </div>
                    <span className="text-[10px] text-slate-400">80/20 Composite</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Group Discussion (GD) Scheduling Drawer */}
        {showGDScheduler && (
          <form onSubmit={handleScheduleGD} className="bg-slate-50 border border-blue-200 rounded-xl p-4 mb-4 animate-in slide-in-from-bottom-2 duration-150">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>📅</span> {t('shortlist.scheduleGD', 'Schedule Group Discussion (Google Meet)')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Meeting Title *</label>
                <input
                  type="text"
                  value={gdTitle}
                  onChange={(e) => setGdTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Google Meet URL *</label>
                <input
                  type="url"
                  value={gdMeetUrl}
                  onChange={(e) => setGdMeetUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono text-blue-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={gdDateTime}
                  onChange={(e) => setGdDateTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Discussion Agenda / Notes</label>
                <input
                  type="text"
                  value={gdAgenda}
                  onChange={(e) => setGdAgenda(e.target.value)}
                  placeholder="e.g. System architecture, team fit, C++ live coding"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {gdSuccessMessage && (
              <p className="text-xs font-semibold text-blue-700 bg-blue-100 p-2 rounded mb-2">
                {gdSuccessMessage}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGDScheduler(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scheduling}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {scheduling ? 'Scheduling...' : `Invite ${selectedIds.length} Candidate(s) via Meet`}
              </button>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              {data && selectedIds.length === data.top_candidates.length ? 'Deselect All' : 'Select All Top Candidates'}
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">{selectedIds.length} candidate(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setShowGDScheduler(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>📅</span> {t('shortlist.scheduleGD', 'Schedule Group Discussion')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
