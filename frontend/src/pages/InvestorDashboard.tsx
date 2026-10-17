import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Bookmark,
  Send,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Rocket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Startup, StartupIdea, InvestorInterest } from '../types';
import { TrustBadge } from '../components/TrustBadge';
import { IdeaAnalysisModal } from '../components/IdeaAnalysisModal';

interface InvestorDashboardProps {
  setCurrentPage: (page: string) => void;
  onSelectStartup?: (startupId: number) => void;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ setCurrentPage, onSelectStartup }) => {
  const { user, profile } = useAuth();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [savedStartups, setSavedStartups] = useState<Startup[]>([]);
  const [sentInterests, setSentInterests] = useState<InvestorInterest[]>([]);
  const [investorOnlyIdeas, setInvestorOnlyIdeas] = useState<StartupIdea[]>([]);

  const [activeTab, setActiveTab] = useState<'discover' | 'saved' | 'interests' | 'private_ideas'>('discover');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Express Interest Modal
  const [selectedStartupForInterest, setSelectedStartupForInterest] = useState<Startup | null>(null);
  const [interestMemo, setInterestMemo] = useState<string>('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState<boolean>(false);
  const [interestSuccess, setInterestSuccess] = useState<string | null>(null);

  // Idea analysis modal
  const [selectedIdeaAnalysis, setSelectedIdeaAnalysis] = useState<{ title: string; analysis: any } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStartups, saved, interests, ideas] = await Promise.all([
        api.getStartups({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          stage: stageFilter !== 'All' ? stageFilter : undefined,
          q: searchQuery || undefined,
        }),
        api.getInvestorSavedStartups(),
        api.getMySentInterests(),
        api.getIdeas(),
      ]);

      setStartups(allStartups);
      setSavedStartups(saved);
      setSentInterests(interests);
      // Filter investor-only ideas (which our backend authorizes specifically for investors!)
      setInvestorOnlyIdeas(ideas.filter((i) => i.visibility === 'INVESTOR_ONLY'));
    } catch (err) {
      console.error('Failed to load investor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, stageFilter, searchQuery]);

  const handleToggleSave = async (startupId: number) => {
    try {
      await api.toggleSaveStartup(startupId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle save startup:', err);
    }
  };

  const handleExpressInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartupForInterest) return;
    setIsSubmittingInterest(true);
    setInterestSuccess(null);
    try {
      const res = await api.expressInterest(selectedStartupForInterest.id, interestMemo);
      setInterestSuccess(res.message);
      loadData();
      setTimeout(() => {
        setSelectedStartupForInterest(null);
        setInterestMemo('');
        setInterestSuccess(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit interest');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-white border border-[#E3EAE5] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Investor & Venture Syndicate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211B] tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-[#65736A] max-w-xl">
            Discover verified tech, non-tech, and social welfare startups. Access private, investor-gated pitch briefs and submit expressions of interest.
          </p>
        </div>

        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl max-w-xs text-xs text-amber-900 leading-relaxed">
          <strong>Mandatory Notice:</strong> VentureBridge is an MVP prototype. No financial transactions, investments, or capital calls are executed on this platform.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3EAE5] gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'discover' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Discover Startups ({startups.length})
          {activeTab === 'discover' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('private_ideas')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'private_ideas' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-purple-700" />
          <span>Investor-Only Briefs ({investorOnlyIdeas.length})</span>
          {activeTab === 'private_ideas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('interests')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'interests' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Sent Interest Requests ({sentInterests.length})
          {activeTab === 'interests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap relative ${
            activeTab === 'saved' ? 'text-[#138A4B]' : 'text-[#65736A] hover:text-[#17211B]'
          }`}
        >
          Saved Startups ({savedStartups.length})
          {activeTab === 'saved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#138A4B]" />
          )}
        </button>
      </div>

      {/* TAB 1: DISCOVER STARTUPS */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#65736A] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search startups, problems, technologies..."
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
                <option value="Tech Startups">Tech Startups</option>
                <option value="Non-Tech Startups">Non-Tech Startups</option>
                <option value="Social Welfare Startups">Social Welfare Startups</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
              >
                <option value="All">All Stages</option>
                <option value="Idea Phase">Idea Phase</option>
                <option value="MVP / Prototype">MVP / Prototype</option>
                <option value="Early Traction">Early Traction</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
          </div>

          {/* Startups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startups.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                          st.category === 'Social Welfare Startups'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-[#EAF7EF] text-[#08663A]'
                        }`}
                      >
                        {st.category}
                      </span>
                      <h3 className="font-bold text-lg text-[#17211B] mt-1.5">{st.name}</h3>
                      <p className="text-xs text-[#65736A]">{st.industry} · {st.stage}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrustBadge status={st.verification_status} size="sm" />
                      <button
                        onClick={() => handleToggleSave(st.id)}
                        className="p-1.5 rounded-lg border border-[#E3EAE5] hover:bg-gray-50 text-[#65736A]"
                        title="Bookmark startup"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#17211B]/80 leading-relaxed">
                    {st.description}
                  </p>

                  <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] space-y-1 text-xs">
                    <div><strong className="text-[#17211B]">Problem:</strong> {st.problem}</div>
                    <div><strong className="text-[#17211B]">Solution:</strong> {st.solution}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#65736A]">Location: {st.location}</span>
                    <span className="font-bold text-[#08663A] bg-[#EAF7EF] px-2 py-0.5 rounded-md">
                      Target: {st.funding_requirement || 'Undisclosed'} ({st.funding_stage || 'Pre-Seed'})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage('startups')}
                    className="text-xs font-semibold text-[#138A4B] hover:underline"
                  >
                    View Directory Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStartupForInterest(st);
                      setInterestMemo(`Hello ${st.name} team, we have reviewed your profile and would like to learn more about your traction.`);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors"
                  >
                    Express Interest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INVESTOR-ONLY CONFIDENTIAL IDEAS (BACKEND RESTRICTED) */}
      {activeTab === 'private_ideas' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-950">
            <Lock className="w-4 h-4 shrink-0 text-purple-700 mt-0.5" />
            <div>
              <strong>Confidential Briefs (Investor Authorization Only):</strong> These startup ideas have been specifically designated by founders as <code>INVESTOR_ONLY</code>. Access is authorized server-side and filtered by our FastAPI security dependency.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investorOnlyIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>INVESTOR-ONLY BRIEF</span>
                    </span>
                    <span className="text-xs text-[#65736A]">{idea.industry} · {idea.startup_stage}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#17211B]">{idea.title}</h3>
                  <p className="text-xs text-[#65736A] leading-relaxed line-clamp-3">
                    {idea.problem_statement}
                  </p>

                  <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-1">
                    <div>
                      <strong className="text-purple-950">Target Market:</strong> {idea.target_audience}
                    </div>
                    <div>
                      <strong className="text-purple-950">Capital Target:</strong> {idea.funding_requirements || 'Seed stage capital'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {idea.required_skills?.map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] bg-white border border-[#E3EAE5] rounded text-[#17211B]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      if (idea.analysis) {
                        setSelectedIdeaAnalysis({ title: idea.title, analysis: idea.analysis });
                      }
                    }}
                    className="font-semibold text-[#138A4B] hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Analysis Checklist</span>
                  </button>
                  <span className="text-[#65736A]">Author: {idea.author_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SENT INTEREST REQUESTS */}
      {activeTab === 'interests' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#17211B]">My Sent Expressions of Interest</h2>
            <p className="text-xs text-[#65736A]">Founders receive your inquiry on their entrepreneur dashboard.</p>
          </div>

          {sentInterests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <TrendingUp className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">No interest requests sent yet</h3>
              <p className="text-xs text-[#65736A] mt-1">
                Browse our startup directory and click "Express Interest" to connect with founding teams.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInterests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#17211B]">{req.startup_name}</h3>
                      <span className="text-xs text-[#65736A]">({req.founder_name})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Status: {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#17211B]/80 italic bg-[#F8FAF8] p-2.5 rounded-xl border border-[#E3EAE5] mt-1">
                      "{req.message}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SAVED STARTUPS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#17211B]">Saved Startups</h2>
            <p className="text-xs text-[#65736A]">Startups on your investment watchlist.</p>
          </div>

          {savedStartups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE5] p-8">
              <Bookmark className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#17211B]">Watchlist is empty</h3>
              <p className="text-xs text-[#65736A] mt-1">
                Bookmark startups from the discover tab to save them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedStartups.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border border-[#E3EAE5] p-5 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#17211B]">{st.name}</h3>
                    <p className="text-xs text-[#65736A]">{st.industry} · {st.stage}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSave(st.id)}
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

      {/* EXPRESS INTEREST MODAL */}
      {selectedStartupForInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE5]">
              <div>
                <h3 className="font-bold text-base text-[#17211B]">
                  Express Interest: {selectedStartupForInterest.name}
                </h3>
                <p className="text-xs text-[#65736A]">{selectedStartupForInterest.category}</p>
              </div>
              <button
                onClick={() => setSelectedStartupForInterest(null)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            {interestSuccess ? (
              <div className="p-4 bg-[#EAF7EF] text-[#08663A] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{interestSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleExpressInterestSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> This submits an official introduction request to the founding team. No money transfers take place.
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#65736A] mb-1">
                    Introduction Memo & Diligence Interest
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={interestMemo}
                    onChange={(e) => setInterestMemo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E3EAE5] rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStartupForInterest(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#65736A] hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInterest}
                    className="px-5 py-2 text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] rounded-xl disabled:opacity-50"
                  >
                    {isSubmittingInterest ? 'Sending...' : 'Send Introduction Memo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* IDEA ANALYSIS MODAL */}
      {selectedIdeaAnalysis && (
        <IdeaAnalysisModal
          isOpen={true}
          ideaTitle={selectedIdeaAnalysis.title}
          analysis={selectedIdeaAnalysis.analysis}
          onClose={() => setSelectedIdeaAnalysis(null)}
        />
      )}
    </div>
  );
};
