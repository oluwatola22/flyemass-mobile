import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  ArrowDownLeft, 
  Send, 
  ArrowLeftRight, 
  ArrowUpRight, 
  Download, 
  Copy, 
  CheckCheck, 
  Filter, 
  Search, 
  FileText, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Currency, TransactionType, WalletBalance } from '../../types';

export const WalletsScreen: React.FC = () => {
  const { 
    wallets, 
    activeCurrency, 
    setActiveCurrency, 
    transactions, 
    isBalanceHidden, 
    navigate, 
    showToast,
    activeUserId 
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Supplier' | 'FX Swap' | 'Wallet Top-up' | 'Logistics'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatementModal, setShowStatementModal] = useState(false);

  const defaultWallet: WalletBalance = {
    currency: 'NGN',
    balance: 0,
    symbol: '₦',
    name: 'Nigerian Naira Wallet',
    flag: '🇳🇬',
    equivalentUSD: 0
  };

  const currentWallet = (wallets && wallets.find((w) => w?.currency === activeCurrency)) || (wallets && wallets[0]) || defaultWallet;

  const handleDownloadStatement = () => {
    const user = db.getUser(activeUserId);
    const ledger = db.getLedger().filter(l => l.userId === activeUserId);
    
    let csv = `FLYE-MASS OFFICIAL ACCOUNT STATEMENT\n`;
    csv += `Client Name,${user?.fullName || 'Chief Babatunde Alade'}\n`;
    csv += `Company,${user?.businessName || 'Alade Global Enterprises Ltd'}\n`;
    csv += `Currency Wallet,${currentWallet?.name || 'All Vaults'}\n`;
    csv += `Generated At,${new Date().toISOString()}\n`;
    csv += `Available Balance,${currentWallet?.symbol}${(currentWallet?.balance || 0).toLocaleString()}\n\n`;
    csv += `Reference,Date,Type,Source Currency,Target Currency,Amount,Fee,Opening Balance,Closing Balance,Status,Notes\n`;

    ledger.forEach((tx) => {
      csv += `"${tx.reference}","${new Date(tx.timestamp).toLocaleString()}","${tx.type}","${tx.sourceCurrency}","${tx.targetCurrency}","${tx.amount}","${tx.fee || 0}","${tx.openingBalance ?? ''}","${tx.closingBalance ?? ''}","${tx.status}","${(tx.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FlyeMass_Statement_${currentWallet?.currency || 'NGN'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowStatementModal(false);
    showToast(`Official ${currentWallet?.currency} Ledger Statement downloaded successfully!`, 'success');
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = selectedFilter === 'all' || tx.category === selectedFilter;
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Wallets & Statements" />

      {/* Currency Selector Tabs */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          {(['NGN', 'CNY', 'USD'] as Currency[]).map((curr) => {
            const w = wallets.find((item) => item.currency === curr);
            const isSelected = activeCurrency === curr;
            return (
              <button
                key={curr}
                onClick={() => setActiveCurrency(curr)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{w?.flag}</span>
                <span>{curr}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Wallet Card */}
        <div className="mt-4 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">{currentWallet.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
              Insured Escrow
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-400">{currentWallet?.symbol ?? '₦'}</span>
              <span className="text-3xl font-extrabold text-white tracking-tight num-tabular">
                {isBalanceHidden
                  ? '••••••••'
                  : currentWallet?.currency === 'NGN'
                  ? (currentWallet?.balance ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })
                  : (currentWallet?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 num-tabular">
              Equivalent: ≈ {isBalanceHidden 
                ? '••••' 
                : `$${(currentWallet?.equivalentUSD ?? ((currentWallet?.balance ?? 0) / (currentWallet?.currency === 'CNY' ? 7.24 : currentWallet?.currency === 'NGN' ? 1485 : 1))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
            </p>
          </div>

          {/* Money Flow Action Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <button
              onClick={() => navigate('fund')}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Fund</span>
            </button>

            <button
              onClick={() => navigate('pay')}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Pay</span>
            </button>

            <button
              onClick={() => navigate('exchange')}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Swap</span>
            </button>

            <button
              onClick={() => navigate('withdraw')}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Withdraw</span>
            </button>
          </div>
        </div>

        {/* Quick Fund Navigation Prompt */}
        <div 
          onClick={() => navigate('fund')}
          className="mt-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all active:scale-98 group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                Need to Top Up Your Wallet?
              </p>
              <p className="text-[10px] text-slate-400">
                Deposit via verified channels, bank transfer & cards on the Fund page
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
            Fund
          </button>
        </div>

        {/* Ledger & Statement Header */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Audit Ledger ({filteredTransactions.length})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('history')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Full Ledger
            </button>
            <button
              onClick={() => setShowStatementModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 hover:border-emerald-500/40 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Statement</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Pills */}
        <div className="space-y-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, recipient or order..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(['all', 'Supplier', 'FX Swap', 'Wallet Top-up', 'Logistics'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === cat
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Transactions' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Transactions List */}
        <div className="mt-3 space-y-2.5">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{tx.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ref: <span className="font-mono text-slate-300">{tx.reference}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {tx.date} • {tx.paymentMethod}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-extrabold num-tabular ${
                    tx?.type === 'fund' ? 'text-emerald-400' : 'text-slate-100'
                  }`}>
                    {tx?.type === 'fund' ? '+' : '-'}
                    {tx?.currency === 'NGN' ? '₦' : tx?.currency === 'CNY' ? '¥' : '$'}
                    {(tx?.amount ?? 0).toLocaleString()}
                  </p>
                  {tx?.convertedAmount !== undefined && (
                    <p className="text-[9px] text-slate-400 num-tabular mt-0.5">
                      ≈ {tx?.convertedCurrency === 'NGN' ? '₦' : tx?.convertedCurrency === 'CNY' ? '¥' : '$'}
                      {(tx?.convertedAmount ?? 0).toLocaleString()}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {tx?.status ?? 'completed'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No transactions match your search filter.
            </div>
          )}
        </div>
      </div>

      {/* Statement Generation Modal */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Generate Official Statement</h3>
              </div>
              <button
                onClick={() => setShowStatementModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Download certified bank statement stamped for CBN compliance, Nigerian customs, and Chinese supplier credit references.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  PDF (Signed)
                </button>
                <button className="py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                  Excel CSV
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">Date Range</label>
              <select className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none">
                <option>Last 30 Days (Current Cycle)</option>
                <option>Last 3 Months (Quarterly)</option>
                <option>Year to Date (2026)</option>
              </select>
            </div>

            <button
              onClick={handleDownloadStatement}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Statement (CSV)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
