import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Rocket,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  HeartHandshake,
  Star,
  Award,
  Handshake
} from 'lucide-react';
import { Opportunity, Startup } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { TrustBadge } from '../components/TrustBadge';

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  onSelectStartup?: (startupId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, onSelectStartup }) => {
  const { t } = useLanguage();
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [opps, starts] = await Promise.all([
          api.getOpportunities(),
          api.getStartups(),
        ]);
        setFeaturedOpportunities(opps.slice(0, 3));
        setFeaturedStartups(starts.slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Clear, Confident Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.heroSubtitle}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                {t.heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                {t.heroDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all shadow-xs flex items-center gap-2"
                >
                  <span>{t.getStarted}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage('opportunities')}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs"
                >
                  {t.exploreOpportunities}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-600 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>80/20 Deterministic Match</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>Curated Top 10 Startups</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Deal Negotiation Rooms</span>
                </div>
              </div>
            </div>

            {/* Right Column: Single Restrained Product Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-xs space-y-4">
                {/* Preview Window Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">
                      VentureBridge Match Engine
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-md">
                    Live Demo
                  </span>
                </div>

                {/* Opportunity Match Demonstration */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Frontend Developer
                      </div>
                      <div className="text-[11px] text-slate-500">
                        EcoTrack Solutions · CleanTech
                      </div>
                    </div>
                    <TrustBadge status="Verified" size="sm" />
                  </div>

                  {/* 80/20 Match Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-700">
                        Alex Rivera (Candidate Match)
                      </span>
                      <span className="font-bold text-blue-600">84% Composite Score</span>
                    </div>
                    <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full w-[84%]" />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Formula: (0.80 × 80% Skill Match) + (0.20 × 100% CGPA Score)
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded">
                      React ✓
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded">
                      TypeScript ✓
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded">
                      Tailwind ✓
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                      CGPA: 9.2/10
                    </span>
                  </div>
                </div>

                {/* Deal Room Preview Demonstration */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
                      <Handshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Apex Seed Capital</div>
                      <div className="text-[10px] text-slate-500">Term Sheet Proposed · ₹50,00,000 for 10%</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Active Room
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE PLATFORM PILLARS (4 Minimal Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Core Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built for Real Collaboration
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every feature on VentureBridge directly addresses friction in early-stage team formation, deterministic recruitment, and transparent investor deal-making.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Co-founders */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. Find Co-founders</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with candidates whose technical or operational skills complement yours. Filter by verified skills, work mode, and vision.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
            >
              <span>{t.searchCandidates}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Opportunities */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Explore Opportunities</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover jobs, internships, freelance projects, and tutoring. See transparent match percentages calculated directly from your profile skills.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('opportunities')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
            >
              <span>Browse Listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Startups */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Rocket className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Discover Startups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore emerging ventures across Tech, Non-Tech, and Dedicated Social Welfare initiatives, complete with verified founder ratings and comments.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('startups')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
            >
              <span>{t.discoverStartups}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Investors */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">4. Connect with Capital</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Founders can negotiate live in Interactive Deal Rooms with accredited investors and schedule Top 10 Google Meet connections.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('signup')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
            >
              <span>Join as Investor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 Simple Steps) */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Streamlined Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How VentureBridge Works
            </h2>
            <p className="text-sm text-slate-600">
              Three simple steps to transform your skills or venture vision into tangible momentum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">Create your profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your role as a Founder, Job Seeker, or Investor. Declare your skills, education/CGPA, experience, or startup metrics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">Discover transparent matches</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our 80/20 candidate matching engine ranks candidates objectively, curates Top 10 high-profit/social ventures, and generates checklists.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">Negotiate and collaborate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Launch interactive deal rooms, schedule Google Meet group discussions, submit monthly progress reports, and rate experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED OPPORTUNITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Opportunities
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Featured Positions
            </h2>
            <p className="text-xs text-slate-600">
              Live listings featuring transparent, deterministic skill matching.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('opportunities')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {opp.category}
                  </span>
                  <TrustBadge status={opp.verification_status} size="sm" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{opp.title}</h3>
                  <p className="text-xs text-slate-500">{opp.company}</p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {opp.required_skills?.slice(0, 3).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      {sk}
                    </span>
                  ))}
                  {opp.required_skills?.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                      +{opp.required_skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">{opp.work_mode} · {opp.location?.split(',')[0]}</span>
                <button
                  onClick={() => setCurrentPage('opportunities')}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FEATURED STARTUPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Startups & Ventures
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Featured Ventures
            </h2>
            <p className="text-xs text-slate-600">
              Explore Tech, Non-Tech, and Dedicated Social Welfare initiatives.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('startups')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Browse All Startups</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredStartups.map((st) => (
            <div
              key={st.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      st.category === 'Social Welfare Startups'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {st.category}
                  </span>
                  <TrustBadge status={st.verification_status} size="sm" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{st.name}</h3>
                  <p className="text-xs text-slate-500">{st.industry} · {st.stage}</p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">{st.location}</span>
                <button
                  onClick={() => {
                    if (onSelectStartup) onSelectStartup(st.id);
                    setCurrentPage('startups');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Venture
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CLEAN RESTRAINED CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-amber-50/50 border border-blue-200 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ready to build or join your next venture?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
              Create your profile in minutes to explore transparent opportunities, assemble your founding team, or invest in vetted startups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentPage('signup')}
              className="px-6 py-3 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all shadow-xs"
            >
              Create Free Account
            </button>
            <button
              onClick={() => setCurrentPage('login')}
              className="px-5 py-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
