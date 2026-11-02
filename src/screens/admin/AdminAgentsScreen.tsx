import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { AgentRequestDocument } from '../../types';
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
  Plus
} from 'lucide-react';

export const AdminAgentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [rfqs, setRfqs] = useState<AgentRequestDocument[]>(db.getAgentRequests());
  const [quoteModalRfq, setQuoteModalRfq] = useState<AgentRequestDocument | null>(null);
  const [quoteUSD, setQuoteUSD] = useState('250');
  const [quoteNotes, setQuoteNotes] = useState('Field inspector Chen Wei assigned for physical factory check.');

  useEffect(() => {
    return db.subscribe(() => setRfqs(db.getAgentRequests()));
  }, []);

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalRfq) return;
    const numUSD = Number(quoteUSD) || 250;
    const numNGN = Math.round(numUSD * 1485);

    db.updateAgentQuote(quoteModalRfq.id, numUSD, numNGN, quoteNotes);
    firebaseSync.recordAudit('Agent Desk Lead', 'FORMULATE_QUOTE', 'agent_requests', quoteModalRfq.id, `Sent quote of $${numUSD} USD for ${quoteModalRfq.productName}`);
    showToast(`Formal quote of $${numUSD} USD sent to ${quoteModalRfq.clientName}!`, 'success');
    setQuoteModalRfq(null);
  };

  const handleAdvanceStatus = (rfq: AgentRequestDocument) => {
    const nextStatus = rfq.status === 'submitted' ? 'quote_ready' :
                       rfq.status === 'quote_ready' ? 'quote_accepted' :
                       rfq.status === 'quote_accepted' ? 'in_progress' : 'completed';
    
    const doc = db.getDocument('agent_requests', rfq.id);
    if (doc) {
      doc.status = nextStatus;
      db.resetToDefaults; // trigger persistence
      setRfqs(db.getAgentRequests());
      showToast(`RFQ #${rfq.id} advanced to ${nextStatus}`, 'info');
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
              Manage Canton Fair VIP delegations, factory background checks, and official trade RFQs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
              Guangzhou & Yiwu Field Desks: ACTIVE
            </span>
          </div>
        </div>

        {/* Requests & Quotation Pipeline Table */}
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
                      rfq.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rfq.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{rfq.productName}</h4>
                  <p className="text-xs text-slate-400">
                    Client: <strong className="text-slate-200">{rfq.clientName}</strong> • City: <strong>{rfq.supplierCity}</strong> • Target: {rfq.targetQuantity} units @ ${rfq.targetUnitUSD}
                  </p>
                  {rfq.adminNotes && (
                    <p className="text-[11px] text-slate-500 italic">Notes: {rfq.adminNotes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  {rfq.quoteAmountUSD ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Formal Quote</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${rfq.quoteAmountUSD} USD
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuoteModalRfq(rfq)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Formulate Quote</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAdvanceStatus(rfq)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1"
                  >
                    <span>Advance Stage</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulate Quote Modal */}
      {quoteModalRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleSendQuote} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Official Agent Service Quote Form
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {quoteModalRfq.productName} ({quoteModalRfq.serviceType})
              </h3>
              <p className="text-xs text-slate-400">Client: {quoteModalRfq.clientName}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Service Fee Quote (USD)
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold">$</span>
                <input
                  type="number"
                  value={quoteUSD}
                  onChange={(e) => setQuoteUSD(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold text-sm w-full outline-none"
                  placeholder="250"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Equivalent NGN: ≈ ₦{((Number(quoteUSD) || 0) * 1485).toLocaleString()} NGN
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Field Instructions & Scope Notes
              </label>
              <textarea
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Dispatch Quote to Client
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};
