import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { PinPad } from '../../components/ui/PinPad';
import { db } from '../../services/db';
import { CHINA_HOTELS } from '../../data/mockData';
import { Currency, Hotel, HotelRoomType } from '../../types';
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
  Wallet,
  Users,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';

export const HotelDetailScreen: React.FC = () => {
  const { routeParam, navigate, showToast, wallets, activeUserId, userProfile } = useApp();

  // Find hotel from DB or mock fallback
  const allHotels = db.getHotels();
  const hotel: Hotel = (allHotels.length > 0 ? allHotels : CHINA_HOTELS).find((h: Hotel) => h.id === routeParam) || CHINA_HOTELS[0];

  // Room Types
  const defaultRoomTypes: HotelRoomType[] = [
    { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Comfortable king bed, city view, high-speed Wi-Fi', amenities: ['King Bed', 'Free Wi-Fi', 'Rain Shower'] },
    { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 30, maxGuests: 3, description: 'Spacious double bed suite, complimentary executive breakfast', amenities: ['Twin Double Beds', 'Breakfast Included', 'Work Desk'] },
    { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 80, maxGuests: 4, description: 'Luxury 65sqm suite with private meeting lounge & panoramic skyline view', amenities: ['Separate Living Area', 'Executive Lounge Access', 'Bathtub', 'Airport Transfer'] }
  ];
  const roomTypes: HotelRoomType[] = (hotel.roomTypes && hotel.roomTypes.length > 0) ? hotel.roomTypes : defaultRoomTypes;

  const [selectedRoom, setSelectedRoom] = useState<HotelRoomType>(roomTypes[0]);
  const [checkIn, setCheckIn] = useState('2026-11-12');
  const [checkOut, setCheckOutDate] = useState('2026-11-16');
  const [guestCount, setGuestCount] = useState<number>(2);

  const [guestName, setGuestName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [guestEmail, setGuestEmail] = useState(userProfile?.email || 'alade@aladeholdings.ng');
  const [guestPhone, setGuestPhone] = useState(userProfile?.phone || '+234 803 123 4567');

  const isCnyConfigured = (hotel?.pricePerNightCNY ?? (hotel as any)?.priceCNY ?? 0) > 0;
  const isNgnConfigured = (hotel?.pricePerNightNGN ?? (hotel as any)?.priceNGN ?? 0) > 0;

  const defaultCurrency: Currency = isNgnConfigured ? 'NGN' : isCnyConfigured ? 'CNY' : 'NGN';

  const [copiedTaxiCard, setCopiedTaxiCard] = useState(false);
  const [copiedAddressZh, setCopiedAddressZh] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(defaultCurrency);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Nights calculation
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const rawNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  const nights = rawNights > 0 ? rawNights : 1;

  // Multi-Currency Authoritative Calculations (No invented rates overwriting admin prices)
  const baseUSD = Number(hotel?.pricePerNightUSD ?? (hotel as any)?.priceUSD) || 0;
  const surchUSD = Number(selectedRoom?.nightlySurchargeUSD) || 0;
  const nightlyTotalUSD = (baseUSD || 120) + surchUSD;
  const totalUSD = nightlyTotalUSD * nights;

  const baseCNY = Number(hotel?.pricePerNightCNY ?? (hotel as any)?.priceCNY) || 0;
  const surchCNY = Number((selectedRoom as any)?.surchargeCNY ?? (selectedRoom as any)?.nightlySurchargeCNY) || 
    (surchUSD && baseUSD > 0 ? Math.round(surchUSD * (baseCNY / baseUSD)) : 0);
  const nightlyTotalCNY = baseCNY + surchCNY;
  const totalCNY = nightlyTotalCNY * nights;

  const baseNGN = Number(hotel?.pricePerNightNGN ?? (hotel as any)?.priceNGN) || 0;
  const surchNGN = Number((selectedRoom as any)?.surchargeNGN ?? (selectedRoom as any)?.nightlySurchargeNGN) || 
    (surchUSD && baseUSD > 0 ? Math.round(surchUSD * (baseNGN / baseUSD)) : 0);
  const nightlyTotalNGN = baseNGN + surchNGN;
  const totalNGN = nightlyTotalNGN * nights;

  const currentWallet = wallets.find((w) => w.currency === paymentCurrency);
  const isPaymentCurrencyConfigured = paymentCurrency === 'CNY' ? isCnyConfigured : isNgnConfigured;
  const debitAmount = paymentCurrency === 'NGN' ? totalNGN : paymentCurrency === 'CNY' ? totalCNY : totalUSD;
  const hasSufficient = (currentWallet?.balance || 0) >= debitAmount;
  const isPublished = (hotel as any)?.isPublished !== false;

  const chineseAddressText = hotel?.chineseAddress || (hotel?.district ? `中国广东省广州市${hotel.district}` : '中国广东省广州市');
  const taxiCardZh = hotel?.taxiCardZh || `师傅您好，请带我到：${hotel?.chineseName || hotel?.name || '中国商务酒店'}（${chineseAddressText}）。谢谢！`;

  const handleCopyTaxiCard = () => {
    navigator.clipboard?.writeText(taxiCardZh);
    setCopiedTaxiCard(true);
    showToast('Chinese taxi driver directions copied!', 'success');
    setTimeout(() => setCopiedTaxiCard(false), 2000);
  };

  const handleCopyAddressZh = () => {
    navigator.clipboard?.writeText(chineseAddressText);
    setCopiedAddressZh(true);
    showToast('Chinese address copied!', 'success');
    setTimeout(() => setCopiedAddressZh(false), 2000);
  };

  const handleBook = () => {
    if (!isPublished) {
      showToast('This hotel is currently unavailable for booking.', 'error');
      return;
    }
    if ((selectedRoom as any)?.isAvailable === false) {
      showToast('Selected room type is currently sold out. Please choose an available room category.', 'error');
      return;
    }
    if (!isPaymentCurrencyConfigured) {
      showToast(`Hotel does not accept ${paymentCurrency}. Please choose an eligible configured currency.`, 'error');
      return;
    }
    if (!hasSufficient) {
      showToast(`Insufficient balance in ${paymentCurrency} wallet. Top up or swap first!`, 'error');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = async (pin: string) => {
    setShowPinModal(false);
    setIsBooking(true);
    try {
      await db.bookHotelWithPin(
        activeUserId,
        hotel,
        nights,
        totalUSD,
        paymentCurrency,
        guestName,
        pin,
        {
          roomType: selectedRoom.name,
          checkIn,
          checkOut,
          guestCount,
          guestEmail,
          guestPhone
        }
      );

      showToast(`Hotel reservation confirmed! Reference BK-2026 issued.`, 'success');
      navigate('hotel-bookings');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete hotel booking', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Hotel Booking & Voucher" />

      <div className="p-4 space-y-4">
        {/* Cover Photo & Badges */}
        <div className="relative h-56 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <img
            src={hotel.image || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
            alt={hotel.name || 'Partner Hotel'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-400 flex items-center gap-1 border border-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{hotel.rating}</span>
            <span className="text-slate-400">({hotel.reviewsCount || 120})</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-slate-950 font-bold text-[10px] uppercase">
              {hotel.city} Trade Hub Partner
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1.5 leading-snug">{hotel.name}</h2>
            <p className="text-xs text-slate-300 font-sans">{hotel.chineseName}</p>
          </div>
        </div>

        {/* Addresses & Distance */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">English Address</span>
            <p className="text-xs text-white leading-relaxed">{hotel.englishAddress || `${hotel.district}, ${hotel.city}, China`}</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-indigo-400">Official Chinese Address (中文地址)</span>
              <button
                type="button"
                onClick={handleCopyAddressZh}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedAddressZh ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAddressZh ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-indigo-200 font-sans select-all leading-relaxed">{chineseAddressText}</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{hotel.distanceToMarket}</span>
          </div>
        </div>

        {/* Essential Chinese Taxi Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              出租车司机专用卡 (Show to Taxi Driver)
            </span>
            <button
              onClick={handleCopyTaxiCard}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              {copiedTaxiCard ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTaxiCard ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-medium text-white select-all leading-relaxed">
            {taxiCardZh}
          </div>
          <p className="text-[10px] text-slate-400">
            Show this screen to your airport or high-speed rail taxi driver directly upon arrival in China.
          </p>
        </div>

        {/* Room Category Selection */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Select Room Category</h4>
            <span className="text-[10px] text-slate-400">Prices per night</span>
          </div>

          <div className="space-y-2">
            {roomTypes.map((rt) => {
              const isSelected = selectedRoom.name === rt.name || selectedRoom.id === rt.id;
              const surcharge = rt.nightlySurchargeUSD || 0;
              const roomNightly = (baseUSD || 120) + surcharge;
              const isRoomAvailable = (rt as any).isAvailable !== false;

              return (
                <div
                  key={rt.name}
                  onClick={() => {
                    if (isRoomAvailable) {
                      setSelectedRoom(rt);
                    } else {
                      showToast(`${rt.name} is currently sold out. Please select an available category.`, 'info');
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    !isRoomAvailable
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rt.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                        isRoomAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isRoomAvailable ? 'Available' : 'Sold Out'}
                      </span>
                      {surcharge > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">
                          +${surcharge} USD / nt
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[9px]">
                          Standard Base
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{rt.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>Max {rt.maxGuests || 2} Guests</span>
                      <span>•</span>
                      <span>{rt.amenities?.join(', ')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-sm font-mono font-black text-white">${roomNightly}</span>
                    <span className="text-[10px] text-slate-400 block">/ night</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stay Dates</h4>
            <span className="text-xs font-bold text-emerald-400">{nights} Nights Stay</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Check-In</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Check-Out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Primary Guest Details */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Primary Guest & Voucher Info</h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Legal Name (as in Passport)</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-white">Cancellation Policy</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {hotel.cancellationPolicy || 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.'}
            </p>
          </div>
        </div>

        {/* Unpublished Warning */}
        {!isPublished && (
          <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-rose-300">Listing Currently Unavailable</h5>
              <p className="text-[11px] text-rose-200/80">This hotel has been unpublished by administration and is not currently accepting reservations.</p>
            </div>
          </div>
        )}

        {/* Settlement Wallet Selector & Breakdown */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Debit Settlement Wallet</h4>
            <span className="text-[10px] text-slate-400">Available: {currentWallet?.currency} {currentWallet?.balance.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['NGN', 'CNY'] as Currency[]).map((c) => {
              const w = wallets.find((wal) => wal.currency === c);
              const isSelected = paymentCurrency === c;
              const isEligible = c === 'CNY' ? isCnyConfigured : isNgnConfigured;

              return (
                <button
                  key={c}
                  type="button"
                  disabled={!isEligible}
                  onClick={() => setPaymentCurrency(c)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    !isEligible
                      ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-xs">{c === 'NGN' ? '🇳🇬 NGN' : '🇨🇳 CNY'}</span>
                    {!isEligible && <span className="text-[8px] px-1 py-0.2 bg-slate-800 text-slate-500 rounded">N/A</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {c === 'NGN' ? '₦' : '¥'}{(w?.balance || 0).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>{selectedRoom.name} ({paymentCurrency === 'CNY' ? `¥${nightlyTotalCNY.toLocaleString()}/nt` : `₦${nightlyTotalNGN.toLocaleString()}/nt`} × {nights} nights)</span>
              <span className="text-white font-mono font-bold">
                {paymentCurrency === 'CNY' ? `¥${totalCNY.toLocaleString()} CNY` : `₦${totalNGN.toLocaleString()} NGN`}
              </span>
            </div>

            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Direct Admin Pricing</span>
              <span className="text-emerald-400 font-mono">
                {paymentCurrency === 'CNY' && isNgnConfigured ? `(or ₦${totalNGN.toLocaleString()} NGN)` : ''}
                {paymentCurrency === 'NGN' && isCnyConfigured ? `(or ¥${totalCNY.toLocaleString()} CNY)` : ''}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-slate-400 text-xs">Total Settlement:</span>
                <span className="text-base font-extrabold text-white block num-tabular">
                  {paymentCurrency === 'NGN' ? `₦${totalNGN.toLocaleString()} NGN` : paymentCurrency === 'CNY' ? `¥${totalCNY.toLocaleString()} CNY` : `$${totalUSD.toLocaleString()} USD`}
                </span>
              </div>

              {!hasSufficient && isPaymentCurrencyConfigured && (
                <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Insufficient Balance</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Booking CTA */}
        <button
          type="button"
          disabled={!hasSufficient || isBooking || !isPublished || !isPaymentCurrencyConfigured}
          onClick={handleBook}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>{isPublished ? 'Confirm Booking with 6-Digit PIN' : 'Listing Currently Unavailable'}</span>
        </button>
      </div>

      {/* 6-Digit Transaction PIN Modal */}
      {showPinModal && (
        <PinPad
          onComplete={handlePinSuccess}
          onCancel={() => setShowPinModal(false)}
          title="Confirm Hotel Reservation"
          subtitle={`Enter 6-digit transaction PIN to debit ${paymentCurrency} ${debitAmount.toLocaleString()} to hotel escrow`}
        />
      )}
    </div>
  );
};
