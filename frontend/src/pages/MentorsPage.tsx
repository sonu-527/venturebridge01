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

export const MentorsPage: React.FC = () => {
  const { user } = useAuth();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
          <Compass className="w-3.5 h-3.5" />
          <span>Professional Advisory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          Mentors & Industry Guides
        </h1>
        <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
          Connect with experienced tech executives, serial founders, and social welfare leaders. Submit formal requests for guidance on architecture, fundraising, and MVP validation.
        </p>
      </div>

      {/* Advisory Purpose Banner */}
      <div className="p-3.5 bg-[#EAF7EF]/70 border border-[#138A4B]/20 rounded-2xl flex items-center justify-between text-xs text-[#08663A]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#138A4B] shrink-0" />
          <span>
            <strong>Mentorship Focus:</strong> Mentors provide high-level strategic guidance and feedback on architecture and product discovery without interfering with your dashboard operations.
          </span>
        </div>
        <span className="font-semibold shrink-0 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-[#138A4B]/20">
          Verified Directory
        </span>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#65736A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search mentors by name, expertise, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Industries</option>
            <option value="Enterprise Tech">Enterprise Tech & Infrastructure</option>
            <option value="Venture Capital">Venture Capital & Startups</option>
            <option value="B2B SaaS">B2B SaaS & Product</option>
            <option value="Sustainability">Sustainability & Social Impact</option>
          </select>
        </div>
      </div>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#65736A]">
          Loading mentors directory...
        </div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EAE5] p-8">
          <Compass className="w-12 h-12 text-[#65736A]/40 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-[#17211B]">No matching mentors found</h3>
          <p className="text-xs text-[#65736A] mt-1">Try clearing your search query or industry filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-2xl border border-[#E3EAE5] p-6 shadow-xs hover:border-[#138A4B]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={mentor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={mentor.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#E3EAE5]"
                    />
                    <div>
                      <h3 className="font-bold text-base text-[#17211B]">{mentor.name}</h3>
                      <p className="text-xs text-[#138A4B] font-medium">{mentor.area_of_expertise}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      mentor.availability_status === 'Available'
                        ? 'bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20'
                        : mentor.availability_status === 'Limited'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ● {mentor.availability_status}
                  </span>
                </div>

                <div className="text-xs text-[#65736A] space-y-1">
                  <div><strong className="text-[#17211B]">Experience:</strong> {mentor.experience}</div>
                  <div><strong className="text-[#17211B]">Industry:</strong> {mentor.industry}</div>
                </div>

                {mentor.bio && (
                  <p className="text-xs text-[#65736A] leading-relaxed">
                    {mentor.bio}
                  </p>
                )}

                <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] space-y-1 text-xs">
                  <span className="font-semibold text-[#17211B]">Areas of Guidance:</span>
                  <p className="text-[#65736A] leading-relaxed">{mentor.areas_of_guidance}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <span className="text-[#65736A]">Direct Guidance Request</span>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors flex items-center gap-1.5 shadow-xs"
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
