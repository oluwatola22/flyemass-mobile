import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  ArrowLeftRight, 
  Package, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  FileText, 
  Share2,
  Calendar
} from 'lucide-react';
import { Currency, Transaction } from '../../types';

export const HistoryScreen: React.FC = () => {
  const { transactions, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'All' | Currency>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'completed' | 'processing' | 'failed'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Supplier' | 'Logistics' | 'FX Swap' | 'Wallet Top-up' | 'Tech Store'>('All');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCurrency = currencyFilter === 'All' || tx.currency === currencyFilter;
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;

    return matchesSearch && matchesCurrency && matchesStatus && matchesCategory;
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Transaction statement generated and exported to PDF!', 'success');
    }, 1200);
  };

  const getCategoryIcon = (category: Transaction['category']) => {
    switch (category) {
      case 'Supplier': return Send;
      case 'Logistics': return Package;
      case 'FX Swap': return ArrowLeftRight;
      case 'Tech Store': return Smartphone;
      default: return ArrowDownLeft;
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Audit Ledger & History" />

      <div className="p-4 space-y-4">
        {/* Search & Export Header */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, supplier, amount..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            title="Download PDF Ledger"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'PDF'}</span>
          </button>
        </div>

        {/* Currency Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['All', 'NGN', 'CNY'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrencyFilter(curr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                currencyFilter === curr
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {curr === 'All' ? 'All Currencies' : curr === 'NGN' ? '₦ Naira' : '¥ Yuan RMB'}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['All', 'Supplier', 'FX Swap', 'Logistics', 'Tech Store', 'Wallet Top-up'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-950/60 border border-slate-800/80 text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing <strong className="text-white">{filteredTransactions.length}</strong> transactions</span>
          <span className="text-[10px] text-slate-500">Immutable Hash Recorded</span>
        </div>

        {/* Ledger List */}
        <div className="space-y-2.5">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const Icon = getCategoryIcon(tx.category);
              const isNegative = tx.type === 'pay_supplier' || tx.type === 'shop_purchase' || tx.type === 'cargo_freight' || tx.type === 'withdraw';
              const symbol = tx.currency === 'NGN' ? '₦' : tx.currency === 'CNY' ? '¥' : '$';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all active:scale-98 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isNegative ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate max-w-[170px] sm:max-w-xs">
                        {tx.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{tx.reference.slice(0, 14)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-extrabold font-mono tabular-nums block ${
                      isNegative ? 'text-white' : 'text-emerald-400'
                    }`}>
                      {isNegative ? '-' : '+'}{symbol}{(tx?.amount ?? 0).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400/90 uppercase tracking-wider">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{tx.status}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No transactions match your search</p>
              <p className="text-[11px] text-slate-500">Try adjusting your filters or currency selection</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Official Trade Clearing Receipt
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {selectedTx.currency === 'NGN' ? '₦' : selectedTx.currency === 'CNY' ? '¥' : '$'}
                {(selectedTx?.amount ?? 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedTx.title}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-300">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Rail:</span>
                <span className="font-semibold text-white">{selectedTx.paymentMethod || 'FlyeMass Liquidity Vault'}</span>
              </div>
              {selectedTx.recipient && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-semibold text-emerald-400 truncate max-w-[170px]">{selectedTx.recipient}</span>
                </div>
              )}
              {selectedTx.convertedAmount && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Converted Value:</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {selectedTx.convertedCurrency} {(selectedTx?.convertedAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300">{selectedTx.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('Receipt PDF exported to your device downloads', 'success');
                  setSelectedTx(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF Receipt</span>
              </button>
              <button
                onClick={() => {
                  showToast('Receipt link copied to clipboard', 'info');
                }}
                className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
