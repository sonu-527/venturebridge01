import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Message, Connection } from '../types';

interface MessagingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeConnection: Connection | null;
}

export const MessagingDrawer: React.FC<MessagingDrawerProps> = ({
  isOpen,
  onClose,
  activeConnection,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const peerId = activeConnection?.peer_id;
  const peerName = activeConnection?.peer_name || 'Connection';

  const fetchMessages = async () => {
    if (!peerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMessages(peerId);
      setMessages(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && peerId) {
      fetchMessages();
    }
  }, [isOpen, peerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !peerId || isSending) return;

    setIsSending(true);
    try {
      const newMsg = await api.sendMessage(peerId, inputText.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !activeConnection) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E3EAE5] bg-[#F8FAF8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAF7EF] text-[#08663A] font-semibold flex items-center justify-center border border-[#138A4B]/20">
              {peerName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#17211B]">{peerName}</h3>
              <p className="text-xs text-[#65736A]">{activeConnection.peer_role || 'Connected Member'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#65736A] hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAF8]/40">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-10 text-xs text-[#65736A]">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-[#EAF7EF] text-[#08663A] flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#17211B]">Start the conversation</p>
              <p className="text-xs text-[#65736A] mt-1 max-w-xs mx-auto">
                You are connected with {peerName}. Discuss startup ideas, co-founder synergies, or project scope.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-[#138A4B] text-white rounded-br-xs'
                        : 'bg-white text-[#17211B] border border-[#E3EAE5] rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-[#65736A] mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E3EAE5] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#17211B] placeholder-[#65736A] focus:outline-none focus:border-[#138A4B] focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-[#138A4B] text-white hover:bg-[#08663A] disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
