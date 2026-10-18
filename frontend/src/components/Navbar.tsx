import React, { useState } from 'react';
import {
  Rocket,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCheck,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout, quickLogin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);

  const handleQuickDemo = async (role: 'entrepreneur' | 'job_seeker' | 'investor', dashboardRoute: string) => {
    try {
      await quickLogin(role);
      setCurrentPage(dashboardRoute);
    } catch (err: any) {
      alert(`Demo Login: ${err.message || 'Failed to authenticate demo user'}`);
    }
  };

  const getDashboardRoute = () => {
    if (!user) return 'login';
    if (user.role === 'entrepreneur') return 'entrepreneur-dashboard';
    if (user.role === 'job_seeker') return 'jobseeker-dashboard';
    if (user.role === 'investor') return 'investor-dashboard';
    if (user.role === 'admin') return 'admin-reports';
    return 'home';
  };

  const navLinks = [
    { id: 'home', label: t('nav.brand', 'Home') },
    { id: 'opportunities', label: t('nav.opportunities', 'Opportunities') },
    { id: 'startups', label: t('nav.startups', 'Startups') },
    { id: 'find-people', label: t('nav.network', 'Find People') },
    { id: 'mentors', label: t('nav.mentors', 'Mentors') },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-800 transition-colors">
                VB
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                  Venture<span className="text-blue-600">Bridge</span>
                </span>
                <span className="text-[10px] text-amber-600 tracking-wider uppercase font-bold mt-0.5">
                  Talent • Capital • Growth
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setCurrentPage(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentPage === link.id
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Bilingual Language Switcher (EN | हिन्दी) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              title="Toggle English / हिन्दी"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'en' ? 'EN' : 'हिन्दी'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400 font-normal">{language === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setQuickLoginOpen(!quickLoginOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                title="Switch demo persona for testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Personas</span>
                <ChevronDown className="w-3 h-3 text-blue-600" />
              </button>

              {quickLoginOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setQuickLoginOpen(false)}
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Instant Demo Login
                  </div>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('entrepreneur', 'entrepreneur-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/50 flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Sarah Chen (Founder)</div>
                      <div className="text-[10px] text-slate-500">EcoTrack · Entrepreneur</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('job_seeker', 'jobseeker-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/50 flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Alex Rivera (Developer)</div>
                      <div className="text-[10px] text-slate-500">React/Python · Job Seeker</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('investor', 'investor-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/50 flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Marcus Vance (VC Partner)</div>
                      <div className="text-[10px] text-slate-500">Apex Ventures · Investor</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(getDashboardRoute())}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Rocket className="w-3.5 h-3.5 text-amber-300" />
                  <span className="capitalize">{user.role.replace('_', ' ')} Dashboard</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <img
                    src={user.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                    {user.full_name}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setCurrentPage('home');
                    }}
                    title="Log out"
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('nav.signIn', 'Sign In')}
                </button>
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-colors cursor-pointer"
                >
                  {t('nav.join', 'Join Platform')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 text-xs font-bold bg-slate-100 rounded-lg text-slate-700"
            >
              {language.toUpperCase()}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentPage(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-slate-700"
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setCurrentPage(getDashboardRoute());
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center block mb-2"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  logout();
                  setCurrentPage('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-red-600 text-xs font-semibold text-center block"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setCurrentPage('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setCurrentPage('signup');
                  setMobileMenuOpen(false);
                }}
                className="py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Join
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
