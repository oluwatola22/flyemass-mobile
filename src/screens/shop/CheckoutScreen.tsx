import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { 
  ShieldCheck, 
  MapPin, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  Plane,
  Building
} from 'lucide-react';
import { Currency } from '../../types';

export const CheckoutScreen: React.FC = () => {
  const { 
    cart, 
    clearCart, 
    wallets, 
    userPin, 
    placeShopOrder,
    selectedOrderId,
    navigate, 
    showToast 
  } = useApp();

  const [paymentWallet, setPaymentWallet] = useState<Currency>('USD');
  const [deliveryAddress, setDeliveryAddress] = useState('Plot 14, Commercial Avenue, Ikeja Computer Village, Lagos, Nigeria');
  const [recipientContact, setRecipientContact] = useState('Chief Babatunde Alade (+234 803 555 9201)');
  const [showPinModal, setShowPinModal] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const subtotalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalUSD = subtotalUSD + 45;
  const totalNGN = totalUSD * 1485;
  const totalCNY = totalUSD * 7.24;

  const selectedWalletObj = wallets.find((w) => w.currency === paymentWallet);
  const requiredAmount = paymentWallet === 'NGN' ? totalNGN : paymentWallet === 'USD' ? totalUSD : totalCNY;

  const handlePay = () => {
    if (!selectedWalletObj || selectedWalletObj.balance < requiredAmount) {
      showToast(`Insufficient balance in ${paymentWallet} wallet`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    const success = placeShopOrder(paymentWallet, deliveryAddress);
    if (success) {
      setOrderConfirmed(true);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Secure Wallet Checkout" />

      <div className="p-4 space-y-4">
        {/* Destination Address */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lagos Delivery Address</span>
            </span>
            <button className="text-[11px] text-emerald-400 font-bold hover:underline">Change</button>
          </div>
          <p className="text-xs font-semibold text-white">{deliveryAddress}</p>
          <p className="text-[11px] text-slate-400">{recipientContact}</p>
        </div>

        {/* Integrated Multi-Currency Wallet Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Wallet to Debit</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Direct Settlement</span>
          </div>

          <div className="space-y-2">
            {(['NGN', 'CNY', 'USD'] as Currency[]).map((c) => {
              const w = wallets.find((item) => item.currency === c);
              const isSelected = paymentWallet === c;
              const charge = c === 'NGN' ? totalNGN : c === 'USD' ? totalUSD : totalCNY;
              const hasEnough = (w?.balance || 0) >= charge;

              return (
                <div
                  key={c}
                  onClick={() => setPaymentWallet(c)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w?.flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{w?.name}</h4>
                      <p className="text-[10px] text-slate-400 num-tabular">
                        Balance: {w?.symbol}{w?.balance.toLocaleString()} {c}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-400 num-tabular block">
                      {w?.symbol}{charge.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    {!hasEnough && (
                      <span className="text-[9px] text-rose-400 font-bold">Insufficient</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Debit Confirmation */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Air Cargo Clearance:</span>
            <span className="text-emerald-400 font-bold">Pre-cleared at Lagos MM2</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Debit Vault:</span>
            <span className="text-white font-bold">{paymentWallet} Wallet</span>
          </div>
          <div className="flex justify-between items-baseline text-white border-t border-slate-800 pt-2 font-bold">
            <span className="text-sm">Amount Debited:</span>
            <span className="text-lg font-extrabold text-emerald-400 num-tabular">
              {selectedWalletObj?.symbol}{requiredAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {paymentWallet}
            </span>
          </div>
        </div>

        <button
          onClick={handlePay}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Authorize Debit with PIN</span>
        </button>
      </div>

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Tech Purchase"
              subtitle={`Debit ${selectedWalletObj?.symbol}${requiredAmount.toLocaleString()} from ${paymentWallet} wallet`}
              expectedPin={userPin}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* Order Confirmed Celebration Modal */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Order Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your Hong Kong factory order has been placed into our automated Guangzhou consolidation workflow.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Waybill Number:</span>
                <span className="font-mono text-emerald-400 font-bold">FM-TECH-AIR-892</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Landing:</span>
                <span className="text-white">In 3 Business Days</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setOrderConfirmed(false);
                  navigate('shop-order-detail');
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Track Tech Consignment
              </button>

              <button
                onClick={() => {
                  setOrderConfirmed(false);
                  navigate('shop-orders');
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-all"
              >
                View Purchase Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
