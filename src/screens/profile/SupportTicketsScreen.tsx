import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Ticket, 
  Plus, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  X,
  FileText,
  Paperclip
} from 'lucide-react';
import { SupportTicket } from '../../types';

interface SupportTicketsScreenProps {
  initialView?: 'list' | 'detail' | 'new';
}

export const SupportTicketsScreen: React.FC<SupportTicketsScreenProps> = ({ initialView = 'list' }) => {
  const { 
    supportTickets, 
    addSupportTicket, 
    addTicketMessage, 
    selectedTicketId, 
    setSelectedTicketId, 
    routeParam, 
    navigate, 
    showToast 
  } = useApp();

  const [view, setView] = useState<'list' | 'detail' | 'new'>(initialView);
  const [replyText, setReplyText] = useState('');

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Air Freight Waybill');
  const [priority, setPriority] = useState<SupportTicket['priority']>('High');
  const [message, setMessage] = useState('');

  const activeTicketId = routeParam || selectedTicketId || supportTickets[0]?.id;
  const currentTicket = supportTickets.find((t) => t.id === activeTicketId) || supportTickets[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in subject and message', 'error');
      return;
    }

    addSupportTicket({
      subject,
      category,
      priority,
      message
    });

    setSubject('');
    setMessage('');
    setView('list');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentTicket) return;

    addTicketMessage(currentTicket.id, replyText);
    setReplyText('');
    showToast('Reply dispatched to on-ground clearing agent', 'info');
  };

  const getPriorityBadge = (p: SupportTicket['priority']) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'High': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (s: SupportTicket['status']) => {
    switch (s) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  // Detail View
  if (view === 'detail' && currentTicket) {
    return (
      <div className="min-h-full pb-24 bg-slate-950 text-white flex flex-col justify-between">
        <Header title={`Ticket ${currentTicket.ticketNumber}`} />

        <div className="p-4 space-y-4 flex-1">
          {/* Back & Status Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>All Tickets</span>
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPriorityBadge(currentTicket.priority)}`}>
                {currentTicket.priority} Priority
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(currentTicket.status)}`}>
                {currentTicket.status}
              </span>
            </div>
          </div>

          {/* Ticket Subject Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">{currentTicket.category}</span>
            <h3 className="text-sm font-extrabold text-white">{currentTicket.subject}</h3>
            <p className="text-[10px] text-slate-400">Created: {currentTicket.createdAt} • Last update: {currentTicket.lastUpdated}</p>
          </div>

          {/* Messages Thread */}
          <div className="space-y-3">
            {currentTicket.messages.map((msg, i) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-1 px-1">
                    {msg.senderName} • {msg.timestamp}
                  </span>
                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 sticky bottom-14 z-20">
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply to assigned agent..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold active:scale-95 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // New Ticket Form View
  if (view === 'new') {
    return (
      <div className="min-h-full pb-24 bg-slate-950 text-white">
        <Header title="Open Trade Ticket" />

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Tickets</span>
            </button>
            <span className="text-xs text-emerald-400 font-semibold">Priority Escalation Desk</span>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ticket Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Supplier Escrow', 'Customs & Port', 'Air Freight Waybill', 'FX Swap Slippage'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-xl text-[11px] font-semibold border text-left transition-all ${
                      category === cat
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Urgent', 'High', 'Normal'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      priority === p
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Flight ET921 Waybill verification or Tin Can clearance"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the shipment reference, container mark, or transaction code..."
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Ticket to Duty Desk</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Default: Ticket List View
  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Support Tickets" />

      <div className="p-4 space-y-4">
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/50 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Guangzhou & Lagos Duty Desk
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Enterprise Trade Tickets
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Guaranteed 15-minute response SLA for Tier 3 Exporters.
            </p>
          </div>

          <button
            onClick={() => setView('new')}
            className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            title="Open Ticket"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab switchers to live chat */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md">
            Logged Tickets ({supportTickets.length})
          </button>
          <button
            onClick={() => navigate('support-chat')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            24/7 Live Messaging
          </button>
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {supportTickets.map((tkt) => (
            <div
              key={tkt.id}
              onClick={() => {
                setSelectedTicketId(tkt.id);
                setView('detail');
              }}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all active:scale-98 space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {tkt.ticketNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getPriorityBadge(tkt.priority)}`}>
                    {tkt.priority}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(tkt.status)}`}>
                  {tkt.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">{tkt.category}</span>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors mt-0.5">
                  {tkt.subject}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                  {tkt.messages[tkt.messages.length - 1]?.text}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Updated: {tkt.lastUpdated}</span>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Thread</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
