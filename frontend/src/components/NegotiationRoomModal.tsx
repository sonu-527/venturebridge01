import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NegotiationRoom } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NegotiationRoomModalProps {
  roomId?: number;
  room?: NegotiationRoom;
  isOpen: boolean;
  onClose: () => void;
  onDealAccepted?: () => void;
  onRoomUpdated?: () => void;
}

export const NegotiationRoomModal: React.FC<NegotiationRoomModalProps> = ({
  roomId: propRoomId,
  room: initialRoom,
  isOpen,
  onClose,
  onDealAccepted,
  onRoomUpdated,
}) => {
  const effectiveRoomId = propRoomId || initialRoom?.id || 1;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [room, setRoom] = useState<NegotiationRoom | null>(initialRoom || null);
  const [loading, setLoading] = useState(false);

  // Counter-offer state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState<number>(initialRoom?.proposed_amount || 0);
  const [counterValuation, setCounterValuation] = useState<number>(initialRoom?.proposed_valuation || 0);
  const [counterEquity, setCounterEquity] = useState<number>(initialRoom?.proposed_equity || 0);
  const [counterCurrency, setCounterCurrency] = useState<'INR' | 'USD'>((initialRoom?.currency as 'INR' | 'USD') || 'INR');
  const [counterNotes, setCounterNotes] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Chat message state
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Deal action state
  const [accepting, setAccepting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await api.getNegotiationRoom(effectiveRoomId);
      setRoom(res);
      setCounterAmount(res.proposed_amount);
      setCounterValuation(res.proposed_valuation);
      setCounterEquity(res.proposed_equity);
      setCounterCurrency((res.currency as 'INR' | 'USD') || 'INR');
    } catch (err) {
      console.error('Failed to load negotiation room:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoom();
      setShowCounterForm(false);
      setActionMessage(null);
    }
  }, [isOpen, effectiveRoomId]);

  const handleSendCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCounter(true);
      setActionMessage(null);
      await api.submitCounterOffer(effectiveRoomId, {
        proposed_amount: Number(counterAmount),
        currency: counterCurrency,
        proposed_valuation: Number(counterValuation),
        proposed_equity: Number(counterEquity),
        notes: counterNotes,
      });
      setActionMessage('Counter-offer registered! Counterpart notified.');
      setShowCounterForm(false);
      fetchRoom();
      if (onRoomUpdated) onRoomUpdated();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to submit counter-offer.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    try {
      setSendingMsg(true);
      await api.sendNegotiationMessage(effectiveRoomId, chatMessage);
      setChatMessage('');
      fetchRoom();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAcceptDeal = async () => {
    if (!confirm('Are you sure you want to accept this term sheet? This will execute the investment agreement and automatically credit the startup fundraising total.')) {
      return;
    }
    try {
      setAccepting(true);
      setActionMessage(null);
      await api.updateNegotiationStatus(effectiveRoomId, 'Accepted', 'Term sheet executed successfully via automated protocol.');
      setActionMessage('Deal confirmed! Fundraising total has been updated automatically.');
      fetchRoom();
      if (onDealAccepted) {
        onDealAccepted();
      }
      if (onRoomUpdated) {
        onRoomUpdated();
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to accept term sheet.');
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  const symbol = room?.currency === 'USD' ? '$' : '₹';
  const isFounder = user?.id === room?.founder_id;
  const isInvestor = user?.id === room?.investor_id;
  const isClosedOrAccepted = room?.status === 'Accepted' || room?.status === 'Closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 relative max-h-[92vh] flex flex-col my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {t('negotiation.title', 'Deal Negotiation Chamber')}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  room?.status === 'Accepted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : room?.status === 'Countered'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  ● {room?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {room?.startup_name} • Founder: <span className="font-semibold text-slate-700">{room?.founder_name}</span> & Investor: <span className="font-semibold text-slate-700">{room?.investor_name}</span>
              </p>
            </div>
          </div>

          {/* Google Meet Button */}
          {room?.google_meet_link && (
            <a
              href={room.google_meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-xs transition"
            >
              <span>📹</span> Connect on Google Meet
            </a>
          )}
        </div>

        {/* Legal Savings Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/10 border border-amber-200/90 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📜</span>
            <span className="text-xs font-bold text-amber-950">
              {t('negotiation.legalSavings', 'Legal Savings: Estimated ₹75,000 / $1,000 saved using VentureBridge automated term sheet protocol.')}
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
            Pre-Seed Safe Standard
          </span>
        </div>

        {/* Active Term Sheet Card */}
        {room && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('negotiation.valuation', 'Pre-Money Valuation')}
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {symbol}{room.proposed_valuation?.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Agreed Company Value</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {t('negotiation.ticketSize', 'Investment Ticket')}
              </span>
              <div className="text-xl font-extrabold text-blue-800 font-mono mt-0.5">
                {symbol}{room.proposed_amount?.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold">Immediate Capital Transfer</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('negotiation.equity', 'Equity Dilution')}
              </span>
              <div className="text-xl font-extrabold text-amber-600 font-mono mt-0.5">
                {room.proposed_equity}%
              </div>
              <span className="text-[10px] text-slate-500">Preferred Class A Shares</span>
            </div>
          </div>
        )}

        {/* Counter-Offer Form (Expandable) */}
        {showCounterForm && !isClosedOrAccepted && (
          <form onSubmit={handleSendCounter} className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 mb-4 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                {isFounder ? 'Founder Counter-Offer Form' : 'Investor Revised Terms'}
              </h4>
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Currency</label>
                <select
                  value={counterCurrency}
                  onChange={(e) => setCounterCurrency(e.target.value as 'INR' | 'USD')}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Valuation ({counterCurrency})</label>
                <input
                  type="number"
                  value={counterValuation}
                  onChange={(e) => setCounterValuation(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Ticket Size ({counterCurrency})</label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Equity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={counterEquity}
                  onChange={(e) => setCounterEquity(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Commercial Justification / Terms</label>
              <input
                type="text"
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                placeholder="e.g. Countering based on Q3 audited run-rate and 40% QoQ user growth..."
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingCounter}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {submittingCounter ? 'Submitting...' : 'Register Counter-Offer'}
              </button>
            </div>
          </form>
        )}

        {actionMessage && (
          <p className="text-xs mb-3 font-semibold text-blue-800 bg-blue-100 p-2.5 rounded-xl">
            {actionMessage}
          </p>
        )}

        {/* In-Room Negotiation Chat Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3 min-h-[160px] max-h-[220px] bg-slate-50/70 p-3 rounded-xl border border-slate-200">
          {room?.messages && room.messages.length > 0 ? (
            room.messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              const isCounter = m.message_type === 'counter_offer';
              const isStatus = m.message_type === 'status_change';

              if (isStatus) {
                return (
                  <div key={m.id} className="text-center py-1 text-[11px] font-bold text-slate-500 italic">
                    ── {m.content} ──
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                    <span className="font-bold text-slate-700">{m.sender_name}</span>
                    <span>({m.sender_role})</span>
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs max-w-md ${
                    isCounter
                      ? 'bg-amber-100/90 text-amber-950 border border-amber-300 font-medium'
                      : isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-6 text-xs text-slate-400 italic">
              Negotiation room opened. Discuss term sheet amendments or submit a counter-offer above.
            </p>
          )}
        </div>

        {/* Message Input Form */}
        {!isClosedOrAccepted && (
          <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type message, clarify liquidation preferences, or ask question..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatMessage.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {!isClosedOrAccepted && (
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
              >
                ⚖️ {t('negotiation.counterAction', 'Send Counter-Offer')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Close Chamber
            </button>

            {!isClosedOrAccepted && (
              <button
                type="button"
                onClick={handleAcceptDeal}
                disabled={accepting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>🤝</span> {accepting ? 'Executing Deal...' : t('negotiation.acceptDeal', 'Accept Term Sheet & Confirm Deal')}
              </button>
            )}

            {room?.status === 'Accepted' && (
              <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1.5">
                <span>✓</span> {t('negotiation.dealClosed', 'Deal Confirmed & Executed')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
