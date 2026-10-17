import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'Job' | 'Profile' | 'Startup';
  targetId: number;
  targetName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('Suspicious or misleading description');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please log in to submit a trust & safety report.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.submitReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      setSuccessMessage(res.message);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3EAE5] bg-[#F8FAF8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#17211B] text-base">Report {targetType}</h3>
              <p className="text-xs text-[#65736A] truncate max-w-xs">{targetName}</p>
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

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                <strong>Trust & Fairness Notice:</strong> Reports are reviewed by human administrators.
                A listing is not labeled fraudulent solely based on an unverified report.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Reason for Report
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-white text-sm text-[#17211B] focus:outline-none focus:border-[#138A4B] focus:ring-1 focus:ring-[#138A4B]"
                >
                  <option value="Suspicious or misleading description">Suspicious or misleading description</option>
                  <option value="Requests upfront fee or personal payment">Requests upfront fee or personal payment</option>
                  <option value="Unverified contact details or impersonation">Unverified contact details or impersonation</option>
                  <option value="Inaccurate salary or requirements">Inaccurate compensation or requirements</option>
                  <option value="Spam or duplicate content">Spam or duplicate content</option>
                  <option value="Other concern">Other concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#65736A] mb-1.5">
                  Additional Details & Evidence (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe specific details, missing links, or discrepancies you noticed..."
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
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
