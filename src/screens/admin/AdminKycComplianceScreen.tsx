import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { KycIdType, KycStatus, KycSubmissionDocument } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Copy,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  FileText,
  User,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Loader2,
  ZoomIn
} from 'lucide-react';

const REJECTION_PRESETS = [
  'Document scan is blurry, dark, or unreadable. Please provide a clear, high-resolution photo.',
  'Legal name on identification does not match account registration records.',
  'Government document has expired or is not an accepted identification type.',
  'Incomplete submission: reverse side scan required for Driver\'s License / Voter\'s Card.',
  'Document borders are cropped or covered. Please upload the entire document page.'
];

export const AdminKycComplianceScreen: React.FC = () => {
  const { showToast } = useApp();
  const [submissions, setSubmissions] = useState<KycSubmissionDocument[]>(() => db.getKycSubmissions());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inspection & Lightbox Modal
  const [inspectingSubmission, setInspectingSubmission] = useState<KycSubmissionDocument | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Reject Modal State
  const [rejectingSubmission, setRejectingSubmission] = useState<KycSubmissionDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await db.fetchKycSubmissions(statusFilter);
      if (res.success && res.submissions) {
        setSubmissions(res.submissions);
      } else {
        setSubmissions(db.getKycSubmissions());
      }
    } catch {
      setSubmissions(db.getKycSubmissions());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    const unsub = db.subscribe(() => {
      setSubmissions(db.getKycSubmissions());
    });
    return () => unsub();
  }, [statusFilter]);

  // Real-time Counts
  const allSubmissions = db.getKycSubmissions();
  const counts = useMemo(() => ({
    all: allSubmissions.length,
    pending: allSubmissions.filter(s => s.status === 'pending').length,
    verified: allSubmissions.filter(s => s.status === 'verified').length,
    rejected: allSubmissions.filter(s => s.status === 'rejected').length
  }), [allSubmissions]);

  // Filtered List
  const filteredSubmissions = useMemo(() => {
    let list = submissions;
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s => 
        s.fullLegalName?.toLowerCase().includes(q) ||
        s.userId?.toLowerCase().includes(q) ||
        s.idNumber?.toLowerCase().includes(q) ||
        s.userEmail?.toLowerCase().includes(q) ||
        s.companyName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [submissions, statusFilter, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied to clipboard: ${text}`, 'info');
  };

  const handleApprove = async (sub: KycSubmissionDocument) => {
    if (!window.confirm(`Approve KYC verification for ${sub.fullLegalName}? This will unlock withdrawal capabilities and activate the verified badge.`)) {
      return;
    }

    setIsProcessingAction(true);
    try {
      const res = await db.reviewKyc({
        submissionId: sub.id,
        userId: sub.userId,
        action: 'approve',
        adminName: 'Compliance Desk Officer'
      });

      if (res.success) {
        showToast(`KYC Approved for ${sub.fullLegalName}! Full privileges unlocked.`, 'success');
        if (inspectingSubmission?.id === sub.id) {
          setInspectingSubmission({ ...sub, status: 'verified' });
        }
        await loadSubmissions();
      } else {
        showToast(res.error || 'Failed to approve KYC', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Approval error', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSubmission) return;
    if (!rejectionReason.trim()) {
      showToast('A specific rejection reason is mandatory', 'error');
      return;
    }

    setIsProcessingAction(true);
    try {
      const res = await db.reviewKyc({
        submissionId: rejectingSubmission.id,
        userId: rejectingSubmission.userId,
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
        adminName: 'Compliance Desk Officer'
      });

      if (res.success) {
        showToast(`KYC Disapproved for ${rejectingSubmission.fullLegalName}. Reason dispatched to user.`, 'info');
        setRejectingSubmission(null);
        if (inspectingSubmission?.id === rejectingSubmission.id) {
          setInspectingSubmission({ ...rejectingSubmission, status: 'rejected', rejectionReason });
        }
        await loadSubmissions();
      } else {
        showToast(res.error || 'Failed to reject KYC', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Rejection error', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getIdTypeBadge = (type: KycIdType) => {
    switch (type) {
      case 'NIN':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">NIN (National ID)</span>;
      case 'Drivers_License':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">Driver's License</span>;
      case 'International_Passport':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">Passport</span>;
      case 'Voters_Card':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">Voter's Card</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">{type}</span>;
    }
  };

  return (
    <AdminLayout activeTab="kyc-compliance">
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">

        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Enterprise KYC & Identity Compliance Vault
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative Nigerian Identity Verification (NIN, Driver's License, International Passport, Voter's Card) & Withdrawal Gating Management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSubmissions}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Vault</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Submissions */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-5 rounded-3xl bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'all' ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Submissions</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-2 font-mono">{counts.all}</p>
            <p className="text-[11px] text-slate-500 mt-1">All recorded files</p>
          </div>

          {/* Pending Review */}
          <div 
            onClick={() => setStatusFilter('pending')}
            className={`p-5 rounded-3xl bg-slate-900 border transition-all cursor-pointer relative overflow-hidden ${
              statusFilter === 'pending' ? 'border-amber-500/60 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {counts.pending > 0 && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-300 mt-2 font-mono">{counts.pending}</p>
            <p className="text-[11px] text-amber-400/80 mt-1">Awaiting compliance sign-off</p>
          </div>

          {/* Approved & Verified */}
          <div 
            onClick={() => setStatusFilter('verified')}
            className={`p-5 rounded-3xl bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'verified' ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Verified & Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-300 mt-2 font-mono">{counts.verified}</p>
            <p className="text-[11px] text-emerald-400/80 mt-1">Tier 3 active accounts</p>
          </div>

          {/* Disapproved / Rejected */}
          <div 
            onClick={() => setStatusFilter('rejected')}
            className={`p-5 rounded-3xl bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'rejected' ? 'border-rose-500/60 shadow-lg shadow-rose-500/5' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Disapproved / Action Req.</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-extrabold text-rose-300 mt-2 font-mono">{counts.rejected}</p>
            <p className="text-[11px] text-rose-400/80 mt-1">Gated for corrections</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer shrink-0 ${
                  statusFilter === tab
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? `All (${counts.all})` :
                 tab === 'pending' ? `Pending (${counts.pending})` :
                 tab === 'verified' ? `Verified (${counts.verified})` : `Rejected (${counts.rejected})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID number, user..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Submissions Table / Cards */}
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No KYC submissions found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? `No records match "${searchQuery}". Try clearing your search filter.` : `No identity submissions currently match the "${statusFilter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Applicant & User ID</th>
                    <th className="py-3.5 px-4">Government ID Details</th>
                    <th className="py-3.5 px-4">Document Scans</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-4">Status & Gating</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredSubmissions.map((sub) => {
                    const isCopied = copiedId === sub.id;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors group">
                        
                        {/* Applicant & User ID */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                              {sub.fullLegalName ? sub.fullLegalName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{sub.fullLegalName}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span className="font-mono text-emerald-400">{sub.userId}</span>
                                {sub.companyName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[140px]">{sub.companyName}</span>
                                  </>
                                )}
                              </div>
                              {sub.userEmail && (
                                <p className="text-[10px] text-slate-500 truncate">{sub.userEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Government ID Details */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div>{getIdTypeBadge(sub.idType)}</div>
                            <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                              <span>{sub.idNumber}</span>
                              <button
                                onClick={() => handleCopy(sub.idNumber, sub.id)}
                                className="text-slate-500 hover:text-emerald-400 p-0.5"
                                title="Copy ID Number"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Document Scans */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {/* Front Scan */}
                            {sub.documentFrontUrl ? (
                              <div 
                                onClick={() => setActivePreviewImage({ url: sub.documentFrontUrl, title: `${sub.fullLegalName} - Front Scan` })}
                                className="relative group/thumb cursor-pointer"
                                title="Click to view full resolution"
                              >
                                <img
                                  src={sub.documentFrontUrl}
                                  alt="Front ID"
                                  className="w-12 h-9 rounded-lg object-cover border border-slate-700 group-hover/thumb:border-emerald-500 transition-colors"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[9px] text-slate-400 block text-center mt-0.5">Front</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No front scan</span>
                            )}

                            {/* Back Scan */}
                            {sub.documentBackUrl ? (
                              <div 
                                onClick={() => setActivePreviewImage({ url: sub.documentBackUrl!, title: `${sub.fullLegalName} - Reverse Scan` })}
                                className="relative group/thumb cursor-pointer"
                                title="Click to view full resolution"
                              >
                                <img
                                  src={sub.documentBackUrl}
                                  alt="Back ID"
                                  className="w-12 h-9 rounded-lg object-cover border border-slate-700 group-hover/thumb:border-emerald-500 transition-colors"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[9px] text-slate-400 block text-center mt-0.5">Back</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-600 block self-center">Single-side</span>
                            )}
                          </div>
                        </td>

                        {/* Submission Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="text-white font-medium">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        {/* Status & Gating */}
                        <td className="py-4 px-4">
                          {sub.status === 'verified' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                              <p className="text-[10px] text-slate-500">
                                Unlocked {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                          ) : sub.status === 'rejected' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                                <XCircle className="w-3.5 h-3.5" /> Disapproved
                              </span>
                              {sub.rejectionReason && (
                                <p className="text-[10px] text-rose-400/80 truncate max-w-[160px]" title={sub.rejectionReason}>
                                  {sub.rejectionReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Review
                              </span>
                              <p className="text-[10px] text-amber-400/70 font-medium">
                                Withdrawals Gated
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect Drawer / Modal */}
                            <button
                              onClick={() => setInspectingSubmission(sub)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>

                            {/* Direct Approve */}
                            {sub.status !== 'verified' && (
                              <button
                                onClick={() => handleApprove(sub)}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Direct Reject */}
                            {sub.status !== 'rejected' && (
                              <button
                                onClick={() => {
                                  setRejectingSubmission(sub);
                                  setRejectionReason(REJECTION_PRESETS[0]);
                                }}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 1. FULL INSPECTION MODAL */}
      {/* ======================================================== */}
      {inspectingSubmission && (
        <div 
          onClick={() => setInspectingSubmission(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Compliance Dossier Inspection</h3>
                  <p className="text-xs text-slate-400">Record ID: {inspectingSubmission.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingSubmission(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Applicant Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Full Legal Name:</span>
                <span className="text-white font-bold text-sm">{inspectingSubmission.fullLegalName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">System User ID:</span>
                <span className="text-emerald-400 font-mono font-semibold">{inspectingSubmission.userId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Government ID Type:</span>
                <span className="text-white font-medium">{inspectingSubmission.idTypeLabel || inspectingSubmission.idType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Official ID Number:</span>
                <span className="text-white font-mono font-bold tracking-wider">{inspectingSubmission.idNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Registered Email:</span>
                <span className="text-slate-300">{inspectingSubmission.userEmail || 'babatunde@aladeholding.ng'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Registered Phone:</span>
                <span className="text-slate-300">{inspectingSubmission.userPhone || '+234 803 555 9201'}</span>
              </div>
            </div>

            {/* Document Scans Viewer */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Attached Government Scans
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front Scan */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-400">Front Scan</span>
                  {inspectingSubmission.documentFrontUrl ? (
                    <div 
                      onClick={() => setActivePreviewImage({ url: inspectingSubmission.documentFrontUrl, title: `${inspectingSubmission.fullLegalName} - Front Scan` })}
                      className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 hover:border-emerald-500/50"
                    >
                      <img
                        src={inspectingSubmission.documentFrontUrl}
                        alt="Front ID Scan"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                        <ZoomIn className="w-4 h-4" /> Click to Expand
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-10">No front image provided</p>
                  )}
                </div>

                {/* Back Scan */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-400">Reverse Scan</span>
                  {inspectingSubmission.documentBackUrl ? (
                    <div 
                      onClick={() => setActivePreviewImage({ url: inspectingSubmission.documentBackUrl!, title: `${inspectingSubmission.fullLegalName} - Reverse Scan` })}
                      className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 hover:border-emerald-500/50"
                    >
                      <img
                        src={inspectingSubmission.documentBackUrl}
                        alt="Back ID Scan"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                        <ZoomIn className="w-4 h-4" /> Click to Expand
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-10">No reverse image provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Status Banner */}
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
              inspectingSubmission.status === 'verified'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : inspectingSubmission.status === 'rejected'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider">Status: {inspectingSubmission.status}</span>
                <span>Submitted: {new Date(inspectingSubmission.submittedAt).toLocaleString()}</span>
              </div>
              {inspectingSubmission.rejectionReason && (
                <p className="text-slate-200 mt-1">Rejection Reason: {inspectingSubmission.rejectionReason}</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingSubmission(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>

              {inspectingSubmission.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectingSubmission(inspectingSubmission);
                    setRejectionReason(REJECTION_PRESETS[0]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                >
                  Disapprove KYC
                </button>
              )}

              {inspectingSubmission.status !== 'verified' && (
                <button
                  type="button"
                  onClick={() => handleApprove(inspectingSubmission)}
                  disabled={isProcessingAction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Verification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REJECT KYC REASON MODAL */}
      {/* ======================================================== */}
      {rejectingSubmission && (
        <div 
          onClick={() => setRejectingSubmission(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Disapprove KYC Verification</h3>
                <p className="text-xs text-slate-400">Applicant: {rejectingSubmission.fullLegalName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Please specify the compliance reason for rejecting this document. This feedback will be displayed directly to the customer on their profile so they can make corrections.
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Select Quick Preset:</label>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors border ${
                      rejectionReason === preset
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Custom Feedback Note:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                placeholder="Enter specific instructions..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingSubmission(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingAction || !rejectionReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isProcessingAction ? 'Disapproving...' : 'Confirm Disapproval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. LIGHTBOX FULL RESOLUTION IMAGE VIEWER */}
      {/* ======================================================== */}
      {activePreviewImage && (
        <div 
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{activePreviewImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={activePreviewImage.url}
                  download="KYC_Document_Full.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button 
                  onClick={() => setActivePreviewImage(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[75vh] overflow-auto">
              <img
                src={activePreviewImage.url}
                alt="Document Scan Full Resolution"
                className="max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminKycComplianceScreen;
