import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  CacRegistrationDocument,
  CacPricingConfig,
  CacApplicationStatus
} from '../../types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Building2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  ExternalLink,
  MessageSquare,
  Send,
  Upload,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Eye,
  FileText,
  User,
  X,
  Sparkles,
  Award
} from 'lucide-react';

export const AdminCacServicesScreen: React.FC = () => {
  const { adminUser, showToast } = useApp();

  // Pricing State
  const [pricing, setPricing] = useState<CacPricingConfig>(() => db.getCacPricing());
  const [editBnFee, setEditBnFee] = useState<number>(35000);
  const [editCompanyFee, setEditCompanyFee] = useState<number>(75000);
  const [isUpdatingPricing, setIsUpdatingPricing] = useState(false);

  // Applications
  const [applications, setApplications] = useState<CacRegistrationDocument[]>(() =>
    db.getCacApplications()
  );
  const [selectedApp, setSelectedApp] = useState<CacRegistrationDocument | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CacApplicationStatus>('all');

  // Inspection Drawer / Processing State
  const [rcNumberInput, setRcNumberInput] = useState('');
  const [certUrlInput, setCertUrlInput] = useState(
    'https://supabase.flyemass.com/storage/v1/object/public/cac_documents/sample-cac-certificate.pdf'
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Compliance Chat Thread Input
  const [adminChatMessage, setAdminChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Load and Subscribe
  useEffect(() => {
    db.fetchCacPricing().then(p => {
      setPricing(p);
      setEditBnFee(p.business_name_ngn);
      setEditCompanyFee(p.company_registration_ngn);
    });
    db.fetchCacApplications().then(apps => setApplications(apps));

    const unsub = db.subscribe(() => {
      const p = db.getCacPricing();
      setPricing(p);
      setApplications(db.getCacApplications());
      if (selectedApp) {
        const updated = db.getCacApplicationById(selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    });
    return unsub;
  }, [selectedApp?.id]);

  // Sync inputs when selecting an app
  useEffect(() => {
    if (selectedApp) {
      setRcNumberInput(selectedApp.rcNumber || (selectedApp.serviceType === 'company_registration' ? `RC-${Math.floor(1000000 + Math.random() * 9000000)}` : `BN-${Math.floor(100000 + Math.random() * 900000)}`));
      setCertUrlInput(selectedApp.certificatePdfUrl || `https://supabase.flyemass.com/storage/v1/object/public/cac_documents/cac-cert-${selectedApp.reference.toLowerCase()}.pdf`);
      setAdminNotes(selectedApp.adminNotes || '');
    }
  }, [selectedApp]);

  // Save Dynamic Pricing
  const handleSavePricing = async () => {
    setIsUpdatingPricing(true);
    try {
      const res = await db.updateCacPricing(
        {
          business_name_ngn: Number(editBnFee),
          company_registration_ngn: Number(editCompanyFee)
        },
        adminUser?.name || 'Super Admin'
      );
      if (res.success) {
        showToast('CAC dynamic statutory pricing updated and published to mobile storefront!', 'success');
      } else {
        showToast(res.error || 'Failed to update pricing', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Pricing update failed', 'error');
    } finally {
      setIsUpdatingPricing(false);
    }
  };

  // Complete & Dispatch Certificate
  const handleCompleteApplication = async () => {
    if (!selectedApp) return;
    if (!rcNumberInput.trim()) {
      showToast('Official Registration / RC Number is required', 'error');
      return;
    }
    if (!certUrlInput.trim()) {
      showToast('CAC Certificate PDF URL is required', 'error');
      return;
    }

    setIsCompleting(true);
    try {
      const res = await db.completeCacRegistration({
        applicationId: selectedApp.id,
        rcNumber: rcNumberInput.trim(),
        certificatePdfUrl: certUrlInput.trim(),
        adminId: adminUser?.name || 'CAC Corporate Registry Desk',
        adminNotes: adminNotes.trim()
      });

      if (res.success && res.application) {
        setSelectedApp(res.application);
        showToast(
          `CAC Registration for "${res.application.primaryName}" completed! Profile tagged with RC ${rcNumberInput.trim()}`,
          'success'
        );
      } else {
        showToast(res.error || 'Failed to complete registration', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Completion failed', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Send Compliance Message (Admin inquiry)
  const handleSendAdminMessage = async () => {
    if (!selectedApp || !adminChatMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const res = await db.sendCacThreadMessage({
        applicationId: selectedApp.id,
        sender: 'admin',
        senderName: adminUser?.name || 'CAC Compliance Officer',
        message: adminChatMessage.trim()
      });

      if (res.success && res.application) {
        setSelectedApp(res.application);
        setAdminChatMessage('');
        showToast('Compliance inquiry dispatched to customer. Status set to Action Required.', 'success');
      } else {
        showToast(res.error || 'Failed to send message', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post message', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Status Change
  const handleStatusChange = async (status: CacApplicationStatus) => {
    if (!selectedApp) return;
    try {
      const res = await db.updateCacStatus({
        applicationId: selectedApp.id,
        status,
        adminId: adminUser?.name || 'Super Admin',
        notes: adminNotes
      });
      if (res.success && res.application) {
        setSelectedApp(res.application);
        showToast(`Status updated to ${status.replace('_', ' ')}`, 'success');
      } else {
        showToast(res.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const actionReq = applications.filter(a => a.status === 'action_required').length;
    const inReview = applications.filter(a => a.status === 'in_review').length;
    const completed = applications.filter(a => a.status === 'completed').length;
    return { total, pending, actionReq, inReview, completed };
  }, [applications]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        app.primaryName.toLowerCase().includes(q) ||
        app.reference.toLowerCase().includes(q) ||
        app.userName.toLowerCase().includes(q) ||
        (app.rcNumber && app.rcNumber.toLowerCase().includes(q)) ||
        app.category.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  return (
    <AdminLayout activeTab="services-cac">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Corporate Affairs Commission (CAC) Registration Console
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Statutory Business Name & Incorporated Company (LTD) filings, dynamic CAMA fee management & certificate delivery
            </p>
          </div>

          <button
            onClick={() => {
              db.fetchCacApplications();
              db.fetchCacPricing();
              showToast('Refreshed CAC application desk', 'success');
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2 self-start active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Sync Registry
          </button>
        </div>

        {/* Dynamic Pricing Management Card */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Dynamic Statutory Pricing Control (NGN)</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Last updated: {new Date(pricing.lastUpdated || Date.now()).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business Name Registration Fee (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₦
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={editBnFee}
                  onChange={e => setEditBnFee(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Incorporated Company Registration Fee (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₦
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editCompanyFee}
                  onChange={e => setEditCompanyFee(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={isUpdatingPricing}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isUpdatingPricing ? 'Publishing...' : 'Publish Dynamic Fees to Storefront'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Filings</span>
            <div className="text-xl font-bold text-white mt-1 num-tabular">{metrics.total}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-amber-400 uppercase">Pending Intake</span>
            <div className="text-xl font-bold text-amber-400 mt-1 num-tabular">{metrics.pending}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase">Under Review</span>
            <div className="text-xl font-bold text-indigo-400 mt-1 num-tabular">{metrics.inReview}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 uppercase">Action Required</span>
            <div className="text-xl font-bold text-rose-400 mt-1 num-tabular">{metrics.actionReq}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase">Incorporated / Done</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 num-tabular">{metrics.completed}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'pending', 'in_review', 'action_required', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab === 'all' ? 'All Applications' : tab.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search proposed name, RC, or applicant..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Applications Master Table */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Entity & Reference</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Industry Category</th>
                  <th className="py-3.5 px-4">Fee Settled</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No CAC registration filings match this filter
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{app.primaryName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{app.reference}</div>
                        {app.rcNumber && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                            RC: {app.rcNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                          {app.serviceType === 'company_registration' ? 'Incorporated Company' : 'Business Name'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{app.userName}</div>
                        <div className="text-slate-400 text-[11px]">{app.userPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{app.category}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        ₦{app.serviceFeeNGN?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            app.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : app.status === 'action_required'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                              : app.status === 'in_review'
                              ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {app.status === 'action_required' ? 'Action Req' : app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspection & Processing Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Top Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  CAC REGISTRATION FILING INSPECTOR
                </span>
                <h2 className="text-base font-bold text-white truncate max-w-md">
                  {selectedApp.primaryName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current CAC Status</span>
                  <span
                    className={`font-bold uppercase text-sm ${
                      selectedApp.status === 'completed'
                        ? 'text-emerald-400'
                        : selectedApp.status === 'action_required'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['pending', 'in_review', 'action_required', 'completed'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        selectedApp.status === st
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st === 'action_required' ? 'Action' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Identity Specs */}
              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Business & Filing Details
                </h3>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Proposed Name</span>
                    <span className="text-white font-semibold">{selectedApp.primaryName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Alternative Name</span>
                    <span className="text-slate-300">{selectedApp.alternativeName || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Entity Type</span>
                    <span className="text-emerald-400 font-semibold">
                      {selectedApp.serviceType === 'company_registration' ? 'Incorporated Company (LTD)' : 'Business Name'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CAC Category</span>
                    <span className="text-slate-300">{selectedApp.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Commencement Date</span>
                    <span className="text-slate-300 font-mono">{selectedApp.commencementDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Statutory Fee Settled</span>
                    <span className="text-emerald-400 font-mono font-bold">₦{selectedApp.serviceFeeNGN?.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-900">
                    <span className="text-slate-400 block text-[11px]">Business Operating Address</span>
                    <span className="text-slate-200">{selectedApp.businessAddress}</span>
                  </div>
                  {selectedApp.businessDescription && (
                    <div className="col-span-2 pt-2 border-t border-slate-900">
                      <span className="text-slate-400 block text-[11px]">Operations & Goods Description</span>
                      <span className="text-slate-300">{selectedApp.businessDescription}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Partners / Directors Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Partners & Directors ({selectedApp.partners?.length || 1})
                </h3>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  {(selectedApp.partners || []).map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{p.fullName}</div>
                        <div className="text-[11px] text-slate-400">{p.email} • {p.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {p.role}
                        </span>
                        {p.sharesPercent !== undefined && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {p.sharesPercent}% shares
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Documents Inspection Gallery */}
              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Uploaded Statutory Documents
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Passport Photo */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-semibold block">Passport Photograph</span>
                    <a
                      href={selectedApp.passportPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 h-28"
                    >
                      <img
                        src={selectedApp.passportPhotoUrl}
                        alt="Passport"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                    </a>
                  </div>

                  {/* ID Card */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Government ID</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {selectedApp.idCardType || 'NIN'}
                      </span>
                    </div>
                    <a
                      href={selectedApp.idCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 h-28"
                    >
                      <img
                        src={selectedApp.idCardUrl}
                        alt="ID Card"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                    </a>
                  </div>

                  {/* Personal Signature */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-semibold block">Personal Signature</span>
                    <a
                      href={selectedApp.signatureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 h-28"
                    >
                      <img
                        src={selectedApp.signatureUrl}
                        alt="Signature"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                    </a>
                  </div>

                  {/* Reference Signature */}
                  {selectedApp.serviceType === 'company_registration' && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-semibold">Reference Signature</span>
                        <span className="text-[10px] text-amber-500 font-bold">LTD Required</span>
                      </div>
                      {selectedApp.referenceSignatureUrl ? (
                        <a
                          href={selectedApp.referenceSignatureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 h-28"
                        >
                          <img
                            src={selectedApp.referenceSignatureUrl}
                            alt="Reference Signature"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </a>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-rose-500/30 flex items-center justify-center text-rose-400">
                          Missing Reference Signature
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Way Compliance Communication Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Two-Way Compliance Thread (Customer Communication)
                  </h3>
                  <span className="text-[10px] text-slate-500">Notifies customer instantly</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {(selectedApp.thread || []).length === 0 ? (
                    <p className="text-slate-500 text-center py-3">No compliance messages exchanged yet.</p>
                  ) : (
                    selectedApp.thread.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl ${
                          msg.sender === 'admin'
                            ? 'bg-slate-900 border border-slate-800 text-slate-200 ml-4 mr-0'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 ml-0 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="font-bold text-white">{msg.senderName}</span>
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={adminChatMessage}
                    onChange={e => setAdminChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendAdminMessage()}
                    placeholder="Request clearer documents, specify corrections, or ask for clarifications..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendAdminMessage}
                    disabled={isSendingMessage || !adminChatMessage.trim()}
                    className="py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Request Action
                  </button>
                </div>
              </div>

              {/* Completion & Certificate Dispatch Section */}
              <div className="p-4 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    Official Incorporation & Certificate Dispatch
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Official Registration / RC Number *
                    </label>
                    <input
                      type="text"
                      value={rcNumberInput}
                      onChange={e => setRcNumberInput(e.target.value)}
                      placeholder="e.g. BN-392810 or RC-1849204"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Official CAC Certificate PDF URL *
                    </label>
                    <input
                      type="text"
                      value={certUrlInput}
                      onChange={e => setCertUrlInput(e.target.value)}
                      placeholder="https://supabase.flyemass.com/storage/v1/object/public/cac_documents/cert.pdf"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Registry Dispatch Notes
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="Official certification notes recorded in user audit ledger..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleCompleteApplication}
                    disabled={isCompleting || !rcNumberInput.trim() || !certUrlInput.trim()}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isCompleting ? 'Finalizing Incorporation...' : 'Mark as Completed & Dispatch Certificate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminCacServicesScreen;
