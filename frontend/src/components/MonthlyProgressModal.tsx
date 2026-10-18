import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MonthlyReminder, MonthlyProgressReport } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MonthlyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId?: number;
  startupName?: string;
  defaultStartupId?: number;
  onReportSubmitted?: () => void;
  onSubmitted?: () => void;
}

export const MonthlyProgressModal: React.FC<MonthlyProgressModalProps> = ({
  isOpen,
  onClose,
  startupId: propStartupId,
  startupName,
  defaultStartupId,
  onReportSubmitted,
  onSubmitted,
}) => {
  const effectiveStartupId = propStartupId || defaultStartupId || 1;
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<MonthlyReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [startupId, setStartupId] = useState<number>(effectiveStartupId);
  const [investorId, setInvestorId] = useState<number>(7);
  const [reportingMonth, setReportingMonth] = useState('October 2026');
  const [revenue, setRevenue] = useState<number>(1850000);
  const [expenses, setExpenses] = useState<number>(480000);
  const [runway, setRunway] = useState<string>('18 months');
  const [milestones, setMilestones] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextGoals, setNextGoals] = useState('');
  const [asks, setAsks] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getMonthlyProgressReminders();
      setReminders(res.reminders);
      if (res.current_month) {
        setReportingMonth(res.current_month);
      }
      if (res.reminders.length > 0) {
        setStartupId(res.reminders[0].startup_id);
        setInvestorId(res.reminders[0].investor_id);
      }
    } catch (err) {
      console.error('Failed to load progress reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
      setMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await api.submitMonthlyProgressReport({
        startup_id: startupId,
        investor_id: investorId,
        reporting_month: reportingMonth,
        revenue: Number(revenue),
        expenses: Number(expenses),
        milestones_achieved: milestones,
        challenges: `${challenges} (Runway: ${runway})`,
        next_month_goals: nextGoals,
        notes: asks,
      });
      setMessage('Monthly progress report logged and delivered to confirmed investors!');
      setTimeout(() => {
        if (onReportSubmitted) onReportSubmitted();
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit progress report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 relative max-h-[92vh] flex flex-col my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
            📈
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('progress.submitReport', 'Submit Monthly Progress Report')}
            </h3>
            <p className="text-xs text-slate-500">
              30-day automated updates for confirmed angel investors & board stakeholders
            </p>
          </div>
        </div>

        {/* Reminders Banner if any */}
        {reminders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
              30-Day Automated Investor Notice
            </span>
            <div className="mt-1 space-y-1">
              {reminders.map((r, i) => (
                <p key={i} className="text-xs font-semibold text-amber-950">
                  • {r.reminder_text}
                </p>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Reporting Month *</label>
              <input
                type="text"
                value={reportingMonth}
                onChange={(e) => setReportingMonth(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Estimated Cash Runway</label>
              <input
                type="text"
                value={runway}
                onChange={(e) => setRunway(e.target.value)}
                placeholder="e.g. 18 months"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                {t('progress.revenue', 'Monthly Revenue (INR ₹)')} *
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                {t('progress.burnRate', 'Monthly Burn Rate / Expenses (INR ₹)')} *
              </label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              {t('progress.milestones', 'Key Milestones Achieved This Month')} *
            </label>
            <textarea
              rows={2}
              value={milestones}
              onChange={(e) => setMilestones(e.target.value)}
              placeholder="e.g. Shipped IoT telemetry v2, closed 5 enterprise B2B pilots, grew user retention by 28%..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Operational Challenges & Blockers
            </label>
            <textarea
              rows={2}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="e.g. Hardware sensor supplier lead time delayed by 2 weeks; working with backup vendor..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Next Month Priorities & Goals
            </label>
            <textarea
              rows={2}
              value={nextGoals}
              onChange={(e) => setNextGoals(e.target.value)}
              placeholder="e.g. Launch self-serve billing, hire 2 backend engineers, begin ISO 27001 audit..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              {t('progress.investorAsks', 'Asks for Investors & Introductions Needed')}
            </label>
            <input
              type="text"
              value={asks}
              onChange={(e) => setAsks(e.target.value)}
              placeholder="e.g. Warm intros to fleet logistics directors or automotive OEM procurement leads..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {message && (
            <p className="text-xs font-semibold text-blue-800 bg-blue-100 p-2.5 rounded-xl">
              {message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Transmitting...' : 'Dispatch Monthly Investor Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
