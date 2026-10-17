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
  HeartHandshake
} from 'lucide-react';
import { Opportunity, Startup } from '../types';
import { api } from '../services/api';
import { TrustBadge } from '../components/TrustBadge';

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  onSelectStartup?: (startupId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, onSelectStartup }) => {
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
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#E3EAE5] bg-gradient-to-b from-white to-[#F8FAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF7EF] border border-[#138A4B]/20 text-[#08663A] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Entrepreneurship & Employment Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#17211B] tracking-tight leading-[1.15]">
                Build Your Future.{' '}
                <span className="text-[#138A4B]">Together.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#65736A] max-w-2xl leading-relaxed">
                Discover opportunities, build your startup team, and connect with people who can help turn your ideas into reality. Transparent skill matching for students, founders, and impact investors.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setCurrentPage('opportunities')}
                  className="px-6 py-3.5 rounded-xl text-sm font-semibold text-[#17211B] bg-white border border-[#E3EAE5] hover:bg-gray-50 transition-colors shadow-xs"
                >
                  Explore Opportunities
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-[#65736A] border-t border-[#E3EAE5]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#138A4B]" />
                  <span>Rule-Based Skill Matching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#138A4B]" />
                  <span>Verified Startup Profiles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#138A4B]" />
                  <span>Social Welfare Section</span>
                </div>
              </div>
            </div>

            {/* Right Collaboration Visual (Card composition with clean tokens) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl bg-white border border-[#E3EAE5] p-6 shadow-xl space-y-4">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E3EAE5]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold text-sm">
                      VB
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17211B]">Venture Synergy Matrix</div>
                      <div className="text-[10px] text-[#65736A]">Active Cross-Functional Connections</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF7EF] text-[#08663A]">
                    Live MVP
                  </span>
                </div>

                {/* Candidate & Founder mini cards simulation */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#E3EAE5] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#17211B]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        SC
                      </div>
                      <span>EcoTrack Solutions (Social Impact)</span>
                    </div>
                    <TrustBadge status="Verified" size="sm" />
                  </div>
                  <p className="text-[11px] text-[#65736A] leading-snug">
                    Looking for a Frontend Intern proficient in React & Tailwind to build circular community portals.
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white border border-[#E3EAE5] rounded-md text-[#17211B]">
                      React
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white border border-[#E3EAE5] rounded-md text-[#17211B]">
                      Tailwind
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white border border-[#E3EAE5] rounded-md text-[#17211B]">
                      Python
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EAF7EF]/70 border border-[#138A4B]/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#08663A]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#138A4B] text-white flex items-center justify-center text-[10px] font-bold">
                        AR
                      </div>
                      <span>Alex Rivera (Job Seeker)</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#08663A] rounded-full border border-[#138A4B]/30">
                      75% Skill Match
                    </span>
                  </div>
                  <p className="text-[11px] text-[#17211B]/80 leading-snug">
                    Matched on 3 of 4 required skills: React, JavaScript, HTML.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#E3EAE5] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#138A4B]" />
                    <span className="text-[#17211B] font-medium">Apex Seed Capital</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#08663A] bg-[#EAF7EF] px-2 py-0.5 rounded-full">
                    Interested in CleanTech Pre-Seed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE SECTION: 4 CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17211B]">
            Engineered for Collaboration
          </h2>
          <p className="text-sm text-[#65736A] leading-relaxed">
            Every feature on VentureBridge directly tackles the employment and early startup friction points.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Card 1: Find Co-founders */}
          <div className="p-6 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-[#138A4B]" />
              </div>
              <h3 className="font-bold text-base text-[#17211B]">1. Find Co-founders</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Connect with people whose skills complement yours. Filter by technical competencies, commitment expectations, and shared vision.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('find-people')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
            >
              <span>Search People</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Explore Opportunities */}
          <div className="p-6 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5 text-[#138A4B]" />
              </div>
              <h3 className="font-bold text-base text-[#17211B]">2. Explore Opportunities</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Discover jobs, internships, freelance projects, and tutoring. See transparent match percentages based strictly on your verified skills.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('opportunities')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
            >
              <span>Browse Listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Discover Startups */}
          <div className="p-6 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                <Rocket className="w-5 h-5 text-[#138A4B]" />
              </div>
              <h3 className="font-bold text-base text-[#17211B]">3. Discover Startups</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Explore emerging businesses and social impact ventures. Dedicated sections for Tech, Non-Tech, and Social Welfare initiatives.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('startups')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
            >
              <span>Explore Startups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Connect with Investors */}
          <div className="p-6 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-[#138A4B]" />
              </div>
              <h3 className="font-bold text-base text-[#17211B]">4. Connect with Investors</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Help founders present ideas to verified investors. Share private investor-only briefings securely enforced on our backend API.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('signup')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
            >
              <span>Join as Investor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="bg-[#EAF7EF]/40 border-y border-[#E3EAE5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#08663A]">
              Streamlined Onboarding
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#17211B]">
              How VentureBridge Works
            </h2>
            <p className="text-xs sm:text-sm text-[#65736A]">
              Three simple steps to transform your skills or startup vision into reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl border border-[#E3EAE5] shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-[#138A4B] text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-[#17211B] mb-1">Create your profile</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Choose your role as an Entrepreneur, Job Seeker, or Investor. Declare your verified skills, project links, or startup requirements.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E3EAE5] shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-[#138A4B] text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-[#17211B] mb-1">Discover relevant matches</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Our transparent rule-based algorithm ranks complementary co-founders, opportunities with exact skill overlap, and vetted ventures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E3EAE5] shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-[#138A4B] text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-[#17211B] mb-1">Connect and collaborate</h3>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Send connection requests, express investor interest, or apply for internships with persistent database messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED OPPORTUNITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#08663A] mb-1">
              Employment & Experience
            </div>
            <h2 className="text-2xl font-bold text-[#17211B]">
              Featured Opportunities
            </h2>
            <p className="text-xs text-[#65736A]">
              Fictional demo listings representing real high-demand tech & social roles.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('opportunities')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-5 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:border-[#138A4B]/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#EAF7EF] text-[#08663A]">
                    {opp.category}
                  </span>
                  <TrustBadge status={opp.verification_status} size="sm" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17211B] line-clamp-1">{opp.title}</h3>
                  <p className="text-xs text-[#65736A]">{opp.company}</p>
                </div>
                <p className="text-xs text-[#65736A] line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {opp.required_skills?.slice(0, 3).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F8FAF8] border border-[#E3EAE5] text-[#17211B]"
                    >
                      {sk}
                    </span>
                  ))}
                  {opp.required_skills?.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-[#65736A]">
                      +{opp.required_skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <span className="text-[#65736A]">{opp.work_mode} · {opp.location.split(',')[0]}</span>
                <button
                  onClick={() => setCurrentPage('opportunities')}
                  className="font-semibold text-[#138A4B] hover:underline"
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
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#08663A] mb-1">
              Ventures & Ideas
            </div>
            <h2 className="text-2xl font-bold text-[#17211B]">
              Featured Startups
            </h2>
            <p className="text-xs text-[#65736A]">
              Explore Tech, Non-Tech, and Dedicated Social Welfare Ventures.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('startups')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#138A4B] hover:text-[#08663A]"
          >
            <span>Browse All Startups</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredStartups.map((st) => (
            <div
              key={st.id}
              className="p-5 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs hover:border-[#138A4B]/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
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
                  <h3 className="font-bold text-sm text-[#17211B]">{st.name}</h3>
                  <p className="text-xs text-[#65736A]">{st.industry} · {st.stage}</p>
                </div>
                <p className="text-xs text-[#65736A] line-clamp-3 leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <span className="text-[#65736A]">{st.location}</span>
                <button
                  onClick={() => setCurrentPage('startups')}
                  className="font-semibold text-[#138A4B] hover:underline"
                >
                  Explore Venture
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TRUST & FRAUD PREVENTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#F8FAF8] border border-[#E3EAE5] p-8 md:p-12 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#08663A] bg-[#EAF7EF] px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-[#138A4B]" />
              <span>Trust, Safety & Accountability</span>
            </div>
            <h2 className="text-2xl font-bold text-[#17211B]">
              Transparent Information, Zero Gimmicks
            </h2>
            <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
              We eliminate fake statistics, exaggerated claims, and opaque hiring practices with clear status badges, portfolio links, and human report reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-white p-5 rounded-2xl border border-[#E3EAE5] space-y-2">
              <h4 className="font-semibold text-sm text-[#17211B]">Verification Badges</h4>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Profiles and startup claims are visibly categorized as Verified, Review Pending, or Unverified. We do not invent verification scores.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E3EAE5] space-y-2">
              <h4 className="font-semibold text-sm text-[#17211B]">Deterministic Skill Match</h4>
              <p className="text-xs text-[#65736A] leading-relaxed">
                No black-box algorithms. You see exactly which required skills match your profile and which are missing, with transparent calculations.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E3EAE5] space-y-2">
              <h4 className="font-semibold text-sm text-[#17211B]">Community Reporting</h4>
              <p className="text-xs text-[#65736A] leading-relaxed">
                Flag misleading job descriptions or suspicious requests. Reports are cautiously audited by human admins with tracked statuses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-[#138A4B] text-white p-8 md:p-14 space-y-6 shadow-lg">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Connect Talent, Ideas & Opportunities?
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
            Join VentureBridge today as an Entrepreneur, Job Seeker, or Investor to jumpstart your collaboration.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentPage('signup')}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-white text-[#08663A] hover:bg-gray-100 transition-colors shadow-xs"
            >
              Create Free Account
            </button>
            <button
              onClick={() => setCurrentPage('opportunities')}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#08663A] text-white hover:bg-[#07532f] transition-colors"
            >
              Explore Openings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
