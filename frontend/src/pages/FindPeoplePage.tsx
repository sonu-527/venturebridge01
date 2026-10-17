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

export const FindPeoplePage: React.FC = () => {
  const { user } = useAuth();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
          <Users className="w-3.5 h-3.5" />
          <span>Talent & Co-Founder Discovery</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          Find Co-founders & Team Members
        </h1>
        <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
          Transparent candidate ranking based on declared competencies and collaboration modes. Each match displays a verified rationale.
        </p>
      </div>

      {/* Matching Rationale Notice */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <Sparkles className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
        <div>
          <strong>Transparent Match Rationale:</strong> Candidates are ranked by verified skill overlap with your startup requirements.
          A high match score highlights technical overlap only; founders and candidates should independently evaluate interpersonal and operational compatibility.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#65736A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by skill (e.g. React, Python, Figma)..."
            value={targetSkill}
            onChange={(e) => setTargetSkill(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={preferredMode}
            onChange={(e) => setPreferredMode(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Work Modes</option>
            <option value="Remote">Remote Only</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#65736A]">
          Loading candidate profiles...
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EAE5] p-8">
          <Users className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-[#17211B]">No matching talent found</h3>
          <p className="text-xs text-[#65736A] mt-1">Try clearing your skill filter to see all candidates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs hover:border-[#138A4B]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={cand.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={cand.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-[#E3EAE5]"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-[#17211B]">{cand.full_name}</h3>
                      <p className="text-xs text-[#65736A]">{cand.experience_level} · {cand.preferred_work_mode}</p>
                    </div>
                  </div>
                  <TrustBadge status={cand.is_verified ? 'Verified' : 'Unverified'} size="sm" />
                </div>

                {cand.bio && (
                  <p className="text-xs text-[#65736A] leading-relaxed line-clamp-2">
                    {cand.bio}
                  </p>
                )}

                {/* Match Rationale Card */}
                {cand.match_reason && (
                  <div className="p-3 bg-[#EAF7EF]/70 rounded-xl border border-[#138A4B]/20 text-xs text-[#08663A] leading-relaxed">
                    <strong>Match Rationale: </strong>
                    <span>{cand.match_reason}</span>
                  </div>
                )}

                <div className="text-[11px] text-[#65736A] space-y-0.5">
                  {cand.education && <div><strong className="text-[#17211B]">Education:</strong> {cand.education}</div>}
                  {cand.location && <div><strong className="text-[#17211B]">Location:</strong> {cand.location}</div>}
                </div>

                {/* Skills tags */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-[#65736A] uppercase tracking-wider">
                    Core Skills:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cand.skills?.map((sk, i) => (
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

              {/* Footer with Portfolio/GitHub links and Connect Button */}
              <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {cand.portfolio_url && (
                    <a
                      href={cand.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#65736A] hover:text-[#138A4B] p-1"
                      title="Portfolio Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {cand.github_url && (
                    <a
                      href={cand.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#65736A] hover:text-[#17211B] p-1"
                      title="GitHub Profile"
                    >
                      <Code2 className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => {
                    setConnectingCandidate(cand);
                    setConnectionFeedback(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECT REQUEST MODAL */}
      {connectingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE5]">
              <div>
                <h3 className="font-bold text-base text-[#17211B]">
                  Connect with {connectingCandidate.full_name}
                </h3>
                <p className="text-xs text-[#65736A]">{connectingCandidate.experience_level}</p>
              </div>
              <button
                onClick={() => setConnectingCandidate(null)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            {connectionFeedback ? (
              <div className="p-4 bg-[#EAF7EF] text-[#08663A] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{connectionFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleSendConnection} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Introduction Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConnectingCandidate(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#65736A] hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingRequest}
                    className="px-5 py-2 text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] rounded-xl disabled:opacity-50"
                  >
                    {isSendingRequest ? 'Sending...' : 'Send Request'}
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
