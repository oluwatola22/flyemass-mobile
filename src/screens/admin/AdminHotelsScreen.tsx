import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { CHINA_HOTELS } from '../../data/mockData';
import { Hotel } from '../../types';
import { 
  Hotel as HotelIcon, 
  MapPin, 
  Star, 
  Search, 
  Plus, 
  CheckCircle2, 
  Ticket, 
  DollarSign, 
  Copy, 
  CheckCheck,
  Building2,
  Calendar
} from 'lucide-react';

export const AdminHotelsScreen: React.FC = () => {
  const { hotelBookings, showToast } = useApp();
  const [hotelsList, setHotelsList] = useState<Hotel[]>(CHINA_HOTELS);
  const [activeTab, setActiveTab] = useState<'hotels' | 'vouchers'>('hotels');
  const [dbBookings, setDbBookings] = useState<any[]>(() => {
    const list = db.getHotelBookings();
    return list.length > 0 ? list : hotelBookings;
  });

  useEffect(() => {
    return db.subscribe(() => {
      const list = db.getHotelBookings();
      if (list.length > 0) setDbBookings(list);
    });
  }, []);

  const handleUpdateStatus = (bookingId: string, newStatus: string) => {
    db.updateHotelBookingStatus(bookingId, newStatus);
    setDbBookings(db.getHotelBookings());
    firebaseSync.recordAudit('Hotel Desk Officer', 'HOTEL_VOUCHER_UPDATE', 'hotel_bookings', bookingId, `Updated status to ${newStatus}`);
    showToast(`Voucher status updated to ${newStatus}!`, 'success');
  };

  return (
    <AdminLayout activeTab="hotels">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Trade-Hub Hotel Operations</h1>
            <p className="text-xs text-slate-400">
              Manage Canton Fair & Yiwu commodity market partner hotels, room contracts, and buyer check-in vouchers.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hotels' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Partner Hotels ({hotelsList.length})
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'vouchers' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Client Check-in Vouchers ({hotelBookings.length})
            </button>
          </div>
        </div>

        {/* 1. HOTELS LIST */}
        {activeTab === 'hotels' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotelsList.map((hotel) => (
              <div
                key={hotel.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 bg-slate-950">
                    <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-emerald-400">
                      {hotel.city} Trade Hub
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-xs font-bold text-white">{hotel.name}</h3>
                    <p className="text-[11px] text-slate-400 font-sans">{hotel.chineseName}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{hotel.distanceToMarket}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-white">${hotel.pricePerNightUSD} USD</span>
                    <span className="text-[10px] text-slate-400 block">/ night contract</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    Active Partner
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. VOUCHERS LIST */}
        {activeTab === 'vouchers' && (
          <div className="space-y-3">
            {dbBookings.map((bk) => (
              <div
                key={bk.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">{bk.hotel?.name || bk.hotelName} ({bk.hotel?.city || 'China'})</p>
                    <p className="text-[11px] text-slate-400">Guest: <strong className="text-slate-200">{bk.guestName}</strong> • {bk.nights} nights ({bk.checkIn} - {bk.checkOut})</p>
                    <p className="text-[10px] font-mono text-emerald-400 font-bold">Confirmation: {bk.confirmationCode}</p>
                    {bk.taxiCardZh && (
                      <p className="text-[10px] text-slate-400 font-sans bg-slate-950 p-2 rounded-xl border border-slate-800/80 mt-1">
                        🚕 {bk.taxiCardZh}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      {bk.status}
                    </span>
                    <p className="text-xs font-mono font-extrabold text-white mt-1">${bk.totalUSD} USD</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {bk.status !== 'Checked-in' && (
                      <button
                        onClick={() => handleUpdateStatus(bk.id, 'Checked-in')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200"
                      >
                        Check In
                      </button>
                    )}
                    {bk.status !== 'Completed' && (
                      <button
                        onClick={() => handleUpdateStatus(bk.id, 'Completed')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-bold"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
