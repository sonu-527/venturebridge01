import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { MeetingRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface MeetingManagementSectionProps {
  title?: string;
  onRequestNewMeeting?: () => void;
}

export const MeetingManagementSection: React.FC<MeetingManagementSectionProps> = ({
  title = 'Scheduled Google Meet Discussions',
  onRequestNewMeeting,
}) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Approved' | 'Other'>('All');

  // Modal states for Link editing or Rescheduling
  const [linkModalMeeting, setLinkModalMeeting] = useState<MeetingRequest | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [rescheduleMeeting, setRescheduleMeeting] = useState<MeetingRequest | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.getMyMeetings();
      setMeetings(res);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleRespond = async (meetingId: number, status: 'Approved' | 'Rejected') => {
    try {
      setActionMessage(null);
      await api.respondToMeetingRequest(meetingId, status);
      setActionMessage(`Meeting request has been marked as '${status}'.`);
      fetchMeetings();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || `Failed to ${status.toLowerCase()} meeting request.`);
    }
  };

  const handleCancel = async (meetingId: number) => {
    if (!confirm('Are you sure you want to cancel this meeting request?')) return;
    try {
      setActionMessage(null);
      await api.cancelMeetingRequest(meetingId);
      setActionMessage('Meeting request has been cancelled.');
      fetchMeetings();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel meeting.');
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalMeeting) return;
    setLinkError(null);

    const pattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
    if (!pattern.test(linkInput.trim())) {
      setLinkError('Invalid format. Link must match https://meet.google.com/xxx-xxxx-xxx');
      return;
    }

    try {
      await api.updateMeetingLink(linkModalMeeting.id, linkInput.trim());
      setLinkModalMeeting(null);
      setLinkInput('');
      setActionMessage('Google Meet link saved successfully.');
      fetchMeetings();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setLinkError(err.message || 'Failed to update link.');
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleMeeting) return;
    setRescheduleError(null);

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDate < todayStr) {
      setRescheduleError('Please choose a future date.');
      return;
    }

    try {
      const res = await api.updateMeetingDetails(rescheduleMeeting.id, {
        meeting_date: newDate,
        start_time: newTime,
      });

      setRescheduleMeeting(null);
      let notice = 'Meeting details updated.';
      if (res.renewed_approval_required) {
        notice = 'Meeting rescheduled! Status has been reset to Pending for renewed approval.';
      }
      setActionMessage(notice);
      fetchMeetings();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule meeting.');
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    if (activeFilter === 'Pending') return m.status === 'Pending';
    if (activeFilter === 'Approved') return m.status === 'Approved';
    if (activeFilter === 'Other') return m.status === 'Cancelled' || m.status === 'Rejected' || m.status === 'Completed';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              Two-party Google Meet coordination with confirmed mutual approvals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRequestNewMeeting && (
            <button
              onClick={onRequestNewMeeting}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request Meeting</span>
            </button>
          )}

          <button
            onClick={fetchMeetings}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
            title="Refresh meetings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b border-slate-100 pb-2 text-xs">
        {(['All', 'Pending', 'Approved', 'Other'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === tab
                ? 'bg-blue-100 text-blue-800 font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab}
            {tab === 'Pending' && meetings.filter((m) => m.status === 'Pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {meetings.filter((m) => m.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {loading ? (
        <p className="text-center py-8 text-xs text-slate-400">Loading meeting schedule...</p>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} meetings found</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Request a Google Meet discussion with a founder, investor, or candidate to connect directly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((m) => {
            const isUserRequester = Boolean(user && Number(user.id) === Number(m.requester_id));
            const isUserRecipient = Boolean(user && Number(user.id) === Number(m.recipient_id));
            const counterpartName = isUserRequester ? m.recipient_name : m.requester_name;
            const counterpartRole = isUserRequester ? m.recipient_role : m.requester_role;

            return (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Meeting Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>

                    {/* Status Badge */}
                    {m.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        Approved & Confirmed
                      </span>
                    ) : m.status === 'Pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Recipient Approval
                      </span>
                    ) : m.status === 'Rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-3 h-3 text-red-600" />
                        Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        {m.status}
                      </span>
                    )}

                    {/* Link Pending indicator */}
                    {m.status === 'Approved' && !m.google_meet_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Link pending
                      </span>
                    )}
                  </div>

                  {m.purpose && (
                    <p className="text-xs text-slate-600 line-clamp-1">{m.purpose}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {m.meeting_date}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {m.start_time} ({m.duration_minutes} min • {m.time_zone})
                    </span>
                    <span>
                      {isUserRequester ? (
                        <>With: <strong className="text-slate-800 font-semibold">{counterpartName}</strong> ({counterpartRole})</>
                      ) : (
                        <>From: <strong className="text-slate-800 font-semibold">{counterpartName}</strong> ({counterpartRole})</>
                      )}
                    </span>
                  </div>

                  {m.agenda && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 whitespace-pre-line font-sans">
                      <strong className="text-slate-700">Agenda:</strong> {m.agenda}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Recipient Approval actions */}
                  {isUserRecipient && m.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(m.id, 'Approved')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRespond(m.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 text-xs font-semibold transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* Requester awaiting notice */}
                  {isUserRequester && m.status === 'Pending' && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 italic">
                      Awaiting response from {counterpartName}
                    </span>
                  )}

                  {/* Approved: Join Meeting Button */}
                  {m.status === 'Approved' && m.google_meet_url && (
                    <a
                      href={m.google_meet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Google Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Approved: Add or Update Meet Link */}
                  {m.status === 'Approved' && (
                    <button
                      onClick={() => {
                        setLinkModalMeeting(m);
                        setLinkInput(m.google_meet_url || '');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{m.google_meet_url ? 'Edit Link' : 'Add Meet Link'}</span>
                    </button>
                  )}

                  {/* Reschedule Button */}
                  {(m.status === 'Pending' || m.status === 'Approved') && (
                    <button
                      onClick={() => {
                        setRescheduleMeeting(m);
                        setNewDate(m.meeting_date);
                        setNewTime(m.start_time);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                      title="Reschedule (resets approved status to pending)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Cancel Button */}
                  {(m.status === 'Pending' || m.status === 'Approved') && (
                    <button
                      onClick={() => handleCancel(m.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                      title="Cancel meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / UPDATE GOOGLE MEET LINK */}
      {linkModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setLinkModalMeeting(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Enter Google Meet Link</h3>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Google Meet URL *
                </label>
                <input
                  type="url"
                  required
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must be formatted as: https://meet.google.com/xxx-xxxx-xxx
                </span>
              </div>

              {linkError && (
                <p className="text-xs text-red-600 font-semibold">{linkError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLinkModalMeeting(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Meet Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE DATE & TIME */}
      {rescheduleMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setRescheduleMeeting(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reschedule Meeting</h3>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> Changing date or start time will reset this meeting status to <strong>Pending</strong>, requiring renewed approval from the recipient.
              </span>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">New Time</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              {rescheduleError && (
                <p className="text-xs text-red-600 font-semibold">{rescheduleError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleMeeting(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Reschedule & Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
