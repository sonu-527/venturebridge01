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
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  setCurrentPage: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signup', setCurrentPage }) => {
  const { login, register, quickLogin } = useAuth();
  const { t } = useLanguage();
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
      payload.portfolio_url = portfolioUrl || undefined;
      payload.github_url = githubUrl || undefined;
      payload.career_interests = parseCommaList(careerInterests);
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
      setErrorMessage(err.message || 'Registration failed.');
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
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isLogin ? t.signIn : t.createAccount}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {isLogin
            ? 'Sign in to access your dashboard and continue collaborations.'
            : 'Join VentureBridge to connect with co-founders, opportunities, and capital.'}
        </p>

        {/* Mode Toggle */}
        <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-2xs mt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setErrorMessage(null);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isLogin
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.createAccount}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setErrorMessage(null);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isLogin
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.signIn}
          </button>
        </div>
      </div>

      {/* Quick Demo Access Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Quick Demo Access (One-Click Personas)
          </span>
          <span className="text-[11px] text-slate-400">Instant evaluation</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('entrepreneur')}
            className="py-2 px-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-medium border border-slate-200 hover:border-blue-300 transition-all text-center"
          >
            Sarah (Founder)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('job_seeker')}
            className="py-2 px-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-medium border border-slate-200 hover:border-blue-300 transition-all text-center"
          >
            Alex (Candidate)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('investor')}
            className="py-2 px-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-medium border border-slate-200 hover:border-blue-300 transition-all text-center"
          >
            Marcus (Investor)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LOGIN VIEW */}
      {isLogin ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                {t.emailAddress}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="founder@ecotrack.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 active:scale-[0.99] transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Signing In...' : t.signIn}
            </button>
          </form>
        </div>
      ) : (
        /* REGISTRATION VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
              Step 1: Choose Your Primary Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('entrepreneur')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'entrepreneur'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Rocket className={`w-4 h-4 ${selectedRole === 'entrepreneur' ? 'text-blue-600' : 'text-slate-400'}`} />
                    {selectedRole === 'entrepreneur' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="font-bold text-sm text-slate-900 pt-1">Founder</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Build ventures & assemble your team.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('job_seeker')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'job_seeker'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Briefcase className={`w-4 h-4 ${selectedRole === 'job_seeker' ? 'text-blue-600' : 'text-slate-400'}`} />
                    {selectedRole === 'job_seeker' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="font-bold text-sm text-slate-900 pt-1">Job Seeker</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Find matched roles & gap analysis.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('investor')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'investor'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <TrendingUp className={`w-4 h-4 ${selectedRole === 'investor' ? 'text-blue-600' : 'text-slate-400'}`} />
                    {selectedRole === 'investor' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="font-bold text-sm text-slate-900 pt-1">Investor</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Access private startup briefs.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleRegisterSubmit} className="space-y-5 pt-4 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Step 2: Profile Details
            </div>

            {/* Base credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  {t.fullName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  {t.emailAddress} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  {t.password} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  {t.location}
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                {t.bio}
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of your focus and goals..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Entrepreneur role fields */}
            {selectedRole === 'entrepreneur' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Founder Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.startupName}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EcoTrack Solutions"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.industry}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CleanTech, HealthTech"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.stage}
                    </label>
                    <select
                      value={startupStage}
                      onChange={(e) => setStartupStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Idea Phase">Idea Phase</option>
                      <option value="MVP / Prototype">MVP / Prototype</option>
                      <option value="Early Traction">Early Traction</option>
                      <option value="Scaling">Scaling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.skillsNeeded}
                    </label>
                    <input
                      type="text"
                      placeholder="React, Python, UI/UX"
                      value={skillsNeededInput}
                      onChange={(e) => setSkillsNeededInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Job Seeker role fields */}
            {selectedRole === 'job_seeker' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Candidate & Skill Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.education}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.S. in Computer Science"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.skills}
                    </label>
                    <input
                      type="text"
                      placeholder="React, TypeScript, Python"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.experienceLevel}
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Entry Level">Entry Level (Student / New Grad)</option>
                      <option value="Junior">Junior (1-2 years)</option>
                      <option value="Mid-Level">Mid-Level (3-5 years)</option>
                      <option value="Senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Preferred Work Mode
                    </label>
                    <select
                      value={preferredWorkMode}
                      onChange={(e) => setPreferredWorkMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Portfolio URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://myportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      GitHub URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Investor role fields */}
            {selectedRole === 'investor' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Investor Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.investorType}
                    </label>
                    <select
                      value={investorType}
                      onChange={(e) => setInvestorType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Angel Investor">Angel Investor</option>
                      <option value="Venture Capital">Venture Capital</option>
                      <option value="Family Office">Family Office</option>
                      <option value="Syndicate">Syndicate Lead</option>
                      <option value="Individual">Individual Backer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      {t.preferredStage}
                    </label>
                    <select
                      value={investmentStagePref}
                      onChange={(e) => setInvestmentStagePref(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Pre-Seed">Pre-Seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Growth">Growth</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Preferred Industries & Focus
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Social Welfare, CleanTech, Healthcare, B2B SaaS"
                      value={preferredIndustries}
                      onChange={(e) => setPreferredIndustries(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 active:scale-[0.99] transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
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
