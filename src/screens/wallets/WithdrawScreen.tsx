import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  Building2, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock,
  Info,
  Receipt
} from 'lucide-react';

const NIGERIAN_BANKS = [
  { name: 'Zenith Bank Plc', code: '057' },
  { name: 'Access Bank Nigeria', code: '044' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Kuda Microfinance Bank', code: '090267' },
  { name: 'OPay Digital Services', code: '090405' },
  { name: 'PalmPay Limited', code: '090336' }
];

export const WithdrawScreen: React.FC = () => {
  const { wallets, goBack, showToast, activeUserId } = useApp();
  const [amount, setAmount] = useState('250000');
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('2089140022');
  const [accountName, setAccountName] = useState('Chief Babatunde Alade');
  const [withdrawalNote, setWithdrawalNote] = useState('Trade profits liquidation');
  
  // NUBAN verification
  const [isVerifyingNuban, setIsVerifyingNuban] = useState(false);
  const [nubanError, setNubanError] = useState<string | null>(null);

  // Review & PIN Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  const ngnWallet = wallets.find((w) => w.currency === 'NGN');
  const ngnBalance = ngnWallet?.balance || 0;
  const FLAT_FEE_NGN = 50; // Phase 8 flat ₦50 processing fee

  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length === 10) {
      setIsVerifyingNuban(true);
      setNubanError(null);

      db.enquireAccount(selectedBank.code, cleanAcc)
        .then((res) => {
          setIsVerifyingNuban(false);
          if (res && res.success && res.accountName) {
            setAccountName(res.accountName);
            setNubanError(null);
          } else if (res && res.error) {
            setNubanError(res.error);
          }
        })
        .catch(() => {
          setIsVerifyingNuban(false);
        });
    } else {
      if (cleanAcc.length > 0 && cleanAcc.length < 10) {
        setNubanError('Account number must be exactly 10 digits');
      } else {
        setNubanError(null);
      }
    }
  }, [accountNumber, selectedBank]);

  const validateForm = (): boolean => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 1000) {
      showToast('Minimum withdrawal amount is ₦1,000.00 NGN', 'error');
      return false;
    }

    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length !== 10) {
      showToast('Please enter a valid 10-digit NUBAN account number', 'error');
      return false;
    }

    if (nubanError) {
      showToast(`Invalid account details: ${nubanError}`, 'error');
      return false;
    }

    if (!accountName.trim()) {
      showToast('Please verify beneficiary account name', 'error');
      return false;
    }

    const totalDeduction = num + FLAT_FEE_NGN;
    if (totalDeduction > ngnBalance) {
      showToast(`Insufficient NGN balance. Total debit required: ₦${totalDeduction.toLocaleString()} (Available: ₦${(ngnBalance ?? 0).toLocaleString()})`, 'error');
      return false;
    }

    return true;
  };

  const handleInitiateReview = () => {
    if (!validateForm()) return;
    setShowReviewModal(true);
  };

  const handleProceedToPin = () => {
    setShowReviewModal(false);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (enteredPin: string) => {
    const num = parseFloat(amount);
    setIsSubmitting(true);
    try {
      const res = await db.requestWithdrawal(
        activeUserId,
        selectedBank.name,
        accountNumber.replace(/\D/g, ''),
        accountName.trim(),
        num,
        enteredPin,
        {
          fee: FLAT_FEE_NGN,
          bankCode: selectedBank.code,
          customerNote: withdrawalNote.trim() || 'Bank transfer',
          idempotencyKey: `wd_${activeUserId}_${Date.now()}`
        }
      );

      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }

      setShowPinModal(false);
      setSubmissionReceipt({
        reference: res?.withdrawal?.reference || `WD-${Math.floor(10000000 + Math.random() * 90000000)}`,
        amount: num,
        fee: FLAT_FEE_NGN,
        totalDeduction: num + FLAT_FEE_NGN,
        bankName: selectedBank.name,
        accountNumber: accountNumber.replace(/\D/g, ''),
        accountName: accountName.trim(),
        note: withdrawalNote.trim() || 'Bank transfer',
        status: 'Pending',
        timestamp: new Date().toLocaleString()
      });
      showToast(`Withdrawal request queued for clearance! Ref: ${res?.withdrawal?.reference}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Withdrawal communication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(amount || '0');
  const validAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
  const totalDeduction = validAmount + FLAT_FEE_NGN;

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Withdraw Naira (NGN)" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* NGN Balance Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇳🇬</span>
            <div>
              <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">
                NGN Naira Wallet
              </span>
              <p className="font-extrabold text-emerald-400 num-tabular text-lg">
                ₦{(ngnBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            NUBAN Payout
          </span>
        </div>

        {/* Amount Input Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Amount to Withdraw (₦ NGN)
            </label>
            <span className="text-[10px] text-slate-500">Min: ₦1,000.00</span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-2xl font-bold text-emerald-400">₦</span>
            <input
              type="number"
              step="100"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1,000"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-2xl font-extrabold text-white num-tabular"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
            <span>Standard NIP Clearance: 5 - 30 mins</span>
            <span className="text-slate-300">Processing Fee: ₦{FLAT_FEE_NGN}.00</span>
          </div>
        </div>

        {/* Destination Bank Account Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            Destination Bank Account
          </h3>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Beneficiary Bank
            </label>
            <select
              value={selectedBank.code}
              onChange={(e) => {
                const found = NIGERIAN_BANKS.find(b => b.code === e.target.value);
                if (found) setSelectedBank(found);
              }}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
            >
              {NIGERIAN_BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              NUBAN Account Number (10 Digits)
            </label>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 2089140022"
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white outline-none font-mono focus:border-emerald-500 tracking-wider"
            />
          </div>

          {/* NIBSS Account Holder Name Verification */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex-1 mr-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Beneficiary Name (NIBSS Enquiry)
              </span>
              {isVerifyingNuban ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mt-0.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enquiring NIBSS Instant Switch...</span>
                </div>
              ) : nubanError ? (
                <span className="font-semibold text-rose-400 text-xs block mt-0.5">{nubanError}</span>
              ) : (
                <span className="font-bold text-emerald-400 text-xs block mt-0.5">{accountName}</span>
              )}
            </div>
            {isVerifyingNuban ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : nubanError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Withdrawal Purpose / Note (Optional)
            </label>
            <input
              type="text"
              value={withdrawalNote}
              onChange={(e) => setWithdrawalNote(e.target.value)}
              placeholder="e.g. Supplier settlement or Personal transfer"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Fee & Deduction Breakdown Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Withdrawal Amount:</span>
            <span className="font-extrabold text-white num-tabular">₦{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Processing Fee (NIP):</span>
            <span className="font-bold text-slate-200 num-tabular">₦{FLAT_FEE_NGN}.00 NGN</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
            <span className="font-bold text-slate-200">Total Wallet Debit:</span>
            <span className="font-black text-emerald-400 num-tabular">₦{totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN</span>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
          <p className="leading-snug text-[11px]">
            Funds are settled directly through CBN-licensed commercial banks and NIBSS Instant Payments. Submissions are queued for clearance.
          </p>
        </div>

        <button
          onClick={handleInitiateReview}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Review Payout (₦{validAmount.toLocaleString()})</span>
        </button>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Review Withdrawal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Verify bank details before PIN entry</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary Name:</span>
                <span className="font-bold text-white text-right max-w-[180px] truncate">{accountName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank:</span>
                <span className="font-semibold text-slate-200 text-right max-w-[180px] truncate">{selectedBank.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Number:</span>
                <span className="font-mono text-emerald-400 font-bold tracking-wider">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Note:</span>
                <span className="text-slate-300 text-right max-w-[180px] truncate">{withdrawalNote || 'Bank transfer'}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Payout Amount:</span>
                <span className="font-extrabold text-white num-tabular text-sm">₦{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Flat Processing Fee:</span>
                <span className="font-bold text-slate-200">₦{FLAT_FEE_NGN}.00</span>
              </div>
              <div className="pt-1 border-t border-slate-800/60 flex justify-between font-bold">
                <span className="text-slate-200">Total Deducted:</span>
                <span className="text-emerald-400 num-tabular text-sm">₦{totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                Authorizing with your transaction PIN will immediately debit ₦{totalDeduction.toLocaleString()} from your NGN wallet and queue the payout for administrative clearance.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={handleProceedToPin}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Authorize with PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Withdrawal"
              subtitle={`Withdraw ₦${validAmount.toLocaleString()} to ${selectedBank.name} (₦${FLAT_FEE_NGN} fee)`}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* Submission Receipt Modal */}
      {submissionReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Withdrawal Queued for Clearance</h3>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">Status: Pending Administrative Payout</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Reference:</span>
                <span className="font-mono text-emerald-400 font-bold">{submissionReceipt.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-200 text-right max-w-[180px] truncate">{submissionReceipt.accountName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank:</span>
                <span className="text-slate-200">{submissionReceipt.bankName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Number:</span>
                <span className="font-mono text-slate-300">{submissionReceipt.accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout Amount:</span>
                <span className="font-extrabold text-white num-tabular">₦{submissionReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Processing Fee:</span>
                <span className="text-slate-300">₦{submissionReceipt.fee}.00</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold">
                <span className="text-slate-200">Total Debited:</span>
                <span className="text-emerald-400 num-tabular">₦{submissionReceipt.totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>Submission Time:</span>
                <span className="text-slate-400">{submissionReceipt.timestamp}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Notice on Settlement</span>
              </p>
              <p className="text-slate-400">
                Your withdrawal request has been registered and deducted from your available balance. Commercial payouts are processed via NIP settlement. You will receive an in-app alert when disbursed.
              </p>
            </div>

            <button
              onClick={() => {
                setSubmissionReceipt(null);
                goBack();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Done & Return to Wallets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
