import React, { useState } from 'react';
import {
  Briefcase,
  Rocket,
  Users,
  Compass,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout, quickLogin } = useAuth();
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
    return 'home';
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'startups', label: 'Startups' },
    { id: 'find-people', label: 'Find People' },
    { id: 'mentors', label: 'Mentors' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3EAE5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#138A4B] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#08663A] transition-colors">
                VB
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[#17211B] tracking-tight leading-none">
                  Venture<span className="text-[#138A4B]">Bridge</span>
                </span>
                <span className="text-[10px] text-[#65736A] tracking-wider uppercase font-medium mt-0.5">
                  Talent & Ventures
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setCurrentPage(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === link.id
                      ? 'bg-[#EAF7EF] text-[#08663A] font-semibold'
                      : 'text-[#65736A] hover:text-[#17211B] hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Persona Switcher (Crucial for hackathon judges!) */}
            <div className="relative">
              <button
                onClick={() => setQuickLoginOpen(!quickLoginOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#08663A] bg-[#EAF7EF] hover:bg-[#d6f0df] border border-[#138A4B]/20 transition-colors"
                title="Switch demo persona for testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#138A4B]" />
                <span>Demo Personas</span>
                <ChevronDown className="w-3 h-3 text-[#138A4B]" />
              </button>

              {quickLoginOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E3EAE5] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setQuickLoginOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#65736A] uppercase tracking-wider border-b border-[#E3EAE5]">
                    Instant Demo Login
                  </div>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('entrepreneur', 'entrepreneur-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAF8] flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#17211B]">Sarah Chen (Founder)</div>
                      <div className="text-[10px] text-[#65736A]">EcoTrack · Entrepreneur</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#138A4B] opacity-0 group-hover:opacity-100" />
                  </button>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('job_seeker', 'jobseeker-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAF8] flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#17211B]">Alex Rivera (Developer)</div>
                      <div className="text-[10px] text-[#65736A]">React/Python · Job Seeker</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#138A4B] opacity-0 group-hover:opacity-100" />
                  </button>
                  <button
                    onClick={() => {
                      setQuickLoginOpen(false);
                      handleQuickDemo('investor', 'investor-dashboard');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#F8FAF8] flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#17211B]">Marcus Vance (VC Partner)</div>
                      <div className="text-[10px] text-[#65736A]">Apex Ventures · Investor</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#138A4B] opacity-0 group-hover:opacity-100" />
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(getDashboardRoute())}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span className="capitalize">{user.role.replace('_', ' ')} Dashboard</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#E3EAE5]">
                  <img
                    src={user.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-[#E3EAE5]"
                  />
                  <span className="text-xs font-medium text-[#17211B] max-w-[100px] truncate">
                    {user.full_name}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setCurrentPage('home');
                    }}
                    title="Log out"
                    className="p-1 rounded-md text-[#65736A] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#17211B] hover:bg-gray-100 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors shadow-xs"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#65736A] hover:text-[#17211B] hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3EAE5] bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentPage(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentPage === link.id
                  ? 'bg-[#EAF7EF] text-[#08663A] font-semibold'
                  : 'text-[#65736A] hover:bg-gray-50'
              }`}
            >
              {link.label}
            </button>
          ))}

          {user ? (
            <div className="pt-3 border-t border-[#E3EAE5] space-y-2">
              <button
                onClick={() => {
                  setCurrentPage(getDashboardRoute());
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-[#138A4B] text-white"
              >
                Go to {user.role.replace('_', ' ')} Dashboard
              </button>
              <div className="flex items-center justify-between px-3 py-2 text-xs text-[#65736A]">
                <span>Logged in as {user.full_name}</span>
                <button
                  onClick={() => {
                    logout();
                    setCurrentPage('home');
                    setMobileMenuOpen(false);
                  }}
                  className="text-red-600 font-semibold"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#E3EAE5] grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setCurrentPage('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-center rounded-lg text-sm font-semibold border border-[#E3EAE5] text-[#17211B]"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setCurrentPage('signup');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-center rounded-lg text-sm font-semibold bg-[#138A4B] text-white"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Quick Demo Switcher on mobile */}
          <div className="pt-2 border-t border-[#E3EAE5]">
            <div className="text-[10px] uppercase font-semibold text-[#65736A] px-3 mb-1">
              Instant Demo Switcher
            </div>
            <div className="flex gap-1.5 px-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleQuickDemo('entrepreneur', 'entrepreneur-dashboard');
                }}
                className="flex-1 py-1 text-[11px] font-medium bg-[#EAF7EF] text-[#08663A] rounded border border-[#138A4B]/20 text-center"
              >
                Founder
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleQuickDemo('job_seeker', 'jobseeker-dashboard');
                }}
                className="flex-1 py-1 text-[11px] font-medium bg-[#EAF7EF] text-[#08663A] rounded border border-[#138A4B]/20 text-center"
              >
                Candidate
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleQuickDemo('investor', 'investor-dashboard');
                }}
                className="flex-1 py-1 text-[11px] font-medium bg-[#EAF7EF] text-[#08663A] rounded border border-[#138A4B]/20 text-center"
              >
                Investor
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
