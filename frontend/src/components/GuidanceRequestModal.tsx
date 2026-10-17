import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Mentor } from '../types';
import { useAuth } from '../context/AuthContext';

interface GuidanceRequestModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GuidanceRequestModal: React.FC<GuidanceRequestModalProps> = ({
  mentor,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please log in to submit a guidance request.');
      return;
    }
    if (!topic.trim() || !message.trim()) {
      setErrorMessage('Please provide both a guidance topic and context message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.requestGuidance(mentor.id, { topic, message });
      setSuccessMessage(res.message);
      setTimeout(() => {
        setSuccessMessage(null);
        setTopic('');
        setMessage('');
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit guidance request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3EAE5] bg-[#F8FAF8]">
          <div className="flex items-center gap-3">
            <img
              src={mentor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={mentor.name}
              className="w-10 h-10 rounded-full object-cover border border-[#E3EAE5]"
            />
            <div>
              <h3 className="font-semibold text-[#17211B] text-base">Request Guidance</h3>
              <p className="text-xs text-[#65736A]">{mentor.name} · {mentor.area_of_expertise}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#65736A] hover:bg-gray-100 hover:text-[#17211B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMessage ? (
            <div className="p-4 rounded-xl bg-[#EAF7EF] border border-[#138A4B]/20 text-[#08663A] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="p-3 bg-[#EAF7EF]/60 border border-[#138A4B]/15 rounded-xl text-xs text-[#08663A] flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Mentorship Focus:</strong> Mentors provide high-level advice on system architecture, fundraising strategy, and product validation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Guidance Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architecture review for our React + FastAPI backend"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] placeholder-[#65736A]/50 focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Context & Questions (Be Specific)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Introduce yourself, your current milestone, and 2-3 specific questions you need advice on..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] placeholder-[#65736A]/50 focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#65736A] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-[#138A4B] hover:bg-[#08663A] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending Request...' : 'Send Guidance Request'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
