import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { FundWalletModal } from '../../components/wallet/FundWalletModal';
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
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Building2,
  ShoppingBag,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Currency, Transaction, WalletBalance } from '../../types';

export const WalletsScreen: React.FC = () => {
  const { 
    wallets, 
    activeCurrency, 
    setActiveCurrency, 
    transactions, 
    isBalanceHidden, 
    toggleBalancePrivacy,
    navigate, 
    showToast,
    activeUserId,
    openSwapModal,
    openFundModal,
    isFundModalOpen,
    closeFundModal,
    t
  } = useApp();

  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'All' | 'NGN' | 'CNY'>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const width = container.clientWidth;
    if (width > 0) {
      const index = Math.round(container.scrollLeft / width);
      const clampedIndex = Math.max(0, Math.min(1, index));
      if (clampedIndex !== activeWalletIndex) {
        setActiveWalletIndex(clampedIndex);
      }
    }
  };

  const scrollToWallet = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const width = container.clientWidth;
    container.scrollTo({
      left: index * width,
      behavior: 'smooth'
    });
    setActiveWalletIndex(index);
  };
  const [systemRates, setSystemRates] = useState<any>({
    USD_NGN: 1485.00,
    USD_CNY: 7.24,
    NGN_CNY: 214.50,
    lastUpdated: Date.now()
  });

  useEffect(() => {
    db.getAuthoritativeRates().then(setSystemRates).catch(() => {});
  }, []);

  const kycInfo = db.getKycStatus(activeUserId);
  const isKycVerified = kycInfo.status === 'verified';

  // Compute Balances
  // Institutional Vault Reference: United States Dollar Wallet (USD)
  const ngnWallet = wallets.find(w => w.currency === 'NGN') || { currency: 'NGN', balance: 0, symbol: '₦', name: 'Nigerian Naira Vault', flag: '🇳🇬', equivalentUSD: 0 };
  const cnyWallet = wallets.find(w => w.currency === 'CNY') || { currency: 'CNY', balance: 0, symbol: '¥', name: 'Chinese Yuan Vault', flag: '🇨🇳', equivalentUSD: 0 };

  const rateCnyNgn = systemRates.input_cny_to_ngn || systemRates.CNY_to_NGN || (systemRates.USD_NGN && systemRates.USD_CNY ? systemRates.USD_NGN / systemRates.USD_CNY : 214.50);

  const totalNGN = ngnWallet.balance + (cnyWallet.balance * rateCnyNgn);
  const totalCNY = totalNGN / rateCnyNgn;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedRef(label);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleDownloadStatement = () => {
    const user = db.getUser(activeUserId);
    const ledger = db.getLedger().filter(l => l.userId === activeUserId);
    
    let csv = `FLYE-MASS MULTI-CURRENCY OFFICIAL ACCOUNT STATEMENT\n`;
    csv += `Client Name,${user?.fullName || 'Chief Babatunde Alade'}\n`;
    csv += `Company,${user?.businessName || 'Alade Global Enterprises Ltd'}\n`;
    csv += `Generated At,${new Date().toISOString()}\n`;
    csv += `Total Portfolio Value (NGN),₦${totalNGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    csv += `NGN Vault Available,₦${ngnWallet.balance.toLocaleString('en-NG', { maximumFractionDigits: 2 })}\n`;
    csv += `CNY Vault Available,¥${cnyWallet.balance.toLocaleString('en-CN', { minimumFractionDigits: 2 })}\n\n`;
    csv += `Reference,Date,Type,Source Currency,Target Currency,Amount,Fee,Opening Balance,Closing Balance,Status,Notes\n`;

    ledger.forEach((tx) => {
      csv += `"${tx.reference}","${new Date(tx.timestamp).toLocaleString()}","${tx.type}","${tx.sourceCurrency}","${tx.targetCurrency}","${tx.amount}","${tx.fee || 0}","${tx.openingBalance ?? ''}","${tx.closingBalance ?? ''}","${tx.status}","${(tx.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FlyeMass_MultiCurrency_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowStatementModal(false);
    showToast('Official certified financial statement downloaded!', 'success');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesCurrency = selectedCurrencyFilter === 'All' || tx.currency === selectedCurrencyFilter;
    const matchesCategory = 
      selectedCategoryFilter === 'all' ? true :
      selectedCategoryFilter === 'fund' ? (tx.category === 'Wallet Top-up' || tx.type === 'fund') :
      selectedCategoryFilter === 'swap' ? (tx.category === 'FX Swap') :
      selectedCategoryFilter === 'supplier' ? (tx.category === 'Supplier') :
      selectedCategoryFilter === 'logistics' ? (tx.category === 'Logistics') :
      selectedCategoryFilter === 'hotel' ? (tx.title.toLowerCase().includes('hotel') || tx.reference.startsWith('BK-') || tx.category === 'Tech Store') :
      true;

    const matchesSearch = 
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCurrency && matchesCategory && matchesSearch;
  });

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.category === 'FX Swap') return <ArrowLeftRight className="w-4 h-4 text-amber-400" />;
    if (tx.category === 'Supplier') return <Send className="w-4 h-4 text-indigo-400" />;
    if (tx.category === 'Logistics') return <Package className="w-4 h-4 text-cyan-400" />;
    if (tx.title.toLowerCase().includes('hotel') || tx.reference.startsWith('BK-')) return <Building2 className="w-4 h-4 text-purple-400" />;
    if (tx.type === 'fund') return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Wallets & Multi-Currency" />

      <div className="p-4 space-y-4">
        {/* ======================================================== */}
        {/* 1. CURRENCY VAULTS — TRUE FULL-WIDTH SWIPE CAROUSEL */}
        {/* ======================================================== */}
        <div className="space-y-3">
          {/* Subtle Heading with 1 of 2 Indicator (No bulky buttons, no "Swipe" text) */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('wallets.multi_currency_vaults', 'Currency Vaults')}
            </h2>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {activeWalletIndex + 1} of 2
            </span>
          </div>

          {/* Full-width Carousel Viewport (Only ONE card visible at a time, zero peek) */}
          <div className="w-full overflow-hidden rounded-3xl">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar touch-pan-x overscroll-x-contain scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Card 1: Nigerian Naira Wallet (NGN) */}
              <div data-wallet-card="true" className="w-full min-w-full max-w-full shrink-0 snap-center">
                <div className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 shadow-xl relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl shrink-0 drop-shadow-md">🇳🇬</span>
                      <div>
                        <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
                          Nigerian Naira Wallet
                        </h3>
                        <span className="text-xs font-medium text-emerald-400 font-mono">NGN</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium font-mono uppercase tracking-wider">
                      Primary Rail
                    </span>
                  </div>

                  {/* Available Balance (28-32px, font-weight 600 Semi-bold, tight tabular numerals) */}
                  <div className="pt-2 relative z-10">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block">
                      {t('wallets.available_balance', 'Available Balance')}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-3xl font-semibold text-white font-mono tracking-tight num-tabular">
                        {isBalanceHidden ? '••••••••' : `₦${ngnWallet.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                      <span className="text-xs font-medium text-slate-400">NGN</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-mono num-tabular">
                      ≈ {isBalanceHidden ? '••••' : `¥${((ngnWallet.balance / rateCnyNgn)).toLocaleString('en-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RMB`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Chinese Yuan Wallet (CNY/RMB) */}
              <div data-wallet-card="true" className="w-full min-w-full max-w-full shrink-0 snap-center">
                <div className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-500/50 shadow-xl relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl shrink-0 drop-shadow-md">🇨🇳</span>
                      <div>
                        <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
                          Chinese Yuan Wallet
                        </h3>
                        <span className="text-xs font-medium text-amber-400 font-mono">CNY / RMB</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium font-mono uppercase tracking-wider">
                      China Trade
                    </span>
                  </div>

                  {/* Available Balance (28-32px, font-weight 600 Semi-bold, tight tabular numerals) */}
                  <div className="pt-2 relative z-10">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block">
                      {t('wallets.available_balance', 'Available Balance')}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-3xl font-semibold text-amber-400 font-mono tracking-tight num-tabular">
                        {isBalanceHidden ? '••••••••' : `¥${cnyWallet.balance.toLocaleString('en-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                      <span className="text-xs font-medium text-amber-300/80">CNY</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-mono num-tabular">
                      ≈ {isBalanceHidden ? '••••' : `₦${(cnyWallet.balance * rateCnyNgn).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Pagination Indicator (● ━) */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            {[0, 1].map((idx) => {
              const isActive = activeWalletIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => scrollToWallet(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-7 h-1.5 bg-emerald-400 shadow-sm shadow-emerald-500/40'
                      : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600'
                  }`}
                  aria-label={`Go to wallet ${idx + 1} of 2`}
                />
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. INSTANT MULTI-WALLET ACTIONS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => openFundModal()}
            data-testid="fund-wallet-btn"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-md">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors truncate w-full">
              Fund
            </span>
            <span className="text-xs text-slate-400 mt-0.5 line-clamp-1 truncate w-full">
              Deposit
            </span>
          </button>

          <button
            onClick={() => navigate('pay')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-md">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors truncate w-full">
              Pay
            </span>
            <span className="text-xs text-slate-400 mt-0.5 line-clamp-1 truncate w-full">
              Supplier
            </span>
          </button>

          <button
            onClick={() => openSwapModal(activeWalletIndex === 0 ? 'NGN' : activeWalletIndex === 1 ? 'CNY' : 'USD')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-amber-500/30 hover:border-amber-500/50 active:scale-95 transition-all flex flex-col items-center text-center group cursor-pointer shadow-lg shadow-amber-500/5"
            title="Open Currency Swap Modal"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-md">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-amber-300 group-hover:text-amber-400 transition-colors truncate w-full">
              FX Swap
            </span>
            <span className="text-xs text-slate-400 mt-0.5 line-clamp-1 truncate w-full">
              Instant
            </span>
          </button>

          <button
            onClick={() => navigate('withdraw')}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-md">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors truncate w-full">
              Withdraw
            </span>
            <span className="text-xs text-slate-400 mt-0.5 line-clamp-1 truncate w-full">
              NUBAN
            </span>
          </button>
        </div>

        {/* KYC Compliance Reminder Banner */}
        {!isKycVerified && (
          <div 
            onClick={() => navigate('kyc')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-300">Identity Verification Required</p>
                <p className="text-[11px] text-slate-300">Complete KYC to unlock full withdrawals & China payments.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 shrink-0">
              Verify <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. TRANSACTION HISTORY & ACTIVITY AUDIT LEDGER */}
        {/* ======================================================== */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transaction History ({filteredTransactions.length})
            </span>

            <button
              onClick={() => setShowStatementModal(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Statement</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, recipient, notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Currency Filter Bar */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(['All', 'NGN', 'CNY'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrencyFilter(curr)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCurrencyFilter === curr
                    ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {curr === 'All' ? 'All Currencies' : curr === 'NGN' ? '🇳🇬 NGN' : '🇨🇳 CNY'}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'fund', label: 'Top-ups / Deposits' },
              { id: 'swap', label: 'FX Swaps' },
              { id: 'logistics', label: 'Freight Payments' },
              { id: 'supplier', label: 'Supplier Payouts' },
              { id: 'hotel', label: 'Hotel Bookings' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-1.5">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-300">No Ledger Postings Found</p>
                <p className="text-[11px] text-slate-500">No settled transactions or conversions match your active filter.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-99 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {getTransactionIcon(tx)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {tx.title}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-slate-800 text-slate-400">
                          {tx.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Ref: <span className="font-mono text-slate-300">{tx.reference}</span> · {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs font-extrabold font-mono num-tabular ${
                      tx.type === 'fund' ? 'text-emerald-400' : 'text-slate-100'
                    }`}>
                      {tx.type === 'fund' ? '+' : '-'}
                      {tx.currency === 'NGN' ? '₦' : tx.currency === 'CNY' ? '¥' : '$'}
                      {(tx.amount || 0).toLocaleString()}
                    </p>
                    <span className={`inline-block mt-0.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      tx.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {tx.status || 'completed'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. TRANSACTION DETAILS RECEIPT MODAL */}
      {/* ======================================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200 mt-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Transaction Receipt</h3>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">{selectedTx.category}</span>
              <p className="text-2xl font-black font-mono text-white">
                {selectedTx.type === 'fund' ? '+' : '-'}
                {selectedTx.currency === 'NGN' ? '₦' : selectedTx.currency === 'CNY' ? '¥' : '$'}
                {(selectedTx.amount || 0).toLocaleString()} {selectedTx.currency}
              </p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                selectedTx.status === 'successful' || selectedTx.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : selectedTx.status === 'processing' || selectedTx.status === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : selectedTx.status === 'rejected' || selectedTx.status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}>
                {selectedTx.status === 'successful' || selectedTx.status === 'completed' ? 'Successful' : selectedTx.status || 'completed'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reference:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-white font-bold">{selectedTx.reference}</span>
                  <button 
                    onClick={() => handleCopy(selectedTx.reference, 'Reference')}
                    className="p-1 hover:text-emerald-400 text-slate-500"
                  >
                    {copiedRef === 'Reference' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300 font-mono">{selectedTx.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Channel / Method:</span>
                <span className="text-slate-300 font-semibold">{selectedTx.paymentMethod || 'Wallet Ledger'}</span>
              </div>

              {selectedTx.recipient && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Counterparty:</span>
                  <span className="text-white font-bold">{selectedTx.recipient}</span>
                </div>
              )}

              {selectedTx.convertedAmount && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">Converted Amount:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {selectedTx.convertedCurrency} {(selectedTx.convertedAmount || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Customer Uploaded QR Code */}
            {selectedTx.qrCodeUrl && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Beneficiary Payout QR Code
                </span>
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src={selectedTx.qrCodeUrl} alt="Payout QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Admin Transfer Proof Receipt */}
            {(selectedTx.receiptUrl || selectedTx.paymentProofUrl) && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Admin Transfer Proof Receipt
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Cleared</span>
                </div>
                {((selectedTx.receiptUrl || selectedTx.paymentProofUrl)?.startsWith('data:image') || (selectedTx.receiptUrl || selectedTx.paymentProofUrl)?.match(/\.(png|jpe?g|webp|gif)/i)) && (
                  <div className="w-full max-h-40 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img 
                      src={selectedTx.receiptUrl || selectedTx.paymentProofUrl} 
                      alt="Transfer Receipt Proof" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <a
                  href={selectedTx.receiptUrl || selectedTx.paymentProofUrl}
                  download={`transfer-receipt-${selectedTx.reference}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="download-receipt-btn"
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Transfer Receipt</span>
                </a>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  handleCopy(`FLYE-MASS OFFICIAL RECEIPT\nReference: ${selectedTx.reference}\nAmount: ${selectedTx.currency} ${selectedTx.amount}\nStatus: ${selectedTx.status}\nDate: ${selectedTx.date}`, 'Receipt');
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Receipt Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. STATEMENT DOWNLOAD MODAL */}
      {/* ======================================================== */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-200 mt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Download Account Statement</h3>
              </div>
              <button 
                onClick={() => setShowStatementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Export certified ledger statements for NGN, CNY, and USD transactions with double-entry balance verification.
            </p>

            <button
              onClick={handleDownloadStatement}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Certified Statement (.CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* Providus Bank Dedicated Virtual Account (DVA) Funding Modal */}
      <FundWalletModal isOpen={isFundModalOpen} onClose={closeFundModal} />
    </div>
  );
};
