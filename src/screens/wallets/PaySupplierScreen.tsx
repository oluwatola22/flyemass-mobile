import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Building2, 
  AlertCircle, 
  Smartphone,
  ExternalLink,
  Receipt
} from 'lucide-react';

type PayMethod = 'alipay' | 'wechat' | 'bank';

export const PaySupplierScreen: React.FC = () => {
  const { wallets, paySupplier, userPin, goBack, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<PayMethod>('alipay');
  
  // Form fields
  const [receiverId, setReceiverId] = useState('13800138000');
  const [amountCNY, setAmountCNY] = useState('25000');
  const [supplierName, setSupplierName] = useState('Shenzhen Foxconn Micro Tech Ltd');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [orderRemark, setOrderRemark] = useState('PO #9824 - iPhone Parts Batch 2');
  
  // Security PIN state
  const [showPinModal, setShowPinModal] = useState(false);
  const [paymentCompleteReceipt, setPaymentCompleteReceipt] = useState<any | null>(null);

  const cnyWallet = wallets.find((w) => w.currency === 'CNY');
  const cnyBalance = cnyWallet?.balance || 0;

  const handleVerifyReceiver = () => {
    setIsVerifying(true);
    setIsVerified(false);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      showToast('Supplier merchant identity verified with SAFE China registry', 'success');
    }, 800);
  };

  const handleInitiatePayment = () => {
    const num = parseFloat(amountCNY);
    if (isNaN(num) || num <= 0) {
      showToast('Enter a valid CNY payment amount', 'error');
      return;
    }
    if (num > cnyBalance) {
      showToast(`Insufficient CNY balance (Available: ¥${cnyBalance.toLocaleString()})`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = (pin: string) => {
    setShowPinModal(false);
    const num = parseFloat(amountCNY);
    const methodLabel = activeTab === 'alipay' ? 'Alipay Business' : activeTab === 'wechat' ? 'WeChat Pay' : 'China UnionPay CNAPS';
    
    const success = paySupplier(supplierName, methodLabel, num, orderRemark);
    if (success) {
      setPaymentCompleteReceipt({
        amount: num,
        recipient: supplierName,
        receiverId,
        method: methodLabel,
        reference: `FLYE-CN-${Math.floor(1000000 + Math.random() * 9000000)}`,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Pay China Supplier" />

      <div className="p-4 space-y-4">
        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setActiveTab('alipay'); handleVerifyReceiver(); }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'alipay' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Alipay</span>
            <span className="text-[10px] opacity-80">(支付宝)</span>
          </button>

          <button
            onClick={() => { setActiveTab('wechat'); handleVerifyReceiver(); }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'wechat' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>WeChat</span>
            <span className="text-[10px] opacity-80">(微信支付)</span>
          </button>

          <button
            onClick={() => { setActiveTab('bank'); handleVerifyReceiver(); }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Bank (银联)</span>
          </button>
        </div>

        {/* Balance Status */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <div>
              <span className="text-slate-400">Available RMB Wallet:</span>
              <p className="font-extrabold text-emerald-400 num-tabular">¥{cnyBalance.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={goBack}
            className="text-[11px] font-semibold text-emerald-400 hover:underline"
          >
            + Swap from NGN
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3.5 p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              {activeTab === 'alipay' ? 'Alipay Account / Phone / Email' : activeTab === 'wechat' ? 'WeChat Pay Merchant ID' : 'Bank Account / CNAPS Number'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="e.g. 13800138000"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
              />
              <button
                type="button"
                onClick={handleVerifyReceiver}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 shrink-0"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Automated Receiver Verification Card */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Automated SAFE Receiver Check
              </span>
              {isVerifying ? (
                <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Querying China API...</span>
              ) : isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Real-Name Verified</span>
                </span>
              ) : null}
            </div>

            <p className="text-xs font-bold text-white mt-1">{supplierName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Verified Chinese Business Entity • Guangdong Tax Bureau Registered
            </p>
          </div>

          {/* Amount in CNY */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Payment Amount (¥ CNY)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-lg font-bold text-emerald-400">¥</span>
              <input
                type="number"
                value={amountCNY}
                onChange={(e) => setAmountCNY(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xl font-extrabold text-white num-tabular"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Equivalent: ≈ ₦{(parseFloat(amountCNY || '0') * 214.5).toLocaleString()} NGN</span>
              <span>Settlement: Instant (T+0)</span>
            </div>
          </div>

          {/* PO / Invoice Reference */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Order Reference / 1688 Order ID
            </label>
            <input
              type="text"
              value={orderRemark}
              onChange={(e) => setOrderRemark(e.target.value)}
              placeholder="e.g. 1688 Order #89201"
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white"
            />
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-400" />
          <p className="leading-snug text-[11px]">
            FlyeMass is an authorized cross-border clearing partner. Payments are directly settled to the Chinese merchant's wallet in local Renminbi.
          </p>
        </div>

        <button
          onClick={handleInitiatePayment}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Authorize Payout (¥{parseFloat(amountCNY || '0').toLocaleString()})</span>
        </button>
      </div>

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Supplier Payout"
              subtitle={`Transfer ¥${parseFloat(amountCNY).toLocaleString()} to ${supplierName}`}
              expectedPin={userPin}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {paymentCompleteReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Payment Successful</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">Supplier Merchant Credited</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-extrabold text-white num-tabular text-sm">¥{paymentCompleteReceipt.amount.toLocaleString()} CNY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recipient:</span>
                <span className="font-bold text-slate-200 text-right max-w-[180px] truncate">{paymentCompleteReceipt.recipient}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Channel:</span>
                <span className="text-slate-200">{paymentCompleteReceipt.method}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reference:</span>
                <span className="font-mono text-emerald-400">{paymentCompleteReceipt.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-slate-300">{paymentCompleteReceipt.timestamp}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentCompleteReceipt(null);
                goBack();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Done & Return to Wallets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
