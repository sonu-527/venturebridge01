import React, { useState } from 'react';
import {
  Rocket,
  Briefcase,
  TrendingUp,
  User,
  Mail,
  Lock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  setCurrentPage: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signup', setCurrentPage }) => {
  const { login, register, quickLogin } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === 'login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('entrepreneur');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');

  // Entrepreneur specific
  const [startupName, setStartupName] = useState('');
  const [industry, setIndustry] = useState('CleanTech & Sustainability');
  const [startupStage, setStartupStage] = useState('MVP / Prototype');
  const [skillsNeededInput, setSkillsNeededInput] = useState('React, Python, Tailwind CSS');

  // Job Seeker specific
  const [education, setEducation] = useState('B.S. in Computer Science');
  const [skillsInput, setSkillsInput] = useState('React, JavaScript, TypeScript, Python');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level');
  const [preferredWorkMode, setPreferredWorkMode] = useState('Hybrid');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [careerInterests, setCareerInterests] = useState('Web Development, Climate Tech');

  // Investor specific
  const [investorType, setInvestorType] = useState('Angel Investor');
  const [areasOfInterest, setAreasOfInterest] = useState('Social Impact, CleanTech, Healthcare');
  const [preferredIndustries, setPreferredIndustries] = useState('CleanTech, HealthTech, Fair Trade');
  const [investmentStagePref, setInvestmentStagePref] = useState('Pre-Seed');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectToDashboard = (role: UserRole) => {
    if (role === 'entrepreneur') setCurrentPage('entrepreneur-dashboard');
    else if (role === 'job_seeker') setCurrentPage('jobseeker-dashboard');
    else if (role === 'investor') setCurrentPage('investor-dashboard');
    else setCurrentPage('home');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await login(loginEmail, loginPassword);
      redirectToDashboard(user.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const parseCommaList = (str: string) =>
      str.split(',').map((s) => s.trim()).filter(Boolean);

    const payload: any = {
      email,
      password,
      role: selectedRole,
      full_name: fullName,
      location,
      profile_image: profileImage || undefined,
      bio,
    };

    if (selectedRole === 'entrepreneur') {
      payload.startup_name = startupName;
      payload.industry = industry;
      payload.startup_stage = startupStage;
      payload.skills_needed = parseCommaList(skillsNeededInput);
    } else if (selectedRole === 'job_seeker') {
      payload.education = education;
      payload.skills = parseCommaList(skillsInput);
      payload.experience_level = experienceLevel;
      payload.preferred_work_mode = preferredWorkMode;
      payload.portfolio_url = portfolioUrl;
      payload.github_url = githubUrl;
      payload.career_interests = careerInterests;
    } else if (selectedRole === 'investor') {
      payload.investor_type = investorType;
      payload.areas_of_interest = areasOfInterest;
      payload.preferred_industries = preferredIndustries;
      payload.investment_stage_pref = investmentStagePref;
    }

    try {
      const user = await register(payload);
      redirectToDashboard(user.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'entrepreneur' | 'job_seeker' | 'investor') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await quickLogin(role);
      redirectToDashboard(user.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
      {/* Tab Switcher & Header */}
      <div className="text-center max-w-xl mx-auto mb-8 space-y-3">
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          {isLogin ? 'Welcome Back to VentureBridge' : 'Join VentureBridge'}
        </h1>
        <p className="text-sm text-[#65736A]">
          {isLogin
            ? 'Access your role-based dashboard and continue your collaborations.'
            : 'Select your role to connect with co-founders, opportunities, or ventures.'}
        </p>

        {/* Quick Demo Access Box */}
        <div className="p-3.5 rounded-2xl bg-[#EAF7EF] border border-[#138A4B]/20 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#08663A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Demo Access (One-Click)
            </span>
            <span className="text-[10px] text-[#08663A]/80 font-medium">Instant testing</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('entrepreneur')}
              className="py-1.5 px-2 bg-white text-[#17211B] rounded-xl text-xs font-semibold hover:border-[#138A4B] border border-[#E3EAE5] transition-all shadow-2xs text-center"
            >
              Sarah (Founder)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('job_seeker')}
              className="py-1.5 px-2 bg-white text-[#17211B] rounded-xl text-xs font-semibold hover:border-[#138A4B] border border-[#E3EAE5] transition-all shadow-2xs text-center"
            >
              Alex (Developer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('investor')}
              className="py-1.5 px-2 bg-white text-[#17211B] rounded-xl text-xs font-semibold hover:border-[#138A4B] border border-[#E3EAE5] transition-all shadow-2xs text-center"
            >
              Marcus (Investor)
            </button>
          </div>
        </div>

        <div className="inline-flex rounded-xl p-1 bg-[#F8FAF8] border border-[#E3EAE5] mt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMessage(null);
            }}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              !isLogin
                ? 'bg-white text-[#138A4B] shadow-xs'
                : 'text-[#65736A] hover:text-[#17211B]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMessage(null);
            }}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              isLogin
                ? 'bg-white text-[#138A4B] shadow-xs'
                : 'text-[#65736A] hover:text-[#17211B]'
            }`}
          >
            Log In
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 max-w-lg mx-auto p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LOGIN FORM */}
      {isLogin ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#E3EAE5] p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#65736A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. founder@ecotrack.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] placeholder-[#65736A]/50 focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#65736A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] placeholder-[#65736A]/50 focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#138A4B] text-white font-semibold text-sm hover:bg-[#08663A] transition-colors shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      ) : (
        /* REGISTRATION FLOW WITH 3 ROLE SELECTABLE CARDS */
        <div className="bg-white rounded-3xl border border-[#E3EAE5] p-6 sm:p-10 shadow-sm space-y-8">
          {/* 3 Main Role Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#17211B] mb-3">
              Step 1: Choose Your Primary Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role 1: Entrepreneur */}
              <div
                onClick={() => setSelectedRole('entrepreneur')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  selectedRole === 'entrepreneur'
                    ? 'border-[#138A4B] bg-[#EAF7EF]/40 shadow-xs'
                    : 'border-[#E3EAE5] hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                      <Rocket className="w-5 h-5 text-[#138A4B]" />
                    </div>
                    {selectedRole === 'entrepreneur' && (
                      <CheckCircle2 className="w-5 h-5 text-[#138A4B]" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-[#17211B]">Entrepreneur</h3>
                  <p className="text-xs text-[#65736A] mt-1 leading-relaxed">
                    Build your startup, find co-founders, post openings, and hire talented people.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[#138A4B]">
                  Post Startups & Ideas →
                </div>
              </div>

              {/* Role 2: Job Seeker */}
              <div
                onClick={() => setSelectedRole('job_seeker')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  selectedRole === 'job_seeker'
                    ? 'border-[#138A4B] bg-[#EAF7EF]/40 shadow-xs'
                    : 'border-[#E3EAE5] hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                      <Briefcase className="w-5 h-5 text-[#138A4B]" />
                    </div>
                    {selectedRole === 'job_seeker' && (
                      <CheckCircle2 className="w-5 h-5 text-[#138A4B]" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-[#17211B]">Job Seeker</h3>
                  <p className="text-xs text-[#65736A] mt-1 leading-relaxed">
                    Discover jobs, internships, freelance projects matching your skills, and analyze skill gaps.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[#138A4B]">
                  Transparent Skill Match →
                </div>
              </div>

              {/* Role 3: Investor */}
              <div
                onClick={() => setSelectedRole('investor')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  selectedRole === 'investor'
                    ? 'border-[#138A4B] bg-[#EAF7EF]/40 shadow-xs'
                    : 'border-[#E3EAE5] hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#08663A] flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5 text-[#138A4B]" />
                    </div>
                    {selectedRole === 'investor' && (
                      <CheckCircle2 className="w-5 h-5 text-[#138A4B]" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-[#17211B]">Investor</h3>
                  <p className="text-xs text-[#65736A] mt-1 leading-relaxed">
                    Discover vetted startups, view confidential investor-only ideas, and express interest to founders.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[#138A4B]">
                  Private Briefings Access →
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleRegisterSubmit} className="space-y-6 pt-4 border-t border-[#E3EAE5]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#17211B]">
              Step 2: Profile & Role Specifics
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Location (City, State / Country)
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                Bio / Mission Statement
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe what you are building, your career focus, or what drives your investment thesis..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
              />
            </div>

            {/* Entrepreneur Fields */}
            {selectedRole === 'entrepreneur' && (
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#E3EAE5] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#08663A]">
                  Entrepreneur Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Startup Name (Optional initially)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EcoTrack Solutions"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CleanTech, HealthTech, Fair Trade"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Startup Stage
                    </label>
                    <select
                      value={startupStage}
                      onChange={(e) => setStartupStage(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    >
                      <option value="Idea Phase">Idea Phase</option>
                      <option value="MVP / Prototype">MVP / Prototype</option>
                      <option value="Early Traction">Early Traction</option>
                      <option value="Scaling">Scaling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Skills Needed in Team (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, Python, UI/UX, Growth"
                      value={skillsNeededInput}
                      onChange={(e) => setSkillsNeededInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Job Seeker Fields */}
            {selectedRole === 'job_seeker' && (
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#E3EAE5] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#08663A]">
                  Candidate & Skill Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Education & Degree
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.S. in Computer Science"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, JavaScript, Python, Tailwind"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    >
                      <option value="Entry Level">Entry Level (Student / New Grad)</option>
                      <option value="Junior">Junior (1-2 years)</option>
                      <option value="Mid-Level">Mid-Level (3-5 years)</option>
                      <option value="Senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Preferred Work Mode
                    </label>
                    <select
                      value={preferredWorkMode}
                      onChange={(e) => setPreferredWorkMode(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Any">Any Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Portfolio URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://myportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      GitHub URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Investor Fields */}
            {selectedRole === 'investor' && (
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#E3EAE5] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#08663A]">
                  Investor Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Investor Type
                    </label>
                    <select
                      value={investorType}
                      onChange={(e) => setInvestorType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    >
                      <option value="Angel Investor">Angel Investor</option>
                      <option value="Venture Capital">Venture Capital</option>
                      <option value="Family Office">Family Office</option>
                      <option value="Syndicate">Syndicate Lead</option>
                      <option value="Individual">Individual Backer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Investment Stage Preference
                    </label>
                    <select
                      value={investmentStagePref}
                      onChange={(e) => setInvestmentStagePref(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    >
                      <option value="Pre-Seed">Pre-Seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Growth">Growth</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                      Preferred Industries & Focus
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Social Welfare, CleanTech, Healthcare, B2B SaaS"
                      value={preferredIndustries}
                      onChange={(e) => setPreferredIndustries(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#138A4B] text-white font-semibold text-sm hover:bg-[#08663A] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Open Dashboard'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
