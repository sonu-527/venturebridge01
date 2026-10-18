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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Administrator Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Trust & Safety Review Queue
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Human administrator moderation console for community reports across jobs, profiles, and startups.
          </p>
        </div>

        <div className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 self-start md:self-auto font-medium">
          <span>{filteredReports.length} reports in queue</span>
        </div>
      </div>

      {updateFeedback && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{updateFeedback}</span>
        </div>
      )}

      {/* Filter and Queue summary */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-900">
          Filter Queue by Status
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button
            onClick={fetchReports}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reports Table / Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading trust reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <CheckCircle2 className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-900">Queue is clean</h3>
          <p className="text-xs text-slate-500 mt-1">No reports matching the selected status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {rep.target_type} Report #{rep.id}
                  </span>
                  <span className="text-xs font-bold text-slate-900">Target ID: {rep.target_id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      rep.status === 'Resolved'
                        ? 'bg-blue-100 text-blue-800'
                        : rep.status === 'Under Review'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rep.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rep.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div>
                  <strong className="text-slate-900">Reported Reason: </strong>
                  <span className="text-red-700 font-medium">{rep.reason}</span>
                </div>
                {rep.details && (
                  <div>
                    <strong className="text-slate-900">Submitted Evidence / Context: </strong>
                    <span className="text-slate-600">{rep.details}</span>
                  </div>
                )}
                <div>
                  <strong className="text-slate-900">Reporter: </strong>
                  <span className="text-slate-600">{rep.reporter_name} ({rep.reporter_email})</span>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Update Audit Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Pending Review')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Pending Review'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Pending Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Under Review')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Under Review'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Under Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'Resolved')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                      rep.status === 'Resolved'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
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
