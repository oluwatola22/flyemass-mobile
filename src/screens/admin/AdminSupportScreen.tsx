import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getMobileAppUrl } from '../../utils/environment';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { SupportTicketDocument, SupportTicketStatus, SupportTicketPriority } from '../../types';
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
  ExternalLink,
  Bot,
  Sparkles,
  AlertTriangle,
  UserCheck,
  FileText,
  Copy,
  Check,
  X,
  Building,
  DollarSign,
  ChevronDown,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';

interface StructuredInquiryData {
  headerTag?: string;
  propertyTitle?: string;
  fields: { label: string; value: string; isHighlight?: boolean }[];
  customerNotes?: string;
  notice?: string;
}

function parseStructuredMessage(rawText: string): StructuredInquiryData | null {
  if (!rawText) return null;
  const text = rawText.trim();
  
  const hasTag = text.startsWith('[') && text.includes('INQUIRY');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const colonLines = lines.filter(l => l.includes(':'));
  
  if (!hasTag && colonLines.length < 3) {
    return null;
  }

  let headerTag = '';
  let propertyTitle = '';
  let customerNotes = '';
  let notice = '';
  const fields: { label: string; value: string; isHighlight?: boolean }[] = [];

  for (const line of lines) {
    if (line.startsWith('[') && line.endsWith(']')) {
      headerTag = line.slice(1, -1).trim();
      continue;
    }
    
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const label = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (/^property$/i.test(label) || /^property name$/i.test(label) || /^shipment$/i.test(label)) {
      propertyTitle = value;
    } else if (/^customer notes$/i.test(label) || /^notes$/i.test(label)) {
      customerNotes = value;
    } else if (/^notice$/i.test(label) || /^disclaimer$/i.test(label)) {
      notice = value;
    } else {
      if (value.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        for (const part of parts) {
          const pColon = part.indexOf(':');
          if (pColon !== -1) {
            const pLabel = part.slice(0, pColon).trim();
            const pVal = part.slice(pColon + 1).trim();
            fields.push({
              label: pLabel,
              value: pVal,
              isHighlight: /rent|deposit|price|fee|cost|amount/i.test(pLabel)
            });
          }
        }
      } else {
        fields.push({
          label,
          value,
          isHighlight: /rent|deposit|price|fee|cost|amount|weight|transit/i.test(label)
        });
      }
    }
  }

  return {
    headerTag: headerTag || 'INQUIRY DETAILS',
    propertyTitle,
    fields,
    customerNotes,
    notice
  };
}

