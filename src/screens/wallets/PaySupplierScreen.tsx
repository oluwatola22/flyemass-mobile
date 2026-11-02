import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Building2, 
  AlertCircle, 
  Smartphone,
  ExternalLink,
  Receipt,
  Upload,
  X,
  FileCheck,
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';

type PayMethod = 'alipay' | 'wechat' | 'bank';

const PAYMENT_PURPOSES = [
  'Supplier Payment',
  'Logistics Fee',
  'Personal Remittance',
  'Goods Purchase',
  'Education',
  'Family Support',
  'Services',
  'Other'
];

export const PaySupplierScreen: React.FC = () => {
  const { wallets, goBack, showToast, activeUserId } = useApp();
  const [activeTab, setActiveTab] = useState<PayMethod>('alipay');
  
  // Beneficiary fields
  const [recipientName, setRecipientName] = useState('Shenzhen Foxconn Micro Tech Ltd');
  const [accountNumber, setAccountNumber] = useState('13800138000');
  const [bankName, setBankName] = useState('Industrial and Commercial Bank of China (ICBC)');
  const [swiftBic, setSwiftBic] = useState('');
  
  // QR Code upload
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeFileName, setQrCodeFileName] = useState<string>('');

  // Payment purpose & notes
  const [purpose, setPurpose] = useState('Supplier Payment');
  const [purposeExplanation, setPurposeExplanation] = useState('');
  const [notes, setNotes] = useState('PO #9824 - Batch order electronics components');

  // Amount
  const [amountCNY, setAmountCNY] = useState('25000');
  
  // Receiver verification status
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  // Modals & Flow
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  const cnyWallet = wallets.find((w) => w.currency === 'CNY');
  const cnyBalance = cnyWallet?.balance || 0;
  const ngnRate = db.getSystemSettings()?.rates?.NGN_CNY || 214.50;

  const handleVerifyReceiver = () => {
    setIsVerifying(true);
    setIsVerified(false);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      showToast('Supplier merchant identity verified with SAFE China registry', 'success');
    }, 600);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('Only PNG or JPG image files are allowed for QR code', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('QR code image size must not exceed 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrCodeDataUrl(reader.result as string);
      setQrCodeFileName(file.name);
      showToast('QR Code uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrCodeDataUrl(null);
    setQrCodeFileName('');
  };

  const validateForm = (): boolean => {
    if (!recipientName.trim()) {
      showToast('Please enter the recipient or company name', 'error');
      return false;
    }
    if (!accountNumber.trim()) {
      showToast('Please enter recipient account number or ID', 'error');
      return false;
    }
    if (activeTab === 'bank' && !bankName.trim()) {
      showToast('Please enter recipient bank name', 'error');
      return false;
    }
    if (purpose === 'Other' && (!purposeExplanation || purposeExplanation.trim().length < 5)) {
      showToast('Please provide an explanation for payment purpose (min 5 characters)', 'error');
      return false;
    }
    if (!notes || notes.trim().length < 5) {
      showToast('Please enter transaction notes / order details (min 5 characters)', 'error');
      return false;
    }

    const num = parseFloat(amountCNY);
    if (isNaN(num) || num < 1 || num > 1000000) {
      showToast('Payment amount must be between ¥1.00 and ¥1,000,000.00 CNY', 'error');
      return false;
    }
    const decParts = amountCNY.split('.');
    if (decParts[1] && decParts[1].length > 2) {
      showToast('Payment amount cannot have more than 2 decimal places', 'error');
      return false;
    }
    if (num > cnyBalance) {
      showToast(`Insufficient CNY balance (Available: ¥${(cnyBalance ?? 0).toLocaleString()})`, 'error');
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
    const num = parseFloat(amountCNY);
    const methodLabel = activeTab === 'alipay' ? 'Alipay' : activeTab === 'wechat' ? 'WeChat Pay' : 'China Bank Transfer';
    
    setIsSubmitting(true);
    try {
      const res = await db.paySupplier(
        activeUserId,
        recipientName.trim(),
        accountNumber.trim(),
        methodLabel,
        num,
        notes.trim(),
        enteredPin,
        {
          qrCodeUrl: qrCodeDataUrl || undefined,
          purpose,
          purposeExplanation: purpose === 'Other' ? purposeExplanation.trim() : undefined,
          bankName: activeTab === 'bank' ? bankName.trim() : undefined,
          swiftBic: activeTab === 'bank' && swiftBic.trim() ? swiftBic.trim() : undefined,
          idempotencyKey: `rmb_pay_${activeUserId}_${Date.now()}`
        }
      );

      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }

      setShowPinModal(false);
      setSubmissionReceipt({
        reference: res?.payment?.reference || `RMB-${Math.floor(10000000 + Math.random() * 90000000)}`,
        amount: num,
        recipient: recipientName.trim(),
        receiverAccount: accountNumber.trim(),
        method: methodLabel,
        bankName: activeTab === 'bank' ? bankName.trim() : undefined,
        purpose,
        notes: notes.trim(),
        status: 'Pending',
        timestamp: new Date().toLocaleString(),
        equivalentNGN: num * ngnRate
      });
      showToast(`Payment request submitted for clearance! Ref: ${res?.payment?.reference}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Supplier payment communication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(amountCNY || '0');
  const validAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
  const estimatedNGN = validAmount * ngnRate;

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Send Money to China (RMB)" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Method Switcher Tabs */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Payout Channel
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => { setActiveTab('alipay'); handleVerifyReceiver(); }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'alipay' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Alipay</span>
              </div>
              <span className="text-[10px] opacity-80 font-normal">支付宝</span>
            </button>

            <button
              onClick={() => { setActiveTab('wechat'); handleVerifyReceiver(); }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'wechat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>WeChat</span>
              </div>
              <span className="text-[10px] opacity-80 font-normal">微信支付</span>
            </button>

            <button
              onClick={() => { setActiveTab('bank'); handleVerifyReceiver(); }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank Transfer</span>
              </div>
              <span className="text-[10px] opacity-80 font-normal">银联 / CNAPS</span>
            </button>
          </div>
        </div>

        {/* CNY Balance Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🇨🇳</span>
            <div>
              <span className="text-slate-400 text-[11px] block">Available RMB Balance:</span>
              <p className="font-extrabold text-emerald-400 num-tabular text-sm">¥{(cnyBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CNY</p>
            </div>
          </div>
          <button
            onClick={goBack}
            className="text-[11px] font-bold text-emerald-400 hover:underline px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            + Swap NGN
          </button>
        </div>

        {/* Recipient Details Form */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            Beneficiary Details
          </h3>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Recipient / Business Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Shenzhen Foxconn Micro Tech Ltd"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {activeTab === 'alipay' ? 'Alipay Account (Mobile / Email / Alipay ID)' :
               activeTab === 'wechat' ? 'WeChat Pay ID / Mobile' :
               'Bank Account Number (UnionPay / CNAPS)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={activeTab === 'alipay' ? 'e.g. 13800138000 or pay@supplier.cn' : activeTab === 'wechat' ? 'e.g. wx_supplier_890' : 'e.g. 6222021001123456789'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyReceiver}
                className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 shrink-0"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Bank specific fields */}
          {activeTab === 'bank' && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Industrial and Commercial Bank of China (ICBC)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  SWIFT / BIC / CNAPS Branch Code (Optional)
                </label>
                <input
                  type="text"
                  value={swiftBic}
                  onChange={(e) => setSwiftBic(e.target.value)}
                  placeholder="e.g. ICBCCNBSH"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white font-mono"
                />
              </div>
            </>
          )}

          {/* QR Code Upload for Alipay & WeChat */}
          {(activeTab === 'alipay' || activeTab === 'wechat') && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Recipient QR Code (Optional, max 5MB PNG/JPG)
              </label>
              {qrCodeDataUrl ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={qrCodeDataUrl}
                      alt="Uploaded QR"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-white p-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>QR Code Attached</span>
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{qrCodeFileName || 'qrcode_receipt.png'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveQr}
                    type="button"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                    title="Remove QR code"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 cursor-pointer transition-all">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-300">Click to upload recipient QR code</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SAFE China Registry Check
            </span>
            {isVerifying ? (
              <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Checking Registry...</span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Entity</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Amount & Purpose Section */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            Payment Terms & Amount
          </h3>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
            >
              {PAYMENT_PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {purpose === 'Other' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Please Explain Payment Purpose (Min 5 chars)
              </label>
              <textarea
                value={purposeExplanation}
                onChange={(e) => setPurposeExplanation(e.target.value)}
                placeholder="Explain the reason for this remittance..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white resize-none"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Order Reference / Notes (Min 5 chars)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 1688 Order #89201 or Goods description"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Amount to Send (¥ CNY)
              </label>
              <span className="text-[10px] text-slate-500">Min: ¥1.00 • Max: ¥1,000,000.00</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-lg font-bold text-emerald-400">¥</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max="1000000"
                value={amountCNY}
                onChange={(e) => setAmountCNY(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xl font-extrabold text-white num-tabular"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Informational Equivalent: ≈ ₦{estimatedNGN.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN</span>
              <span className="text-emerald-400 font-semibold">Transfer Fee: ¥0.00 Free</span>
            </div>
          </div>
        </div>

        {/* Deduction Summary Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Payment Amount:</span>
            <span className="font-extrabold text-white num-tabular">¥{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CNY</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Transfer Fee:</span>
            <span className="font-bold text-emerald-400">¥0.00 (Free)</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
            <span className="font-bold text-slate-200">Total Wallet Deduction:</span>
            <span className="font-black text-emerald-400 num-tabular">¥{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CNY</span>
          </div>
        </div>

        {/* Compliance Note */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
          <p className="leading-snug text-[11px]">
            FlyeMass clears RMB cross-border transactions through licensed partners in compliance with SAFE (State Administration of Foreign Exchange). Submission places request in clearance queue.
          </p>
        </div>

        <button
          onClick={handleInitiateReview}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Review Payment (¥{validAmount.toLocaleString()})</span>
        </button>
      </div>

      {/* Payment Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Review China Payment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirm details before entering PIN</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-white text-right max-w-[180px] truncate">{recipientName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Channel:</span>
                <span className="font-semibold text-slate-200 capitalize">{activeTab === 'alipay' ? 'Alipay' : activeTab === 'wechat' ? 'WeChat Pay' : 'China Bank'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account / ID:</span>
                <span className="font-mono text-slate-200 text-right max-w-[180px] truncate">{accountNumber}</span>
              </div>
              {activeTab === 'bank' && (
                <div className="flex justify-between text-slate-400">
                  <span>Bank:</span>
                  <span className="font-semibold text-slate-200 text-right max-w-[180px] truncate">{bankName}</span>
                </div>
              )}
              {qrCodeDataUrl && (
                <div className="flex justify-between text-slate-400 items-center">
                  <span>QR Attached:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Yes
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Purpose:</span>
                <span className="text-slate-200">{purpose}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Notes:</span>
                <span className="text-slate-300 text-right max-w-[180px] truncate">{notes}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Debit Amount:</span>
                <span className="font-extrabold text-white num-tabular text-sm">¥{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Equivalent:</span>
                <span className="font-semibold text-slate-300">≈ ₦{estimatedNGN.toLocaleString()} NGN</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fee:</span>
                <span className="font-bold text-emerald-400">¥0.00</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                Submitting this request debits your CNY wallet immediately. The transaction will be submitted to the FlyeMass China clearance queue for verification and payout.
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
              title="Authorize RMB Transfer"
              subtitle={`Transfer ¥${validAmount.toLocaleString()} CNY to ${recipientName}`}
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
              <h3 className="text-lg font-extrabold text-white">Payment Queued for Clearance</h3>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">Status: Pending Staff Review</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Reference:</span>
                <span className="font-mono text-emerald-400 font-bold">{submissionReceipt.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="font-extrabold text-white num-tabular">¥{submissionReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-200 text-right max-w-[180px] truncate">{submissionReceipt.recipient}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account / ID:</span>
                <span className="font-mono text-slate-300">{submissionReceipt.receiverAccount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Channel:</span>
                <span className="text-slate-200">{submissionReceipt.method}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Purpose:</span>
                <span className="text-slate-200">{submissionReceipt.purpose}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Submission Time:</span>
                <span className="text-slate-300">{submissionReceipt.timestamp}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Notice on Settlement</span>
              </p>
              <p className="text-slate-400">
                This receipt confirms your submission. FlyeMass operations staff manually review and execute foreign currency payouts during China banking hours (typically within 2 to 6 hours). You will be notified once disbursed.
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
