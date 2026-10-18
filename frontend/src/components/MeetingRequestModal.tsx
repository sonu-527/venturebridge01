import React, { useState } from 'react';
import { X, Calendar, Clock, Video, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface MeetingRequestModalProps {
  recipientId: number;
  recipientName: string;
  recipientRole?: string;
  defaultTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MeetingRequestModal: React.FC<MeetingRequestModalProps> = ({
  recipientId,
  recipientName,
  recipientRole = 'Platform Member',
  defaultTitle = '',
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Tomorrow's date ISO string
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [title, setTitle] = useState(defaultTitle || `Introductory Discussion with ${recipientName}`);
  const [purpose, setPurpose] = useState('');
  const [meetingDate, setMeetingDate] = useState(minDateStr);
  const [startTime, setStartTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timeZone, setTimeZone] = useState('IST');
  const [agenda, setAgenda] = useState('');
  const [googleMeetUrl, setGoogleMeetUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validate Google Meet format helper
  const isValidMeetUrl = (url: string) => {
    if (!url.trim()) return true;
    const pattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
    return pattern.test(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // 1. Future date validation
    const todayStr = new Date().toISOString().split('T')[0];
    if (meetingDate < todayStr) {
      setErrorMessage('Meeting date cannot be in the past. Please select a future date.');
      return;
    }

    // If meeting is today, check time
    if (meetingDate === todayStr) {
      const now = new Date();
      const [hrs, mins] = startTime.split(':').map(Number);
      const schedTime = new Date();
      schedTime.setHours(hrs, mins, 0, 0);
      if (schedTime <= now) {
        setErrorMessage('Meeting start time must be in the future.');
        return;
      }
    }

    // 2. Google meet link format validation
    if (googleMeetUrl.trim() && !isValidMeetUrl(googleMeetUrl)) {
      setErrorMessage(
        'Invalid Google Meet URL format. Link must match https://meet.google.com/xxx-xxxx-xxx'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createMeetingRequest({
        recipient_id: recipientId,
        title: title.trim(),
        purpose: purpose.trim(),
        meeting_date: meetingDate,
        start_time: startTime,
        duration_minutes: durationMinutes,
        time_zone: timeZone,
        agenda: agenda.trim(),
        google_meet_url: googleMeetUrl.trim() || undefined,
      });

      let notice = res.message || 'Meeting request submitted successfully!';
      if (res.conflict_warning) {
        notice += ` (${res.conflict_warning})`;
      }
      setSuccessNotice(notice);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit meeting request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Schedule Google Meet Discussion
            </h3>
            <p className="text-xs text-slate-500">
              Two-party verified workflow with <span className="font-semibold text-slate-700">{recipientName}</span> ({recipientRole})
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Purpose / Key Objectives
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Valuation discussion, tech stack architecture walkthrough, or terms review"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date, Time, Duration & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Date * (Future dates only)
              </label>
              <input
                type="date"
                required
                min={minDateStr}
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes (Quick intro)</option>
                <option value={30}>30 minutes (Standard sync)</option>
                <option value={45}>45 minutes (In-depth discussion)</option>
                <option value={60}>60 minutes (Comprehensive review)</option>
                <option value={90}>90 minutes (Technical interview / Board)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Time Zone
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="IST">IST (India Standard Time - UTC+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="EST">EST (Eastern Standard Time - UTC-5)</option>
                <option value="PST">PST (Pacific Standard Time - UTC-8)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Google Meet Link (Optional, or provide upon approval)
            </label>
            <input
              type="url"
              value={googleMeetUrl}
              onChange={(e) => setGoogleMeetUrl(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Format: https://meet.google.com/xxx-xxxx-xxx. Can be added later once the recipient approves.
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Discussion Agenda / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="1. Traction highlights&#10;2. Capital allocation strategy&#10;3. Terms & governance"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <span className="font-bold text-amber-900 shrink-0">Two-party rule:</span>
            <span>
              The meeting will be created in <strong className="font-semibold text-amber-950">Pending</strong> status. The recipient must confirm the request before the Google Meet link unlocks.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Sending Request...' : 'Send Meeting Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
