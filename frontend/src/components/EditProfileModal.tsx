import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Briefcase,
  Code,
  GraduationCap,
  Globe,
  Code2,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { user, profile, refreshUser } = useAuth();

  // Basic user state
  const [fullName, setFullName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  // Job seeker state
  const [skillsText, setSkillsText] = useState<string>('');
  const [education, setEducation] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('Entry Level');
  const [preferredWorkMode, setPreferredWorkMode] = useState<string>('Hybrid');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [careerInterests, setCareerInterests] = useState<string>('');

  // Entrepreneur / Founder state
  const [startupName, setStartupName] = useState<string>('');
  const [industry, setIndustry] = useState<string>('Technology');
  const [startupStage, setStartupStage] = useState<string>('Prototype / MVP');
  const [skillsNeededText, setSkillsNeededText] = useState<string>('');

  // Investor state
  const [investorType, setInvestorType] = useState<string>('Angel Investor');
  const [areasOfInterest, setAreasOfInterest] = useState<string>('');
  const [preferredIndustries, setPreferredIndustries] = useState<string>('');
  const [investmentStagePref, setInvestmentStagePref] = useState<string>('Seed');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever modal opens or user/profile changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      setLocation(user.location || '');
      setProfileImage(user.profile_image || '');
      setBio(user.bio || '');

      if (user.role === 'job_seeker') {
        const skillsList: string[] = Array.isArray(profile?.skills) ? profile.skills : [];
        setSkillsText(skillsList.join(', '));
        setEducation(profile?.education || '');
        setExperienceLevel(profile?.experience_level || 'Entry Level');
        setPreferredWorkMode(profile?.preferred_work_mode || 'Hybrid');
        setPortfolioUrl(profile?.portfolio_url || '');
        setGithubUrl(profile?.github_url || '');
        setCareerInterests(profile?.career_interests || '');
      } else if (user.role === 'entrepreneur') {
        setStartupName(profile?.startup_name || '');
        setIndustry(profile?.industry || 'Technology');
        setStartupStage(profile?.startup_stage || 'Prototype / MVP');
        const neededList: string[] = Array.isArray(profile?.skills_needed) ? profile.skills_needed : [];
        setSkillsNeededText(neededList.join(', '));
      } else if (user.role === 'investor') {
        setInvestorType(profile?.investor_type || 'Angel Investor');
        setAreasOfInterest(profile?.areas_of_interest || '');
        setPreferredIndustries(profile?.preferred_industries || '');
        setInvestmentStagePref(profile?.investment_stage_pref || 'Seed');
      }

      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user, profile]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Build update payload
    const payload: Record<string, any> = {
      full_name: fullName.trim(),
      location: location.trim(),
      profile_image: profileImage.trim() || undefined,
      bio: bio.trim(),
    };

    if (user.role === 'job_seeker') {
      const parsedSkills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      payload.skills = parsedSkills;
      payload.education = education.trim();
      payload.experience_level = experienceLevel;
      payload.preferred_work_mode = preferredWorkMode;
      payload.portfolio_url = portfolioUrl.trim();
      payload.github_url = githubUrl.trim();
      payload.career_interests = careerInterests.trim();
    } else if (user.role === 'entrepreneur') {
      const parsedSkillsNeeded = skillsNeededText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      payload.startup_name = startupName.trim();
      payload.industry = industry.trim();
      payload.startup_stage = startupStage;
      payload.skills_needed = parsedSkillsNeeded;
    } else if (user.role === 'investor') {
      payload.investor_type = investorType;
      payload.areas_of_interest = areasOfInterest.trim();
      payload.preferred_industries = preferredIndustries.trim();
      payload.investment_stage_pref = investmentStagePref;
    }

    try {
      await api.updateProfile(payload);
      await refreshUser();
      setSuccessMessage('Profile updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'entrepreneur':
        return 'Startup Founder';
      case 'job_seeker':
        return 'Job Seeker';
      case 'investor':
        return 'Investor';
      default:
        return 'User';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3EAE5] bg-[#F8FAF8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20 flex items-center justify-center font-bold">
              <User className="w-4 h-4 text-[#138A4B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[#17211B] text-base sm:text-lg tracking-tight">
                  Edit Profile
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
                  {getRoleLabel()}
                </span>
              </div>
              <p className="text-[11px] text-[#65736A]">
                Update identity, credentials, and role-specific preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#65736A] hover:bg-gray-100 hover:text-[#17211B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-[#EAF7EF] border border-[#138A4B]/30 rounded-xl text-xs text-[#08663A] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#138A4B]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Verification Status Pill */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-[#E3EAE5] flex items-center justify-between text-xs text-[#65736A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#138A4B]" />
              <span>
                Account Status:{' '}
                <strong className="text-[#17211B]">
                  {user.is_verified ? 'Verified Profile' : 'Standard Profile'}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-500 italic">
              Verification is managed via administrative review
            </span>
          </div>

          {/* SECTION 1: BASE INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B] flex items-center gap-2 border-b border-[#E3EAE5] pb-2">
              <User className="w-3.5 h-3.5 text-[#138A4B]" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#65736A]" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#65736A]" />
                Avatar / Profile Image URL
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                Bio / Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your professional background, focus areas, and goals..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B] resize-none"
              />
            </div>
          </div>

          {/* SECTION 2: ROLE-SPECIFIC FIELDS */}

          {/* JOB SEEKER FIELDS */}
          {user.role === 'job_seeker' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B] flex items-center gap-2 border-b border-[#E3EAE5] pb-2">
                <Briefcase className="w-3.5 h-3.5 text-[#138A4B]" />
                Job Seeker Qualifications & Skills
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-[#138A4B]" />
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. React, TypeScript, Python, FastAPI, Tailwind CSS, SQL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
                <p className="text-[11px] text-[#65736A] mt-1">
                  These skills directly power your transparent match scores and Skill Gap analysis.
                </p>
                {skillsText.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skillsText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20"
                        >
                          {sk}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#65736A]" />
                    Education
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. B.S. in Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                  >
                    <option value="Entry Level">Entry Level (0-2 years)</option>
                    <option value="Mid Level">Mid Level (2-5 years)</option>
                    <option value="Senior Level">Senior Level (5+ years)</option>
                    <option value="Lead / Principal">Lead / Principal</option>
                    <option value="Intern / Student">Intern / Student</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Preferred Work Mode
                  </label>
                  <select
                    value={preferredWorkMode}
                    onChange={(e) => setPreferredWorkMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#65736A]" />
                    Career Interests
                  </label>
                  <input
                    type="text"
                    value={careerInterests}
                    onChange={(e) => setCareerInterests(e.target.value)}
                    placeholder="e.g. AI Startups, Fintech, DevTools"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#65736A]" />
                    Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://portfolio.me"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-[#65736A]" />
                    GitHub / Code Profile URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ENTREPRENEUR / FOUNDER FIELDS */}
          {user.role === 'entrepreneur' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B] flex items-center gap-2 border-b border-[#E3EAE5] pb-2">
                <Building2 className="w-3.5 h-3.5 text-[#138A4B]" />
                Founder & Startup Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="e.g. HealthBridge AI"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Primary Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Healthtech">Healthtech</option>
                    <option value="EdTech">EdTech</option>
                    <option value="CleanTech / Climate">CleanTech / Climate</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="AgriTech">AgriTech</option>
                    <option value="Social Enterprise">Social Enterprise</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                  Startup Stage
                </label>
                <select
                  value={startupStage}
                  onChange={(e) => setStartupStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                >
                  <option value="Idea / Concept">Idea / Concept</option>
                  <option value="Prototype / MVP">Prototype / MVP</option>
                  <option value="Early Traction">Early Traction</option>
                  <option value="Seed Funded">Seed Funded</option>
                  <option value="Growth / Scaling">Growth / Scaling</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-[#138A4B]" />
                  Skills Needed for Founding Team (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsNeededText}
                  onChange={(e) => setSkillsNeededText(e.target.value)}
                  placeholder="e.g. React, Python, UI/UX, Growth Marketing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
                <p className="text-[11px] text-[#65736A] mt-1">
                  Used by our matching engine to surface relevant co-founders and team members.
                </p>
                {skillsNeededText.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skillsNeededText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20"
                        >
                          {sk}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INVESTOR FIELDS */}
          {user.role === 'investor' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17211B] flex items-center gap-2 border-b border-[#E3EAE5] pb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#138A4B]" />
                Investor Preferences & Criteria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Investor Type
                  </label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                  >
                    <option value="Angel Investor">Angel Investor</option>
                    <option value="Venture Capitalist">Venture Capitalist (VC)</option>
                    <option value="Syndicate Lead">Syndicate Lead</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Corporate VC">Corporate VC</option>
                    <option value="Accelerator / Incubator">Accelerator / Incubator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                    Preferred Investment Stage
                  </label>
                  <select
                    value={investmentStagePref}
                    onChange={(e) => setInvestmentStagePref(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Early Stage">Early Stage</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B+">Series B+</option>
                    <option value="All Stages">All Stages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                  Areas of Interest / Thesis
                </label>
                <input
                  type="text"
                  value={areasOfInterest}
                  onChange={(e) => setAreasOfInterest(e.target.value)}
                  placeholder="e.g. AI tooling, Clean energy, B2B SaaS, Decentralized identity"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211B] mb-1.5">
                  Preferred Industries
                </label>
                <input
                  type="text"
                  value={preferredIndustries}
                  onChange={(e) => setPreferredIndustries(e.target.value)}
                  placeholder="e.g. Healthcare, Software, Education, Climate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#E3EAE5] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#65736A] hover:bg-gray-100 hover:text-[#17211B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
