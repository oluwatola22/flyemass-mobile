import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { AgentRequestDocument, Supplier } from '../../types';
import { VETTED_SUPPLIERS } from '../../data/mockData';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  FileText,
  DollarSign,
  Send,
  Plus,
  Star,
  ShieldAlert,
  X,
  ChevronRight
} from 'lucide-react';

export const AdminAgentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'rfqs' | 'suppliers'>('rfqs');
  const [rfqs, setRfqs] = useState<AgentRequestDocument[]>(db.getAgentRequests());
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(VETTED_SUPPLIERS);
  const [quoteModalRfq, setQuoteModalRfq] = useState<AgentRequestDocument | null>(null);
  const [quoteUSD, setQuoteUSD] = useState('250');
  const [quoteNotes, setQuoteNotes] = useState('Field inspector Chen Wei assigned for physical factory check.');
  
  // Register Supplier Modal State
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('Foshan Nanhai Precision Aluminum Extrusions');
  const [newSupZh, setNewSupZh] = useState('佛山市南海精工铝业实业有限公司');
  const [newSupCity, setNewSupCity] = useState('Foshan');
  const [newSupCategory, setNewSupCategory] = useState('Industrial & Building Materials');
  const [newSupBadge, setNewSupBadge] = useState<Supplier['badge']>('Factory Direct');
  const [newSupMinOrder, setNewSupMinOrder] = useState('¥10,000 (~$1,380)');

  useEffect(() => {
    return db.subscribe(() => setRfqs(db.getAgentRequests()));
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName,
      chineseName: newSupZh,
      category: newSupCategory,
      city: newSupCity,
      badge: newSupBadge,
      rating: 4.9,
      ordersFulfilled: 0,
      minOrderValue: newSupMinOrder,
      verifiedYears: 1,
      mainProducts: ['Custom Hardware', 'Wholesale OEM Parts'],
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      inspectionPassed: true
    };

    try {
      await db.createSupplier(newSup, 'adm-001');
      setSuppliersList(prev => [newSup, ...prev]);
      setShowAddSupplier(false);
      showToast(`Supplier ${newSup.name} registered and published!`, 'success');
    } catch (err: any) {
      setSuppliersList(prev => [newSup, ...prev]);
      setShowAddSupplier(false);
      showToast(`Supplier ${newSup.name} added to directory!`, 'success');
    }
  };

  const handleToggleSupplierInspection = (supId: string) => {
    setSuppliersList(prev => prev.map(s => {
      if (s.id === supId) {
        const next = !s.inspectionPassed;
        showToast(`${s.name} factory inspection set to: ${next ? 'PASSED' : 'PENDING'}`, 'info');
        return { ...s, inspectionPassed: next };
      }
      return s;
    }));
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalRfq) return;
    const numUSD = Number(quoteUSD) || 250;
    const numNGN = Math.round(numUSD * 1485);

    try {
      await db.quoteAgentRequest(quoteModalRfq.id, numUSD, numNGN, quoteNotes, 'Zhang Wei (Bilingual Ground Agent)', 'adm-001');
      showToast(`Formal quote of $${numUSD} USD sent to ${quoteModalRfq.clientName}!`, 'success');
      setQuoteModalRfq(null);
      setRfqs(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to send quote', 'error');
    }
  };

  const handleAdvanceStatus = async (rfq: AgentRequestDocument) => {
    if (rfq.status === 'po_issued' || rfq.status === 'quote_accepted' || rfq.status === 'in_progress') {
      try {
        await db.completeAgentRequest(rfq.id, 'Ground inspection completed successfully. PDF report filed.', 'adm-001');
        setRfqs(db.getAgentRequests());
        showToast(`RFQ #${rfq.id} marked as COMPLETED & escrow disbursed!`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to complete request', 'error');
      }
    } else {
      const doc = db.getDocument('agent_requests', rfq.id);
      if (doc) {
        doc.status = 'quote_ready';
        setRfqs(db.getAgentRequests());
        showToast(`RFQ #${rfq.id} status updated!`, 'info');
      }
    }
  };

  return (
    <AdminLayout activeTab="agents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">China Ground Trade Sourcing & Inspections</h1>
            <p className="text-xs text-slate-400">
              Manage Canton Fair VIP delegations, factory background checks, verified suppliers, and official trade RFQs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab('rfqs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rfqs' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Client RFQs ({rfqs.length})
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Verified Suppliers ({suppliersList.length})
              </button>
            </div>

            {activeTab === 'suppliers' && (
              <button
                onClick={() => setShowAddSupplier(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Register Supplier</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. RFQ Table */}
        {activeTab === 'rfqs' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Client Sourcing Requests & Quotations ({rfqs.length})
              </h3>
            </div>

            <div className="space-y-3">
              {rfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{rfq.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                        {rfq.serviceType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rfq.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        rfq.status === 'quote_ready' ? 'bg-cyan-500/20 text-cyan-300' :
                        rfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{rfq.productName} ({rfq.category})</h4>
                    <p className="text-xs text-slate-400">
                      Client: <strong className="text-white">{rfq.clientName}</strong> • Target Qty: <strong className="font-mono text-slate-200">{rfq.targetQuantity} units</strong> @ ${rfq.targetUnitUSD}/unit
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Target Region: {rfq.supplierCity}</span>
                      {rfq.inspectionRequired && (
                        <span className="ml-2 text-emerald-400 font-semibold">• Factory Audit Required</span>
                      )}
                    </p>
                    {rfq.quoteAmountUSD && (
                      <p className="text-xs font-bold text-emerald-400 font-mono pt-1">
                        Authoritative Quote Issued: ${rfq.quoteAmountUSD.toLocaleString()} USD (₦{(rfq.quoteAmountNGN || rfq.quoteAmountUSD * 1485).toLocaleString()} NGN)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setQuoteModalRfq(rfq);
                        setQuoteUSD(String(rfq.quoteAmountUSD || 250));
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rfq.quoteAmountUSD ? 'Edit Quote' : 'Formulate Quote'}</span>
                    </button>

                    <button
                      onClick={() => handleAdvanceStatus(rfq)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>Advance Status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Verified Suppliers Directory Table */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliersList.map((sup) => (
                <div key={sup.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{sup.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          {sup.badge}
                        </span>
                      </div>
                      <p className="text-xs font-chinese text-slate-300 mt-0.5">{sup.chineseName}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{sup.city} • {sup.category}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{sup.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{sup.verifiedYears} yrs verified</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Min. Order Value</span>
                      <strong className="text-white">{sup.minOrderValue}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Inspection Status</span>
                      <button
                        onClick={() => handleToggleSupplierInspection(sup.id)}
                        className={`font-bold inline-flex items-center gap-1 ${
                          sup.inspectionPassed ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'
                        }`}
                        title="Click to toggle audit verification"
                      >
                        {sup.inspectionPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        <span>{sup.inspectionPassed ? 'Audit Passed' : 'Pending Audit'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sup.mainProducts.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote Formulation Modal */}
      {quoteModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleSendQuote} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Formulate Sourcing Quote</h3>
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Commission / Agent Service Fee ($ USD)
                </label>
                <input
                  type="number"
                  value={quoteUSD}
                  onChange={(e) => setQuoteUSD(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono font-bold text-white text-sm outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Equivalent to approx ₦{((Number(quoteUSD) || 0) * 1485).toLocaleString()} NGN
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Field Inspector Notes & Terms
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Issue Authoritative Quote to Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register New Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleCreateSupplier} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Register Verified Chinese Supplier</h3>
              <button
                type="button"
                onClick={() => setShowAddSupplier(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Chinese Legal Name (中文名)</label>
                <input
                  type="text"
                  value={newSupZh}
                  onChange={(e) => setNewSupZh(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-chinese"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">City Hub</label>
                  <input
                    type="text"
                    value={newSupCity}
                    onChange={(e) => setNewSupCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Badge</label>
                  <select
                    value={newSupBadge}
                    onChange={(e) => setNewSupBadge(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="Canton Fair VIP">Canton Fair VIP</option>
                    <option value="Factory Direct">Factory Direct</option>
                    <option value="Gold Manufacturer">Gold Manufacturer</option>
                    <option value="Verified Escrow">Verified Escrow</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Register & Publish to Sourcing Directory
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};
