import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Search,
  Filter,
  ShieldCheck,
  Globe,
  Users,
  MapPin,
  ExternalLink,
  Bookmark,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { Startup, Opportunity } from '../types';
import { api } from '../services/api';
import { TrustBadge } from '../components/TrustBadge';
import { ReportModal } from '../components/ReportModal';
import { useAuth } from '../context/AuthContext';

export const StartupsPage: React.FC = () => {
  const { user } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected startup for detailed view modal
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ id: number; name: string } | null>(null);

  const fetchStartups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStartups({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        stage: stageFilter !== 'All' ? stageFilter : undefined,
        verification: verificationFilter !== 'All' ? verificationFilter : undefined,
        q: searchQuery || undefined,
      });
      setStartups(data);
    } catch (err) {
      console.error('Failed to load startups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [categoryFilter, stageFilter, verificationFilter, searchQuery]);

  const handleOpenDetails = async (id: number) => {
    try {
      const detail = await api.getStartup(id);
      setSelectedStartup(detail);
    } catch (err) {
      console.error('Failed to load startup detail:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
          <Rocket className="w-3.5 h-3.5" />
          <span>Venture Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          Discover Emerging Startups
        </h1>
        <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
          Explore early-stage ventures across Tech, Non-Tech, and Dedicated Social Welfare impact domains.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#65736A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, problem, or solution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Category Tabs: Specifying Dedicated Social Welfare */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Categories</option>
            <option value="Tech Startups">Tech Startups</option>
            <option value="Non-Tech Startups">Non-Tech Startups</option>
            <option value="Social Welfare Startups">Social Welfare Startups ★</option>
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

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Verification</option>
            <option value="Verified">Verified Only</option>
            <option value="Verification Pending">Review Pending</option>
            <option value="Unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Startups Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#65736A]">
          Loading startup directory...
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EAE5] p-8">
          <Rocket className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-[#17211B]">No matching startups found</h3>
          <p className="text-xs text-[#65736A] mt-1">Try relaxing your category or stage filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs hover:border-[#138A4B]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      st.category === 'Social Welfare Startups'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-[#EAF7EF] text-[#08663A]'
                    }`}
                  >
                    {st.category}
                  </span>
                  <TrustBadge status={st.verification_status} size="sm" />
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#17211B] line-clamp-1">{st.name}</h3>
                  <p className="text-xs text-[#65736A]">{st.industry} · {st.stage}</p>
                </div>

                <p className="text-xs text-[#65736A] line-clamp-3 leading-relaxed">
                  {st.description}
                </p>

                <div className="p-2.5 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] text-xs">
                  <span className="font-semibold text-[#17211B]">Problem: </span>
                  <span className="text-[#65736A] line-clamp-2">{st.problem}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {st.required_skills?.slice(0, 3).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] bg-white border border-[#E3EAE5] rounded text-[#17211B]"
                    >
                      {sk}
                    </span>
                  ))}
                  {st.required_skills?.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-[#65736A]">
                      +{st.required_skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <span className="text-[#65736A]">{st.location}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportTarget({ id: st.id, name: st.name })}
                    className="text-[#65736A] hover:text-amber-700 p-1"
                    title="Report suspicious listing"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetails(st.id)}
                    className="font-semibold text-[#138A4B] hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STARTUP DETAILS MODAL */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-[#E3EAE5]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF7EF] text-[#08663A]">
                    {selectedStartup.category}
                  </span>
                  <TrustBadge status={selectedStartup.verification_status} size="sm" />
                </div>
                <h2 className="text-xl font-bold text-[#17211B]">{selectedStartup.name}</h2>
                <p className="text-xs text-[#65736A]">
                  Founded by {selectedStartup.owner_name} · {selectedStartup.industry} · {selectedStartup.stage}
                </p>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-[#65736A] hover:text-[#17211B]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-[#17211B] mb-1">Overview</h4>
                <p className="text-[#65736A] leading-relaxed">{selectedStartup.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5]">
                  <h5 className="font-bold text-[#17211B] mb-1">Problem Being Solved</h5>
                  <p className="text-[#65736A] leading-relaxed">{selectedStartup.problem}</p>
                </div>
                <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5]">
                  <h5 className="font-bold text-[#17211B] mb-1">Proposed Solution</h5>
                  <p className="text-[#65736A] leading-relaxed">{selectedStartup.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-[#E3EAE5]">
                <div>
                  <div className="text-[#65736A] text-[10px] uppercase">Location</div>
                  <div className="font-semibold text-[#17211B]">{selectedStartup.location}</div>
                </div>
                <div>
                  <div className="text-[#65736A] text-[10px] uppercase">Team Size</div>
                  <div className="font-semibold text-[#17211B]">{selectedStartup.team_size} members</div>
                </div>
                <div>
                  <div className="text-[#65736A] text-[10px] uppercase">Funding Stage</div>
                  <div className="font-semibold text-[#17211B]">{selectedStartup.funding_stage || 'Bootstrapped'}</div>
                </div>
                <div>
                  <div className="text-[#65736A] text-[10px] uppercase">Target Capital</div>
                  <div className="font-semibold text-[#08663A]">{selectedStartup.funding_requirement || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#17211B] mb-2">Required Core Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStartup.required_skills?.map((sk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#EAF7EF] text-[#08663A] rounded-lg border border-[#138A4B]/20"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Open Opportunities for this startup */}
              {selectedStartup.open_opportunities && selectedStartup.open_opportunities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E3EAE5]">
                  <h4 className="font-bold text-sm text-[#17211B]">Open Positions at this Startup</h4>
                  <div className="space-y-2">
                    {selectedStartup.open_opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-[#17211B]">{opp.title}</div>
                          <div className="text-[11px] text-[#65736A]">{opp.category} · {opp.work_mode} · {opp.compensation}</div>
                        </div>
                        <span className="text-xs font-semibold text-[#138A4B]">Active Opening</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E3EAE5]">
              <button
                onClick={() => setSelectedStartup(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          targetType="Startup"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
