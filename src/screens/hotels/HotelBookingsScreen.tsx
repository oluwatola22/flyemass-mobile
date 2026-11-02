import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { 
  Building, 
  QrCode, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Copy, 
  Share2,
  Ticket
} from 'lucide-react';

export const HotelBookingsScreen: React.FC = () => {
  const { hotelBookings, showToast, navigate } = useApp();

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Trade Hotel Vouchers" />

      <div className="p-4 space-y-4">
        {hotelBookings.map((bk) => (
          <div
            key={bk.id}
            className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4 p-5"
          >
            {/* Voucher Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Check-In Voucher
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                {bk.status}
              </span>
            </div>

            {/* Hotel Title */}
            <div>
              <h3 className="text-base font-extrabold text-white">{bk.hotel.name}</h3>
              <p className="text-xs text-slate-300 font-sans mt-0.5">{bk.hotel.chineseName}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{bk.hotel.district}, {bk.hotel.city}</span>
              </p>
            </div>

            {/* Check-In QR Simulation */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
                <QrCode className="w-32 h-32 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                  Confirmation Code
                </span>
                <span className="text-sm font-mono font-extrabold text-emerald-400 tracking-wider">
                  {bk.confirmationCode}
                </span>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Check-In</span>
                <span className="font-bold text-white">{bk.checkIn}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Check-Out</span>
                <span className="font-bold text-white">{bk.checkOut} ({bk.nights} nights)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Primary Guest</span>
                <span className="font-bold text-white truncate block">{bk.guestName}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Total Settlement</span>
                <span className="font-bold text-emerald-400 num-tabular">${bk.totalUSD} USD (Paid)</span>
              </div>
            </div>

            {/* Taxi Driver Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                给司机的中文地址 (For Taxi)
              </span>
              <p className="text-white font-medium select-all leading-relaxed">
                {bk.taxiCardZh}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
