import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { CHINA_HOTELS } from '../../data/mockData';
import { Currency } from '../../types';
import { 
  Building, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Copy, 
  CheckCheck, 
  Calendar, 
  ShieldCheck, 
  Phone,
  ArrowRight,
  Wallet
} from 'lucide-react';

export const HotelDetailScreen: React.FC = () => {
  const { routeParam, bookHotel, navigate, showToast, wallets } = useApp();
  const [nights, setNights] = useState<number>(4);
  const [copiedTaxiCard, setCopiedTaxiCard] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('USD');
  const [showPinModal, setShowPinModal] = useState(false);

  const hotel = CHINA_HOTELS.find((h) => h.id === routeParam) || CHINA_HOTELS[0];

  const totalUSD = hotel.pricePerNightUSD * nights;
  const totalCNY = hotel.pricePerNightCNY * nights;
  const totalNGN = totalUSD * 1485;

  const currentWallet = wallets.find(w => w.currency === paymentCurrency);
  const debitAmount = paymentCurrency === 'NGN' ? totalNGN : paymentCurrency === 'CNY' ? totalCNY : totalUSD;
  const hasSufficient = (currentWallet?.balance || 0) >= debitAmount;

  const taxiCardZh = `师傅您好，请带我到：${hotel.chineseName} (${hotel.district})。谢谢！`;

  const handleCopyTaxiCard = () => {
    navigator.clipboard?.writeText(taxiCardZh);
    setCopiedTaxiCard(true);
    showToast('Chinese taxi driver directions copied!', 'success');
    setTimeout(() => setCopiedTaxiCard(false), 2000);
  };

  const handleBook = () => {
    if (!hasSufficient) {
      showToast(`Insufficient balance in ${paymentCurrency} wallet. Top up or swap first!`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = (pin: string) => {
    setShowPinModal(false);
    const success = bookHotel(hotel, nights, paymentCurrency, pin);
    if (success) {
      navigate('hotel-bookings');
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Hotel Booking & Voucher" />

      <div className="p-4 space-y-4">
        {/* Cover Photo */}
        <div className="relative h-56 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />

          <div className="absolute bottom-4 left-4 right-4">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-slate-950 font-bold text-[10px] uppercase">
              {hotel.city} Trade Hub Partner
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1.5 leading-snug">{hotel.name}</h2>
            <p className="text-xs text-slate-300 font-sans">{hotel.chineseName}</p>
          </div>
        </div>

        {/* Essential Chinese Taxi Card (For Chinese taxi / DiDi drivers) */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              出租车司机专用卡 (Show to Taxi Driver)
            </span>
            <button
              onClick={handleCopyTaxiCard}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl hover:bg-emerald-500/20 transition-all"
            >
              {copiedTaxiCard ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTaxiCard ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-medium text-white select-all leading-relaxed">
            {taxiCardZh}
          </div>
          <p className="text-[10px] text-slate-400">
            Show this screen to your airport or high-speed rail taxi driver directly upon landing in China.
          </p>
        </div>

        {/* Amenities & Proximity */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">International Trade Amenities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {hotel.amenities.map((a) => (
              <div key={a} className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stay Duration Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Select Nights:</span>
            <div className="flex items-center gap-2">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setNights(n)}
                  className={`w-9 h-8 rounded-xl text-xs font-bold transition-all ${
                    nights === n
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {n}n
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between text-xs">
            <span className="text-slate-400">Total for {nights} nights:</span>
            <div className="text-right">
              <span className="text-lg font-extrabold text-white num-tabular">${totalUSD} USD</span>
              <span className="text-xs text-emerald-400 block num-tabular">≈ ¥{totalCNY.toLocaleString()} CNY / ₦{totalNGN.toLocaleString()} NGN</span>
            </div>
          </div>
        </div>

        {/* Multi-Currency Payment Wallet Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Payment Wallet</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Guaranteed Booking</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['USD', 'NGN', 'CNY'] as Currency[]).map((c) => {
              const w = wallets.find(item => item.currency === c);
              const isSelected = paymentCurrency === c;
              const charge = c === 'NGN' ? totalNGN : c === 'USD' ? totalUSD : totalCNY;
              const hasEnough = (w?.balance || 0) >= charge;

              return (
                <div
                  key={c}
                  onClick={() => setPaymentCurrency(c)}
                  className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl block mb-1">{w?.flag}</span>
                  <span className="text-xs font-bold text-white block">{c}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                    {w?.symbol}{charge.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  {!hasEnough && (
                    <span className="text-[9px] text-rose-400 font-bold block mt-0.5">Insufficient</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleBook}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Authorize Reservation with PIN</span>
        </button>
      </div>

      {/* 6-Digit PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <PinPad
              title="Authorize Hotel Booking"
              subtitle={`Debit ${currentWallet?.symbol}${debitAmount.toLocaleString()} from ${paymentCurrency} wallet`}
              onComplete={handlePinSuccess}
              onCancel={() => setShowPinModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
