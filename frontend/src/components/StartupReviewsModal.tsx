import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StartupComment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface StartupReviewsModalProps {
  startupId: number;
  startupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StartupReviewsModal: React.FC<StartupReviewsModalProps> = ({
  startupId,
  startupName,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState<StartupComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [roleTitle, setRoleTitle] = useState('Frontend Engineer');
  const [message, setMessage] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.getStartupComments(startupId);
      setComments(res);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, startupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmitting(true);
      setMessage(null);
      const res = await api.submitStartupComment(startupId, {
        comment_text: commentText,
        pros,
        cons,
        role_title: roleTitle,
      });
      setMessage(`Review posted! Status: ${res.employment_status}`);
      setCommentText('');
      setPros('');
      setCons('');
      fetchComments();
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const isInvestor = user?.role === 'investor';

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this workplace review?')) return;
    try {
      await api.deleteStartupComment(commentId);
      fetchComments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 relative max-h-[90vh] flex flex-col my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            💬
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('rating.commentsTitle', 'Employee & Collaborator Experience Reviews')}
            </h3>
            <p className="text-xs text-slate-500">{startupName} • Verified Workplace Culture & Feedback</p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6">
          {loading ? (
            <p className="text-center py-8 text-xs text-slate-400">Loading experiences...</p>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-700">No workplace reviews yet</p>
              <p className="text-xs text-slate-400 mt-1">Be the first employee, contractor, or candidate to share experience!</p>
            </div>
          ) : (
            comments.map((c) => {
              const canDelete = Boolean(user && (user.id === c.user_id || user.role === 'admin') && !isInvestor);
              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                        {c.author_name ? c.author_name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{c.author_name}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">• {c.role_title}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Verification Badge */}
                      {c.is_verified_employee ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          ✓ {t('rating.verifiedEmployee', 'Verified Employment')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {t('rating.communityReview', 'Community Review')}
                        </span>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-red-600 text-xs px-1 py-0.5 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Delete your review"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 mb-2 leading-relaxed">{c.comment_text}</p>

                  {(c.pros || c.cons) && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      {c.pros && (
                        <div className="bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-100">
                          <span className="font-bold">Pros:</span> {c.pros}
                        </div>
                      )}
                      {c.cons && (
                        <div className="bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-100">
                          <span className="font-bold">Notes/Cons:</span> {c.cons}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-2 text-right">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Post Review Form / Read-only Investor Banner */}
        {!user ? (
          <p className="text-xs text-slate-500 text-center py-4 border-t border-slate-100">
            Please log in to write a workplace review.
          </p>
        ) : isInvestor ? (
          <div className="border-t border-amber-200 bg-amber-50/80 -mx-6 -mb-6 p-5 rounded-b-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
              ℹ
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">View Only Mode</p>
              <p className="text-[11px] text-amber-800">
                Investors have verified read-only access to startup reviews and workplace experience feedback.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              {t('rating.writeReview', 'Write Workplace Experience')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Your Role at Company</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer, Intern, Contributor"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Highlights / Pros</label>
                <input
                  type="text"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="e.g. Great mentorship, fast pace, competitive pay"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Constructive Feedback / Cons</label>
              <input
                type="text"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="e.g. Overtime during launch sprint"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Experience Overview *</label>
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Describe team collaboration, sprint cadence, engineering practices, and founder transparency..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {message && (
              <p className="text-xs mb-3 font-semibold text-blue-700 bg-blue-100/60 p-2 rounded">
                {message}
              </p>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                Verified badge is awarded automatically if you have matched/applied or connected with the founder.
              </span>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Post Experience Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
