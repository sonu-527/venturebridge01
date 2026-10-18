import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Briefcase,
  ExternalLink,
  Code2,
  Globe,
  UserPlus,
  CheckCircle2,
  Sparkles,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Candidate } from '../types';
import { api } from '../services/api';
import { TrustBadge } from '../components/TrustBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const FindPeoplePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [targetSkill, setTargetSkill] = useState<string>('');
  const [preferredMode, setPreferredMode] = useState<string>('All');

  // Connection request modal / state
  const [connectingCandidate, setConnectingCandidate] = useState<Candidate | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>('Hi, I saw your profile on VentureBridge and would love to connect regarding potential collaboration.');
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await api.findCofounders({
        target_skill: targetSkill || undefined,
        preferred_mode: preferredMode !== 'All' ? preferredMode : undefined,
      });
      setCandidates(data);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [targetSkill, preferredMode]);

  const handleSendConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to send connection requests.');
      return;
    }
    if (!connectingCandidate) return;

    setIsSendingRequest(true);
    setConnectionFeedback(null);
    try {
      const res = await api.sendConnectionRequest(connectingCandidate.id, connectionMessage);
      setConnectionFeedback(res.message);
      setTimeout(() => {
        setConnectingCandidate(null);
        setConnectionFeedback(null);
      }, 2000);
    } catch (err: any) {
      setConnectionFeedback(err.message || 'Failed to send connection request.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Co-founder & Talent Discovery</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.searchCandidates} & Team
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Candidate ranking based on declared skills and preferred collaboration modes.
          </p>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start md:self-auto font-medium">
          <span>{candidates.length} profiles available</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by skill (e.g. React, Python, Figma)..."
            value={targetSkill}
            onChange={(e) => setTargetSkill(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={preferredMode}
            onChange={(e) => setPreferredMode(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllWorkModes}</option>
            <option value="Remote">Remote Only</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading candidate profiles...
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-900">No matching talent found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your skill filter to see all candidates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {cand.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{cand.full_name}</h3>
                      <p className="text-xs text-slate-500">{cand.location || 'Location flexible'}</p>
                    </div>
                  </div>
                  <TrustBadge status={cand.is_verified ? 'Verified' : 'Unverified'} size="sm" />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {cand.bio || 'Product builder focused on early-stage initiatives.'}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Education:</span>
                    <span className="font-semibold text-slate-900">{cand.education || 'Computer Science'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Experience:</span>
                    <span className="font-semibold text-slate-900">{cand.experience_level || 'Intermediate'}</span>
                  </div>
                  {cand.cgpa ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Academic Score:</span>
                      <span className="font-bold text-amber-600">CGPA {cand.cgpa}/10</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cand.skills?.map((sk, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 text-[10px] rounded border ${
                          targetSkill && sk.toLowerCase().includes(targetSkill.toLowerCase())
                            ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                {cand.portfolio_url ? (
                  <a
                    href={cand.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Profile verified</span>
                )}

                <button
                  onClick={() => setConnectingCandidate(cand)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECT MODAL */}
      {connectingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Send Connection Request</h3>
                <p className="text-xs text-slate-500">Connect with {connectingCandidate.full_name}</p>
              </div>
              <button
                onClick={() => setConnectingCandidate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {connectionFeedback ? (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold">
                ✓ {connectionFeedback}
              </div>
            ) : (
              <form onSubmit={handleSendConnection} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Introduction Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setConnectingCandidate(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingRequest}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-2xs"
                  >
                    {isSendingRequest ? 'Sending...' : 'Send Invitation'}
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
