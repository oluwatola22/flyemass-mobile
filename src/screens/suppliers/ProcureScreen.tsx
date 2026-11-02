import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  FileCheck2, 
  Plus, 
  Send, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { AgentRequestDocument } from '../../types';

export const ProcureScreen: React.FC = () => {
  const { navigate, showToast, activeUserId } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [agentRequests, setAgentRequests] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [acceptingRfq, setAcceptingRfq] = useState<AgentRequestDocument | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // RFQ Form state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Electronics & Parts');
  const [targetQuantity, setTargetQuantity] = useState(500);
  const [targetUnitUSD, setTargetUnitUSD] = useState(15.50);
  const [supplierCity, setSupplierCity] = useState<'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('Shenzhen');
  const [inspectionRequired, setInspectionRequired] = useState(true);
  const [cantonFairBooth, setCantonFairBooth] = useState('');

  useEffect(() => {
    return db.subscribe(() => setAgentRequests(db.getAgentRequests()));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showToast('Please specify product name', 'error');
      return;
    }

    try {
      await db.createAgentRequest({
        productName,
        category,
        targetQuantity: Number(targetQuantity),
        targetUnitUSD: Number(targetUnitUSD),
        supplierCity,
        inspectionRequired,
        cantonFairBooth: cantonFairBooth || undefined,
        serviceType: 'Factory Direct RFQ & Procurement',
        userId: activeUserId || 'usr_alade_01'
      });

      setShowModal(false);
      setProductName('');
      setCantonFairBooth('');
      setAgentRequests(db.getAgentRequests());
      showToast('Factory RFQ submitted to China sourcing desk!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit RFQ', 'error');
    }
  };

  const handleAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingRfq) return;
    if (pinInput.length !== 6) {
      showToast('Please enter your 6-digit transaction PIN', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await db.acceptAgentQuote(acceptingRfq.id, pinInput, 'USD', activeUserId || 'usr_alade_01');
      showToast(`Quote of $${acceptingRfq.quoteAmountUSD} USD accepted! Funds locked in escrow.`, 'success');
      setAcceptingRfq(null);
      setPinInput('');
      setAgentRequests(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: AgentRequestDocument['status']) => {
    switch (status) {
      case 'po_issued':
      case 'quote_accepted': return { color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'PO Issued (Escrow Locked)' };
      case 'completed': return { color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', label: 'Completed & Delivered' };
      case 'quote_ready': return { color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Quote Ready for Review' };
      default: return { color: 'bg-slate-800 border-slate-700 text-slate-300', label: 'Pending Sourcing Review' };
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Direct Quotation Manager" />

      <div className="p-4 space-y-4">
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              China Factory Direct RFQ
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Procurement & Quotation Desk
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Direct factory price negotiation by our Guangzhou & Shenzhen native buyers.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            title="Create RFQ"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab switcher: Procure / Agent */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md transition-all"
          >
            Quotation Manager ({agentRequests.length})
          </button>
          <button
            onClick={() => navigate('agent')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            Ground Agents & Audits
          </button>
        </div>

        {/* Quotations List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Factory RFQs
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">0% Commission Escrow</span>
          </div>

          {agentRequests.map((rfq) => {
            const badge = getStatusBadge(rfq.status);
            return (
              <div
                key={rfq.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">
                    {rfq.id.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-white">{rfq.productName}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>Hub: <strong className="text-emerald-400">{rfq.supplierCity}</strong></span>
                    <span>•</span>
                    <span>Target: <strong className="text-white">{rfq.targetQuantity.toLocaleString()} units</strong></span>
                    <span>•</span>
                    <span>Target Unit: <strong className="font-mono text-amber-400">${rfq.targetUnitUSD}</strong></span>
                  </div>
                </div>

                {/* Formal Quote Display Card if quoted */}
                {rfq.quoteAmountUSD && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Official China Desk Quotation</span>
                      <span className="text-xs font-mono font-extrabold text-white">${rfq.quoteAmountUSD} USD (₦{rfq.quoteAmountNGN?.toLocaleString()})</span>
                    </div>
                    {rfq.adminNotes && (
                      <p className="text-[10px] text-slate-300 italic">"{rfq.adminNotes}"</p>
                    )}
                    {rfq.assignedAgent && (
                      <p className="text-[9px] text-slate-400">Assigned Inspector: <strong className="text-emerald-400">{rfq.assignedAgent}</strong></p>
                    )}

                    {rfq.status === 'quote_ready' && (
                      <button
                        onClick={() => setAcceptingRfq(rfq)}
                        className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Accept Quote & Lock Escrow (${rfq.quoteAmountUSD})</span>
                      </button>
                    )}
                  </div>
                )}

                {rfq.cantonFairBooth && (
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold">Canton Fair Booth: </span>
                    {rfq.cantonFairBooth}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">{new Date(rfq.createdAt).toLocaleDateString()}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        showToast(`Quotation breakdown for ${rfq.id} sent to your email`, 'success');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300"
                    >
                      View Sheet
                    </button>

                    <button
                      onClick={() => navigate('support-chat')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold"
                    >
                      Chat Agent
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accept Quote Modal */}
      {acceptingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setAcceptingRfq(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-white">Accept Sourcing Quote</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Funds will be held in double-entry escrow and released upon milestone completion.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Product / Assignment:</span>
                <span className="font-semibold text-white">{acceptingRfq.productName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Escrow Required:</span>
                <span className="font-mono font-bold text-emerald-400">${acceptingRfq.quoteAmountUSD} USD</span>
              </div>
            </div>

            <form onSubmit={handleAcceptQuote} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  6-Digit Transaction PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-center tracking-[0.4em] font-mono text-base text-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Securing Escrow...' : `Confirm & Lock $${acceptingRfq.quoteAmountUSD} Escrow`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RFQ Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-white">Create Direct RFQ</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit target specifications to factory sourcing desk in China.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product Description / Commodity
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. 100W GaN Fast Chargers or 5kW Solar Inverters"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Quantity
                  </label>
                  <input
                    type="number"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Unit ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetUnitUSD}
                    onChange={(e) => setTargetUnitUSD(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Sourcing Region
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Shenzhen', 'Guangzhou', 'Yiwu', 'Foshan'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSupplierCity(c)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        supplierCity === c
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Canton Fair Booth (Optional)
                </label>
                <input
                  type="text"
                  value={cantonFairBooth}
                  onChange={(e) => setCantonFairBooth(e.target.value)}
                  placeholder="e.g. Pazhou Hall 14.1, Booth C02"
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <input
                  type="checkbox"
                  id="inspection"
                  checked={inspectionRequired}
                  onChange={(e) => setInspectionRequired(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="inspection" className="text-[11px] text-slate-300 cursor-pointer">
                  Require on-ground factory pre-shipment audit
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit RFQ to China Sourcing Team</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
