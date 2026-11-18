import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
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
  Paperclip,
  ChevronDown,
  Building,
  Home,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCheck,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  User,
  Headphones
} from 'lucide-react';
import { SupportTicket } from '../../types';

interface SupportTicketsScreenProps {
  initialView?: 'list' | 'detail' | 'new';
}

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

  if (!propertyTitle && fields.length === 0) return null;

  return {
    headerTag: headerTag || 'Official Trade Inquiry',
    propertyTitle,
    fields,
    customerNotes,
    notice
  };
}

const StructuredMessageCard: React.FC<{ data: StructuredInquiryData; isUser: boolean; timestamp: string }> = ({ data, isUser, timestamp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    const textToCopy = `${data.headerTag}\n${data.propertyTitle ? `Property: ${data.propertyTitle}\n` : ''}${data.fields.map(f => `${f.label}: ${f.value}`).join('\n')}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full max-w-md ${isUser ? 'ml-auto' : 'mr-auto'} space-y-1.5`}>
      <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-emerald-400" />
          <span>Structured Inquiry Card</span>
        </span>
        <span>{timestamp}</span>
      </div>

      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-3 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Tag Ribbon */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{data.headerTag || 'OFFICIAL INQUIRY'}</span>
          </span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors p-1 cursor-pointer"
            title="Copy details"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Title */}
        {data.propertyTitle && (
          <div className="relative z-10">
            <h4 className="text-sm font-black text-white leading-snug">
              {data.propertyTitle}
            </h4>
          </div>
        )}

        {/* Structured Details Grid / Key-Value Rows */}
        <div className="space-y-1.5 relative z-10">
          {data.fields.map((f, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs ${
                f.isHighlight 
                  ? 'bg-slate-950 border border-emerald-500/30 shadow-inner' 
                  : 'bg-slate-950/60 border border-slate-800/80'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                {f.label}
              </span>
              <span className={`text-right font-medium truncate ${
                f.isHighlight 
                  ? 'text-emerald-400 font-mono font-black' 
                  : 'text-slate-100 font-bold'
              }`}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        {/* Customer Notes */}
        {data.customerNotes && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border-l-2 border-emerald-500 text-xs space-y-1 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Notes</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">{data.customerNotes}</p>
          </div>
        )}

        {/* Notice */}
        {data.notice && (
          <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800/80 relative z-10">
            {data.notice}
          </p>
        )}
      </div>
    </div>
  );
};

export const SupportTicketsScreen: React.FC<SupportTicketsScreenProps> = ({ initialView = 'list' }) => {
  const { 
    supportTickets, 
    addSupportTicket, 
    addTicketMessage, 
    selectedTicketId, 
    setSelectedTicketId, 
    routeParam, 
    navigate, 
    showToast,
    userProfile,
    activeUserId
  } = useApp();

  const [view, setView] = useState<'list' | 'detail' | 'new'>(initialView);
  const [replyText, setReplyText] = useState('');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    url: string;
    fileName: string;
    fileType: string;
    isUploading?: boolean;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Air Freight Waybill');
  const [priority, setPriority] = useState<SupportTicket['priority']>('High');
  const [message, setMessage] = useState('');

  const activeTicketId = routeParam || selectedTicketId || supportTickets[0]?.id;
  const currentTicket = supportTickets.find((t) => t.id === activeTicketId) || supportTickets[0];

  useEffect(() => {
    if (view === 'detail') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view, currentTicket?.messages?.length, pendingAttachment]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds 15MB limit', 'error');
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPendingAttachment({
      file,
      url: localPreviewUrl,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      isUploading: true
    });
    setIsUploadingFile(true);

    try {
      const uploadRes = await db.uploadChatAttachment(file, currentTicket?.id || 'tkt_default', activeUserId || 'usr_alade_01');
      if (uploadRes && uploadRes.url) {
        setPendingAttachment({
          file,
          url: uploadRes.url,
          fileName: uploadRes.fileName || file.name,
          fileType: uploadRes.fileType || file.type,
          isUploading: false
        });
        showToast('Document attached ready to send', 'success');
      } else {
        setPendingAttachment(prev => prev ? { ...prev, isUploading: false } : null);
      }
    } catch {
      setPendingAttachment(prev => prev ? { ...prev, isUploading: false } : null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !pendingAttachment) || !currentTicket) return;

    const text = replyText.trim();
    const attachment = pendingAttachment ? {
      url: pendingAttachment.url,
      fileName: pendingAttachment.fileName,
      fileType: pendingAttachment.fileType
    } : undefined;

    setReplyText('');
    setPendingAttachment(null);
    addTicketMessage(currentTicket.id, text, attachment);
    showToast('Reply dispatched to Trade Concierge & clearing agent', 'info');

    // Trigger AI response and real-time categorization
    try {
      await db.sendConciergeChat(text || `Attached file: ${attachment?.fileName}`, currentTicket.id);
    } catch {
      // Handled via local fallback
    }
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
      case 'Resolved':
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Pending Human Review':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Human In-Progress':
      case 'In Progress':
      case 'in_progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Open - AI Handled':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  // Detail View (Redesigned Professional Support Desk Chat Interface)
  if (view === 'detail' && currentTicket) {
    return (
      <div className="h-full flex flex-col justify-between bg-slate-950 text-white relative">
        <Header title={`Ticket ${currentTicket.ticketNumber}`} />

        {/* Streamlined Fixed Ticket Header Card */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 shadow-md space-y-2.5">
          {/* Top Line: Navigation, Ticket Code & Status Badges */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setView('list')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95"
                title="Back to all tickets"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tickets</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono font-black text-xs text-emerald-400 tracking-wide shrink-0">
                  {currentTicket.ticketNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs ${getStatusBadge(currentTicket.status)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{currentTicket.status}</span>
              </span>

              <span className={`hidden sm:inline-flex px-2 py-1 rounded-full border text-[10px] font-bold ${getPriorityBadge(currentTicket.priority)}`}>
                {currentTicket.priority}
              </span>

              <button
                type="button"
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer shrink-0 transition-colors"
                title={isHeaderExpanded ? "Collapse ticket metadata" : "Expand ticket metadata"}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isHeaderExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub Line: Subject Title & Category Badge */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate min-w-0 flex-1">
              {currentTicket.subject}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                {currentTicket.category}
              </span>
              <span className={`sm:hidden px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPriorityBadge(currentTicket.priority)}`}>
                {currentTicket.priority}
              </span>
            </div>
          </div>

          {/* Collapsible Metadata Drawer */}
          {isHeaderExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                <span>Priority: <strong className="text-white">{currentTicket.priority} Priority</strong></span>
                <span>Created: <strong className="text-slate-300 font-mono">{currentTicket.createdAt}</strong></span>
                <span>Last Updated: <strong className="text-slate-300 font-mono">{currentTicket.lastUpdated}</strong></span>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Duty Desk: <strong className="text-white">Guangzhou & Lagos Operations</strong></span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold">15-Min SLA Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Thread - Natural Breathing Room & Balanced Bubble Spacing */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {currentTicket.messages.map((msg, i) => {
            const isUser = msg.sender === 'user';
            const structuredData = parseStructuredMessage(msg.text);

            if (structuredData) {
              return (
                <StructuredMessageCard
                  key={i}
                  data={structuredData}
                  isUser={isUser}
                  timestamp={msg.timestamp}
                />
              );
            }

            const senderLabel = isUser 
              ? (msg.senderName || userProfile.name || 'Chief Babatunde Alade')
              : (msg.senderName || 'Chen Wei (Trade AI)');

            return (
              <div
                key={i}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Label & Timestamp Row aligned with bubble */}
                <div className={`flex items-center gap-1.5 text-[10px] px-1 ${isUser ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isUser 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {isUser ? <User className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                  </div>
                  <span className={`font-bold ${isUser ? 'text-slate-200' : 'text-emerald-400'}`}>
                    {senderLabel}
                  </span>
                  {!isUser && (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[9px] border border-cyan-800/40">
                      Agent
                    </span>
                  )}
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-mono text-[9px]">{msg.timestamp}</span>
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl max-w-[85%] sm:max-w-[78%] text-xs leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-xs shadow-emerald-500/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-black/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-2.5 p-2 rounded-xl flex items-center gap-2 text-[11px] font-bold transition-all ${
                        isUser
                          ? 'bg-slate-950/20 border border-slate-950/30 text-slate-950 hover:bg-slate-950/30'
                          : 'bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1">{msg.attachmentName || 'View Attached Document'}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {/* Scroll Anchor & Bottom Messages Breathing Room */}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Floating/Sticky Chat Input & Action Bar with Navigation Buffer */}
        <div className="px-4 pt-3 pb-6 sm:pb-7 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 sticky bottom-0 z-30 space-y-2.5 mb-1 sm:mb-2">
          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-xs shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                {pendingAttachment.fileType.startsWith('image/') ? (
                  <img src={pendingAttachment.url} alt="preview" className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white font-bold truncate max-w-[200px]">{pendingAttachment.fileName}</p>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                    {pendingAttachment.isUploading ? 'Uploading to secure vault...' : 'Attachment Ready'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Form Row */}
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
              disabled={isUploadingFile}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                pendingAttachment
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Attach image or document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={pendingAttachment ? "Add a note with your attachment..." : "Type your reply to assigned agent..."}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500 min-w-0 transition-colors"
            />

            <button
              type="submit"
              disabled={(!replyText.trim() && !pendingAttachment) || isUploadingFile}
              className="w-10 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/25 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send reply"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // New Ticket Form View (Optimized Spacing & Natural Flow)
  if (view === 'new') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <Header title="Open Trade Ticket" />

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4 pb-12 sm:pb-16 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Back to Tickets</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Priority Escalation Desk</span>
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            {/* Ticket Category Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Ticket Category
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Select Issue Area</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Supplier Trade Payout', 'Customs & Port', 'Air Freight Waybill', 'FX Swap Slippage'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-2xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency Level & SLA Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Urgency Level & SLA
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {priority === 'Urgent' ? '15-Min Response SLA' : priority === 'High' ? '30-Min Response SLA' : '2-Hour Response SLA'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Urgent', 'High', 'Normal'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2.5 rounded-2xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      priority === p
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400 font-extrabold shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject & Detailed Message Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject / Waybill Reference
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Flight ET921 Waybill verification or Tin Can clearance"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the shipment reference, container mark, or transaction code..."
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none transition-colors font-sans"
                  required
                />
              </div>
            </div>

            {/* Submit Action Button — Positioned Harmoniously */}
            <div className="pt-1 space-y-2">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Ticket to Duty Desk</span>
              </button>
              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted submission to Guangzhou & Lagos 24/7 Operations</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default: Ticket List View
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <Header title="Support Tickets" />

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-12 sm:pb-16 max-w-lg mx-auto w-full">
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
            className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Open Ticket"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab switchers to live chat */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md cursor-pointer">
            Logged Tickets ({supportTickets.length})
          </button>
          <button
            onClick={() => navigate('support-chat')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
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
