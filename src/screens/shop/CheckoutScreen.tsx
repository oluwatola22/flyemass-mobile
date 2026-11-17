import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  MapPin, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  Plane,
  Building,
  Edit2,
  X,
  PackageCheck,
  Check
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
    setSelectedOrderId,
    navigate, 
    showToast,
    userProfile
  } = useApp();

  const [paymentWallet, setPaymentWallet] = useState<Currency>('NGN');
  
  // Shipping Mark & Delivery Address State
  const shippingMark = userProfile ? `FM / ${userProfile.flyeTag?.replace('@', '').toUpperCase() || 'USR-8924'} / ${(userProfile.name || 'Chief Babatunde Alade').toUpperCase()}` : 'FM / USR-8924 / BABATUNDE ALADE';
  const [recipientName, setRecipientName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [recipientPhone, setRecipientPhone] = useState(userProfile?.phone || '+234 803 555 9201');
  const [deliveryAddress, setDeliveryAddress] = useState('Plot 14, Commercial Avenue, Ikeja Computer Village');
  const [deliveryCity, setDeliveryCity] = useState('Ikeja, Lagos');
  const [deliveryStateCountry, setDeliveryStateCountry] = useState('Lagos State, Nigeria');
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(deliveryAddress);
  const [tempName, setTempName] = useState(recipientName);
  const [tempPhone, setTempPhone] = useState(recipientPhone);
  const [tempCity, setTempCity] = useState(deliveryCity);
  const [tempStateCountry, setTempStateCountry] = useState(deliveryStateCountry);

  const [showPinModal, setShowPinModal] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    orderNumber: string;
    trackingNumber: string;
    totalAmount: number;
    currency: Currency;
  } | null>(null);

  const dbState = db.getState();
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };
  const shopSettings = db.getShopSettings();
  const deliveryFeeNGN = shopSettings.deliveryFeeNGN ?? 5000;

  // Accurate calculations with variant price adjustments
  const subtotalNGN = cart.reduce((sum, item) => {
    const base = item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485));
    const adj = item.priceAdjustmentNGN || 0;
    return sum + ((base + adj) * item.quantity);
  }, 0);

  const totalNGN = subtotalNGN + deliveryFeeNGN;
  const totalCNY = Math.round((totalNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24));

  const selectedWalletObj = wallets.find((w) => w.currency === paymentWallet);
  const requiredAmount = paymentWallet === 'CNY' ? totalCNY : totalNGN;

  const handlePay = () => {
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim() || !deliveryCity.trim() || !deliveryStateCountry.trim()) {
      showToast('Please complete all delivery details (Name, Phone, Address, City, State/Country)', 'error');
      return;
    }
    if (!selectedWalletObj || selectedWalletObj.balance < requiredAmount) {
      showToast(`Insufficient balance in ${paymentWallet} wallet`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = (enteredPin?: string) => {
    setShowPinModal(false);
    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullDestination = `${deliveryAddress}, ${deliveryCity}, ${deliveryStateCountry} (${recipientName}, ${recipientPhone})`;

    const success = placeShopOrder(paymentWallet, fullDestination, enteredPin);
    if (success) {
      setConfirmedOrderData({
        orderNumber,
        trackingNumber,
        totalAmount: requiredAmount,
        currency: paymentWallet
      });
      setOrderConfirmed(true);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryAddress(tempAddress);
    setRecipientName(tempName);
    setRecipientPhone(tempPhone);
    setDeliveryCity(tempCity);
    setDeliveryStateCountry(tempStateCountry);
    setShowAddressModal(false);
    showToast('Delivery address updated', 'success');
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Secure Tech Checkout" />

      <div className="p-4 space-y-4">
        {/* Step 1: Destination Delivery Details Form */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step 1: Destination Delivery Details</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Doorstep Delivery</span>
          </div>

          {/* Customer Shipping Mark Badge */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unique Customer Shipping Mark</span>
              <p className="text-xs font-mono font-bold text-emerald-400">{shippingMark}</p>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              HK Tagged
            </span>
          </div>

          {/* Direct Input Delivery Form */}
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Chief Babatunde Alade"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. +234 803 555 9201"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Shipping Address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Plot / Street / Suite"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="e.g. Ikeja, Lagos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">State / Country</label>
                <input
                  type="text"
                  value={deliveryStateCountry}
                  onChange={(e) => setDeliveryStateCountry(e.target.value)}
                  placeholder="e.g. Lagos State, Nigeria"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Order Items Summary */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Step 2: Order Review ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </span>

          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto no-scrollbar">
            {cart.map((item, idx) => {
              const unitPrice = (item.product.priceNGN || Math.round((item.product.priceUSD || 0) * (rates.USD_NGN || 1485))) + (item.priceAdjustmentNGN || 0);
              const lineTotal = unitPrice * item.quantity;

              return (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{item.product.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.selectedColor} • {item.selectedStorage} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold shrink-0 num-tabular">
                    ₦{lineTotal.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Hardware Subtotal:</span>
              <span className="text-white font-bold num-tabular">₦{subtotalNGN.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Standard Air Delivery Fee:</span>
              <span className="text-white font-bold num-tabular">₦{deliveryFeeNGN.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-white pt-1 border-t border-slate-800/60">
              <span>Total Payable (NGN):</span>
              <span className="text-base text-emerald-400 font-extrabold num-tabular">₦{totalNGN.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Step 3: Multi-Currency Wallet Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step 3: Select Payment Wallet</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Instant Escrow Settlement</span>
          </div>

          <div className="space-y-2">
            {(['NGN', 'CNY'] as Currency[]).map((c) => {
              const w = wallets.find((item) => item.currency === c);
              const isSelected = paymentWallet === c;
              const charge = c === 'CNY' ? totalCNY : totalNGN;
              const hasEnough = (w?.balance || 0) >= charge;

              return (
                <div
                  key={c}
                  onClick={() => setPaymentWallet(c)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w?.flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{w?.name}</h4>
                      <p className="text-[10px] text-slate-400 num-tabular">
                        Available: {w?.symbol}{(w?.balance ?? 0).toLocaleString()} {c}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-400 num-tabular block">
                      {w?.symbol}{charge.toLocaleString()} {c}
                    </span>
                    {!hasEnough && (
                      <span className="text-[9px] text-rose-400 font-bold">Insufficient Balance</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Debit Confirmation Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Air Cargo Clearance:</span>
            <span className="text-emerald-400 font-bold">Pre-cleared via FlyeMass Air Escrow</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Funding Source:</span>
            <span className="text-white font-bold">{paymentWallet} Wallet</span>
          </div>
          <div className="flex justify-between items-baseline text-white border-t border-slate-800 pt-2 font-bold">
            <span className="text-sm">Amount Debited:</span>
            <span className="text-lg font-extrabold text-emerald-400 num-tabular">
              {selectedWalletObj?.symbol}{requiredAmount.toLocaleString()} {paymentWallet}
            </span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          type="button"
          onClick={handlePay}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Authorize Payment with 6-Digit PIN</span>
        </button>
      </div>

      {/* Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edit Delivery Destination</h3>
              <button 
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Delivery Address & Hub in Nigeria</label>
                <textarea
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Save Address Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Apple Order"
              subtitle={`Debit ${selectedWalletObj?.symbol}${requiredAmount.toLocaleString()} from ${paymentWallet} wallet`}
              expectedPin={userPin}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}

      {/* Order Confirmed Celebration Modal */}
      {orderConfirmed && confirmedOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Apple Order Placed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your payment of {confirmedOrderData.currency} {confirmedOrderData.totalAmount.toLocaleString()} has been verified and your order allocated in Hong Kong Hub.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Order Reference:</span>
                <span className="font-mono text-white font-bold">{confirmedOrderData.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Consignment Waybill:</span>
                <span className="font-mono text-emerald-400 font-bold">{confirmedOrderData.trackingNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Arrival:</span>
                <span className="text-white">2–4 Business Days via Air Cargo</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderConfirmed(false);
                  navigate('shop-orders');
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Track Order & Timeline
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderConfirmed(false);
                  navigate('shop');
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
