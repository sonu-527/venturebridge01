import React, { useState } from 'react';
import { Shield, Mail, HelpCircle, FileText, Lock, X } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const openInfoModal = (title: string, body: string) => {
    setModalContent({ title, body });
  };

  return (
    <footer className="bg-white border-t border-[#E3EAE5] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#138A4B] text-white flex items-center justify-center font-bold text-sm">
                VB
              </div>
              <span className="font-bold text-base text-[#17211B]">
                Venture<span className="text-[#138A4B]">Bridge</span>
              </span>
            </div>
            <p className="text-xs text-[#65736A] leading-relaxed">
              Connecting Talent, Ideas, and Opportunities. Designed for student entrepreneurs, job seekers, and forward-thinking early investors.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#08663A] font-medium bg-[#EAF7EF] px-2.5 py-1 rounded-md w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>Transparent & Verified Platform</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#17211B] mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#65736A]">
              <li>
                <button
                  onClick={() => openInfoModal('About VentureBridge', 'VentureBridge is a student hackathon MVP built to bridge the gap between fresh graduate skills and early-stage startup hiring needs. It facilitates transparent co-founder discovery, idea sharing, and investor connections without unnecessary paywalls or opaque algorithms.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  About VentureBridge
                </button>
              </li>
              <li>
                <button
                  onClick={() => openInfoModal('Contact & Inquiries', 'For support or questions regarding demo data and review submissions, contact the student engineering team at team@venturebridge.local. All inquiries are responded to within 24-48 business hours.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => openInfoModal('Help & FAQ', 'How does skill matching work? We compute the percentage of required skills from an opportunity that match your declared skills. Is funding real? No, VentureBridge is a prototype demonstration platform. No real financial payments or transactions are executed.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  Help & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#17211B] mb-3">
              Trust & Safety
            </h4>
            <ul className="space-y-2 text-xs text-[#65736A]">
              <li>
                <button
                  onClick={() => openInfoModal('Privacy Policy', 'We value privacy. Password hashes are generated with salted PBKDF2 with 100,000 iterations. Confidential startup ideas marked INVESTOR-ONLY are enforced on the backend API and never leaked to unauthorized public clients.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openInfoModal('Terms & Conditions', 'All startup entries and job postings shown are fictional representations for hackathon evaluation. Users agree not to post unsolicited spam or misleading contact details. Violations are reviewed by platform administrators.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => openInfoModal('Verification Standards', 'Profiles and startups undergo cautious human review before earning the Verified badge. An unverified tag simply denotes community status and is not an accusation of fraud.')}
                  className="hover:text-[#138A4B] transition-colors"
                >
                  Verification Standards
                </button>
              </li>
            </ul>
          </div>

          {/* Social Impact & Disclaimers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#17211B] mb-3">
              Hackathon Notice
            </h4>
            <p className="text-xs text-[#65736A] leading-relaxed">
              Theme: Entrepreneurship & Employment. Built with React 19, TypeScript, Tailwind CSS, and FastAPI SQLite.
            </p>
            <p className="text-[11px] text-[#65736A]/80 mt-2">
              © 2026 VentureBridge. All sample startups and positions are simulated demo data.
            </p>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE5]">
              <h3 className="font-semibold text-base text-[#17211B]">{modalContent.title}</h3>
              <button
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg text-[#65736A] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#65736A] leading-relaxed mt-4">
              {modalContent.body}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
