import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  ArrowDownUp, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Currency } from '../../types';

export const ExchangeScreen: React.FC = () => {
  const { wallets, executeSwap, goBack, showToast } = useApp();
  
  const [fromCurrency, setFromCurrency] = useState<Currency>('NGN');
  const [toCurrency, setToCurrency] = useState<Currency>('CNY');
  const [fromAmount, setFromAmount] = useState<string>('5000000');
  
  // Rate lock timer (60 seconds countdown)
  const [countdown, setCountdown] = useState<number>(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          showToast('Live FX rate refreshed', 'info');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getExchangeRate = (from: Currency, to: Currency): number => {
    if (from === to) return 1;
    // Base rates
    if (from === 'CNY' && to === 'NGN') return 214.50;
    if (from === 'NGN' && to === 'CNY') return 1 / 214.50;
    if (from === 'USD' && to === 'NGN') return 1485.00;
    if (from === 'NGN' && to === 'USD') return 1 / 1485.00;
    if (from === 'USD' && to === 'CNY') return 7.24;
    if (from === 'CNY' && to === 'USD') return 1 / 7.24;
    return 1;
  };

  const rate = getExchangeRate(fromCurrency, toCurrency);
  const fromWallet = wallets.find((w) => w.currency === fromCurrency);
  const toWallet = wallets.find((w) => w.currency === toCurrency);

  const parsedFrom = parseFloat(fromAmount) || 0;
  const calculatedTo = parsedFrom * rate;

  const handleFlipCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleSwap = () => {
    if (parsedFrom <= 0) {
      showToast('Enter a valid amount to swap', 'error');
      return;
    }
    const success = executeSwap(fromCurrency, toCurrency, parsedFrom, calculatedTo);
    if (success) {
      goBack();
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Instant FX Swap" />

      <div className="p-4 space-y-4">
        {/* Live Rate Lock Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Locked Rate</span>
              <p className="text-xs font-bold text-white num-tabular">
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold num-tabular">
            <Clock className="w-3.5 h-3.5" />
            <span>{countdown}s lock</span>
          </div>
        </div>

        {/* Split-Screen Calculator Layout */}
        <div className="relative space-y-2">
          {/* Top: You Pay */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">You Pay (From Vault)</span>
              <span className="num-tabular text-[11px]">
                Available: {fromWallet?.symbol}{fromWallet?.balance.toLocaleString()} {fromCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-extrabold text-white outline-none num-tabular"
              />

              {/* Currency Dropdown Pill */}
              <div className="relative shrink-0">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as Currency)}
                  className="appearance-none bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-bold text-white pr-7 cursor-pointer outline-none hover:bg-slate-750"
                >
                  <option value="NGN">🇳🇬 NGN</option>
                  <option value="CNY">🇨🇳 CNY (RMB)</option>
                  <option value="USD">🇺🇸 USD</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>

            <div className="flex gap-2 mt-2.5">
              {[0.25, 0.5, 1.0].map((fraction) => (
                <button
                  key={fraction}
                  type="button"
                  onClick={() => {
                    if (fromWallet) setFromAmount(Math.floor(fromWallet.balance * fraction).toString());
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white"
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
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-black/60"
            >
              <ArrowDownUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom: You Receive */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">You Receive (Estimated)</span>
              <span className="num-tabular text-[11px]">
                Vault: {toWallet?.symbol}{toWallet?.balance.toLocaleString()} {toCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-extrabold text-emerald-400 num-tabular truncate">
                {calculatedTo.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>

              {/* Currency Dropdown Pill */}
              <div className="relative shrink-0">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value as Currency)}
                  className="appearance-none bg-slate-800 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-bold text-white pr-7 cursor-pointer outline-none hover:bg-slate-750"
                >
                  <option value="CNY">🇨🇳 CNY (RMB)</option>
                  <option value="NGN">🇳🇬 NGN</option>
                  <option value="USD">🇺🇸 USD</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2.5">
              Guaranteed execution with zero spread slippage.
            </p>
          </div>
        </div>

        {/* Live Swap Breakdown Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Locked Rate</span>
            <span className="font-mono text-slate-200">1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Exchange Fee</span>
            <span className="text-emerald-400 font-bold">0.00% (FlyeMass Free Tier)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Slippage Protection</span>
            <span className="text-slate-200">Strict 0.00% (Fixed Rate)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2">
            <span>Settlement Time</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Instant (Under 3 seconds)
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSwap}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Confirm Instant FX Swap</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