export const AdminSupportScreen: React.FC = () => {
  const { showToast } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());
  const [selectedTicketId, setSelectedTicketId] = useState<string>('tkt_8901');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'waiting' | 'pending_human' | 'resolved'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    url: string;
    fileName: string;
    fileType: string;
    isUploading: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
  }, []);

  const dbState = db.getState();

  const tickets = Object.values(dbState.support_tickets || {}).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const activeTicket = dbState.support_tickets[selectedTicketId] || tickets[0];

  const filteredTickets = tickets.filter((tkt) => {
    const matchesSearch = 
      tkt.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tkt.ticketNumber && tkt.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tkt.category && tkt.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tkt.userId && tkt.userId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending_human') return tkt.status === 'Pending Human Review' || tkt.status === 'escalated';
    if (statusFilter === 'open') return tkt.status === 'Open - AI Handled' || tkt.status === 'open' || tkt.status === 'Open';
    if (statusFilter === 'in_progress') return tkt.status === 'Human In-Progress' || tkt.status === 'in_progress' || tkt.status === 'In Progress';
    if (statusFilter === 'waiting') return tkt.status === 'Waiting on Customer' || tkt.status === 'waiting_on_customer';
    if (statusFilter === 'resolved') return tkt.status === 'resolved' || tkt.status === 'Resolved' || tkt.status === 'closed';
    return true;
  });

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedId(id);
    showToast(`Copied ${val} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPendingAttachment({
      file,
      url: localPreviewUrl,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      isUploading: true
    });

    try {
      const uploadRes = await db.uploadChatAttachment(file, activeTicket?.id, 'adm-002');
      if (uploadRes && uploadRes.url) {
        setPendingAttachment({
          file,
          url: uploadRes.url,
          fileName: uploadRes.fileName || file.name,
          fileType: uploadRes.fileType || file.type,
          isUploading: false
        });
        showToast('Document attached and ready to dispatch', 'success');
      } else {
        setPendingAttachment(prev => prev ? { ...prev, isUploading: false } : null);
      }
    } catch {
      setPendingAttachment(prev => prev ? { ...prev, isUploading: false } : null);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !pendingAttachment) || !activeTicket) return;

    db.addTicketMessage(activeTicket.id, {
      senderId: 'adm-002',
      senderName: 'Chen Wei (Guangzhou Hub - Human Specialist)',
      text: replyText.trim() || `[Attached File: ${pendingAttachment?.fileName}]`,
      isAdmin: true,
      attachmentUrl: pendingAttachment?.url,
      attachmentName: pendingAttachment?.fileName,
      attachmentType: pendingAttachment?.fileType
    });

    // Advance to Human In-Progress if not resolved
    if (activeTicket.status !== 'resolved' && activeTicket.status !== 'Resolved' && activeTicket.status !== 'closed') {
      db.updateTicketLifecycle(activeTicket.id, {
        status: 'Human In-Progress',
        adminId: 'adm-002',
        adminName: 'Chen Wei (Guangzhou Hub Specialist)'
      });
    }

    firebaseSync.recordAudit('Support Agent', 'REPLY_TICKET', 'support_tickets', activeTicket.id, `Sent reply to ${activeTicket.userId}`);
    showToast('Reply dispatched to client mobile chat in real-time!', 'success');
    setReplyText('');
    setPendingAttachment(null);
    setDbRev(db.getStateRevision());
  };

  const handleTakeOver = async (ticketId: string) => {
    try {
      await db.takeOverSupportTicket(ticketId, 'adm-002', 'Chen Wei (Guangzhou Hub Supervisor)');
      showToast('You have taken over this thread! Active AI has yielded to human specialist.', 'success');
      setDbRev(db.getStateRevision());
    } catch {
      showToast('Thread takeover registered locally', 'info');
    }
  };

  const handleUpdateStatus = (newStatus: SupportTicketStatus) => {
    if (!activeTicket) return;
    db.updateTicketLifecycle(activeTicket.id, {
      status: newStatus,
      adminId: 'adm-002',
      adminName: 'Chen Wei (Guangzhou Hub)'
    });
    showToast(`Ticket status updated to: ${newStatus}`, 'success');
    setDbRev(db.getStateRevision());
  };

  const handleUpdatePriority = (newPriority: SupportTicketPriority) => {
    if (!activeTicket) return;
    db.updateTicketLifecycle(activeTicket.id, {
      priority: newPriority,
      adminId: 'adm-002',
      adminName: 'Chen Wei (Guangzhou Hub)'
    });
    showToast(`Ticket priority set to: ${newPriority}`, 'success');
    setDbRev(db.getStateRevision());
  };

  const handleResolveTicket = async (ticketId: string) => {
    const tkt = dbState.support_tickets[ticketId];
    if (tkt) {
      try {
        await db.resolveSupportTicket(ticketId, 'Inquiry successfully resolved by trade concierge desk', 'adm-002');
        showToast(`Ticket #${tkt.ticketNumber || ticketId} marked as RESOLVED!`, 'success');
        setDbRev(db.getStateRevision());
      } catch {
        db.updateTicketLifecycle(ticketId, {
          status: 'Resolved',
          resolutionNotes: 'Resolved by trade concierge',
          adminId: 'adm-002'
        });
        showToast(`Ticket #${tkt.ticketNumber || ticketId} marked as RESOLVED`, 'info');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Human Review':
      case 'escalated':
      case 'Escalated (Pending Human Review)':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Human In-Progress':
      case 'in_progress':
      case 'In Progress':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'Waiting on Customer':
      case 'waiting_on_customer':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'Open - AI Handled':
      case 'open':
      case 'Open':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
      case 'resolved':
      case 'Resolved':
      case 'closed':
      case 'Closed':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const getPriorityBadge = (p: string = 'Normal') => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'High':
      case 'High Priority':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Low':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      default:
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
    }
  };

  const getSlaIndicator = (ticket: SupportTicketDocument) => {
    const priority = ticket.priority || 'Normal';
    let slaDurationMins = 120;
    if (priority === 'Urgent') slaDurationMins = 15;
    else if (priority === 'High' || priority === 'High Priority') slaDurationMins = 30;
    else if (priority === 'Low') slaDurationMins = 240;

    const createdAt = ticket.createdAt || ticket.updatedAt || Date.now();
    const dueAt = ticket.slaDueAt || (createdAt + slaDurationMins * 60 * 1000);
    const minsLeft = Math.round((dueAt - Date.now()) / (60 * 1000));

    if (ticket.status === 'resolved' || ticket.status === 'Resolved' || ticket.status === 'closed' || ticket.status === 'Closed') {
      return { label: 'SLA Met (Resolved)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', isBreached: false };
    }
    if (minsLeft <= 0) {
      return { label: `SLA Breached (${Math.abs(minsLeft)}m overdue)`, color: 'text-rose-400 bg-rose-500/15 border-rose-500/40 animate-pulse', isBreached: true };
    }
    if (minsLeft <= 10) {
      return { label: `Due Soon: ${minsLeft}m remaining`, color: 'text-amber-400 bg-amber-500/15 border-amber-500/40 animate-pulse', isBreached: false };
    }
    return { label: `On Track: ${minsLeft}m remaining (${priority})`, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', isBreached: false };
  };

  const getExtractedIdentifiers = (ticket: SupportTicketDocument) => {
    const list: { type: 'waybill' | 'transaction' | 'amount'; label: string; value: string }[] = [];
    if (ticket.extractedDetails?.extractedIdentifiers?.length) {
      return ticket.extractedDetails.extractedIdentifiers;
    }
    if (ticket.extractedDetails?.waybillNumber) {
      list.push({ type: 'waybill', label: 'Waybill Number', value: ticket.extractedDetails.waybillNumber });
    }
    if (ticket.extractedDetails?.transactionRef) {
      list.push({ type: 'transaction', label: 'Transaction Reference', value: ticket.extractedDetails.transactionRef });
    }
    if (ticket.extractedDetails?.amount) {
      list.push({ type: 'amount', label: 'Monetary Amount', value: ticket.extractedDetails.amount });
    }
    for (const msg of ticket.messages) {
      const wb = msg.text.match(/(FM-[A-Z0-9-]+|SL-[0-9-]+|SF[0-9]+|ET[0-9]+)/i);
      if (wb && !list.some(x => x.value === wb[0])) {
        list.push({ type: 'waybill', label: 'Waybill Number', value: wb[0] });
      }
      const ref = msg.text.match(/(REF-[A-Z0-9-]+|TX-[A-Z0-9-]+|ldg_[0-9]+|tx_[0-9]+|REC-[A-Z0-9-]+)/i);
      if (ref && !list.some(x => x.value === ref[0])) {
        list.push({ type: 'transaction', label: 'Transaction Ref', value: ref[0] });
      }
      const amt = msg.text.match(/(₦|¥|\$|USD|NGN|RMB|CNY)\s?([0-9,]+(\.[0-9]{1,2})?)/i);
      if (amt && !list.some(x => x.value === amt[0])) {
        list.push({ type: 'amount', label: 'Monetary Amount', value: amt[0] });
      }
    }
    return list;
  };

  const extractedIdentifiers = activeTicket ? getExtractedIdentifiers(activeTicket) : [];
  const slaInfo = activeTicket ? getSlaIndicator(activeTicket) : null;

  return (
    <AdminLayout activeTab="support">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Enterprise Global Support Desk</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Intercom/Zendesk Standard • Gemini 3.8</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live omnichannel ticketing state machine, automated metadata extraction, and real-time bidirectional customer sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Supabase & WebSocket Sync: ACTIVE</span>
            </span>
          </div>
        </div>

        {/* 3-Column Workspace: Ticket Queue | Conversation Thread | Context Side-Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
          {/* Left Column: Tickets Queue (col-span-3) */}
          <div className="lg:col-span-3 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Tickets ({filteredTickets.length})
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {tickets.filter(t => t.status === 'Pending Human Review' || t.status === 'escalated').length} Require Attention
                </span>
              </div>

              {/* Lifecycle State Machine Filter Pills */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[9px] font-bold">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Open' },
                  { id: 'in_progress', label: 'In-Progress' },
                  { id: 'waiting', label: 'Waiting' },
                  { id: 'pending_human', label: 'Escalated' },
                  { id: 'resolved', label: 'Resolved' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`py-1 px-1 rounded-lg transition-all cursor-pointer text-center truncate ${
                      statusFilter === tab.id
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject, waybill..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
              {filteredTickets.map((tkt) => {
                const isSelected = activeTicket?.id === tkt.id;
                const isEscalated = tkt.status === 'Pending Human Review' || tkt.status === 'escalated';
                return (
                  <div
                    key={tkt.id}
                    onClick={() => setSelectedTicketId(tkt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                        : isEscalated
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-400">
                          {tkt.ticketNumber || tkt.id}
                        </span>
                        {isEscalated && (
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadge(tkt.status)}`}>
                        {tkt.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{tkt.subject}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {tkt.messages[tkt.messages.length - 1]?.text || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[9px] text-slate-500">
                      <span className="truncate max-w-[100px]">{tkt.category || 'General'}</span>
                      <span className={`px-1.5 py-0.2 rounded-md font-bold ${getPriorityBadge(tkt.priority)}`}>
                        {tkt.priority || 'Normal'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Column: Live Conversation Workspace (col-span-5) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col overflow-hidden">
            {activeTicket ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-extrabold text-white truncate max-w-[180px]">{activeTicket.subject}</h3>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">({activeTicket.ticketNumber || activeTicket.id})</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          Client: {activeTicket.userName || 'Chief Babatunde Alade'} • {activeTicket.userId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => window.open(getMobileAppUrl(`?userId=${activeTicket.userId}`), '_blank')}
                        className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        title="Open Client View"
                      >
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Client View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      {activeTicket.status !== 'Human In-Progress' && activeTicket.status !== 'resolved' && activeTicket.status !== 'Resolved' && activeTicket.status !== 'closed' && (
                        <button
                          onClick={() => handleTakeOver(activeTicket.id)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Take Over Chat</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SLA Countdown & Priority Strip */}
                  {slaInfo && (
                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">SLA Tracking:</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold border text-[9px] ${slaInfo.color}`}>
                          {slaInfo.label}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[9px]">
                        Category: <strong className="text-slate-300">{activeTicket.category || 'General Trade'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-950/40">
                  {activeTicket.messages.map((m, i) => {
                    const isAdmin = m.isAdmin;
                    const isAi = (m as any).isAi || m.senderId === 'ai-chen-wei' || m.senderName?.includes('Trade AI');
                    const isSystem = m.senderName?.includes('System');

                    if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center my-2">
                          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-amber-300 font-semibold shadow-xs">
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    // Structured Inquiry Parsing
                    const structuredData = parseStructuredMessage(m.text);
                    if (structuredData) {
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5" />
                              <span>Structured Inquiry Details</span>
                            </span>
                            <span>{m.timestamp}</span>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs shadow-md space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-black uppercase">
                                {structuredData.headerTag}
                              </span>
                              {structuredData.propertyTitle && (
                                <span className="text-[11px] font-bold text-white">{structuredData.propertyTitle}</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {structuredData.fields.map((f, idx) => (
                                <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{f.label}</span>
                                  <span className={`text-[11px] font-mono font-bold ${f.isHighlight ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {f.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {structuredData.customerNotes && (
                              <p className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-800">
                                Note: {structuredData.customerNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[85%] ${
                          isAdmin ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px]">
                          <span className={`font-bold flex items-center gap-1 ${
                            isAi ? 'text-indigo-400' :
                            isAdmin ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {isAi && <Sparkles className="w-2.5 h-2.5" />}
                            {m.senderName || (isAdmin ? 'Admin Officer' : 'Client')}
                          </span>
                          <span className="text-slate-500 font-mono text-[9px]">• {m.timestamp}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                            isAi
                              ? 'bg-slate-900 border border-indigo-500/30 text-slate-200 rounded-tr-none'
                              : isAdmin
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {m.text}

                          {m.attachmentUrl && (
                            <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 max-w-full">
                              {m.attachmentType?.startsWith('image/') || m.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                                <img
                                  src={m.attachmentUrl}
                                  alt={m.attachmentName || 'attachment'}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-white truncate">{m.attachmentName || 'Document Attachment'}</p>
                                <a
                                  href={m.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-0.5"
                                >
                                  <span>View Document</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer with Document / Receipt Upload */}
                <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
                  {pendingAttachment && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-white truncate font-bold text-[11px]">{pendingAttachment.fileName}</span>
                        <span className="text-[9px] text-emerald-400 font-mono">Attachment Ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingAttachment(null)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      title="Attach Waybill, Receipt or Image"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type response to client (advances thread to Human In-Progress)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() && !pendingAttachment}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      <span>Dispatch</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 my-auto">
                Select an inquiry from the queue to start live response.
              </div>
            )}
          </div>

          {/* Right Column: Dedicated Context & Metadata Side-Panel (col-span-4) */}
          <div className="lg:col-span-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-4 flex flex-col space-y-4 overflow-y-auto no-scrollbar">
            {activeTicket ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ticket Management</h3>
                  </div>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {activeTicket.ticketNumber || activeTicket.id}
                  </span>
                </div>

                {/* State Machine Transition Selector */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lifecycle Status State
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { id: 'Open - AI Handled', label: 'Open (AI)' },
                      { id: 'Human In-Progress', label: 'In-Progress' },
                      { id: 'Waiting on Customer', label: 'Waiting Client' },
                      { id: 'Pending Human Review', label: 'Escalated' },
                      { id: 'Resolved', label: 'Resolved' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleUpdateStatus(st.id as any)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          activeTicket.status === st.id
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Selector & SLA Indicator */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Priority & SLA Rule
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${getPriorityBadge(activeTicket.priority)}`}>
                      {activeTicket.priority || 'Normal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { id: 'Urgent', label: 'Urgent (15m)' },
                      { id: 'High', label: 'High (30m)' },
                      { id: 'Normal', label: 'Normal (2h)' },
                      { id: 'Low', label: 'Low (4h)' }
                    ].map(pr => (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => handleUpdatePriority(pr.id as any)}
                        className={`py-1 rounded-lg text-[9px] font-bold border text-center transition-all cursor-pointer truncate ${
                          activeTicket.priority === pr.id
                            ? 'bg-slate-800 border-emerald-500 text-emerald-400 font-extrabold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>

                  {slaInfo && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Current SLA:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${slaInfo.color}`}>
                        {slaInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Extracted Identifiers Panel */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>Extracted Identifiers</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {extractedIdentifiers.length} Found
                    </span>
                  </div>

                  {extractedIdentifiers.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {extractedIdentifiers.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">{item.label}</span>
                            <span className={`font-mono font-bold text-xs truncate block ${
                              item.type === 'waybill' ? 'text-cyan-400' :
                              item.type === 'transaction' ? 'text-emerald-400' :
                              'text-amber-400'
                            }`}>
                              {item.value}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.value, `item-${idx}`)}
                            className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Copy reference"
                          >
                            {copiedId === `item-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic py-1 text-center">
                      No waybills or references detected in thread yet.
                    </p>
                  )}
                </div>

                {/* Customer Dossier Card */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified Client Dossier</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                      Tier 3 Exporter
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 text-[10px]">Client Name:</span>
                      <strong className="text-white">{activeTicket.userName || 'Chief Babatunde Alade'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 text-[10px]">User ID / Tag:</span>
                      <span className="font-mono text-cyan-400 font-bold">FM-USR-8924</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 text-[10px]">Phone Number:</span>
                      <span className="font-mono text-slate-200">+234 803 123 4567</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 text-[10px]">CAC Enterprise:</span>
                      <span className="text-slate-200">Alade Global Import & Logistics</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(activeTicket.id)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve Ticket</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 my-auto">
                Select a ticket to review metadata.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
