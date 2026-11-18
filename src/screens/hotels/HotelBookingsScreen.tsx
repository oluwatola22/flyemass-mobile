import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  Building, 
  QrCode, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Copy, 
  Share2,
  Ticket,
  Ban,
  Download,
  Users,
  CheckCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

export const HotelBookingsScreen: React.FC = () => {
  const { hotelBookings, showToast, navigate, activeUserId } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Merge context bookings with database bookings
  const dbBookings = db.getHotelBookings();
  const allBookings = dbBookings.length > 0 ? dbBookings : hotelBookings;

  const filteredBookings = allBookings.filter((bk: any) => {
    if (selectedFilter === 'all') return true;
    const s = (bk.status || '').toLowerCase();
    if (selectedFilter === 'confirmed') return s === 'confirmed' || s === 'checked_in' || s === 'checked-in';
    if (selectedFilter === 'completed') return s === 'completed';
    if (selectedFilter === 'cancelled') return s === 'cancelled';
    return true;
  });

  const handleCopyText = (id: string, text: string, msg: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(msg, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = async (bk: any) => {
    const refundCur = bk.currency === 'USD' ? 'CNY' : (bk.currency || 'CNY');
    const refundAmt = bk.amountDebited || bk.totalCNY || bk.totalUSD;
    if (!window.confirm(`Cancel reservation at ${bk.hotelName || bk.hotel?.name}? You will receive an immediate atomic refund of ${refundCur} ${refundAmt.toLocaleString()} to your wallet.`)) {
      return;
    }

    try {
      await db.cancelHotelBooking(bk.id, activeUserId, 'Customer requested cancellation');
      showToast(`Reservation cancelled. ${refundCur} ${refundAmt.toLocaleString()} credited back to your wallet!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel reservation', 'error');
    }
  };

  const handleDownloadVoucher = (bk: any) => {
    const voucherRef = bk.reference || bk.confirmationCode || 'BK-2026';
    // Create voucher text content to download as simulated bilingual document
    const voucherContent = `=======================================================
FLYEMASS OFFICIAL HOTEL RESERVATION VOUCHER / 酒店入住凭证
=======================================================
Booking Reference: ${voucherRef}
Confirmation Code: ${bk.confirmationCode}
Status: ${bk.status.toUpperCase()}
Issued: ${new Date(bk.createdAt || Date.now()).toLocaleDateString()}

HOTEL INFORMATION / 酒店信息:
Hotel Name: ${bk.hotelName || bk.hotel?.name}
Chinese Name / 中文名: ${bk.chineseName || bk.hotel?.chineseName}
City & District: ${bk.hotel?.city || 'China'} - ${bk.hotel?.district}
English Address: ${bk.hotel?.englishAddress || 'Guangzhou, Guangdong, China'}
Chinese Address / 酒店中文地址: ${bk.hotel?.chineseAddress || '中国广东省广州市'}

RESERVATION DETAILS / 预订详情:
Room Category / 房型: ${bk.roomType || 'Standard Room'}
Primary Guest / 主住客人: ${bk.guestName}
Guest Contact: ${bk.guestPhone || 'N/A'} | ${bk.guestEmail || 'N/A'}
Check-In Date / 入住日期: ${bk.checkIn}
Check-Out Date / 离店日期: ${bk.checkOut}
Total Stay / 晚数: ${bk.nights} Nights
Guests: ${bk.guestCount || 1}

SETTLEMENT / 结算凭证:
Settlement Status: FULLY SETTLED / 已付讫
Paid Amount: ${bk.currency === 'USD' ? 'CNY' : (bk.currency || 'CNY')} ${(bk.amountDebited || bk.totalCNY || bk.totalUSD).toLocaleString()}
Double-Entry Clearing Ledger Reference: liabilities:hotel_clearing:${bk.id}

QR VERIFICATION TOKEN / 电子验证码:
${bk.qrVerificationToken || `FLYEMASS|${voucherRef}|${bk.hotelId}|${bk.checkIn}`}

DIRECTIONS FOR TAXI DRIVER / 给出租车司机:
${bk.taxiCardZh || '师傅您好，请带我到酒店。谢谢！'}
=======================================================
FlyeMass Cross-Border Logistics & China Travel Concierge
Guangzhou • Shenzhen • Yiwu • Hong Kong • Lagos
Support 24/7: support@flyemass.com
=======================================================`;

    const blob = new Blob([voucherContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FlyeMass_Voucher_${voucherRef}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Official bilingual reservation voucher downloaded!`, 'success');
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="My Hotel Vouchers" />

      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {(['all', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedFilter === tab
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'confirmed' ? 'Upcoming' : tab}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No vouchers in this category</h4>
            <p className="text-xs text-slate-400">Book trade hotels in Guangzhou, Shenzhen, and Yiwu anytime.</p>
            <button
              onClick={() => navigate('hotels')}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Browse Partner Hotels
            </button>
          </div>
        ) : (
          filteredBookings.map((bk: any) => {
            const isCancelled = bk.status === 'cancelled' || bk.status === 'Cancelled';
            const isCompleted = bk.status === 'completed' || bk.status === 'Completed';
            const isCheckedIn = bk.status === 'checked_in' || bk.status === 'checked-in' || bk.status === 'Checked-in';
            const bookingRef = bk.reference || bk.id;

            return (
              <div
                key={bk.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4 p-5"
              >
                {/* Voucher Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        REF: {bookingRef}
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Official Check-In Voucher
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                      isCancelled
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : isCompleted
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : isCheckedIn
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {bk.status}
                  </span>
                </div>

                {/* Hotel Title & Addresses */}
                <div>
                  <h3 className="text-base font-extrabold text-white">{bk.hotelName || bk.hotel?.name}</h3>
                  <p className="text-xs text-indigo-300 font-sans mt-0.5">{bk.chineseName || bk.hotel?.chineseName}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{bk.hotel?.district || bk.hotel?.city || 'China Trade Hub'}</span>
                  </p>
                </div>

                {/* Check-In QR Simulation & Verification Token */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
                    <QrCode className="w-32 h-32 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                      Hotel Confirmation Code
                    </span>
                    <span className="text-sm font-mono font-extrabold text-emerald-400 tracking-wider">
                      {bk.confirmationCode}
                    </span>
                  </div>
                  {bk.qrVerificationToken && (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 break-all select-all">
                      TOKEN: {bk.qrVerificationToken}
                    </div>
                  )}
                </div>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Room Category</span>
                    <span className="font-bold text-white truncate block">{bk.roomType || 'Standard Room'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Stay Duration</span>
                    <span className="font-bold text-white">{bk.nights} Nights</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Check-In</span>
                    <span className="font-bold text-white">{bk.checkIn}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Check-Out</span>
                    <span className="font-bold text-white">{bk.checkOut}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Primary Guest</span>
                    <span className="font-bold text-white truncate block">{bk.guestName}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Paid Settlement</span>
                    <span className="font-bold text-emerald-400 num-tabular">
                      {bk.currency === 'USD' ? 'CNY' : (bk.currency || 'CNY')} {(bk.amountDebited || bk.totalCNY || bk.totalUSD).toLocaleString()} (Paid)
                    </span>
                  </div>
                </div>

                {/* Taxi Driver Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                      给司机的中文地址 (For Taxi / DiDi Driver)
                    </span>
                    <button
                      onClick={() => handleCopyText(bk.id, bk.taxiCardZh || '', 'Taxi address copied!')}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedId === bk.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === bk.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-white font-medium select-all leading-relaxed">
                    {bk.taxiCardZh}
                  </p>
                </div>

                {/* Actions: Download Voucher & Cancel */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => handleDownloadVoucher(bk)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Bilingual Voucher</span>
                  </button>

                  {!isCancelled && !isCompleted && (
                    <button
                      onClick={() => handleCancel(bk)}
                      className="py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel & Refund</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
