import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FundraisingCommandCenterData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FundraisingCommandCenterProps {
  startupId: number;
  startupName?: string;
  initialData?: FundraisingCommandCenterData;
  onOpenNegotiationRoom?: (roomId: number) => void;
  onFundraisingUpdated?: () => void;
}

export const FundraisingCommandCenter: React.FC<FundraisingCommandCenterProps> = ({
  startupId,
  startupName,
  initialData,
  onOpenNegotiationRoom,
  onFundraisingUpdated,
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<FundraisingCommandCenterData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const fetchFundraising = async () => {
    try {
      setLoading(true);
      const res = await api.getFundraisingCommandCenter(startupId);
      setData(res);
    } catch (err) {
      console.error('Failed to load fundraising data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchFundraising();
    }
  }, [startupId]);

  if (!data && loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-slate-100 rounded"></div>
          <div className="h-16 bg-slate-100 rounded"></div>
          <div className="h-16 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Approximate conversion rate for dual-currency view: 1 USD = 83 INR
  const FX_RATE = 83.0;

  const target = currency === 'INR' ? data.target_funding_goal : Math.round(data.target_funding_goal / FX_RATE);
  const raised = currency === 'INR' ? data.total_raised : Math.round(data.total_raised / FX_RATE);
  const remaining = Math.max(0, target - raised);
  const symbol = currency === 'INR' ? '₹' : '$';
  const progressPct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white p-6 shadow-xl border border-blue-900/50 mb-6 relative overflow-hidden">
      {/* Decorative accent blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-extrabold tracking-wide uppercase text-blue-200">
              {t('fundraising.title', 'Fundraising Command Center')}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time capital balance for <span className="font-bold text-white">{data.startup_name}</span>
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              currency === 'INR' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              currency === 'USD' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('fundraising.target', 'Target Goal')}
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {symbol}{target.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Total Seed / Angel Round</span>
        </div>

        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 backdrop-blur-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
            {t('fundraising.raised', 'Raised to Date')}
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {symbol}{raised.toLocaleString()}
          </div>
          <span className="text-[10px] text-blue-200">
            {progressPct}% {t('fundraising.funded', 'Funded')}
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('fundraising.remaining', 'Remaining Needed')}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {symbol}{remaining.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Open Allocation for Investors</span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative z-10 mb-6">
        <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
          <span>Capital Progress</span>
          <span className="font-mono text-amber-300">{progressPct}% Complete</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Confirmed Investments & Pending Negotiations Summary */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10">
        <div>
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <span>🤝</span> Confirmed Investments ({data.confirmed_investments.length})
          </h4>
          {data.confirmed_investments.length === 0 ? (
            <p className="text-slate-400 italic text-[11px]">No confirmed term sheets closed yet.</p>
          ) : (
            <div className="space-y-1.5">
              {data.confirmed_investments.map((deal) => (
                <div key={deal.id} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-white font-medium">{deal.investor_name}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {symbol}{(currency === 'INR' ? deal.amount : Math.round(deal.amount / FX_RATE)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <span>⚖️</span> Active Negotiations ({data.pending_proposals.length})
          </h4>
          {data.pending_proposals.length === 0 ? (
            <p className="text-slate-400 italic text-[11px]">No active term sheet proposals in chamber.</p>
          ) : (
            <div className="space-y-1.5">
              {data.pending_proposals.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => onOpenNegotiationRoom && onOpenNegotiationRoom(prop.id)}
                  className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer transition"
                >
                  <span className="text-white font-medium truncate max-w-[140px]">{prop.investor_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-300">
                      {symbol}{(currency === 'INR' ? prop.proposed_amount : Math.round(prop.proposed_amount / FX_RATE)).toLocaleString()} ({prop.proposed_equity}%)
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold underline">Review</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
