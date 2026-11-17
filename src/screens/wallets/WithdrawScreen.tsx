import React, { useState, useEffect, useRef } from 'react';
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
  QrCode,
  Upload,
  X,
  FileCheck,
  Eye,
  Download,
  Copy,
  CheckCheck,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { Currency } from '../../types';

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

const CHINESE_BANKS = [
  'Industrial and Commercial Bank of China (ICBC)',
  'China Construction Bank (CCB)',
  'Bank of China (BOC)',
  'Agricultural Bank of China (ABC)',
  'Bank of Communications (BOCOM)',
  'China Merchants Bank (CMB)',
  'Postal Savings Bank of China (PSBC)',
  'China CITIC Bank',
  'Shanghai Pudong Development Bank (SPDB)',
  'Industrial Bank Co Ltd',
  'China Minsheng Bank'
];

export type PayoutChannel = 'alipay' | 'wechat' | 'china_bank' | 'naira_bank';

export const WithdrawScreen: React.FC = () => {
  const { wallets, goBack, showToast, activeUserId } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<PayoutChannel>('alipay');

  // Amount inputs
  const [amountNgn, setAmountNgn] = useState('250000');
  const [amountCny, setAmountCny] = useState('5000');

  // Alipay Fields
  const [alipayName, setAlipayName] = useState('Chen Wei (Alipay Merchant)');
  const [alipayAccount, setAlipayAccount] = useState('13800138000');
  const [alipayQrDataUrl, setAlipayQrDataUrl] = useState<string | null>(
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><rect x="20" y="20" width="60" height="60" fill="%231677FF"/><rect x="30" y="30" width="40" height="40" fill="%23ffffff"/><rect x="40" y="40" width="20" height="20" fill="%231677FF"/><rect x="120" y="20" width="60" height="60" fill="%231677FF"/><rect x="130" y="30" width="40" height="40" fill="%23ffffff"/><rect x="140" y="40" width="20" height="20" fill="%231677FF"/><rect x="20" y="120" width="60" height="60" fill="%231677FF"/><rect x="30" y="130" width="40" height="40" fill="%23ffffff"/><rect x="40" y="140" width="20" height="20" fill="%231677FF"/><circle cx="100" cy="100" r="16" fill="%231677FF"/><text x="100" y="105" font-size="12" fill="%23ffffff" text-anchor="middle" font-weight="bold">支</text></svg>'
  );
  const [alipayQrFileName, setAlipayQrFileName] = useState('alipay_pay_qr_code.png');

  // WeChat Pay Fields
  const [wechatName, setWechatName] = useState('Li Na (Guangzhou Sourcing)');
  const [wechatAccount, setWechatAccount] = useState('wxid_lina_trade88');
  const [wechatQrDataUrl, setWechatQrDataUrl] = useState<string | null>(null);
  const [wechatQrFileName, setWechatQrFileName] = useState('');

  // Chinese Bank Fields
  const [chineseBank, setChineseBank] = useState(CHINESE_BANKS[0]);
  const [chineseAccountNumber, setChineseAccountNumber] = useState('6222021001123456789');
  const [chineseAccountName, setChineseAccountName] = useState('Guangzhou Global Logistics Co Ltd');

  // Naira Bank Fields
  const [selectedNgnBank, setSelectedNgnBank] = useState(NIGERIAN_BANKS[0]);
  const [ngnAccountNumber, setNgnAccountNumber] = useState('2089140022');
  const [ngnAccountName, setNgnAccountName] = useState('Chief Babatunde Alade');
  const [isVerifyingNuban, setIsVerifyingNuban] = useState(false);
  const [nubanError, setNubanError] = useState<string | null>(null);

  // General Notes
  const [withdrawalNote, setWithdrawalNote] = useState('Cross-border trade payout');

  // Modals & Flow
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showQrPreviewModal, setShowQrPreviewModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ngnWallet = wallets.find((w) => w.currency === 'NGN') || { currency: 'NGN', balance: 0 };
  const cnyWallet = wallets.find((w) => w.currency === 'CNY') || { currency: 'CNY', balance: 0 };
  const ngnBalance = ngnWallet.balance || 0;
  const cnyBalance = cnyWallet.balance || 0;
  const FLAT_FEE_NGN = 50;

  // Real-time reactive listener: auto-update submissionReceipt if marked successful in background
  useEffect(() => {
    if (!submissionReceipt) return;
    const unsub = db.subscribe(() => {
      const state = db.getState();
      const ref = submissionReceipt.reference;
      const matchedWth = Object.values(state.withdrawals || {}).find(w => w.reference === ref || w.id === ref);
      const matchedPay = Object.values(state.supplier_payments || {}).find(p => p.reference === ref || p.id === ref);
      
      const record = matchedWth || matchedPay;
      if (record) {
        const rawStatus = (record.status || '').toLowerCase();
        const isSuccess = rawStatus === 'successful' || rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'disbursed';
        const proof = (record as any).paymentProofUrl || (record as any).receiptUrl;

        if (isSuccess && submissionReceipt.status !== 'Successful') {
          setSubmissionReceipt((prev: any) => ({
            ...prev,
            status: 'Successful',
            paymentProofUrl: proof || prev?.paymentProofUrl
          }));
          showToast('Payout approved and marked Successful! Transfer receipt attached.', 'success');
        }
      }
    });
    return () => unsub();
  }, [submissionReceipt]);

  // NUBAN verification
  useEffect(() => {
    if (selectedChannel !== 'naira_bank') return;
    const cleanAcc = ngnAccountNumber.replace(/\D/g, '');
    if (cleanAcc.length === 10) {
      setIsVerifyingNuban(true);
      setNubanError(null);

      db.enquireAccount(selectedNgnBank.code, cleanAcc)
        .then((res) => {
          setIsVerifyingNuban(false);
          if (res && res.success && res.accountName) {
            setNgnAccountName(res.accountName);
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
  }, [ngnAccountNumber, selectedNgnBank.code, selectedChannel]);

  // Image file picker handler for QR codes
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (selectedChannel === 'alipay') {
        setAlipayQrDataUrl(result);
        setAlipayQrFileName(file.name);
      } else if (selectedChannel === 'wechat') {
        setWechatQrDataUrl(result);
        setWechatQrFileName(file.name);
      }
      showToast(`${file.name} uploaded successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    if (selectedChannel === 'naira_bank') {
      const num = parseFloat(amountNgn);
      if (isNaN(num) || num < 1000) {
        showToast('Minimum withdrawal amount is ₦1,000.00 NGN', 'error');
        return false;
      }
      const cleanAcc = ngnAccountNumber.replace(/\D/g, '');
      if (cleanAcc.length !== 10) {
        showToast('Please enter a valid 10-digit NUBAN account number', 'error');
        return false;
      }
      if (nubanError) {
        showToast(`Invalid account details: ${nubanError}`, 'error');
        return false;
      }
      if (!ngnAccountName.trim()) {
        showToast('Please verify beneficiary account name', 'error');
        return false;
      }
      const totalDeduction = num + FLAT_FEE_NGN;
      if (totalDeduction > ngnBalance) {
        showToast(`Insufficient NGN balance. Required: ₦${totalDeduction.toLocaleString()} (Available: ₦${ngnBalance.toLocaleString()})`, 'error');
        return false;
      }
      return true;
    }

    // RMB Channels
    const num = parseFloat(amountCny);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid withdrawal amount in RMB (¥)', 'error');
      return false;
    }
    if (num > cnyBalance) {
      showToast(`Insufficient CNY balance. Required: ¥${num.toLocaleString()} (Available: ¥${cnyBalance.toLocaleString()})`, 'error');
      return false;
    }

    if (selectedChannel === 'alipay') {
      if (!alipayName.trim()) {
        showToast('Please enter Alipay beneficiary full name', 'error');
        return false;
      }
      if (!alipayAccount.trim()) {
        showToast('Please enter Alipay account ID, phone, or email', 'error');
        return false;
      }
      if (!alipayQrDataUrl) {
        showToast('Please upload your Alipay QR code image for manual admin clearance', 'error');
        return false;
      }
    } else if (selectedChannel === 'wechat') {
      if (!wechatName.trim()) {
        showToast('Please enter WeChat Pay beneficiary full name', 'error');
        return false;
      }
      if (!wechatAccount.trim()) {
        showToast('Please enter WeChat ID or registered mobile phone number', 'error');
        return false;
      }
      if (!wechatQrDataUrl) {
        showToast('Please upload your WeChat Pay QR code image for manual admin clearance', 'error');
        return false;
      }
    } else if (selectedChannel === 'china_bank') {
      if (!chineseAccountName.trim()) {
        showToast('Please enter Chinese bank account holder name', 'error');
        return false;
      }
      if (!chineseAccountNumber.trim() || chineseAccountNumber.trim().length < 8) {
        showToast('Please enter a valid Chinese bank card or CNAPS account number', 'error');
        return false;
      }
      if (!chineseBank.trim()) {
        showToast('Please select or enter beneficiary Chinese bank name', 'error');
        return false;
      }
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
    setIsSubmitting(true);
    try {
      if (selectedChannel === 'naira_bank') {
        const num = parseFloat(amountNgn);
        const res = await db.requestWithdrawal(
          activeUserId,
          selectedNgnBank.name,
          ngnAccountNumber.replace(/\D/g, ''),
          ngnAccountName.trim(),
          num,
          enteredPin,
          {
            fee: FLAT_FEE_NGN,
            bankCode: selectedNgnBank.code,
            channel: 'naira_bank',
            customerNote: withdrawalNote.trim() || 'Naira bank withdrawal',
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
          channelName: 'Naira (NGN) Bank Payout',
          currency: 'NGN',
          amount: num,
          fee: FLAT_FEE_NGN,
          totalDeduction: num + FLAT_FEE_NGN,
          bankName: selectedNgnBank.name,
          accountNumber: ngnAccountNumber.replace(/\D/g, ''),
          accountName: ngnAccountName.trim(),
          note: withdrawalNote.trim() || 'Bank transfer',
          status: 'Pending',
          timestamp: new Date().toLocaleString()
        });
        showToast(`Withdrawal request queued for clearance! Ref: ${res?.withdrawal?.reference}`, 'success');
      } else {
        // RMB Channel Submission
        const num = parseFloat(amountCny);
        const isAlipay = selectedChannel === 'alipay';
        const isWeChat = selectedChannel === 'wechat';
        const methodName = isAlipay ? 'Alipay' : isWeChat ? 'WeChat Pay' : 'China Bank Transfer';
        const targetName = isAlipay ? alipayName : isWeChat ? wechatName : chineseAccountName;
        const targetAcc = isAlipay ? alipayAccount : isWeChat ? wechatAccount : chineseAccountNumber;
        const qrUrl = isAlipay ? alipayQrDataUrl : isWeChat ? wechatQrDataUrl : '';
        const qrFileName = isAlipay ? alipayQrFileName : isWeChat ? wechatQrFileName : '';

        const res = await db.requestWithdrawal({
          userId: activeUserId,
          channel: selectedChannel,
          currency: 'CNY',
          paymentMethod: methodName,
          amountRMB: num,
          amountCNY: num,
          accountName: targetName.trim(),
          receiverName: targetName.trim(),
          accountNumber: targetAcc.trim(),
          receiverAccount: targetAcc.trim(),
          bankName: selectedChannel === 'china_bank' ? chineseBank : methodName,
          qrCodeUrl: qrUrl || undefined,
          qrCodeFileName: qrFileName || undefined,
          note: withdrawalNote.trim() || `${methodName} Payout`,
          pin: enteredPin,
          idempotencyKey: `wd_rmb_${activeUserId}_${Date.now()}`
        });

        if (res && res.error) {
          showToast(res.error, 'error');
          return;
        }

        setShowPinModal(false);
        setSubmissionReceipt({
          reference: res?.withdrawal?.reference || res?.payment?.reference || `RMB-${Math.floor(10000000 + Math.random() * 90000000)}`,
          channelName: `${methodName} Payout`,
          currency: 'CNY',
          amount: num,
          fee: 0,
          totalDeduction: num,
          bankName: selectedChannel === 'china_bank' ? chineseBank : methodName,
          accountNumber: targetAcc.trim(),
          accountName: targetName.trim(),
          qrCodeUrl: qrUrl || undefined,
          note: withdrawalNote.trim() || `${methodName} Payout`,
          status: 'Pending',
          timestamp: new Date().toLocaleString()
        });
        showToast(`${methodName} payout request queued with QR code! Ref: ${res?.withdrawal?.reference || res?.reference}`, 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Withdrawal communication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedNgnAmount = parseFloat(amountNgn || '0');
  const validNgnAmount = isNaN(parsedNgnAmount) ? 0 : parsedNgnAmount;
  const totalNgnDeduction = validNgnAmount + FLAT_FEE_NGN;

  const parsedCnyAmount = parseFloat(amountCny || '0');
  const validCnyAmount = isNaN(parsedCnyAmount) ? 0 : parsedCnyAmount;

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Withdraw & Payout Desk" />

      {/* Hidden File Input for QR upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleQrUpload} 
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ======================================================== */}
        {/* 1. PAYOUT CHANNEL SELECTOR TABS */}
        {/* ======================================================== */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Select Payout Rail / Channel
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Alipay */}
            <button
              type="button"
              onClick={() => setSelectedChannel('alipay')}
              data-testid="payout-tab-alipay"
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                selectedChannel === 'alipay'
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <AlipayLogo className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">Alipay Payout</span>
                  <span className="text-[10px] text-blue-400 font-mono">QR + Phone (¥)</span>
                </div>
              </div>
              <QrCode className="w-4 h-4 text-blue-400" />
            </button>

            {/* 2. WeChat Pay */}
            <button
              type="button"
              onClick={() => setSelectedChannel('wechat')}
              data-testid="payout-tab-wechat"
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                selectedChannel === 'wechat'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <WeChatLogo className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">WeChat Pay</span>
                  <span className="text-[10px] text-emerald-400 font-mono">QR Code (¥)</span>
                </div>
              </div>
              <QrCode className="w-4 h-4 text-emerald-400" />
            </button>

            {/* 3. Chinese Bank */}
            <button
              type="button"
              onClick={() => setSelectedChannel('china_bank')}
              data-testid="payout-tab-china-bank"
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                selectedChannel === 'china_bank'
                  ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">China Bank</span>
                  <span className="text-[10px] text-amber-400 font-mono">CNAPS Wire (¥)</span>
                </div>
              </div>
              <span className="text-xs">🇨🇳</span>
            </button>

            {/* 4. Naira (NGN) Bank */}
            <button
              type="button"
              onClick={() => setSelectedChannel('naira_bank')}
              data-testid="payout-tab-naira-bank"
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                selectedChannel === 'naira_bank'
                  ? 'bg-teal-600/20 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <span className="text-base">🇳🇬</span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">Naira Bank</span>
                  <span className="text-[10px] text-teal-400 font-mono">NIP Transfer (₦)</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. DYNAMIC WALLET VAULT DISPLAY CARD */}
        {/* ======================================================== */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedChannel === 'naira_bank' ? '🇳🇬' : '🇨🇳'}</span>
            <div>
              <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">
                {selectedChannel === 'naira_bank' ? 'Nigerian Naira Wallet' : 'Chinese Yuan (CNY) Vault'}
              </span>
              <p className="font-extrabold text-emerald-400 num-tabular text-lg">
                {selectedChannel === 'naira_bank'
                  ? `₦${ngnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`
                  : `¥${cnyBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CNY`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {selectedChannel === 'alipay' ? 'Alipay Direct' : selectedChannel === 'wechat' ? 'WeChat Pay' : selectedChannel === 'china_bank' ? 'CNAPS Wire' : 'NUBAN Instant'}
          </span>
        </div>

        {/* ======================================================== */}
        {/* 3. WITHDRAWAL AMOUNT INPUT */}
        {/* ======================================================== */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {selectedChannel === 'naira_bank' ? 'Amount to Withdraw (₦ NGN)' : 'Amount to Withdraw (¥ RMB/CNY)'}
            </label>
            <span className="text-[10px] text-slate-500">
              {selectedChannel === 'naira_bank' ? 'Min: ₦1,000.00' : 'Min: ¥1.00'}
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-2xl font-bold text-emerald-400">
              {selectedChannel === 'naira_bank' ? '₦' : '¥'}
            </span>
            <input
              type="number"
              step={selectedChannel === 'naira_bank' ? '100' : '1'}
              min={selectedChannel === 'naira_bank' ? '1000' : '1'}
              value={selectedChannel === 'naira_bank' ? amountNgn : amountCny}
              onChange={(e) => {
                if (selectedChannel === 'naira_bank') setAmountNgn(e.target.value);
                else setAmountCny(e.target.value);
              }}
              placeholder={selectedChannel === 'naira_bank' ? '250,000' : '5,000'}
              data-testid="input-withdrawal-amount"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-2xl font-extrabold text-white num-tabular"
            />
          </div>

          {/* Quick Percentage Presets */}
          <div className="flex gap-2 pt-2 border-t border-slate-800/80">
            {[0.25, 0.5, 0.75, 1.0].map((frac) => (
              <button
                key={frac}
                type="button"
                onClick={() => {
                  if (selectedChannel === 'naira_bank') {
                    setAmountNgn(Math.max(1000, Math.floor(ngnBalance * frac)).toString());
                  } else {
                    setAmountCny(Math.max(1, Math.floor(cnyBalance * frac)).toString());
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                {frac === 1.0 ? '100% Max' : `${frac * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. DESTINATION RECIPIENT & QR CODE CARDS */}
        {/* ======================================================== */}

        {/* CHANNEL A: ALIPAY PAYOUT */}
        {selectedChannel === 'alipay' && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlipayLogo className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Alipay Recipient & QR Code
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                Mainland China
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Alipay Full Name (Real-Name Verified)
              </label>
              <input
                type="text"
                value={alipayName}
                onChange={(e) => setAlipayName(e.target.value)}
                placeholder="e.g. Chen Wei"
                data-testid="input-alipay-name"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Alipay Account ID / Mobile Phone / Email
              </label>
              <input
                type="text"
                value={alipayAccount}
                onChange={(e) => setAlipayAccount(e.target.value)}
                placeholder="e.g. 13800138000 or alipay@merchant.cn"
                data-testid="input-alipay-account"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Alipay QR Code Upload Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Upload Alipay Payment QR Code <span className="text-rose-400">*</span>
              </label>

              {alipayQrDataUrl ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-blue-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setShowQrPreviewModal(alipayQrDataUrl)}
                      className="w-12 h-12 rounded-xl bg-white p-1 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img src={alipayQrDataUrl} alt="Alipay QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate max-w-[170px]">{alipayQrFileName || 'Alipay_QR_Code.png'}</span>
                      </p>
                      <span className="text-[10px] text-emerald-400 font-mono">Ready for admin clearance</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowQrPreviewModal(alipayQrDataUrl)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Inspect QR Code"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAlipayQrDataUrl(null);
                        setAlipayQrFileName('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove QR Code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-alipay-qr-box"
                  className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Tap to upload Alipay QR code image</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, or screenshot from Alipay app (Max 8MB)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHANNEL B: WECHAT PAY */}
        {selectedChannel === 'wechat' && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <WeChatLogo className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  WeChat Pay Recipient & QR Code
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                Tencent WeChat
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                WeChat Pay Beneficiary Full Name
              </label>
              <input
                type="text"
                value={wechatName}
                onChange={(e) => setWechatName(e.target.value)}
                placeholder="e.g. Li Na"
                data-testid="input-wechat-name"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                WeChat ID / Registered Mobile Phone
              </label>
              <input
                type="text"
                value={wechatAccount}
                onChange={(e) => setWechatAccount(e.target.value)}
                placeholder="e.g. wxid_lina_trade88"
                data-testid="input-wechat-account"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* WeChat QR Code Upload Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Upload WeChat Pay QR Code <span className="text-rose-400">*</span>
              </label>

              {wechatQrDataUrl ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setShowQrPreviewModal(wechatQrDataUrl)}
                      className="w-12 h-12 rounded-xl bg-white p-1 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img src={wechatQrDataUrl} alt="WeChat Pay QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate max-w-[170px]">{wechatQrFileName || 'WeChat_Pay_QR.png'}</span>
                      </p>
                      <span className="text-[10px] text-emerald-400 font-mono">Ready for admin clearance</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowQrPreviewModal(wechatQrDataUrl)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Inspect QR Code"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWechatQrDataUrl(null);
                        setWechatQrFileName('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove QR Code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-wechat-qr-box"
                  className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Tap to upload WeChat Pay QR code image</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, or screenshot from WeChat app (Max 8MB)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHANNEL C: CHINESE BANK TRANSFER */}
        {selectedChannel === 'china_bank' && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Chinese Mainland Bank Details
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                CNAPS Clearance
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Beneficiary Chinese Bank
              </label>
              <select
                value={chineseBank}
                onChange={(e) => setChineseBank(e.target.value)}
                data-testid="select-chinese-bank"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
              >
                {CHINESE_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Account Holder Full Name (PinYin or Chinese Characters)
              </label>
              <input
                type="text"
                value={chineseAccountName}
                onChange={(e) => setChineseAccountName(e.target.value)}
                placeholder="e.g. Guangzhou Global Logistics Co Ltd"
                data-testid="input-china-account-name"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Bank Card / CNAPS Account Number
              </label>
              <input
                type="text"
                value={chineseAccountNumber}
                onChange={(e) => setChineseAccountNumber(e.target.value)}
                placeholder="e.g. 6222021001123456789"
                data-testid="input-china-account-number"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        )}

        {/* CHANNEL D: NAIRA (NGN) BANK PAYOUT */}
        {selectedChannel === 'naira_bank' && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
              Destination Nigerian Bank Account
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Beneficiary Bank
              </label>
              <select
                value={selectedNgnBank.code}
                onChange={(e) => {
                  const found = NIGERIAN_BANKS.find(b => b.code === e.target.value);
                  if (found) setSelectedNgnBank(found);
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
                value={ngnAccountNumber}
                onChange={(e) => setNgnAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 2089140022"
                data-testid="input-ngn-account-number"
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
                  <span className="font-bold text-emerald-400 text-xs block mt-0.5">{ngnAccountName}</span>
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
          </div>
        )}

        {/* Withdrawal Note */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Withdrawal Purpose / Note (Optional)
          </label>
          <input
            type="text"
            value={withdrawalNote}
            onChange={(e) => setWithdrawalNote(e.target.value)}
            placeholder="e.g. Sourcing settlement, Factory payment, or Personal transfer"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        {/* Breakdown Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Payout Rail:</span>
            <span className="font-bold text-white uppercase">
              {selectedChannel === 'alipay' ? 'Alipay Payout (¥)' : selectedChannel === 'wechat' ? 'WeChat Pay (¥)' : selectedChannel === 'china_bank' ? 'Chinese Bank (¥)' : 'Naira Bank (₦)'}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Withdrawal Amount:</span>
            <span className="font-extrabold text-white num-tabular">
              {selectedChannel === 'naira_bank'
                ? `₦${validNgnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN`
                : `¥${validCnyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY`}
            </span>
          </div>
          {selectedChannel === 'naira_bank' && (
            <div className="flex justify-between text-slate-400">
              <span>Processing Fee (NIP):</span>
              <span className="font-bold text-slate-200 num-tabular">₦{FLAT_FEE_NGN}.00 NGN</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
            <span className="font-bold text-slate-200">Total Wallet Debit:</span>
            <span className="font-black text-emerald-400 num-tabular">
              {selectedChannel === 'naira_bank'
                ? `₦${totalNgnDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} NGN`
                : `¥${validCnyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} CNY`}
            </span>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
          <p className="leading-snug text-[11px]">
            Funds are queued for manual administrative clearance. For Alipay and WeChat requests, our treasury desk scans your uploaded QR code to disburse funds and uploads an official transfer receipt.
          </p>
        </div>

        {/* Review Action Button */}
        <button
          onClick={handleInitiateReview}
          data-testid="review-payout-btn"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>
            Review {selectedChannel === 'naira_bank' ? `Payout (₦${validNgnAmount.toLocaleString()})` : `Payout (¥${validCnyAmount.toLocaleString()})`}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. REVIEW MODAL */}
      {/* ======================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Review Withdrawal Payout</h3>
              <p className="text-xs text-slate-400 mt-0.5">Verify recipient details before PIN authorization</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Payout Rail:</span>
                <span className="font-bold text-emerald-400">
                  {selectedChannel === 'alipay' ? '🇨🇳 Alipay Payout (QR)' : selectedChannel === 'wechat' ? '🇨🇳 WeChat Pay (QR)' : selectedChannel === 'china_bank' ? '🇨🇳 Chinese Bank (CNAPS)' : '🇳🇬 Naira Bank (NIP)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary Name:</span>
                <span className="font-bold text-white text-right max-w-[180px] truncate">
                  {selectedChannel === 'alipay' ? alipayName : selectedChannel === 'wechat' ? wechatName : selectedChannel === 'china_bank' ? chineseAccountName : ngnAccountName}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account / ID:</span>
                <span className="font-mono text-emerald-400 font-bold tracking-wider text-right max-w-[180px] truncate">
                  {selectedChannel === 'alipay' ? alipayAccount : selectedChannel === 'wechat' ? wechatAccount : selectedChannel === 'china_bank' ? `${chineseBank} (${chineseAccountNumber})` : `${selectedNgnBank.name} (${ngnAccountNumber})`}
                </span>
              </div>

              {(selectedChannel === 'alipay' || selectedChannel === 'wechat') && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Uploaded QR Code:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-300 font-mono font-bold">Attached & Verified</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Payout Amount:</span>
                <span className="font-extrabold text-white num-tabular text-sm">
                  {selectedChannel === 'naira_bank'
                    ? `₦${validNgnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : `¥${validCnyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              {selectedChannel === 'naira_bank' && (
                <div className="flex justify-between text-slate-400">
                  <span>Processing Fee:</span>
                  <span className="font-bold text-slate-200">₦{FLAT_FEE_NGN}.00</span>
                </div>
              )}

              <div className="pt-1 border-t border-slate-800/60 flex justify-between font-bold">
                <span className="text-slate-200">Total Wallet Debit:</span>
                <span className="text-emerald-400 num-tabular text-sm">
                  {selectedChannel === 'naira_bank'
                    ? `₦${totalNgnDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : `¥${validCnyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                Authorizing with your transaction PIN will immediately debit funds from your wallet and queue the payout for treasury desk manual clearance.
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
                data-testid="proceed-to-pin-btn"
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Authorize with PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PIN AUTHORIZATION MODAL */}
      {/* ======================================================== */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Withdrawal"
              subtitle={`Authorize ${selectedChannel === 'naira_bank' ? `₦${validNgnAmount.toLocaleString()}` : `¥${validCnyAmount.toLocaleString()}`} Payout`}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. LIVE PENDING TRACKING VIEW / RECEIPT MODAL */}
      {/* ======================================================== */}
      {submissionReceipt && (
        <div 
          data-testid="pending-withdrawal-view"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${
                submissionReceipt.status === 'Successful'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-amber-500/20'
              }`}>
                {submissionReceipt.status === 'Successful' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
                )}
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {submissionReceipt.status === 'Successful' ? 'Payout Cleared & Successful' : 'Withdrawal Queued for Clearance'}
              </h3>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${submissionReceipt.status === 'Successful' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                <span 
                  data-testid="withdrawal-status-badge"
                  className={`text-xs font-bold ${submissionReceipt.status === 'Successful' ? 'text-emerald-400' : 'text-amber-400'}`}
                >
                  Status: {submissionReceipt.status === 'Successful' ? 'Successful' : 'Pending Administrative Payout'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Reference:</span>
                <span data-testid="receipt-reference" className="font-mono text-emerald-400 font-bold">{submissionReceipt.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout Channel:</span>
                <span className="font-bold text-white">{submissionReceipt.channelName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-200 text-right max-w-[180px] truncate">{submissionReceipt.accountName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account ID / Number:</span>
                <span className="font-mono text-slate-300">{submissionReceipt.accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout Amount:</span>
                <span className="font-extrabold text-white num-tabular">
                  {submissionReceipt.currency === 'NGN' ? `₦${submissionReceipt.amount.toLocaleString()}` : `¥${submissionReceipt.amount.toLocaleString()}`}
                </span>
              </div>

              {/* Uploaded QR thumbnail if available */}
              {submissionReceipt.qrCodeUrl && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Uploaded QR Code:</span>
                  <div 
                    onClick={() => setShowQrPreviewModal(submissionReceipt.qrCodeUrl)}
                    className="w-10 h-10 rounded-lg bg-white p-0.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img src={submissionReceipt.qrCodeUrl} alt="Uploaded QR" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Transfer Proof Receipt Uploaded by Admin */}
              {submissionReceipt.paymentProofUrl && (
                <div data-testid="admin-proof-receipt-card" className="pt-2 border-t border-emerald-500/30 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Admin Transfer Proof Receipt
                  </span>
                  <div 
                    onClick={() => setShowQrPreviewModal(submissionReceipt.paymentProofUrl)}
                    className="w-full h-28 rounded-xl bg-slate-900 border border-emerald-500/40 p-1 overflow-hidden cursor-pointer hover:opacity-90 flex items-center justify-center relative group"
                  >
                    <img src={submissionReceipt.paymentProofUrl} alt="Transfer Receipt" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Tap to expand
                      </span>
                    </div>
                  </div>
                  <a
                    href={submissionReceipt.paymentProofUrl}
                    download={`FlyeMass_Receipt_${submissionReceipt.reference}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Transfer Receipt</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Notice on Clearance & Receipts</span>
              </p>
              <p className="text-slate-400">
                Your funds have been debited from your vault. Administrators process payouts manually via Alipay, WeChat, or Banking switches. The transfer proof receipt will appear here automatically upon completion.
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

      {/* ======================================================== */}
      {/* 8. QR CODE / RECEIPT INSPECTOR MODAL */}
      {/* ======================================================== */}
      {showQrPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 max-w-xs w-full text-center shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Document / QR Code Viewer
              </h4>
              <button 
                onClick={() => setShowQrPreviewModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-64 h-64 mx-auto bg-white p-2 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
              <img src={showQrPreviewModal} alt="Document View" className="w-full h-full object-contain" />
            </div>

            <a
              href={showQrPreviewModal}
              download="FlyeMass_Document.png"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawScreen;
