import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  ArrowDownUp, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Copy,
  CheckCheck,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { Currency } from '../../types';
import { useFxSwap } from '../../hooks/useFxSwap';
import { formatMinor, fromMinor as fxFromMinor } from '../../services/fxEngine';

export const ExchangeScreen: React.FC = () => {
  const { wallets, goBack, navigate, showToast, activeUserId } = useApp();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, []);
  
  const [fromCurrency, setFromCurrency] = useState<Currency>('NGN');
  const [toCurrency, setToCurrency] = useState<Currency>('CNY');
  const [fromAmount, setFromAmount] = useState<string>('500000');
  
  // Modals & State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [completedSwapResult, setCompletedSwapResult] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Authoritative Treasury Rates from Backend
  const [systemRates, setSystemRates] = useState<any>({
    USD_NGN: 1485.00,
    USD_CNY: 7.24,
    NGN_CNY: 214.50,
    spreadPercent: 0.75,
    lastUpdated: Date.now(),
    updatedBy: 'Central Treasury'
  });

  // Countdown timer for rate refresh
  const [countdown, setCountdown] = useState<number>(45);

  const fetchRates = async () => {
    try {
      const r = await db.getAuthoritativeRates(true);
      if (r) setSystemRates({ ...r });
    } catch (e) {
      // fallback to state
      const s = db.getState();
      if (s.system_settings?.rates) {
        setSystemRates({ ...s.system_settings.rates });
      }
    }
  };

  useEffect(() => {
    fetchRates();
    const unsubscribe = db.subscribe(() => {
      const s = db.getState();
      if (s.system_settings?.rates) {
        const nextRates = s.system_settings.rates;
        setSystemRates((prev: any) => {
          if (
            prev &&
            prev.USD_NGN === nextRates.USD_NGN &&
            prev.USD_CNY === nextRates.USD_CNY &&
            prev.NGN_CNY === nextRates.NGN_CNY &&
            prev.spreadPercent === nextRates.spreadPercent &&
            prev.lastUpdated === nextRates.lastUpdated
          ) {
            return prev;
          }
          return { ...nextRates };
        });
      }
    });
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchRates();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getExchangeRate = (from: Currency, to: Currency): number => {
    if (from === to) return 1;

    // 1. Direct Authoritative Manual Rates Configured by Admin
    if (from === 'CNY' && to === 'NGN' && (systemRates.CNY_to_NGN || systemRates.input_cny_to_ngn)) {
      return Number(systemRates.CNY_to_NGN || systemRates.input_cny_to_ngn);
    }
    if (from === 'NGN' && to === 'CNY') {
      if (systemRates.NGN_to_CNY) return Number(systemRates.NGN_to_CNY);
      if (systemRates.naira_per_rmb) return 1 / Number(systemRates.naira_per_rmb);
      if (systemRates.input_ngn_to_cny) return 1 / Number(systemRates.input_ngn_to_cny);
    }
    if (from === 'USD' && to === 'NGN' && (systemRates.USD_to_NGN || systemRates.input_usd_to_ngn)) {
      return Number(systemRates.USD_to_NGN || systemRates.input_usd_to_ngn);
    }
    if (from === 'NGN' && to === 'USD') {
      if (systemRates.NGN_to_USD) return Number(systemRates.NGN_to_USD);
      if (systemRates.naira_per_usd) return 1 / Number(systemRates.naira_per_usd);
      if (systemRates.input_ngn_to_usd) return 1 / Number(systemRates.input_ngn_to_usd);
    }
    if (from === 'USD' && to === 'CNY' && (systemRates.USD_to_CNY || systemRates.input_usd_to_cny)) {
      return Number(systemRates.USD_to_CNY || systemRates.input_usd_to_cny);
    }
    if (from === 'CNY' && to === 'USD' && (systemRates.CNY_to_USD || systemRates.input_cny_to_usd)) {
      const val = Number(systemRates.CNY_to_USD || systemRates.input_cny_to_usd);
      return val > 1 ? (1 / val) : val;
    }

    // 2. Base clearing rate calculation fallback
    const spread = (systemRates.spreadPercent || 0.75) / 100;
    const ngnRmb = Number(systemRates.NGN_CNY || 214.50);
    const usdNgn = Number(systemRates.USD_NGN || systemRates.NGN_USD || 1485.00);
    const usdCny = Number(systemRates.USD_CNY || 7.24);

    if (from === 'CNY' && to === 'NGN') return ngnRmb * (1 - spread);
    if (from === 'NGN' && to === 'CNY') return (1 / ngnRmb) * (1 - spread);
    if (from === 'USD' && to === 'NGN') return usdNgn * (1 - spread);
    if (from === 'NGN' && to === 'USD') return (1 / usdNgn) * (1 - spread);
    if (from === 'USD' && to === 'CNY') return usdCny * (1 - spread);
    if (from === 'CNY' && to === 'USD') return (1 / usdCny) * (1 - spread);
    return 1;
  };

  const legacyRate = getExchangeRate(fromCurrency, toCurrency);
  const fromWallet = wallets.find((w) => w.currency === fromCurrency);
  const toWallet = wallets.find((w) => w.currency === toCurrency);

  const parsedFrom = parseFloat(fromAmount) || 0;

  // Authoritative published-rate engine: integer minor units, fee, minimum, staleness, USD⇄NGN policy
  const fx = useFxSwap(fromCurrency, toCurrency, fromAmount, fromWallet?.balance || 0, true);
  const rate = fx.effectiveRate ?? legacyRate;
  const calculatedTo = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.creditedMinor) : 0;
  const feeDisplay = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.feeMinor) : 0;
  const netDisplay = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.netMinor) : 0;

  const handleFlipCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleOpenReview = () => {
    if (fromCurrency === toCurrency) {
      showToast('Source and destination currencies cannot be identical', 'error');
      return;
    }
    if (parsedFrom <= 0) {
      showToast('Enter a valid amount to swap', 'error');
      return;
    }
    if ((fromWallet?.balance || 0) < parsedFrom) {
      showToast(`Insufficient ${fromCurrency} balance in vault`, 'error');
      return;
    }
    if (fx.error || !fx.quote || !fx.quote.ok || !fx.direction) {
      showToast(fx.error || 'Unable to price this swap', 'error');
      return;
    }
    setShowReviewModal(true);
  };

  const handleProceedToPin = () => {
    setShowReviewModal(false);
    setShowPinModal(true);
  };

  const handleAuthorizeSwap = async (pin: string) => {
    if (!fx.quote || !fx.quote.ok || !fx.direction || !fx.rateRow) {
      showToast(fx.error || 'Unable to price this swap', 'error');
      setShowPinModal(false);
      return;
    }
    setIsSwapping(true);
    try {
      // execute_currency_swap(_direction, _amount_minor, _pin): atomic, server-priced, rate-locked
      const res: any = await db.executeCurrencySwap(activeUserId, fx.direction, fx.quote.amountMinor, pin, fx.rateRow.id);

      if (!res || !res.success) {
        if (res?.code === 'PIN_NOT_SET') {
          setShowPinModal(false);
          showToast('Set up your transaction PIN before swapping', 'info');
          navigate('setup-pin');
          return;
        }
        if (res?.code === 'RATE_CHANGED' || res?.code === 'RATE_STALE') {
          await fx.refresh();
          setShowPinModal(false);
        }
        showToast(res?.error || 'Swap failed', 'error');
        return;
      }

      setShowPinModal(false);
      setCompletedSwapResult({
        reference: res.reference,
        sourceCurrency: res.source_currency,
        targetCurrency: res.target_currency,
        amount: fxFromMinor(res.amount_minor),
        fee: fxFromMinor(res.fee_minor),
        convertedAmount: fxFromMinor(res.credited_minor),
        rate: res.rate_side === 'sell' ? 1 / res.applied_rate : res.applied_rate,
        timestamp: Date.now()
      });
      showToast(`Swapped ${formatMinor(res.amount_minor, res.source_currency)} to ${formatMinor(res.credited_minor, res.target_currency)} successfully!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Swap execution failed', 'error');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard?.writeText(refText);
    setCopiedRef(true);
    showToast('Reference copied to clipboard', 'info');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Multi-Currency Exchange" />

      <div className="p-4 space-y-4">
        {/* Treasury Rate Lock Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Configured Treasury Rate</span>
              <p className="text-xs font-black text-white num-tabular font-mono">
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { fx.refresh(); fetchRates(); setCountdown(45); }}
            data-testid="exchange-refresh-rates"
            title="Refresh live rates"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold num-tabular font-mono cursor-pointer hover:border-amber-500/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fx.loading ? 'animate-spin' : ''}`} />
            <span>{countdown}s · Refresh</span>
          </button>
        </div>

        {/* Quick 1-Click Popular Corridor Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
            Bilateral Currency Swaps
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setFromCurrency('NGN'); setToCurrency('CNY'); }}
              className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                fromCurrency === 'NGN' && toCurrency === 'CNY'
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🇳🇬 Naira &rarr; 🇨🇳 RMB</span>
              <span className="text-[10px] font-mono text-amber-400">Trade Pay</span>
            </button>

            <button
              type="button"
              onClick={() => { setFromCurrency('CNY'); setToCurrency('NGN'); }}
              className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                fromCurrency === 'CNY' && toCurrency === 'NGN'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🇨🇳 RMB &rarr; 🇳🇬 Naira</span>
              <span className="text-[10px] font-mono text-emerald-400">Repatriate</span>
            </button>
          </div>
        </div>

        {/* Currency Pair Split-Screen Calculator */}
        <div className="relative space-y-2">
          {/* Top: You Pay */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500/60 transition-all shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">You Pay (Debit Source)</span>
              <span className="num-tabular text-[11px] font-mono">
                Available: {fromWallet?.symbol}{(fromWallet?.balance ?? 0).toLocaleString()} {fromCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-black text-white outline-none num-tabular font-mono"
              />

              {/* Currency Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    const nextFrom = e.target.value as Currency;
                    setFromCurrency(nextFrom);
                    if (nextFrom === toCurrency) {
                      setToCurrency(nextFrom === 'NGN' ? 'CNY' : 'NGN');
                    }
                  }}
                  className="appearance-none bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-bold text-white pr-7 cursor-pointer outline-none hover:bg-slate-750"
                >
                  <option value="NGN">🇳🇬 NGN</option>
                  <option value="CNY">🇨🇳 CNY (RMB)</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800/80">
              {[0.25, 0.5, 0.75, 1.0].map((fraction) => (
                <button
                  key={fraction}
                  type="button"
                  onClick={() => {
                    if (fromWallet) setFromAmount(Math.floor(fromWallet.balance * fraction).toString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  {fraction === 1.0 ? '100% Max' : `${fraction * 100}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Center Flip Floating Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              onClick={handleFlipCurrencies}
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
              title="Flip currencies"
            >
              <ArrowDownUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom: You Receive */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500/60 transition-all shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">You Receive (Credit Target)</span>
              <span className="num-tabular text-[11px] font-mono">
                Vault: {toWallet?.symbol}{(toWallet?.balance ?? 0).toLocaleString()} {toCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-black text-emerald-400 num-tabular font-mono truncate">
                {calculatedTo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              {/* Currency Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    const nextTo = e.target.value as Currency;
                    setToCurrency(nextTo);
                    if (nextTo === fromCurrency) {
                      setFromCurrency(nextTo === 'CNY' ? 'NGN' : 'CNY');
                    }
                  }}
                  className="appearance-none bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-bold text-white pr-7 cursor-pointer outline-none hover:bg-slate-750"
                >
                  <option value="CNY">🇨🇳 CNY (RMB)</option>
                  <option value="NGN">🇳🇬 NGN</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Double-entry balanced settlement. Guaranteed rate lock.</span>
            </p>
          </div>
        </div>

        {/* Live Swap Breakdown Summary */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between text-slate-400">
            <span>Conversion Multiplier:</span>
            <span className="font-mono text-emerald-400 font-bold">1 {fromCurrency} = {rate.toFixed(fromCurrency === 'NGN' ? 6 : 4)} {toCurrency}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Inverse Multiplier:</span>
            <span className="font-mono text-slate-300">1 {toCurrency} = {(1 / rate).toFixed(toCurrency === 'NGN' ? 2 : 4)} {fromCurrency}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Platform Swap Fee ({fx.feePercent}%):</span>
            <span className="text-amber-400 font-bold font-mono" data-testid="exchange-fee-line">
              {fx.quote && fx.quote.ok ? `-${fromWallet?.symbol || ''}${feeDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Net Amount Converted:</span>
            <span className="text-slate-200 font-bold font-mono">
              {fx.quote && fx.quote.ok ? `${fromWallet?.symbol || ''}${netDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Minimum Swap:</span>
            <span className="text-slate-300 font-mono">{fx.book ? formatMinor(fx.minAmountMinor, fromCurrency) : '—'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Rate Source:</span>
            <span className="text-slate-300 font-medium">Authoritative Admin Central Treasury</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2">
            <span>Settlement SLA:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Instant Atomic Execution (&lt; 2s)
            </span>
          </div>
        </div>

        {/* Policy / pre-flight validation banner */}
        {(fx.restricted || (fx.error && parsedFrom > 0)) && (
          <div
            data-testid="exchange-preflight-banner"
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
              fx.restricted ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fx.error}</span>
          </div>
        )}

        {/* CTA Review Button */}
        <button
          disabled={!!fx.error}
          onClick={handleOpenReview}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Review Currency Exchange</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* REVIEW BREAKDOWN MODAL */}
      {/* ======================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Review Currency Exchange</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">You Pay:</span>
                  <span className="font-mono font-bold text-white">
                    {fromWallet?.symbol}{parsedFrom.toLocaleString()} {fromCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">You Receive:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {toWallet?.symbol}{calculatedTo.toLocaleString()} {toCurrency}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">Exchange Rate:</span>
                  <span className="font-mono text-slate-200">1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Exchange Fee ({fx.feePercent}%):</span>
                  <span className="font-mono text-amber-400 font-bold">{fromWallet?.symbol}{feeDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-emerald-300 block">Post-Exchange Vault Forecast:</span>
                <p>• {fromCurrency} Balance: <span className="font-mono text-white">{fromWallet?.symbol}{((fromWallet?.balance || 0) - parsedFrom).toLocaleString()}</span></p>
                <p>• {toCurrency} Balance: <span className="font-mono text-white">{toWallet?.symbol}{((toWallet?.balance || 0) + calculatedTo).toLocaleString()}</span></p>
              </div>
            </div>

            <button
              onClick={handleProceedToPin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Enter 6-Digit PIN to Execute
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6-DIGIT TRANSACTION PIN PAD MODAL (Shows from the Top) */}
      {/* ======================================================== */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-200 mt-2">
            <PinPad
              title="Authorize FX Swap"
              subtitle={`Swap ${fromCurrency} ${parsedFrom.toLocaleString()} to ${toCurrency} ${calculatedTo.toLocaleString()}`}
              onComplete={handleAuthorizeSwap}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EXCHANGE SUCCESS RECEIPT MODAL */}
      {/* ======================================================== */}
      {completedSwapResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-white">Currency Swapped!</h3>
              <p className="text-xs text-slate-400">
                Debited {completedSwapResult.sourceCurrency} {completedSwapResult.amount.toLocaleString()} · Credited {completedSwapResult.targetCurrency} {completedSwapResult.convertedAmount.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Exchange Ref:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-white font-bold">{completedSwapResult.reference}</span>
                  <button 
                    onClick={() => handleCopyRef(completedSwapResult.reference)}
                    className="p-1 hover:text-emerald-400 text-slate-500"
                  >
                    {copiedRef ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Exchange Rate:</span>
                <span className="font-mono text-slate-200">1 {completedSwapResult.sourceCurrency} = {completedSwapResult.rate.toFixed(4)} {completedSwapResult.targetCurrency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Completed (Settled)
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setCompletedSwapResult(null);
                  navigate('home');
                }}
                data-testid="exchange-done-home"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Done · Return Home
              </button>

              <button
                onClick={() => {
                  setCompletedSwapResult(null);
                  setFromAmount('');
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Perform Another Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
