import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RatingStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface StarRatingProps {
  targetType?: 'founder' | 'investor';
  targetId?: number;
  startupId?: number;
  founderId?: number;
  targetName?: string;
  initialStats?: RatingStats;
  compact?: boolean;
  readOnly?: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  targetType = 'founder',
  targetId = 1,
  targetName = 'User',
  initialStats,
  compact = false,
  readOnly = false,
  title,
  size = 'md',
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<RatingStats | null>(initialStats || null);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.getRatings(targetType, targetId);
      setStats(res);
      if (res.user_rating) {
        setRating(res.user_rating);
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialStats) {
      fetchRatings();
    }
  }, [targetType, targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage('Please log in to submit a rating.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      await api.submitRating({
        target_type: targetType,
        target_id: targetId,
        rating,
        review_text: reviewText,
      });
      setMessage('Rating submitted successfully!');
      fetchRatings();
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1200);
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  const avg = stats?.average_rating ?? 0;
  const count = stats?.total_ratings ?? 0;

  const isSelf = Boolean(user && Number(user.id) === Number(targetId));
  const isInvestorViewingNonInvestor = Boolean(user?.role === 'investor' && targetType !== 'investor');
  const isInvestorSelf = Boolean(user?.role === 'investor' && targetType === 'investor' && isSelf);
  const canRate = Boolean(user && !readOnly && !isSelf && !isInvestorViewingNonInvestor && !isInvestorSelf);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <span className="text-amber-500 font-bold">★ {avg > 0 ? avg.toFixed(1) : 'New'}</span>
        {count > 0 && <span className="text-slate-400 font-normal">({count})</span>}
      </div>
    );
  }

  return (
    <div className="inline-block">
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition text-slate-800 text-xs font-medium cursor-pointer"
        title={canRate ? "View and submit ratings" : "View ratings (Read Only)"}
      >
        <span className="text-amber-500 text-sm font-bold">★ {avg > 0 ? avg.toFixed(1) : '5.0'}</span>
        <span className="text-slate-700 font-semibold">{t('rating.outOfFive', 'out of 5.0')}</span>
        <span className="text-slate-400 font-normal">({count} {t('rating.reviews', 'reviews')})</span>
        <span className="text-blue-600 font-semibold underline ml-1">
          {canRate ? (stats?.user_rating ? 'Edit Rating' : 'Rate') : 'View'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                ★
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {targetType === 'founder' ? t('rating.rateFounder', 'Rate Founder') : t('rating.rateInvestor', 'Rate Investor')}
                </h3>
                <p className="text-xs text-slate-500">{targetName} • Verified Rating Record</p>
              </div>
            </div>

            {/* Scorecard Summary */}
            <div className="bg-gradient-to-br from-amber-50 to-blue-50 border border-amber-200/80 rounded-xl p-4 mb-5 flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-1">
                  {avg > 0 ? avg.toFixed(1) : '5.0'}
                  <span className="text-sm font-normal text-slate-500">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Based on {count} verified community & counterpart evaluations
                </p>
              </div>
              <div className="flex text-amber-400 text-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(avg || 5) ? 'text-amber-500' : 'text-slate-200'}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Rating Breakdown */}
            {stats && count > 0 && (
              <div className="space-y-1.5 mb-5 text-xs text-slate-600">
                {[5, 4, 3, 2, 1].map((star) => {
                  const starCount = stats.breakdown?.[star] || 0;
                  const pct = count > 0 ? (starCount / count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-12 text-right font-medium">{star} star</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right font-mono text-slate-400">{starCount}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Read-Only Info Banners or Form */}
            {!user ? (
              <p className="text-xs text-slate-500 italic text-center py-2 border-t border-slate-100">
                Log in to rate this {targetType}.
              </p>
            ) : isSelf ? (
              <div className="border-t border-amber-200 bg-amber-50/80 p-3.5 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-900">View Only Mode</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Self-rating is disabled to preserve community trust and profile integrity.
                </p>
              </div>
            ) : isInvestorViewingNonInvestor ? (
              <div className="border-t border-blue-200 bg-blue-50/80 p-3.5 rounded-xl text-center">
                <p className="text-xs font-bold text-blue-900">View Only Mode</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Investors have read-only access to startup reviews and founder performance ratings.
                </p>
              </div>
            ) : readOnly ? (
              <div className="border-t border-slate-200 bg-slate-50 p-3 rounded-xl text-center text-xs text-slate-600">
                View only mode.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {stats?.user_rating ? 'Update Your Rating (1 to 5 Stars)' : 'Submit Your 1-5 Star Rating'}
                </h4>

                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <span className={(hoverRating || rating) >= star ? 'text-amber-500' : 'text-slate-200'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>

                <div className="mb-3">
                  <textarea
                    rows={2}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share feedback on transparency, vision, responsiveness, or partnership terms (optional)..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {message && (
                  <p className={`text-xs mb-3 font-medium ${message.includes('success') ? 'text-blue-700 bg-blue-50 p-2 rounded' : 'text-red-600 bg-red-50 p-2 rounded'}`}>
                    {message}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
