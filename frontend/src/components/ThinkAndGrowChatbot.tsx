import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  ExternalLink,
  BookOpen,
  Compass,
  Code2,
  CheckCircle2,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SkillLearningResource } from '../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  resources?: SkillLearningResource[];
  timestamp: string;
}

interface ThinkAndGrowChatbotProps {
  targetRole?: string;
  missingSkills?: string[];
  userSkills?: string[];
}

export const ThinkAndGrowChatbot: React.FC<ThinkAndGrowChatbotProps> = ({
  targetRole = 'Full Stack Developer',
  missingSkills = [],
  userSkills = []
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **Think & Grow Career Guide**. I can help you bridge your missing skills for **${targetRole}**, provide beginner-to-advanced learning roadmaps, and recommend hands-on practice projects.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || isSending) return;

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsSending(true);

    try {
      const res = await api.askChatbot({
        message: textToSend,
        target_role: targetRole,
        missing_skills: missingSkills,
        user_skills: userSkills
      });

      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply,
        resources: res.resources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'I could not process your query at this moment. Please check your connection or explore the curated learning links directly below.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#138A4B] text-white rounded-2xl shadow-lg hover:bg-[#08663A] transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Open Think & Grow AI Assistant"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-tight">Think & Grow</div>
            <div className="text-[10px] text-white/80 leading-tight">Career & Skill AI Guide</div>
          </div>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[540px] max-h-[85vh] bg-white rounded-2xl border border-[#E3EAE5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
          {/* Header */}
          <div className="bg-[#138A4B] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight leading-tight">Think & Grow Assistant</h3>
                <p className="text-[11px] text-white/80 leading-tight">
                  Track: {targetRole} · {missingSkills.length} missing skill(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors"
              title="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-[#F8FAF8] border-b border-[#E3EAE5] px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendMessage('Give me a beginner-to-advanced learning roadmap for my missing skills.')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E3EAE5] text-[#08663A] hover:bg-[#EAF7EF] font-medium whitespace-nowrap transition-colors"
            >
              Roadmap
            </button>
            <button
              onClick={() => handleSendMessage('Suggest hands-on portfolio practice projects for my target skills.')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E3EAE5] text-[#08663A] hover:bg-[#EAF7EF] font-medium whitespace-nowrap transition-colors"
            >
              Project Ideas
            </button>
            <button
              onClick={() => handleSendMessage('Where can I find beginner YouTube tutorials for my missing skills?')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E3EAE5] text-[#08663A] hover:bg-[#EAF7EF] font-medium whitespace-nowrap transition-colors"
            >
              YouTube Links
            </button>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8FAF8]/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#138A4B] text-white shadow-2xs'
                      : 'bg-white text-[#17211B] border border-[#E3EAE5] shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs">
                    {msg.text}
                  </div>

                  {/* Resource Cards if returned */}
                  {msg.resources && msg.resources.length > 0 && (
                    <div className="pt-2 border-t border-[#E3EAE5] space-y-2">
                      <div className="text-[10px] font-bold text-[#65736A] uppercase tracking-wider">
                        Curated Learning Links:
                      </div>
                      <div className="space-y-1.5">
                        {msg.resources.map((res, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-[#F8FAF8] border border-[#E3EAE5] flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <span className="font-bold text-[#17211B]">{res.skill}</span>
                              <span className="text-[10px] text-[#65736A] block truncate">{res.practice_project}</span>
                            </div>
                            <a
                              href={res.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-[#EAF7EF] text-[#08663A] hover:bg-[#d6f0df] text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                            >
                              <span>Tutorial</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-[#65736A] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#65736A] p-2">
                <div className="w-2 h-2 rounded-full bg-[#138A4B] animate-pulse" />
                <span>Analyzing missing skills & learning pathways...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Disclaimer */}
          <div className="px-3 py-1.5 bg-white border-t border-[#E3EAE5] text-[10px] text-[#65736A] flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-[#138A4B] shrink-0" />
            <span className="truncate">
              Job applications strictly require 50% skill match. Learning is self-paced.
            </span>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#E3EAE5] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about roadmaps, missing skills, or practice tasks..."
              className="flex-1 px-3 py-2 rounded-xl border border-[#E3EAE5] text-xs text-[#17211B] focus:outline-none focus:border-[#138A4B] transition-colors"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="p-2 rounded-xl bg-[#138A4B] text-white hover:bg-[#08663A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
