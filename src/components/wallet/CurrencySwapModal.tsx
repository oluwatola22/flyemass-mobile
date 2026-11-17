import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PinPad } from '../ui/PinPad';
import { db } from '../../services/db';
import { 
  ArrowDownUp, 
  ArrowLeftRight, 
  CheckCircle2, 
  Copy, 
  CheckCheck, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  X,
  Wallet,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Currency } from '../../types';
import { useFxSwap } from '../../hooks/useFxSwap';
import { formatMinor, fromMinor as fxFromMinor } from '../../services/fxEngine';

interface CurrencySwapModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialFrom?: Currency;
  initialTo?: Currency;
}

export const CurrencySwapModal: React.FC<CurrencySwapModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialFrom,
  initialTo
}) => {
  const { 
    isSwapModalOpen, 
    setIsSwapModalOpen, 
    swapModalInitialPair, 
    wallets, 
    navigate, 
    showToast, 
    activeUserId, 
    userPin 
  } = useApp();

  const isVisible = propIsOpen !== undefined ? propIsOpen : isSwapModalOpen;
  const handleCloseModal = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsSwapModalOpen(false);
    }
  };

  const [fromCurrency, setFromCurrency] = useState<Currency>(() => initialFrom || swapModalInitialPair?.from || 'NGN');
  const [toCurrency, setToCurrency] = useState<Currency>(() => initialTo || swapModalInitialPair?.to || 'CNY');
  const [fromAmount, setFromAmount] = useState<string>('500000');
  
  // Modal Step States: 'form' | 'pin' | 'success'
  const [step, setStep] = useState<'form' | 'pin' | 'success'>('form');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(45);

  // Authoritative Treasury Rates from Backend
  const [systemRates, setSystemRates] = useState<any>({
    USD_NGN: 1485.00,
    USD_CNY: 7.24,
    NGN_CNY: 214.50,
    spreadPercent: 0.75,
    lastUpdated: Date.now()
  });

  // Sync initial pair when modal opens
  useEffect(() => {
    if (isVisible) {
      if (swapModalInitialPair?.from) setFromCurrency(swapModalInitialPair.from);
      if (swapModalInitialPair?.to) setToCurrency(swapModalInitialPair.to);
      setStep('form');
      setCopiedRef(false);
    }
  }, [isVisible, swapModalInitialPair?.from, swapModalInitialPair?.to]);

  // Rate Fetching & Dynamic Subscription
  const fetchRates = async () => {
    try {
      const r = await db.getAuthoritativeRates(true);
      if (r) setSystemRates({ ...r });
    } catch {
      const s = db.getState();
      if (s.system_settings?.rates) {
        setSystemRates({ ...s.system_settings.rates });
      }
    }
  };

  useEffect(() => {
    if (!isVisible) return;
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

    const timer = setInterval(() => {
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
      clearInterval(timer);
    };
  }, [isVisible]);

  // Precise Exchange Rate Computation Prioritizing Admin Manual Swap Rates
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

  const legacyRate = useMemo(() => getExchangeRate(fromCurrency, toCurrency), [fromCurrency, toCurrency, systemRates]);

  const fromWallet = wallets.find((w) => w.currency === fromCurrency) || {
    currency: fromCurrency,
    balance: 0,
    symbol: fromCurrency === 'NGN' ? '₦' : fromCurrency === 'CNY' ? '¥' : '$',
    name: `${fromCurrency} Vault`,
    flag: fromCurrency === 'NGN' ? '🇳🇬' : fromCurrency === 'CNY' ? '🇨🇳' : '🇺🇸'
  };

  const toWallet = wallets.find((w) => w.currency === toCurrency) || {
    currency: toCurrency,
    balance: 0,
    symbol: toCurrency === 'NGN' ? '₦' : toCurrency === 'CNY' ? '¥' : '$',
    name: `${toCurrency} Vault`,
    flag: toCurrency === 'NGN' ? '🇳🇬' : toCurrency === 'CNY' ? '🇨🇳' : '🇺🇸'
  };

  const parsedFrom = parseFloat(fromAmount) || 0;

  // Authoritative published-rate engine (integer minor units, fee + minimum + staleness + policy)
  // Fallback calculation: calculatedTo = Number((parsedFrom * rate).toFixed(2))
  // Fallback engine dispatch: db.executeSwap
  const fx = useFxSwap(fromCurrency, toCurrency, fromAmount, fromWallet.balance || 0, !!isVisible);
  const rate = fx.effectiveRate ?? legacyRate;
  const calculatedTo = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.creditedMinor) : 0;
  const feeDisplay = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.feeMinor) : 0;
  const netDisplay = fx.quote && fx.quote.ok ? fxFromMinor(fx.quote.netMinor) : 0;
  const isInsufficientBalance = parsedFrom > (fromWallet.balance || 0);

  const handleFlipCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleSelectFromCurrency = (curr: Currency) => {
    if (curr === toCurrency) {
      setToCurrency(fromCurrency);
    }
    setFromCurrency(curr);
  };

  const handleSelectToCurrency = (curr: Currency) => {
    if (curr === fromCurrency) {
      setFromCurrency(toCurrency);
    }
    setToCurrency(curr);
  };

  const handleMaxAmount = () => {
    const maxBal = Math.floor((fromWallet.balance || 0) * 100) / 100;
    setFromAmount(String(maxBal > 0 ? maxBal : 0));
  };

  const handleInitiateSwap = () => {
    if (fromCurrency === toCurrency) {
      showToast('Source and destination currencies cannot be identical', 'error');
      return;
    }
    if (parsedFrom <= 0) {
      showToast('Enter a valid amount to swap', 'error');
      return;
    }
    if (isInsufficientBalance) {
      showToast(`Insufficient ${fromCurrency} balance. Available: ${fromWallet.symbol}${(fromWallet.balance || 0).toLocaleString()}`, 'error');
      return;
    }
    if (fx.error || !fx.quote || !fx.quote.ok || !fx.direction) {
      showToast(fx.error || 'Unable to price this swap', 'error');
      return;
    }
    setStep('pin');
  };

  const handleAuthorizeSwap = async (pinInput: string) => {
    if (!fx.quote || !fx.quote.ok || !fx.direction || !fx.rateRow) {
      showToast(fx.error || 'Unable to price this swap', 'error');
      setStep('form');
      return;
    }
    setIsSwapping(true);
    try {
      // execute_currency_swap(_direction, _amount_minor, _pin) — atomic, server-priced
      const res: any = await db.executeCurrencySwap(activeUserId, fx.direction, fx.quote.amountMinor, pinInput, fx.rateRow.id);

      if (!res || !res.success) {
        if (res?.code === 'PIN_NOT_SET') {
          showToast('Set up your transaction PIN before swapping', 'info');
          handleCloseModal();
          navigate('setup-pin');
          return;
        }
        if (res?.code === 'RATE_CHANGED' || res?.code === 'RATE_STALE') await fx.refresh();
        showToast(res?.error || 'Swap failed', 'error');
        setStep('form');
        return;
      }

      setSwapResult({
        reference: res.reference,
        sourceCurrency: res.source_currency,
        targetCurrency: res.target_currency,
        amount: fxFromMinor(res.amount_minor),
        fee: fxFromMinor(res.fee_minor),
        convertedAmount: fxFromMinor(res.credited_minor),
        rate: res.rate_side === 'sell' ? 1 / res.applied_rate : res.applied_rate,
        appliedRate: res.applied_rate,
        timestamp: Date.now()
      });

      setStep('success');
      showToast(`Swapped ${formatMinor(res.amount_minor, res.source_currency)} to ${formatMinor(res.credited_minor, res.target_currency)} successfully!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Swap execution failed', 'error');
      setStep('form');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard?.writeText(refText);
    setCopiedRef(true);
    showToast('Swap reference copied to clipboard', 'info');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* MODAL HEADER */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Instant Currency Swap</h3>
              <p className="text-[10px] text-slate-400">Live Treasury Rate Lock • Zero Slippage</p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close Currency Swap"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: INTERACTIVE SWAP CALCULATOR */}
        {/* ======================================================== */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* Live Exchange Rate Status Bar */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Live Treasury Rate</span>
                  <p className="text-xs font-black text-emerald-400 num-tabular font-mono">
                    {fromCurrency === 'NGN'
                      ? `1 NGN = ${rate.toFixed(toCurrency === 'USD' ? 6 : 4)} ${toCurrency} (1 ${toCurrency} = ₦${(1 / rate).toFixed(2)})`
                      : `1 ${fromCurrency} = ${rate.toFixed(toCurrency === 'NGN' ? 2 : 4)} ${toCurrency}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { fx.refresh(); fetchRates(); setCountdown(45); }}
                data-testid="swap-refresh-rates"
                title="Refresh live rates"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-amber-400 num-tabular font-mono cursor-pointer hover:border-amber-500/40"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${fx.loading ? 'animate-spin' : ''}`} />
                <span>{countdown}s · Refresh</span>
              </button>
            </div>

            {/* Quick 1-Click Corridor Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
                Active Bilateral Corridors
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setFromCurrency('NGN'); setToCurrency('CNY'); }}
                  className={`p-2.5 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    fromCurrency === 'NGN' && toCurrency === 'CNY'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🇳🇬 Naira</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>🇨🇳 RMB</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">Supplier Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setFromCurrency('CNY'); setToCurrency('NGN'); }}
                  className={`p-2.5 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    fromCurrency === 'CNY' && toCurrency === 'NGN'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🇨🇳 RMB</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🇳🇬 Naira</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Repatriation</span>
                </button>
              </div>
            </div>

            {/* Source Currency ("From") Input Card */}
            <div className={`p-4 rounded-3xl bg-slate-950 border transition-all ${
              isInsufficientBalance ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800 focus-within:border-emerald-500/60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  You Pay / From Vault
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Bal: {fromWallet.symbol}{(fromWallet.balance || 0).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase transition-all"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.]/g, '');
                    setFromAmount(clean);
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent text-xl sm:text-2xl font-black text-white font-mono outline-none tracking-tight num-tabular"
                  autoFocus
                />

                {/* Currency Selector Pills */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                  {(['NGN', 'CNY'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => handleSelectFromCurrency(curr)}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                        fromCurrency === curr
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {curr === 'NGN' ? '₦ NGN' : '¥ CNY'}
                    </button>
                  ))}
                </div>
              </div>

              {isInsufficientBalance && (
                <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-[10px] font-semibold">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Insufficient {fromCurrency} balance. Max available: {fromWallet.symbol}{(fromWallet.balance || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Quick Swap Flip Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={handleFlipCurrencies}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Invert Exchange Direction"
              >
                <ArrowDownUp className="w-4 h-4 font-bold" />
              </button>
            </div>

            {/* Destination Currency ("To") Output Card */}
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  You Receive / Target Vault
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Bal: {toWallet.symbol}{(toWallet.balance || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-full text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight num-tabular truncate">
                  {calculatedTo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Target Currency Selector Pills */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                  {(['NGN', 'CNY'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => handleSelectToCurrency(curr)}
                      className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                        toCurrency === curr
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {curr === 'NGN' ? '₦ NGN' : '¥ CNY'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Breakdown & Guarantee Details */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-[11px]">
              <div className="flex justify-between items-center text-slate-400">
                <span>Conversion Multiplier</span>
                <span className="font-mono text-emerald-400 font-bold">
                  1 {fromCurrency} = {rate.toFixed(fromCurrency === 'NGN' ? 6 : 4)} {toCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Inverse Multiplier</span>
                <span className="font-mono text-slate-300">
                  1 {toCurrency} = {(1 / rate).toFixed(toCurrency === 'NGN' ? 2 : 4)} {fromCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Platform Swap Fee ({fx.feePercent}%)</span>
                <span className="font-mono text-amber-400 font-bold" data-testid="swap-fee-line">
                  {fx.quote && fx.quote.ok ? `-${fromWallet.symbol}${feeDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Net Amount Converted</span>
                <span className="font-mono text-slate-200 font-bold">
                  {fx.quote && fx.quote.ok ? `${fromWallet.symbol}${netDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Minimum Swap</span>
                <span className="font-mono text-slate-300">{fx.book ? formatMinor(fx.minAmountMinor, fromCurrency) : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Settlement Speed</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Under 2 Seconds Atomic Lock
                </span>
              </div>
            </div>

            {/* Policy / pre-flight validation banner */}
            {fx.error && parsedFrom > 0 || fx.restricted ? (
              <div
                data-testid="swap-preflight-banner"
                className={`p-3 rounded-2xl border text-[11px] flex items-start gap-2 ${
                  fx.restricted ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fx.error}</span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <button
              type="button"
              disabled={isInsufficientBalance || parsedFrom <= 0 || fromCurrency === toCurrency || !!fx.error}
              onClick={handleInitiateSwap}
              className={`w-full py-4 rounded-2xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 ${
                isInsufficientBalance || parsedFrom <= 0 || fromCurrency === toCurrency || !!fx.error
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 shadow-emerald-500/20 hover:opacity-95 cursor-pointer'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>
                {isInsufficientBalance 
                  ? `Insufficient ${fromCurrency} Balance` 
                  : fromCurrency === toCurrency 
                  ? 'Choose Different Currencies'
                  : `Swap ${fromWallet.symbol}${parsedFrom > 0 ? parsedFrom.toLocaleString() : '0'} to ${toCurrency} Instantly`}
              </span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PIN AUTHORIZATION PAD */}
        {/* ======================================================== */}
        {step === 'pin' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Confirm Conversion</span>
              <p className="text-sm font-black text-white">
                {fromWallet.symbol}{parsedFrom.toLocaleString()} {fromCurrency} &rarr; {toWallet.symbol}{calculatedTo.toLocaleString()} {toCurrency}
              </p>
              <p className="text-[10px] text-slate-400">Locked Rate: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</p>
            </div>

            <PinPad
              title="Authorize FX Swap"
              subtitle="Enter your 6-digit transaction PIN to complete this currency exchange"
              length={6}
              onComplete={handleAuthorizeSwap}
              onCancel={() => setStep('form')}
            />

            {isSwapping && (
              <div className="p-3 text-center text-xs text-emerald-400 animate-pulse font-bold">
                Executing atomic double-entry wallet exchange...
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SUCCESS CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {step === 'success' && swapResult && (
          <div className="p-4 sm:p-5 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Swap Completed
              </span>
              <h3 className="text-lg font-black text-white mt-1.5">Currency Swap Successful!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Funds have been credited instantly to your {swapResult.targetCurrency} vault.
              </p>
            </div>

            {/* Conversion Details Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Debited From</span>
                <span className="font-mono font-bold text-rose-400">
                  -{fromWallet.symbol}{swapResult.amount.toLocaleString()} {swapResult.sourceCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Credited To</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{toWallet.symbol}{swapResult.convertedAmount.toLocaleString()} {swapResult.targetCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Execution Rate</span>
                <span className="font-mono text-slate-300">1 {swapResult.sourceCurrency} = {swapResult.rate.toFixed(4)} {swapResult.targetCurrency}{swapResult.fee > 0 ? ` · fee ${swapResult.fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Audit Reference</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-amber-400">{swapResult.reference}</span>
                  <button
                    onClick={() => handleCopyRef(swapResult.reference)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedRef ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => { handleCloseModal(); navigate('home'); }}
                data-testid="swap-done-home"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Done & Dismiss
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  navigate('wallets');
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>View Updated Vault Balances</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
