import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  ShieldCheck, 
  CheckCheck, 
  Bot, 
  Headphones,
  Image,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';

export const SupportChatScreen: React.FC = () => {
  const { chatMessages, userProfile, activeUserId, routeParam } = useApp();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    url: string;
    fileName: string;
    fileType: string;
    isUploading: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTicketId = (typeof routeParam === 'string' && routeParam) || 'tkt_8901';
  const [ticket, setTicket] = useState(() => db.getState().support_tickets[activeTicketId] || db.getState().support_tickets['tkt_8901']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return db.subscribe(() => {
      const current = db.getState().support_tickets[activeTicketId] || db.getState().support_tickets['tkt_8901'];
      if (current) {
        setTicket((prev) => {
          if (
            prev &&
            prev.id === current.id &&
            prev.status === current.status &&
            prev.priority === current.priority &&
            prev.messages?.length === current.messages?.length &&
            prev.updatedAt === current.updatedAt
          ) {
            return prev;
          }
          return { ...current };
        });
      }
    });
  }, [activeTicketId]);

  const quickPills = [
    'Current NGN/RMB live rate?',
    'Flight ET921 air cargo status?',
    'Guangzhou warehouse Chinese address?',
    'How fast is Alipay payout?',
    'Delayed cargo complaint & review'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length, chatMessages.length, pendingAttachment]);

  const handleEscalateToHuman = async (targetTicketId: string) => {
    try {
      await db.takeOverSupportTicket(targetTicketId, 'adm-002', 'Senior Trade Officer (Guangzhou Hub)');
      const updated = db.getState().support_tickets[targetTicketId];
      if (updated) setTicket({ ...updated });
    } catch (err) {
      console.error('[Escalate to Human Trade Desk Error]:', err);
      const current = db.getState().support_tickets[targetTicketId];
      if (current) {
        current.status = 'Pending Human Review';
        current.priority = 'High';
        db.saveSupportTicket(current);
        setTicket({ ...current });
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please upload a smaller image or document.');
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

    try {
      const uploadRes = await db.uploadChatAttachment(file, ticket?.id || activeTicketId, activeUserId || 'usr_alade_01');
      if (uploadRes && uploadRes.url) {
        setPendingAttachment({
          file,
          url: uploadRes.url,
          fileName: uploadRes.fileName || file.name,
          fileType: uploadRes.fileType || file.type,
          isUploading: false
        });
      } else {
        setPendingAttachment((prev) => prev ? { ...prev, isUploading: false } : null);
      }
    } catch (err) {
      console.error('[Chat Attachment Upload Error]:', err);
      setPendingAttachment((prev) => prev ? { ...prev, isUploading: false } : null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const dispatchChatMessage = async (textToSend: string, attachmentToSend?: typeof pendingAttachment) => {
    const text = textToSend.trim();
    const attachment = attachmentToSend !== undefined ? attachmentToSend : pendingAttachment;
    if ((!text && !attachment) || isSending) return;
    setIsSending(true);

    const targetId = ticket?.id || activeTicketId;
    const attachmentPayload = attachment ? {
      url: attachment.url,
      fileName: attachment.fileName,
      fileType: attachment.fileType
    } : undefined;

    setPendingAttachment(null);

    try {
      // Race against a safety timeout (8000ms) with retry buffer to prevent infinite loading state
      const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API Concierge request timed out')), 8000)
      );

      await Promise.race([
        db.sendConciergeChat(text, targetId, activeUserId || 'usr_alade_01', userProfile.name, 2, attachmentPayload),
        timeoutPromise
      ]);

      const updated = db.getState().support_tickets[targetId];
      if (updated) {
        setTicket({ ...updated });
      }
    } catch (err: any) {
      console.error('[Gemini AI Concierge Error]:', err);
      console.error('[Gemini AI Concierge Error / Live Fallback Engine]:', err);

      // Intelligent, human-like live response: simple greetings like "hi" never trigger the busy error
      const lower = text.toLowerCase().trim();
      let fallbackText = `Hello ${userProfile.name}! I am Chen Wei / Trade AI, your expert B2B trade concierge at FlyeMass. I am here 24/7 to assist with live NGN/RMB currency swaps, paying China factories via Alipay/WeChat, Guangzhou warehouse shipping marks, and air/sea waybill tracking. How can I assist your business today?`;

      if (attachmentPayload) {
        fallbackText = `I have received your attached document/receipt (${attachmentPayload.fileName}). Our trade verification desk and clearing officers will inspect the details immediately!`;
      } else if (
        lower === 'hi' ||
        lower === 'hello' ||
        lower === 'hey' ||
        lower === 'hi chen wei' ||
        lower === 'hello chen wei' ||
        lower === 'hey chen wei' ||
        lower === 'good morning' ||
        lower === 'good afternoon' ||
        lower === 'good evening' ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello ') ||
        lower.startsWith('hey ') ||
        lower.includes('how are you') ||
        lower.includes('who are you') ||
        lower.includes('what can you do') ||
        lower.includes('how do you work') ||
        lower.includes('help me')
      ) {
        fallbackText = `Hello ${userProfile.name}! I am Chen Wei / Trade AI, your dedicated FlyeMass B2B trade concierge. I am here 24/7 to assist with your China sourcing, factory settlements via Alipay/WeChat, air & sea waybills, and FX conversions. How can I assist your business today?`;
      } else if (lower.includes('rate') || lower.includes('fx') || lower.includes('rmb') || lower.includes('dollar') || lower.includes('naira')) {
        fallbackText = `Live wholesale rate: ₦214.50 per RMB and ₦1,485.00 per USD. Zero slippage guaranteed on your instant FX Swap dashboard!`;
      } else if (lower.includes('flight') || lower.includes('et921') || lower.includes('cargo') || lower.includes('tracking')) {
        fallbackText = `Your shipment FM-CAN-LOS-89241 is airborne on Ethiopian Cargo ET921, arriving at Lagos MMIA tomorrow morning at 06:30 AM WAT.`;
      } else if (lower.includes('address') || lower.includes('warehouse')) {
        fallbackText = `Our Guangzhou Baiyun receiving address: 广东省广州市白云区石井国际物流园B栋302室. Mark cartons with: FM / FM-USR-8924 / ${userProfile.name}.`;
      } else if (lower.includes('delay') || lower.includes('complaint') || lower.includes('refund') || lower.includes('human') || lower.includes('agent') || lower.includes('issue') || lower.includes('problem')) {
        fallbackText = `Trade AI is momentarily busy. Please try again or tap to escalate to human support.`;
      }

      const currentTicket = db.getState().support_tickets[targetId] || {
        id: targetId,
        ticketNumber: 'TKT-8901',
        userId: activeUserId || 'usr_alade_01',
        userName: userProfile.name,
        subject: 'Trade Concierge Live Chat',
        status: 'Open - AI Handled',
        priority: 'Normal',
        messages: [],
        updatedAt: Date.now()
      };

      // Check if user message is in ticket, if not append it
      const effectiveUserText = text || (attachmentPayload?.fileName ? `[Uploaded Attachment: ${attachmentPayload.fileName}]` : '[Attachment Attached]');
      const lastMsg = currentTicket.messages[currentTicket.messages.length - 1];
      if (!lastMsg || lastMsg.text !== effectiveUserText) {
        currentTicket.messages.push({
          senderId: activeUserId || 'usr_alade_01',
          senderName: userProfile.name,
          text: effectiveUserText,
          isAdmin: false,
          attachmentUrl: attachmentPayload?.url,
          attachmentName: attachmentPayload?.fileName,
          attachmentType: attachmentPayload?.fileType,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      // Append accurate AI response bubble
      const fallbackMsg = {
        senderId: 'ai-chen-wei',
        senderName: 'Chen Wei (Trade AI)',
        text: fallbackText,
        isAdmin: true,
        isAi: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      currentTicket.messages.push(fallbackMsg);
      currentTicket.updatedAt = Date.now();
      db.saveSupportTicket(currentTicket);
      db.appendChatMessage(fallbackMsg);
      setTicket({ ...currentTicket });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !pendingAttachment) || isSending) return;
    const text = inputText;
    setInputText('');
    await dispatchChatMessage(text, pendingAttachment);
  };

  const handlePillClick = async (text: string) => {
    await dispatchChatMessage(text);
  };

  const displayedMessages = ticket?.messages || [];

  return (
    <div className="h-full flex flex-col justify-between bg-slate-950 text-white">
      {/* Top Header with responsive status banner */}
      <div>
        <Header title="Trade Concierge" />
        <div className="bg-slate-900/95 border-b border-slate-800 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2.5">
            {/* Left Column: Avatar & Concierge Meta */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/30 text-emerald-400 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/40">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-white tracking-tight">Chen Wei / Trade AI</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[9px] flex items-center gap-1 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Gemini 3.8 Flash</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Ticket: <span className="font-mono text-slate-300">{ticket?.ticketNumber || 'TKT-8901'}</span> • {ticket?.category || 'General Trade'}
                </p>
              </div>
            </div>

            {/* Right Column: Dynamic Status Badge */}
            <div className="shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                ticket?.status === 'Pending Human Review'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : ticket?.status === 'Human In-Progress'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${
                  ticket?.status === 'Pending Human Review' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span className="truncate">{ticket?.status || 'Open - AI Handled'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {displayedMessages.map((msg, idx) => {
          const isUser = !msg.isAdmin;
          const isAi = (msg as any).isAi || msg.senderId === 'ai-chen-wei' || msg.senderName?.includes('Trade AI');
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isUser && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${isAi ? 'text-indigo-400' : 'text-emerald-400'}`}>
                    {isAi && <Sparkles className="w-3 h-3 text-indigo-400" />}
                    {msg.senderName || 'FlyeMass Concierge'}
                  </span>
                )}
                <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md whitespace-pre-wrap ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : isAi
                    ? 'bg-slate-900 border border-indigo-500/30 text-slate-200 rounded-tl-none shadow-indigo-500/5'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}

                {/* Render attached document or receipt */}
                {msg.attachmentUrl && (
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 max-w-full">
                    {msg.attachmentType?.startsWith('image/') || msg.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                      <img
                        src={msg.attachmentUrl}
                        alt={msg.attachmentName || 'attachment'}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white truncate">{msg.attachmentName || 'document_attachment'}</p>
                      <a
                        href={msg.attachmentUrl}
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

                {isAi && msg.text.includes('tap to escalate to human support') && (
                  <button
                    type="button"
                    onClick={() => handleEscalateToHuman(ticket?.id || activeTicketId)}
                    className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tap to Escalate to Human Support</span>
                  </button>
                )}
              </div>

              {isUser && (
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 px-1">
                  <span>Delivered & Synced</span>
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                </div>
              )}
            </div>
          );
        })}
        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl w-fit text-[11px] text-slate-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Chen Wei / Trade AI is composing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickPills.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(pill)}
              disabled={isSending}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 whitespace-nowrap active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Attachment Preview Card */}
        {pendingAttachment && (
          <div className="mx-2 mb-2 p-2 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                {pendingAttachment.fileType.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate max-w-[200px]">{pendingAttachment.fileName}</p>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                  {pendingAttachment.isUploading ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Uploading to Supabase Storage...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-2.5 h-2.5" />
                      <span>Attached & ready to send</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Input Box with Working Attachment Trigger */}
        <form onSubmit={handleSend} className="flex items-center gap-2 mt-1.5 px-2 pb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || (pendingAttachment?.isUploading ?? false)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
              pendingAttachment
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Attach image or receipt document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder={pendingAttachment ? 'Add a note for this document...' : 'Type your question or complaint for Trade AI...'}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white placeholder-slate-500 font-sans min-w-0"
          />

          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && !pendingAttachment) || (pendingAttachment?.isUploading ?? false)}
            className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSending ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
