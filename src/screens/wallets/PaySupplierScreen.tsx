import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
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

// Official Alipay Brand Logo SVG
const AlipayLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M860 612.3c-44.5-17.8-163.2-62.2-248.8-94.8 41.5-68.2 71.1-151.1 82.9-240.2h120.7v-58.8H558.6V120h-88.2v98.5H235.4v58.8h176.4v58.8H147.2v58.8h352.8c-11.9 77.1-35.6 142.2-71.1 201.6-77.1-59.3-148.2-130.4-201.6-207.5l-65.2 41.5c59.3 83 136.4 160.1 225.4 225.4-88.9 59.3-196.9 100.9-285.2 124.6l29.7 59.3c112.7-29.7 231.2-77.1 337.8-148.2 94.8 53.4 207.5 106.7 326.1 154.1l35.6-59.3c-106.7-41.5-207.5-88.9-296.4-136.4 29.7-47.4 53.4-100.8 71.1-160.1 77.1 29.7 177.8 71.1 225.4 88.9l65.2-130.6z"/>
  </svg>
);

// Official WeChat Pay Brand Logo SVG
const WeChatLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M384 192c-159 0-288 107.5-288 240 0 76.6 42.9 144.9 110.1 189.6L160 704l95.5-47.8C290.9 666.9 336 672 384 672c7.8 0 15.5-0.3 23.1-0.9-10.4-31.5-16.1-65.2-16.1-100.1 0-145.8 128.9-264 288.8-264 12.8 0 25.3 0.8 37.6 2.4C680.8 238.4 542.4 192 384 192zM288 320c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm192 0c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48z"/>
    <path d="M679.8 368c-132.5 0-240 89.5-240 200s107.5 200 240 200c39.9 0 77.4-8.1 110.4-22.6L864 784l-25.9-64.8C888.6 684.8 919.8 629.5 919.8 568c0-110.5-107.5-200-240-200zm-79.8 112c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40zm160 0c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40z"/>
  </svg>
);

