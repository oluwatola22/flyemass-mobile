import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  ShieldCheck, 
  CheckCheck, 
  Bot, 
  Headphones,
  Image,
  ArrowRight
} from 'lucide-react';

export const SupportChatScreen: React.FC = () => {
  const { chatMessages, sendChatMessage, userProfile } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPills = [
    'Current NGN/RMB live rate?',
    'Flight ET921 air cargo status?',
    'Guangzhou warehouse Chinese address?',
    'How fast is Alipay payout?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handlePillClick = (text: string) => {
    sendChatMessage(text);
  };

  return (
    <div className="h-full flex flex-col justify-between bg-slate-950 text-white">
      {/* Top Header with live agent presence */}
      <div>
        <Header title="Trade Concierge" />
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                CAN
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Chen Wei & Trade AI</p>
              <p className="text-[9px] text-slate-400">Guangzhou Hub Desk • Avg response: &lt; 1 min</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
            LIVE
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isUser && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    {msg.senderName}
                  </span>
                )}
                <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {isUser && msg.status && (
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 px-1">
                  <span>Delivered</span>
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickPills.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(pill)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 whitespace-nowrap active:scale-95 transition-all"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="flex items-center gap-2 mt-1.5 px-2 pb-2">
          <button
            type="button"
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question for China desk..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500"
          />

          <button
            type="submit"
            className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
