import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Report } from '../types';
import { api } from '../services/api';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: number, newStatus: string) => {
    try {
      const res = await api.updateReportStatus(reportId, newStatus);
      setUpdateFeedback(res.message);
      fetchReports();
      setTimeout(() => setUpdateFeedback(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update report status.');
    }
  };

  const filteredReports = statusFilter === 'All'
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Trust & Safety Audit Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17211B] tracking-tight">
          Trust & Fraud Prevention Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#65736A] leading-relaxed">
          Human administrator review console for submitted community reports on jobs, profiles, and startup representations.
        </p>
      </div>

      {/* Guidelines Box */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
        <div>
          <strong>Review Principle:</strong> Listings are not automatically marked fraudulent based on user reports alone. Reviewers assess factual discrepancies, contact availability, and payment requests prior to status resolution.
        </div>
      </div>

      {updateFeedback && (
        <div className="p-3 bg-[#EAF7EF] border border-[#138A4B]/30 rounded-xl text-xs text-[#08663A] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{updateFeedback}</span>
        </div>
      )}

      {/* Filter and Queue summary */}
      <div className="p-4 bg-white rounded-2xl border border-[#E3EAE5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#17211B]">
          <span>Audit Queue: {filteredReports.length} Reports</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E3EAE5] bg-white text-xs text-[#17211B]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button
            onClick={fetchReports}
            className="p-2 rounded-xl border border-[#E3EAE5] hover:bg-gray-50 text-[#65736A]"
            title="Refresh reports"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reports Table / Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#65736A]">
          Loading trust reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EAE5] p-8">
          <CheckCircle2 className="w-12 h-12 text-[#138A4B]/40 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-[#17211B]">Queue is clean</h3>
          <p className="text-xs text-[#65736A] mt-1">No reports matching the selected status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-white border border-[#E3EAE5] shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {rep.target_type} Report #{rep.id}
                  </span>
                  <span className="text-xs font-bold text-[#17211B]">Target ID: {rep.target_id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      rep.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rep.status === 'Under Review'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rep.status}
                  </span>
                  <span className="text-[11px] text-[#65736A]">
                    {new Date(rep.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#E3EAE5] space-y-1 text-xs">
                <div>
                  <strong className="text-[#17211B]">Reported Reason: </strong>
                  <span className="text-red-700 font-medium">{rep.reason}</span>
                </div>
                {rep.details && (
                  <div>
                    <strong className="text-[#17211B]">Submitted Evidence / Context: </strong>
                    <span className="text-[#65736A]">{rep.details}</span>
                  </div>
                )}
                <div>
                  <strong className="text-[#17211B]">Reporter: </strong>
                  <span className="text-[#65736A]">{rep.reporter_name} ({rep.reporter_email})</span>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-2 border-t border-[#E3EAE5] flex items-center justify-between text-xs">
                <span className="text-[#65736A]">Update Audit Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Pending Review')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Pending Review'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'text-[#65736A] border-[#E3EAE5] hover:bg-gray-50'
                    }`}
                  >
                    Pending Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Under Review')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Under Review'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'text-[#65736A] border-[#E3EAE5] hover:bg-gray-50'
                    }`}
                  >
                    Under Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Resolved')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'text-[#65736A] border-[#E3EAE5] hover:bg-gray-50'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