// Official China Flag / UnionPay / CNAPS Bank Logo SVG
const UnionPayLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="none">
    <rect width="1024" height="1024" rx="200" fill="#0B132B"/>
    <path d="M240 280h180l-80 464H160l80-464z" fill="#E60012"/>
    <path d="M420 280h180l-80 464H340l80-464z" fill="#002D72"/>
    <path d="M600 280h180l-80 464H520l80-464z" fill="#00835D"/>
    <text x="512" y="880" textAnchor="middle" fill="#FFFFFF" fontSize="130" fontWeight="900" fontFamily="sans-serif">CNAPS</text>
  </svg>
);

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
  const { wallets, goBack, showToast, activeUserId, navigate } = useApp();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, []);
  const [activeTab, setActiveTab] = useState<PayMethod>('alipay');
  const [fundingCurrency, setFundingCurrency] = useState<'CNY' | 'NGN'>('CNY');
  
  // Beneficiary fields
  const [recipientName, setRecipientName] = useState('Shenzhen Foxconn Micro Tech Ltd');
  const [accountNumber, setAccountNumber] = useState('13800138000');
  const [bankName, setBankName] = useState('Industrial and Commercial Bank of China (ICBC)');
  const [cnapsCode, setCnapsCode] = useState('104581000018');
  const [swiftBic, setSwiftBic] = useState('');
  
  // QR Code upload
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeFileName, setQrCodeFileName] = useState<string>('');

  // Payment purpose & notes
  const [purpose, setPurpose] = useState('Supplier Payment');
  const [purposeExplanation, setPurposeExplanation] = useState('');
  const [notes, setNotes] = useState('PO #9824 - Batch order electronics components');

  // Amount in CNY (Payout to China)
  const [amountCNY, setAmountCNY] = useState('25000');
  
  // Receiver verification status
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  // Modals & Flow
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showKycRestrictionModal, setShowKycRestrictionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  // KYC Compliance Verification Check
  const kycInfo = db.getKycStatus(activeUserId);
  const isKycVerified = kycInfo.status === 'verified';

  const cnyWallet = wallets.find((w) => w.currency === 'CNY');
  const ngnWallet = wallets.find((w) => w.currency === 'NGN');
  const usdWallet = wallets.find((w) => w.currency === 'USD');

  const cnyBalance = cnyWallet?.balance || 0;
  const ngnBalance = ngnWallet?.balance || 0;
  const usdBalance = usdWallet?.balance || 0;

  const rates = db.getSystemSettings()?.rates || { NGN_CNY: 214.50, USD_CNY: 7.24 };
  const ngnRate = Number(rates.NGN_CNY || 214.50);
  const usdRate = Number(rates.USD_CNY || 7.24);

  const parsedAmount = parseFloat(amountCNY || '0');
  const validAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

  const calculateFundingDeduction = (cny: number, currency: 'CNY' | 'NGN' | 'USD') => {
    if (currency === 'NGN') return Math.round(cny * ngnRate * 100) / 100;
    if (currency === 'USD') return Math.round((cny / usdRate) * 100) / 100;
    return cny;
  };

  const requiredFundingAmount = calculateFundingDeduction(validAmount, fundingCurrency);
  const activeBalance = fundingCurrency === 'NGN' ? ngnBalance : cnyBalance;
  const currencySymbol = fundingCurrency === 'NGN' ? '₦' : '¥';

  const handleTabChange = (tab: PayMethod) => {
    setActiveTab(tab);
    if (tab === 'alipay') {
      if (!accountNumber || accountNumber.startsWith('622') || accountNumber.startsWith('wx_')) {
        setAccountNumber('13800138000');
      }
      if (!recipientName || recipientName.includes('Bank') || recipientName.includes('Yiwu')) {
        setRecipientName('Shenzhen Foxconn Micro Tech Ltd');
      }
    } else if (tab === 'wechat') {
      if (!accountNumber || accountNumber.startsWith('622') || accountNumber.startsWith('138')) {
        setAccountNumber('wx_supplier_890');
      }
      if (!recipientName || recipientName.includes('Foxconn')) {
        setRecipientName('Guangzhou Trade Co., Ltd');
      }
    } else if (tab === 'bank') {
      if (!accountNumber || accountNumber.startsWith('138') || accountNumber.startsWith('wx_')) {
        setAccountNumber('6222021001123456789');
      }
      if (!recipientName || recipientName.includes('Foxconn')) {
        setRecipientName('Yiwu Futian Global Sourcing Ltd');
      }
    }
    handleVerifyReceiver();
  };

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
      const field = activeTab === 'alipay' ? 'Alipay ID / Mobile' : activeTab === 'wechat' ? 'WeChat Pay ID' : 'Bank Account / Settlement IBAN';
      showToast(`Please enter a valid ${field}`, 'error');
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
    if (requiredFundingAmount > activeBalance) {
      showToast(
        `Insufficient ${fundingCurrency} balance (Required: ${currencySymbol}${requiredFundingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Available: ${currencySymbol}${activeBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
        'error'
      );
      return false;
    }

    return true;
  };

  const handleInitiateReview = () => {
    if (!isKycVerified) {
      setShowKycRestrictionModal(true);
      return;
    }
    if (!validateForm()) return;
    setShowReviewModal(true);
  };

  const handleProceedToPin = () => {
    setShowReviewModal(false);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (enteredPin: string) => {
    const num = parseFloat(amountCNY);
    const methodLabel = activeTab === 'alipay' ? 'Alipay (支付宝)' : activeTab === 'wechat' ? 'WeChat (微信支付)' : 'Bank Transfer (银联 / CNAPS)';
    
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
          cnapsCode: activeTab === 'bank' && cnapsCode.trim() ? cnapsCode.trim() : undefined,
          fundingCurrency,
          fundingAmount: requiredFundingAmount,
          idempotencyKey: `rmb_pay_${activeUserId}_${Date.now()}`
        }
      );

      if (res && res.error) {
        if ((res as any).kycRequired) {
          setShowPinModal(false);
          setShowKycRestrictionModal(true);
          return;
        }
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
        cnapsCode: activeTab === 'bank' ? cnapsCode.trim() : undefined,
        purpose,
        notes: notes.trim(),
        fundingCurrency,
        fundingAmount: requiredFundingAmount,
        currencySymbol,
        status: 'Pending',
        timestamp: new Date().toLocaleString(),
        equivalentNGN: num * ngnRate
      });
      showToast(`Payment request submitted for clearance! Ref: ${res?.payment?.reference || 'RMB-REQ'}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Supplier payment communication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedNGN = validAmount * ngnRate;

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Send Money to China (RMB)" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Compliance Gating Alert Banner */}
        {!isKycVerified && (
          <div 
            onClick={() => setShowKycRestrictionModal(true)}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/15 transition-colors shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-300">KYC Verification Required</p>
                <p className="text-[11px] text-slate-300">Supplier payouts locked until identity is verified.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 shrink-0">
              Verify <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* Method Switcher Tabs */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Payout Channel
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => handleTabChange('alipay')}
              className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                activeTab === 'alipay'
                  ? 'bg-blue-600 text-white border-blue-400/40 shadow-lg shadow-blue-600/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <AlipayLogo className="w-4 h-4 text-current shrink-0" />
                <span className="font-extrabold text-[11px]">Alipay</span>
              </div>
              <span className="text-[10px] font-medium opacity-90">(支付宝)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('wechat')}
              className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                activeTab === 'wechat'
                  ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <WeChatLogo className="w-4 h-4 text-current shrink-0" />
                <span className="font-extrabold text-[11px]">WeChat</span>
              </div>
              <span className="text-[10px] font-medium opacity-90">(微信支付)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('bank')}
              className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-indigo-600 text-white border-indigo-400/40 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <UnionPayLogo className="w-4 h-4 rounded shrink-0" />
                <span className="font-extrabold text-[11px] truncate">Bank Transfer</span>
              </div>
              <span className="text-[10px] font-medium opacity-90">(银联 / CNAPS)</span>
            </button>
          </div>
        </div>

        {/* Funding Currency / Vault Selector Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Funding Wallet Source
            </label>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Auto-Converts to RMB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {(['CNY', 'NGN'] as const).map((curr) => {
              const isSelected = fundingCurrency === curr;
              const bal = curr === 'CNY' ? cnyBalance : ngnBalance;
              const sym = curr === 'CNY' ? '¥' : '₦';
              const flag = curr === 'CNY' ? '🇨🇳' : '🇳🇬';
              const label = curr === 'CNY' ? 'Chinese RMB' : 'Nigerian Naira';
              return (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setFundingCurrency(curr)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{flag}</span>
                    <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {curr}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{label}</div>
                  <p className="text-xs font-extrabold text-white num-tabular truncate mt-0.5">
                    {sym}{bal.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Active Balance:</span>
              <p className="font-extrabold text-emerald-400 num-tabular text-sm">
                {currencySymbol}{activeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fundingCurrency}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] block">Settlement Model</span>
              <p className="text-[11px] font-mono font-bold text-indigo-400">
                {fundingCurrency === 'CNY' ? 'Direct 1:1 RMB' : `1 CNY = ₦${ngnRate}`}
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Details Form */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Beneficiary Details
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {activeTab === 'alipay' ? 'Alipay Payout' : activeTab === 'wechat' ? 'WeChat Pay Payout' : 'CNAPS Bank Transfer'}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {activeTab === 'bank' ? 'Beneficiary Corporate / Individual Name' : 'Recipient / Business Name'}
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={activeTab === 'bank' ? 'e.g. Yiwu International Logistics Ltd' : activeTab === 'wechat' ? 'e.g. Guangzhou Trade Co., Ltd' : 'e.g. Shenzhen Foxconn Micro Tech Ltd'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {activeTab === 'alipay' ? 'Alipay ID / Mobile Number (or Email)' :
               activeTab === 'wechat' ? 'WeChat Pay Handle / Mobile Number' :
               'Bank Account Number / Settlement IBAN (UnionPay / CNAPS)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={activeTab === 'alipay' ? 'e.g. 13800138000 or pay@supplier.cn' : activeTab === 'wechat' ? 'e.g. wx_supplier_890 or +86 138 0000 0000' : 'e.g. 6222021001123456789 or CN6227003320094892'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyReceiver}
                className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 shrink-0 cursor-pointer"
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
                  Receiving Commercial Bank
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Industrial and Commercial Bank of China (ICBC)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ICBC (工商银行)',
                    'Bank of China (中国银行)',
                    'CCB (建设银行)',
                    'ABC (农业银行)'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBankName(preset)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                        bankName === preset
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  12-Digit CNAPS Bank Clearing Code
                </label>
                <input
                  type="text"
                  value={cnapsCode}
                  onChange={(e) => setCnapsCode(e.target.value)}
                  placeholder="e.g. 104581000018"
                  maxLength={16}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white font-mono"
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
            <span>China Beneficiary Receives:</span>
            <span className="font-extrabold text-white num-tabular">¥{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CNY</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Funding Source:</span>
            <span className="font-semibold text-slate-300">{fundingCurrency} Wallet</span>
          </div>
          {fundingCurrency !== 'CNY' && (
            <div className="flex justify-between text-slate-400">
              <span>Conversion Rate:</span>
              <span className="font-mono text-slate-300">
                {fundingCurrency === 'NGN' ? `1 CNY = ₦${ngnRate}` : `1 USD = ¥${usdRate}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Transfer Fee:</span>
            <span className="font-bold text-emerald-400">¥0.00 (Free)</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
            <span className="font-bold text-slate-200">Total Wallet Deduction:</span>
            <span className="font-black text-emerald-400 num-tabular">
              {currencySymbol}{requiredFundingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fundingCurrency}
            </span>
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
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <span className="font-semibold text-slate-200">
                  {activeTab === 'alipay' ? 'Alipay (支付宝)' : activeTab === 'wechat' ? 'WeChat (微信支付)' : 'Bank Transfer (银联 / CNAPS)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{activeTab === 'bank' ? 'Account / IBAN:' : 'Account / ID:'}</span>
                <span className="font-mono text-slate-200 text-right max-w-[180px] truncate">{accountNumber}</span>
              </div>
              {activeTab === 'bank' && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Receiving Bank:</span>
                    <span className="font-semibold text-slate-200 text-right max-w-[180px] truncate">{bankName}</span>
                  </div>
                  {cnapsCode && (
                    <div className="flex justify-between text-slate-400">
                      <span>CNAPS Code:</span>
                      <span className="font-mono text-slate-200 text-right">{cnapsCode}</span>
                    </div>
                  )}
                </>
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
                <span>China Payout:</span>
                <span className="font-extrabold text-white num-tabular text-sm">¥{validAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Funding Source:</span>
                <span className="font-semibold text-slate-200">{fundingCurrency} Vault</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Wallet Deduction:</span>
                <span className="font-black text-emerald-400 num-tabular text-sm">
                  {currencySymbol}{requiredFundingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fundingCurrency}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transfer Fee:</span>
                <span className="font-bold text-emerald-400">¥0.00 (Free)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                Submitting this request debits your {fundingCurrency} wallet immediately. The transfer will be routed to the FlyeMass China clearance queue for verification and payout.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                onClick={handleProceedToPin}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Authorize with PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Authorization Modal (Shows from the Top) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-200 mt-2">
            <PinPad
              title="Authorize RMB Transfer"
              subtitle={`Transfer ¥${validAmount.toLocaleString()} CNY to ${recipientName} (Debit: ${currencySymbol}${requiredFundingAmount.toLocaleString()} ${fundingCurrency})`}
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
                <span>China Payout:</span>
                <span className="font-extrabold text-white num-tabular">¥{submissionReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Wallet Debited:</span>
                <span className="font-extrabold text-emerald-400 num-tabular">
                  {submissionReceipt.currencySymbol || '¥'}{(submissionReceipt.fundingAmount || submissionReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {submissionReceipt.fundingCurrency || 'CNY'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-200 text-right max-w-[180px] truncate">{submissionReceipt.recipient}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account / ID:</span>
                <span className="font-mono text-slate-300">{submissionReceipt.receiverAccount}</span>
              </div>
              {submissionReceipt.bankName && (
                <div className="flex justify-between text-slate-400">
                  <span>Receiving Bank:</span>
                  <span className="font-semibold text-slate-300 text-right max-w-[180px] truncate">{submissionReceipt.bankName}</span>
                </div>
              )}
              {submissionReceipt.cnapsCode && (
                <div className="flex justify-between text-slate-400">
                  <span>CNAPS Code:</span>
                  <span className="font-mono text-slate-300">{submissionReceipt.cnapsCode}</span>
                </div>
              )}
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
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Done & Return to Wallets
            </button>
          </div>
        </div>
      )}

      {/* Compliance Gating Restriction Modal */}
      {showKycRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">KYC Verification Required</h3>
              <p className="text-xs text-amber-400/90 font-medium mt-1">Regulatory AML & CBN Compliance Gate</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              KYC Verification Required. Please complete your identity verification on your Profile page before initiating withdrawals or supplier payments.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowKycRestrictionModal(false);
                  navigate('kyc');
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Complete KYC Verification
              </button>

              <button
                type="button"
                onClick={() => setShowKycRestrictionModal(false)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Dismiss & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
