import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getMobileAppUrl } from '../../utils/environment';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  CreditCard, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plane, 
  Ship, 
  ShoppingBag, 
  ArrowLeftRight,
  ShieldAlert,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  // Compute live aggregates from authoritative database
  const usersCount = Object.keys(dbState.users || {}).length;
  const ledgerEntries = Object.values(dbState.wallets_ledger || {});
  const shipments = Object.values(dbState.shipments || {});
  const payments = Object.values(dbState.supplier_payments || {});
  const withdrawals = Object.values(dbState.withdrawals || {});
  const agentRequests = Object.values(dbState.agent_requests || {});

  const pendingPayments = payments.filter((p) => p.status === 'processing');
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const activeShipments = shipments.filter(
    (s) => s.currentStatus === 'Origin Received' || s.currentStatus === 'Packed' || s.currentStatus === 'In Transit/Customs'
  );

  // Authoritative Balance Aggregates
  const totalBalancesNGN = Object.values(dbState.users || {}).reduce((acc, u) => acc + (u.balances?.NGN || 0), 0);
  const totalBalancesCNY = Object.values(dbState.users || {}).reduce((acc, u) => acc + (u.balances?.CNY || 0), 0);
  const totalBalancesUSD = Object.values(dbState.users || {}).reduce((acc, u) => acc + (u.balances?.USD || 0), 0);

  // Authoritative Freight Revenue
  const freightRevenueUSD = shipments.filter(s => s.freightPaid).reduce((acc, s) => acc + (s.freightFee || s.costEstimate || 0), 0);

  // Total Trade Volume
  const totalVolumeUSD = totalBalancesUSD + Math.round(totalBalancesNGN / 1485) + Math.round(totalBalancesCNY / 7.24);

  // Chart data points
  const volumeData = [
    { day: 'Mon', ngn: 180, cny: 120, usd: 85 },
    { day: 'Tue', ngn: 240, cny: 160, usd: 110 },
    { day: 'Wed', ngn: 310, cny: 210, usd: 145 },
    { day: 'Thu', ngn: 290, cny: 195, usd: 130 },
    { day: 'Fri', ngn: 420, cny: 280, usd: 190 },
    { day: 'Sat', ngn: 380, cny: 250, usd: 175 },
    { day: 'Sun', ngn: 450, cny: 310, usd: 210 },
  ];

  const maxVal = Math.max(...volumeData.map((d) => d.ngn));

  const handleApprovePayment = (id: string) => {
    const payment = dbState.supplier_payments[id];
    if (payment) {
      payment.status = 'disbursed';
      showToast(`Disbursed ¥${payment.amountRMB.toLocaleString()} to ${payment.receiverName}!`, 'success');
      setDbState({ ...db.getState() });
    }
  };

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Page Title & System Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Executive Command Center</h1>
            <p className="text-xs text-slate-400">
              Live operational monitoring for China-Nigeria settlements, air cargo, and enterprise vaults.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(getMobileAppUrl(), '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs shadow-sm shadow-emerald-500/10 active:scale-95 transition-all"
              title={`Open Client View (${getMobileAppUrl()})`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open Client View</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Stream: <strong>Active</strong></span>
            </span>
          </div>
        </div>

        {/* 4 Primary Executive Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Volume */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Trade Volume (30d)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white num-tabular">
                  ${totalVolumeUSD >= 1000000 ? `${(totalVolumeUSD / 1000000).toFixed(2)}M` : `${totalVolumeUSD.toLocaleString()}`}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Reconciled
                </span>
              </div>
              <p className="text-[11px] text-slate-400 num-tabular mt-0.5">
                ₦{totalBalancesNGN.toLocaleString()} NGN • ¥{totalBalancesCNY.toLocaleString()} CNY
              </p>
            </div>
          </div>

          {/* Card 2: Active Shipments */}
          <div 
            onClick={() => navigate('admin-logistics')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-cyan-500/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Freight Shipments
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white num-tabular">{activeShipments.length} Batches</span>
                <span className="text-xs font-semibold text-cyan-400 flex items-center">
                  <Plane className="w-3 h-3 mr-0.5" /> Air & Sea
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Next: Flight ET921 ETA 36 hrs
              </p>
            </div>
          </div>

          {/* Card 3: Pending Payouts */}
          <div 
            onClick={() => navigate('admin-payments')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Supplier Payout Queue
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-400 num-tabular">
                  {pendingPayments.length} Awaiting
                </span>
                <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  Action Required
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Alipay & WeChat Disbursal Desk
              </p>
            </div>
          </div>

          {/* Card 4: Verified Clients */}
          <div 
            onClick={() => navigate('admin-users')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-indigo-500/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Verified Enterprises
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white num-tabular">{usersCount} Accounts</span>
                <span className="text-xs font-semibold text-emerald-400">100% CAC Verified</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tier 3 Nigerian Importers & Chinese Agents
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time Analytics & Settlement Volume Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Cross-Border Settlement Flow & FX Volume
              </h2>
              <p className="text-xs text-slate-400">Daily transaction throughput (in Millions NGN equivalent)</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-[11px] mr-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> NGN Inflow
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> RMB Supplier Disbursal
                </span>
              </div>

              <div className="flex gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                {(['7d', '30d', '90d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      chartTimeframe === tf ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Responsive SVG Chart */}
          <div className="pt-4">
            <div className="h-56 w-full flex items-end justify-between gap-3 px-2">
              {volumeData.map((item, idx) => {
                const heightPercent = Math.round((item.ngn / maxVal) * 100);
                const rmbPercent = Math.round((item.cny / maxVal) * 100);
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      {/* Bar 1: NGN */}
                      <div
                        className="w-full max-w-[24px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm shadow-emerald-500/20"
                        style={{ height: `${heightPercent}%` }}
                        title={`${item.day}: ₦${item.ngn}M NGN Inflow`}
                      />
                      {/* Bar 2: RMB */}
                      <div
                        className="w-full max-w-[24px] bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm shadow-indigo-500/20"
                        style={{ height: `${rmbPercent}%` }}
                        title={`${item.day}: ¥${item.cny * 10}K RMB Disbursed`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Operational Grid: Quick Action Queue & High-Priority Cargo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Manual Review Action Queue */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Urgent Action Review Queue ({pendingPayments.length})
                </h3>
              </div>
              <button
                onClick={() => navigate('admin-payments')}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {pendingPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{p.receiverName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[9px] uppercase">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Acct: <span className="font-mono text-slate-300">{p.receiverAccount}</span> • {p.notes}
                    </p>
                    <p className="text-xs font-extrabold text-emerald-400 num-tabular mt-1">
                      ¥{p.amountRMB.toLocaleString()} CNY (≈ ₦{p.equivalentNGN.toLocaleString()})
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 ml-3">
                    <button
                      onClick={() => handleApprovePayment(p.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Disburse Payout
                    </button>
                  </div>
                </div>
              ))}

              {pendingPayments.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No pending payouts requiring manual review. All queues clear!
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In-Transit Air & Sea Cargo Waypoints */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Freight Waypoint Status
                </h3>
              </div>
              <button
                onClick={() => navigate('admin-logistics')}
                className="text-xs font-semibold text-cyan-400 hover:underline"
              >
                Control Tower
              </button>
            </div>

            <div className="space-y-3">
              {shipments.slice(0, 2).map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate('admin-logistics')}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs group-hover:text-cyan-400 transition-colors">
                        {s.trackingNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-[9px] uppercase">
                        {s.mode}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {s.currentStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold truncate">{s.title}</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span>Route: {s.originWarehouse} ➔ {s.destination}</span>
                    <span className="font-mono text-slate-200">{s.weightKg} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
