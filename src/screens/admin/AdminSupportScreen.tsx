import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getMobileAppUrl } from '../../utils/environment';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupportTicketDocument } from '../../types';
import { 
  Headphones, 
  Send, 
  CheckCircle2, 
  Search, 
  Clock, 
  Paperclip, 
  MessageSquare, 
  ShieldCheck, 
  User, 
  AlertCircle,
  Tag,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export const AdminSupportScreen: React.FC = () => {
  const { showToast, viewAsClient } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [selectedTicketId, setSelectedTicketId] = useState<string>('tkt_8901');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const tickets = Object.values(dbState.support_tickets);
  const activeTicket = dbState.support_tickets[selectedTicketId] || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    db.addTicketMessage(activeTicket.id, {
      senderId: 'adm-002',
      senderName: 'Chen Wei (Guangzhou Clearing Desk)',
      text: replyText,
      isAdmin: true
    });

    firebaseSync.recordAudit('Support Agent', 'REPLY_TICKET', 'support_tickets', activeTicket.id, `Sent reply to ${activeTicket.userId}`);
    showToast('Reply sent to mobile client in real-time!', 'success');
    setReplyText('');
    setDbState({ ...db.getState() });
  };

  const handleResolveTicket = (ticketId: string) => {
    const tkt = dbState.support_tickets[ticketId];
    if (tkt) {
      db.updateTicketStatus(ticketId, 'resolved');
      firebaseSync.recordAudit('Support Agent', 'RESOLVE_TICKET', 'support_tickets', ticketId, 'Marked as resolved');
      showToast(`Ticket #${tkt.ticketNumber || ticketId} marked as RESOLVED`, 'success');
    }
  };

  return (
    <AdminLayout activeTab="support">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Omnichannel Support & Resolution Desk</h1>
            <p className="text-xs text-slate-400">
              Live two-way concierge messaging with Nigerian trade clients and Guangzhou hub agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time WebSockets / Firestore Sync: ONLINE</span>
            </span>
          </div>
        </div>

        {/* 2-Column Split: Ticket List (Left) and Live Chat Workspace (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">
          {/* Left Column: Tickets Queue */}
          <div className="lg:col-span-1 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Inquiries ({tickets.length})
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter inquiries..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
              {tickets.map((tkt) => {
                const isSelected = activeTicket?.id === tkt.id;
                return (
                  <div
                    key={tkt.id}
                    onClick={() => setSelectedTicketId(tkt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-emerald-500 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-emerald-400">
                        {tkt.ticketNumber || tkt.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tkt.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                        tkt.status === 'in_progress' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tkt.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{tkt.subject}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {tkt.messages[tkt.messages.length - 1]?.text || 'No messages'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Chat & Resolution Workspace */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col overflow-hidden">
            {activeTicket ? (
              <>
                {/* Chat Top Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white">{activeTicket.subject}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">({activeTicket.ticketNumber || activeTicket.id})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Client: Chief Babatunde Alade • Tier 3 Importer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(getMobileAppUrl(`?userId=${activeTicket.userId}`), '_blank')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 active:scale-95"
                      title={`Open Client View (${getMobileAppUrl()})`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Open Client View</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                    {activeTicket.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveTicket(activeTicket.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-950/30">
                  {activeTicket.messages.map((m, i) => {
                    const isAdmin = m.isAdmin;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[80%] ${
                          isAdmin ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                          <span className={`font-bold ${isAdmin ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {m.senderName || (isAdmin ? 'Admin Officer' : 'Client')}
                          </span>
                          <span className="text-slate-500">{m.timestamp}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official admin response to mobile client..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Dispatch</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 my-auto">
                Select an inquiry from the queue to start live response.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
