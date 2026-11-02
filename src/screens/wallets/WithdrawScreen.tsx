import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { Building2, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Currency } from '../../types';

export const WithdrawScreen: React.FC = () => {
  const { wallets, userPin, goBack, showToast, addTransaction } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('NGN');
  const [amount, setAmount] = useState('2500000');
  const [bankName, setBankName] = useState('Zenith Bank Plc');
  const [accountNumber, setAccountNumber] = useState('2089140021');
  const [accountName, setAccountName] = useState('Chief Babatunde Alade');
  const [showPinModal, setShowPinModal] = useState(false);

  const wallet = wallets.find((w) => w.currency === selectedCurrency) || wallets[0];

  const handleWithdraw = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      showToast('Enter a valid withdrawal amount', 'error');
      return;
    }
    if (num > wallet.balance) {
      showToast(`Insufficient balance in ${selectedCurrency} wallet`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    const num = parseFloat(amount);
    wallet.balance -= num;
    addTransaction({
      title: `Withdrawal to ${bankName}`,
      category: 'Wallet Top-up',
      amount: num,
      currency: selectedCurrency,
      status: 'completed',
      reference: `WTH-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: `${accountName} (${accountNumber})`,
      paymentMethod: 'NIBSS Instant Transfer',
      type: 'withdraw'
    });
    showToast(`Withdrawal of ${wallet.symbol}${num.toLocaleString()} processed to ${bankName}`, 'success');
    goBack();
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Withdraw Funds" />

      <div className="p-4 space-y-4">
        {/* Currency selection */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Select Source Account
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['NGN', 'USD'] as Currency[]).map((c) => {
              const isSelected = selectedCurrency === c;
              const w = wallets.find((item) => item.currency === c);
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCurrency(c)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="text-white font-extrabold">{c} Wallet</p>
                  <p className="text-[10px] text-slate-400 num-tabular mt-0.5">
                    Avail: {w?.symbol}{w?.balance.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Amount to Payout
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{wallet.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-extrabold text-white outline-none num-tabular"
            />
          </div>
        </div>

        {/* Destination Bank Account */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Beneficiary Bank
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
            >
              <option>Zenith Bank Plc</option>
              <option>Access Bank Nigeria</option>
              <option>Guaranty Trust Bank (GTB)</option>
              <option>Providus Bank</option>
              <option>First Bank of Nigeria</option>
              <option>Standard Chartered (USD Domiciliary)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Account Number (NUBAN)
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none font-mono"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Beneficiary Name</span>
              <span className="font-bold text-emerald-400">{accountName}</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Authorize Payout ({wallet.symbol}{parseFloat(amount || '0').toLocaleString()})</span>
        </button>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Withdrawal"
              subtitle={`Payout ${wallet.symbol}${parseFloat(amount).toLocaleString()} to ${bankName}`}
              expectedPin={userPin}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
