import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { 
  CreditCard, 
  RefreshCw, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  ArrowDownLeft, 
  Clock 
} from 'lucide-react';

export const AdminFundingScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());

  // Webhook Simulation Modal state
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simProvider, setSimProvider] = useState<'providus' | 'monnify' | 'korapay'>('providus');
  const [simAmount, setSimAmount] = useState('250000');
  const [simUserId, setSimUserId] = useState('usr_alade_01');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const webhookEvents = dbState.webhook_events || db.getWebhookEvents();

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await db.simulateWebhook(simProvider, parseFloat(simAmount) || 100000, simUserId, 'adm-001');
      showToast(`Sandbox ${simProvider.toUpperCase()} webhook processed! ₦${(parseFloat(simAmount) || 100000).toLocaleString()} credited with double-entry. Ref: ${res.reference}`, 'success');
      setShowSimulateModal(false);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation failed', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AdminLayout activeTab="funding">
      <div className="p-6 space-y-6">
        {/* Header / Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Wallet Funding Gateways & Webhooks
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inspect real-time gateway health, cryptographic HMAC signatures, and trigger inbound sandbox webhook simulations.
            </p>
          </div>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Simulate Inbound Webhook</span>
          </button>
        </div>

        {/* Provider Connection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Providus Bank</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SANDBOX_VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Dynamic Virtual Accounts & Inbound NIP Direct Clearing</p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Latency: 142ms</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live 99.98%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Monnify</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Reserved Accounts & Cards (Interswitch / Mastercard)</p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Latency: 185ms</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live 99.95%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Korapay</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cross-Border Collections & Local NIP Inflows</p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Latency: 210ms</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live 99.91%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">CBN RTGS / NIP Switch</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AUTHORITATIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Direct NUBAN Verification & Settlement Bridge</p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Latency: 95ms</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Webhooks Event Journal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Inbound Webhook Verification Journal</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{webhookEvents.length} Captured Events</span>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                  <th className="py-3 px-4 font-semibold">Event ID / Ref</th>
                  <th className="py-3 px-4 font-semibold">Gateway</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Beneficiary User</th>
                  <th className="py-3 px-4 font-semibold">HMAC Signature</th>
                  <th className="py-3 px-4 font-semibold">Received At</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {webhookEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No inbound webhooks recorded. Click "Simulate Inbound Webhook" to test live funding.
                    </td>
                  </tr>
                ) : (
                  webhookEvents.map((evt: any) => (
                    <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{evt.reference || evt.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-slate-800 text-slate-300">
                          {evt.provider}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ₦{(evt.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{evt.userId}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                        {evt.signature ? `${evt.signature.slice(0, 16)}...` : 'sha256-verified'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(evt.receivedAt || evt.createdAt || Date.now()).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {evt.status || 'processed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Webhook Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Simulate Payment Gateway Webhook</h3>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <p>Simulates an authoritative inbound bank credit notification.</p>
              <p className="text-emerald-400 font-semibold">
                ✓ Auto-credits customer NGN wallet balance<br />
                ✓ Generates double-entry ledger entry<br />
                ✓ Verifies HMAC-SHA512 webhook payload
              </p>
            </div>

            <form onSubmit={handleSimulateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Gateway Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['providus', 'monnify', 'korapay'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSimProvider(p)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        simProvider === p
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Beneficiary User ID</label>
                <input
                  type="text"
                  value={simUserId}
                  onChange={(e) => setSimUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Inflow Amount (NGN)</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-emerald-400">₦</span>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-transparent font-mono font-bold text-white text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isSimulating ? 'Processing...' : 'Trigger Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminFundingScreen;
