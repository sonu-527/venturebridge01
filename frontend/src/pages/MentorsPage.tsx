import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  MessageSquare,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Mentor } from '../types';
import { api } from '../services/api';
import { GuidanceRequestModal } from '../components/GuidanceRequestModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const MentorsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Guidance request modal
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMentors({
        industry: industryFilter !== 'All' ? industryFilter : undefined,
        q: searchQuery || undefined,
      });
      setMentors(data);
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [industryFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Advisory Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.mentors} & Industry Guides
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Connect with experienced tech executives, serial founders, and social welfare leaders.
          </p>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start md:self-auto font-medium">
          <span>{mentors.length} advisors listed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search mentors by name, expertise, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">{t.filterAllCategories}</option>
            <option value="Enterprise Tech">Enterprise Tech & Infrastructure</option>
            <option value="Venture Capital">Venture Capital & Startups</option>
            <option value="B2B SaaS">B2B SaaS & Product</option>
            <option value="Sustainability">Sustainability & Social Impact</option>
          </select>
        </div>
      </div>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading mentors directory...
        </div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-900">No matching mentors found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or industry filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={mentor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={mentor.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{mentor.name}</h3>
                      <p className="text-xs text-blue-700 font-medium">{mentor.area_of_expertise}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      mentor.availability_status === 'Available'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : mentor.availability_status === 'Limited'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ● {mentor.availability_status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong className="text-slate-900">Experience:</strong> {mentor.experience}</div>
                  <div><strong className="text-slate-900">Industry:</strong> {mentor.industry}</div>
                </div>

                {mentor.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mentor.bio}
                  </p>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="font-semibold text-slate-900">Areas of Guidance:</span>
                  <p className="text-slate-600 leading-relaxed">{mentor.areas_of_guidance}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Direct Advisory Session</span>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Guidance</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GUIDANCE REQUEST MODAL */}
      <GuidanceRequestModal
        isOpen={Boolean(selectedMentor)}
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
      />
    </div>
  );
};
