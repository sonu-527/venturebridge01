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
  X,
  MessageCircle,
  Star
} from 'lucide-react';
import { Startup, Opportunity } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustBadge } from '../components/TrustBadge';
import { ReportModal } from '../components/ReportModal';
import { StarRating } from '../components/StarRating';
import { StartupReviewsModal } from '../components/StartupReviewsModal';
import { FinancialCharts } from '../components/FinancialCharts';

export const StartupsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected startup for detailed view modal
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);

  // Reviews modal
  const [selectedStartupForReviews, setSelectedStartupForReviews] = useState<{ id: number; name: string } | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Rocket className="w-3.5 h-3.5 text-blue-600" />
            <span>Venture Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.discoverStartups}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {t.exploreVenturesDesc}
          </p>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start md:self-auto font-medium">
          <span>{startups.length} ventures indexed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchStartups}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllCategories}</option>
            <option value="Tech Startups">Tech Startups</option>
            <option value="Non-Tech Startups">Non-Tech Startups</option>
            <option value="Social Welfare Startups">Social Welfare Startups ★</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllStages}</option>
            <option value="Idea Phase">Idea Phase</option>
            <option value="MVP / Prototype">MVP / Prototype</option>
            <option value="Early Traction">Early Traction</option>
            <option value="Scaling">Scaling</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
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
        <div className="text-center py-16 text-xs text-slate-500">
          Loading startup directory...
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-900">No matching startups found</h3>
          <p className="text-xs text-slate-500 mt-1">Try relaxing your category or stage filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {st.category}
                  </span>
                  <TrustBadge status={st.verification_status} size="sm" />
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{st.name}</h3>
                  <p className="text-xs text-slate-500">{st.industry} · {st.stage}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {st.description}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-900">{t.problem}: </span>
                  <span className="text-slate-600 line-clamp-2">{st.problem}</span>
                </div>

                {/* 1-5 Star Ratings Component */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <StarRating
                    targetType="founder"
                    targetId={st.owner_id || st.user_id || 1}
                    title=""
                    readOnly={true}
                    size="sm"
                  />
                  <button
                    onClick={() => setSelectedStartupForReviews({ id: st.id, name: st.name })}
                    className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.workplaceExperienceReviews}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {st.required_skills?.slice(0, 3).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-700"
                    >
                      {sk}
                    </span>
                  ))}
                  {st.required_skills?.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                      +{st.required_skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">{st.location}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportTarget({ id: st.id, name: st.name })}
                    className="text-slate-400 hover:text-amber-700 p-1"
                    title="Report suspicious listing"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetails(st.id)}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {t.viewDetails}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedStartup.category}
                  </span>
                  <TrustBadge status={selectedStartup.verification_status} size="sm" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedStartup.name}</h2>
                <p className="text-xs text-slate-500">
                  Founded by {selectedStartup.owner_name} · {selectedStartup.industry} · {selectedStartup.stage}
                </p>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Interactive Rating Component */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <StarRating
                targetType="founder"
                targetId={selectedStartup.owner_id || selectedStartup.user_id || 1}
                title={`${selectedStartup.name} ${t.founderRating}`}
                readOnly={!user}
                size="md"
              />
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                  About the Startup
                </h4>
                <p className="leading-relaxed">{selectedStartup.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                    Problem Being Solved
                  </h4>
                  <p className="leading-relaxed text-slate-600">{selectedStartup.problem}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                    Proposed Solution
                  </h4>
                  <p className="leading-relaxed text-slate-600">{selectedStartup.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 uppercase text-[9px] block">Location</span>
                  <span className="font-semibold text-slate-900">{selectedStartup.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[9px] block">Team Size</span>
                  <span className="font-semibold text-slate-900">{selectedStartup.team_size || 1} members</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[9px] block">Funding Stage</span>
                  <span className="font-semibold text-slate-900">{selectedStartup.funding_stage || 'Pre-Seed'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[9px] block">Requirement</span>
                  <span className="font-semibold text-slate-900">{selectedStartup.funding_requirement || 'Bootstrapped'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5">
                  Target Skills Needed
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStartup.required_skills?.map((sk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Startup Financials & Unit Economics */}
              <div className="pt-2">
                <FinancialCharts
                  monthlySales={selectedStartup.monthly_sales}
                  unitEconomics={selectedStartup.unit_economics}
                  isOwner={Boolean(user && (user.id === selectedStartup.owner_id || user.id === selectedStartup.user_id))}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedStartupForReviews({ id: selectedStartup.id, name: selectedStartup.name });
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-amber-600" />
                <span>{t.workplaceExperienceReviews}</span>
              </button>

              <button
                onClick={() => setSelectedStartup(null)}
                className="px-5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKPLACE EXPERIENCE REVIEWS MODAL */}
      {selectedStartupForReviews && (
        <StartupReviewsModal
          isOpen={true}
          startupId={selectedStartupForReviews.id}
          startupName={selectedStartupForReviews.name}
          onClose={() => setSelectedStartupForReviews(null)}
        />
      )}

      {/* REPORT SUSPICIOUS MODAL */}
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
