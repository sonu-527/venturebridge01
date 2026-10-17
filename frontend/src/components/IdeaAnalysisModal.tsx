import React from 'react';
import { X, CheckCircle, AlertCircle, Users, Layers, ShieldAlert, Award } from 'lucide-react';
import { IdeaAnalysis } from '../types';

interface IdeaAnalysisModalProps {
  ideaTitle: string;
  analysis: IdeaAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IdeaAnalysisModal: React.FC<IdeaAnalysisModalProps> = ({
  ideaTitle,
  analysis,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="sticky top-0 bg-[#F8FAF8] border-b border-[#E3EAE5] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
                Rule-Based MVP Checklist
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#17211B] mt-1">{ideaTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#65736A] hover:bg-gray-100 hover:text-[#17211B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Transparent Disclaimer Box */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <strong>Transparent Methodology:</strong> This validation check uses deterministic rules evaluating clarity, scope, team requirements, and common failure points. We do not use hallucinated AI predictions, and positive checklist marks do not guarantee commercial success or funding.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Problem Clarity */}
            <div className="p-4 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8]/60 space-y-1.5">
              <div className="flex items-center gap-2 text-[#08663A] font-semibold text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-[#138A4B]" />
                <span>Problem Clarity</span>
              </div>
              <p className="text-xs text-[#17211B] leading-relaxed">
                {analysis.problem_clarity}
              </p>
            </div>

            {/* 2. Target Customers */}
            <div className="p-4 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8]/60 space-y-1.5">
              <div className="flex items-center gap-2 text-[#08663A] font-semibold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#138A4B]" />
                <span>Target Beachhead</span>
              </div>
              <p className="text-xs text-[#17211B] leading-relaxed">
                {analysis.target_customers}
              </p>
            </div>

            {/* 3. Proposed Solution */}
            <div className="p-4 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8]/60 space-y-1.5">
              <div className="flex items-center gap-2 text-[#08663A] font-semibold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4 text-[#138A4B]" />
                <span>Proposed Solution</span>
              </div>
              <p className="text-xs text-[#17211B] leading-relaxed">
                {analysis.proposed_solution}
              </p>
            </div>

            {/* 4. Team Requirements */}
            <div className="p-4 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8]/60 space-y-1.5">
              <div className="flex items-center gap-2 text-[#08663A] font-semibold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-[#138A4B]" />
                <span>Team Milestones</span>
              </div>
              <p className="text-xs text-[#17211B] leading-relaxed">
                {analysis.team_requirements}
              </p>
            </div>
          </div>

          {/* Required Skills Checklist */}
          <div className="p-4 rounded-xl border border-[#E3EAE5] bg-white space-y-2">
            <h4 className="text-xs font-semibold text-[#17211B] uppercase tracking-wider">
              Required Core Competencies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.required_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Possible Challenges */}
          <div className="p-4 rounded-xl border border-red-100 bg-red-50/40 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-semibold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Identified Key Risks & Headwinds</span>
            </div>
            <ul className="space-y-1.5">
              {analysis.possible_challenges?.map((chal, idx) => (
                <li key={idx} className="text-xs text-[#17211B] flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{chal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8FAF8] border-t border-[#E3EAE5] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-[#138A4B] text-white hover:bg-[#08663A] transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
