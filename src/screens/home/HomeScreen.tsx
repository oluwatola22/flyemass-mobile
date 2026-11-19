import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { LIVE_FX_RATES } from '../../data/mockData';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  ArrowLeftRight, 
  Package, 
  Smartphone, 
  Users, 
  ChevronRight, 
  Plane, 
  Ship, 
  TrendingUp, 
  TrendingDown, 
  Copy, 
  CheckCheck, 
  Sparkles, 
  ShieldAlert, 
  Calendar,
  Building,
  Hotel,
  Home,
  Briefcase,
  Zap
} from 'lucide-react';
import { Currency, BannerDocument, WalletBalance } from '../../types';

export const HomeScreen: React.FC = () => {
  const { 
    wallets, 
    activeCurrency, 
    setActiveCurrency, 
    isBalanceHidden, 
    transactions, 
    shipments, 
    navigate, 
    prefetchRoute,
    showToast,
    setIsQuickActionOpen,
    openSwapModal,
    t
  } = useApp();

  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerDocument[]>(() => 
    db.getBanners().filter(b => b.placement !== 'shop' && b.destinationRoute !== 'shop')
  );
  const [dbRates, setDbRates] = useState(() => db.getState().system_settings?.rates);
  const [liveFxDisplay, setLiveFxDisplay] = useState(() => db.getState().system_settings?.live_fx_display);

  useEffect(() => {
    // Initial sync from current db state
    const currentSettings = db.getState().system_settings;
    if (currentSettings?.rates) setDbRates({ ...currentSettings.rates });
    if (currentSettings?.live_fx_display) setLiveFxDisplay({ ...currentSettings.live_fx_display });

    return db.subscribe(() => {
      const nextBanners = db.getBanners().filter(b => b.placement !== 'shop' && b.destinationRoute !== 'shop');
      setBanners((prev) => {
        if (
          prev.length === nextBanners.length &&
          prev.every((b, i) => b.id === nextBanners[i]?.id && b.isActive === nextBanners[i]?.isActive && b.imageUrl === nextBanners[i]?.imageUrl)
        ) {
          return prev;
        }
        return nextBanners;
      });

      const nextSettings = db.getState().system_settings;
      if (nextSettings?.rates) {
        setDbRates({ ...nextSettings.rates });
      }
      if (nextSettings?.live_fx_display) {
        setLiveFxDisplay({ ...nextSettings.live_fx_display });
      }
    });
  }, []);

  const liveRatesList = useMemo(() => {
    // 1. Fixed Buy Rate (Customer converts RMB back to Naira / CNY ➔ NGN)
    const fixedBuyRate = Number(
      dbRates?.input_cny_to_ngn ?? 
      dbRates?.CNY_to_NGN ?? 
      liveFxDisplay?.displayNgnRmb ?? 
      dbRates?.NGN_CNY ?? 
      215.00
    );

    // 2. Fixed Sell Rate (Customer converts Naira to RMB / NGN ➔ CNY)
    const fixedSellRate = Number(
      dbRates?.input_ngn_to_cny ?? 
      dbRates?.naira_per_rmb ?? 
      (dbRates?.NGN_to_CNY ? (1 / Number(dbRates.NGN_to_CNY)) : 220.00)
    );

    // 3. Wholesale Clearing Benchmark Rate (1 RMB = Naira interbank base)
    const benchmarkRate = Number(
      dbRates?.NGN_CNY ?? 
      dbRates?.CNY_NGN ?? 
      liveFxDisplay?.displayNgnRmb ?? 
      217.50
    );

    const inverseNgnToCny = fixedSellRate > 0 ? (1 / fixedSellRate) : 0.004545;

    return [
      {
        pair: '🇨🇳 RMB ➔ 🇳🇬 NGN',
        from: 'CNY' as Currency,
        to: 'NGN' as Currency,
        display: `1 RMB = ₦${fixedBuyRate.toFixed(2)}`,
        tag: 'Fixed Buy',
        rate: fixedBuyRate,
        change24h: 0.42,
        isPositive: true
      },
      {
        pair: '🇳🇬 NGN ➔ 🇨🇳 RMB',
        from: 'NGN' as Currency,
        to: 'CNY' as Currency,
        display: `₦${fixedSellRate.toFixed(2)}/RMB (1 NGN = ¥${inverseNgnToCny.toFixed(4)})`,
        tag: 'Fixed Sell',
        rate: fixedSellRate,
        change24h: -0.35,
        isPositive: false
      },
      {
        pair: '🇨🇳 CNY ⇄ 🇳🇬 NGN',
        from: 'CNY' as Currency,
        to: 'NGN' as Currency,
        display: `₦${benchmarkRate.toFixed(2)} Benchmark`,
        tag: 'Zero Slippage',
        rate: benchmarkRate,
        change24h: 0.00,
        isPositive: true
      }
    ];
  }, [dbRates, liveFxDisplay]);

  // Seamless, symmetrical ticker track helper (prevents text clipping & jumping)
  const renderTickerTrack = (trackId: string) => (
    <div key={trackId} className="flex items-center shrink-0">
      {liveFxDisplay?.announcementText && (
        <div 
          onClick={() => openSwapModal()}
          className="inline-flex items-center gap-1.5 mx-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold cursor-pointer hover:bg-emerald-500/20 transition-all shrink-0 shadow-sm"
        >
          <span>{liveFxDisplay.announcementText}</span>
        </div>
      )}

      {liveRatesList.map((rate, i) => (
        <div 
          key={`${trackId}-${rate.pair}-${i}`} 
          onClick={() => {
            const from = rate.from;
            const to = rate.to;
            openSwapModal(from, to);
          }}
          className="inline-flex items-center gap-2 mx-3.5 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
        >
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            {rate.pair}
          </span>
          <span className="text-xs font-extrabold text-white font-mono num-tabular">
            {rate.display}
          </span>
          <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-full ${
            rate.isPositive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            {rate.isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {rate.tag || (rate.isPositive ? `+${rate.change24h}%` : `${rate.change24h}%`)}
          </span>
        </div>
      ))}

      {/* Corridor pill */}
      <div 
        onClick={() => openSwapModal()}
        className="inline-flex items-center gap-1.5 mx-3 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium cursor-pointer hover:text-white shrink-0"
      >
        <span>🇳🇬 Nigeria ⇄ 🇨🇳 China Direct Settlement</span>
      </div>

      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700 mx-3 shrink-0" />
    </div>
  );

  const defaultWallet: WalletBalance = {
    currency: 'NGN',
    balance: 0,
    symbol: '₦',
    name: 'Nigerian Naira Wallet',
    flag: '🇳🇬',
    accountNumber: '9082341902',
    bankName: 'FlyeMass / Providus Bank',
    equivalentUSD: 0
  };

  const currentWallet = (wallets && wallets[activeCardIndex]) || (wallets && wallets[0]) || defaultWallet;
  const activeShipment = shipments?.[0]; // Active air cargo

  const quickActions = [
    { title: 'Fund Wallet', desc: 'NGN Deposit', icon: ArrowDownLeft, route: 'fund', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
    { title: 'Pay Supplier', desc: 'Alipay / WeChat', icon: Send, route: 'pay', color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30' },
    { title: 'Bills & Data', desc: 'Airtime & Power', icon: Zap, route: 'bills', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' },
    { title: 'Swap FX', desc: 'NGN ⇄ RMB', icon: ArrowLeftRight, route: 'exchange', action: () => openSwapModal(), color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30' },
    { title: 'Withdraw', desc: 'Bank Payout', icon: ArrowUpRight, route: 'withdraw', color: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30' },
    { title: 'Track Cargo', desc: 'Air & Sea', icon: Package, route: 'track', color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="min-h-full pb-20 bg-slate-950 text-white">
      {/* Top Header */}
      <Header />

      {/* Sticky Live FX Ticker Marquee directly below top header */}
      <div 
        data-testid="mobile-livefx-ticker-bar"
        className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 h-11 flex items-center relative overflow-hidden select-none"
      >
        {/* Clean Financial Live FX Badge (Fixed Left Anchor) */}
        <div 
          onClick={() => openSwapModal()}
          className="h-full px-3 text-xs uppercase font-medium text-emerald-400 bg-slate-900 z-20 flex items-center gap-2 border-r border-slate-800 shrink-0 cursor-pointer hover:bg-slate-800/80 transition-all shadow-md select-none"
          title="Open FX Swap"
          aria-label="LIVE FX WHOLESALE"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-xs text-white tracking-wider leading-none">LIVE FX</span>
          <span className="sr-only">WHOLESALE</span>
        </div>

        {/* Scrolling Ticker Track Container */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex items-center relative">
          {/* Subtle Edge Gradients for Smooth In/Out Flow */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-900 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900 to-transparent z-10" />

          <div className="animate-marquee flex items-center whitespace-nowrap will-change-transform">
            {renderTickerTrack('track-a')}
            {renderTickerTrack('track-b')}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Multi-Currency Balance Carousel */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('wallets.multi_currency_vaults', 'Multi-Currency Vaults')}
            </span>
            <div className="flex gap-1.5">
              {(wallets || []).map((w, idx) => (
                <button
                  key={w?.currency || idx}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-lg transition-all ${
                    activeCardIndex === idx
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {w?.currency ?? 'NGN'}
                </button>
              ))}
            </div>
          </div>

          {/* Active Card */}
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl transition-all duration-300">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentWallet?.flag ?? '🇳🇬'}</span>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight leading-snug">{currentWallet?.name ?? 'Multi-Currency Wallet'}</h3>
                    <p className="text-xs text-slate-400">{currentWallet?.bankName ?? 'FlyeMass Clearing Vault'}</p>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400">
                {t('wallets.active', 'ACTIVE')}
              </span>
            </div>

            {/* Big Balance Display (28-32px, font-weight 600 Semi-bold, tight tabular numerals) */}
            <div className="mt-5 relative z-10">
              <span className="text-xs text-slate-400 font-medium">{t('wallets.available_balance', 'Available Balance')}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-semibold text-emerald-400">{currentWallet?.symbol ?? '₦'}</span>
                <span className="text-3xl font-semibold text-white tracking-tight num-tabular">
                  {isBalanceHidden
                    ? '••••••••'
                    : currentWallet?.currency === 'NGN'
                    ? (currentWallet?.balance ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })
                    : (currentWallet?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1">
                  {currentWallet?.currency ?? 'NGN'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 num-tabular">
                ≈ {isBalanceHidden 
                  ? '••••' 
                  : currentWallet?.currency === 'CNY'
                  ? `₦${Math.round((currentWallet?.balance ?? 0) * 215.2).toLocaleString()} NGN`
                  : `¥${((currentWallet?.balance ?? 0) / 215.2).toLocaleString('en-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RMB`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Matrix */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('wallets.instant_actions', 'Instant Actions')}
            </span>
            <button 
              onClick={() => setIsQuickActionOpen(true)}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              {t('action.all_services', 'All Services')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.title}
                  onClick={() => (act as any).action ? (act as any).action() : navigate((act as any).route)}
                  onPointerDown={() => (act as any).route && prefetchRoute((act as any).route)}
                  onTouchStart={() => (act as any).route && prefetchRoute((act as any).route)}
                  onMouseEnter={() => (act as any).route && prefetchRoute((act as any).route)}
                  className="px-2 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 active:scale-[0.97] transition-all flex flex-col items-center text-center group cursor-pointer touch-manipulation h-full justify-between"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${act.color} border flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-sm shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[12px] font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors leading-tight text-center">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-white/60 mt-0.5 leading-tight text-center">
                      {act.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Shipment Mini Progress Widget */}
        {activeShipment && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Air / Sea Cargo
              </span>
              <button
                onClick={() => navigate('track')}
                onPointerDown={() => prefetchRoute('track')}
                onTouchStart={() => prefetchRoute('track')}
                className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5 hover:underline touch-manipulation"
              >
                <span>Track Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div 
              onClick={() => navigate('track')}
              onPointerDown={() => prefetchRoute('track')}
              onTouchStart={() => prefetchRoute('track')}
              onMouseEnter={() => prefetchRoute('track')}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden shadow-lg group touch-manipulation"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    {activeShipment.type === 'air' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">{activeShipment.trackingNumber}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold text-xs uppercase">
                        {activeShipment.type.toUpperCase()} EXPRESS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                      {activeShipment.title}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">ETA Arrival</span>
                  <p className="text-xs font-semibold text-emerald-400">{activeShipment.eta}</p>
                </div>
              </div>

              {/* Progress Line */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-300">
                    Waypoint: <span className="text-emerald-400">{activeShipment.status}</span>
                  </span>
                  <span className="text-slate-400 num-tabular font-mono">
                    {activeShipment.origin} ➔ {activeShipment.destination}
                  </span>
                </div>

                {/* 5-Stage Visual Progress Track */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {['Origin', 'Packed', 'Transit', 'Lagos', 'Done'].map((label, stepIdx) => (
                    <div key={label} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          stepIdx <= (activeShipment.currentStep || 0)
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                            : 'bg-slate-800'
                        }`}
                      />
                      <span className={`text-xs block truncate text-center ${
                        stepIdx <= (activeShipment.currentStep || 0) ? 'text-slate-300 font-medium' : 'text-slate-600'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Trade & Fair Banners Carousel */}
        {banners.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                China Trade Campaigns
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                {banners.length} Active Offers
              </span>
            </div>

            <div className="space-y-2.5">
              {banners.map((ban) => (
                <div
                  key={ban.id}
                  onClick={() => ban.destinationRoute && navigate(ban.destinationRoute)}
                  className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between shadow-xl group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden shrink-0">
                      <img src={ban.imageUrl} alt={ban.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {ban.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase">
                          VIP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {ban.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Activity
            </span>
            <button
              onClick={() => navigate('history')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View Ledger
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.category === 'Supplier' ? 'bg-indigo-500/10 text-indigo-400' :
                    tx.category === 'FX Swap' ? 'bg-amber-500/10 text-amber-400' :
                    tx.category === 'Logistics' ? 'bg-cyan-500/10 text-cyan-400' :
                    tx.category === 'Wallet Top-up' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {tx.category === 'Supplier' && <Send className="w-4 h-4" />}
                    {tx.category === 'FX Swap' && <ArrowLeftRight className="w-4 h-4" />}
                    {tx.category === 'Logistics' && <Package className="w-4 h-4" />}
                    {tx.category === 'Wallet Top-up' && <ArrowDownLeft className="w-4 h-4" />}
                    {tx.category === 'Tech Store' && <Smartphone className="w-4 h-4" />}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[170px]">{tx.title}</p>
                    <p className="text-[10px] text-slate-400">{tx.date} • {tx.paymentMethod}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-extrabold num-tabular ${
                    tx?.type === 'fund' ? 'text-emerald-400' : 'text-slate-100'
                  }`}>
                    {tx?.type === 'fund' ? '+' : '-'}
                    {tx?.currency === 'NGN' ? '₦' : tx?.currency === 'CNY' ? '¥' : '$'}
                    {(tx?.amount ?? 0).toLocaleString()}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    {tx?.status ?? 'completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
