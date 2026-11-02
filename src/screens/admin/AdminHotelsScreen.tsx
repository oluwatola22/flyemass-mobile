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
  const [hotelsList, setHotelsList] = useState<Hotel[]>(() => {
    const list = db.getHotels();
    return list.length > 0 ? list : CHINA_HOTELS;
  });
  const [activeTab, setActiveTab] = useState<'hotels' | 'vouchers'>('hotels');
  const [dbBookings, setDbBookings] = useState<any[]>(() => {
    const list = db.getHotelBookings();
    return list.length > 0 ? list : hotelBookings;
  });

  // Add Hotel Partner Modal State
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelName, setNewHotelName] = useState('Guangzhou Garden Hotel');
  const [newHotelZh, setNewHotelZh] = useState('广州花园酒店');
  const [newCity, setNewCity] = useState('Guangzhou');
  const [newDistrict, setNewDistrict] = useState('Yuexiu Commercial District');
  const [newPriceUSD, setNewPriceUSD] = useState('140');
  const [newDistance, setNewDistance] = useState('15 mins direct to Pazhou Complex');
  const [newTaxiCardZh, setNewTaxiCardZh] = useState('请带我到：广州市越秀区环市东路368号 花园酒店');
  const [isAddingHotel, setIsAddingHotel] = useState(false);

  useEffect(() => {
    const initial = db.getHotels();
    if (initial.length > 0) setHotelsList(initial);

    return db.subscribe(() => {
      const list = db.getHotelBookings();
      if (list.length > 0) setDbBookings(list);
      const hList = db.getHotels();
      if (hList.length > 0) setHotelsList(hList);
    });
  }, []);

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingHotel(true);
    try {
      const priceUSD = parseFloat(newPriceUSD) || 120;
      const newHotelObj = {
        id: `htl_${Date.now()}`,
        name: newHotelName,
        chineseName: newHotelZh,
        city: newCity,
        district: newDistrict,
        pricePerNightUSD: priceUSD,
        pricePerNightCNY: Math.round(priceUSD * 7.24),
        rating: 4.85,
        reviewsCount: 140,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
        tags: ['Business Desk', 'English Concierge', 'Canton Fair Shuttle'],
        distanceToMarket: newDistance,
        amenities: ['Canton Fair Shuttle', 'High-Speed Wi-Fi', 'Western Breakfast', 'Airport Transfer'],
        roomType: 'Superior King Room',
        taxiCardZh: newTaxiCardZh
      };

      await db.createHotel(newHotelObj, 'adm-001');
      showToast(`Partner hotel ${newHotelName} registered successfully!`, 'success');
      setShowAddHotelModal(false);
      setHotelsList(db.getHotels().length > 0 ? db.getHotels() : CHINA_HOTELS);
    } catch (err: any) {
      showToast(err.message || 'Failed to add hotel', 'error');
    } finally {
      setIsAddingHotel(false);
    }
  };

  const handleUpdateStatus = (bookingId: string, newStatus: string) => {
    db.updateHotelBookingStatus(bookingId, newStatus);
    setDbBookings(db.getHotelBookings());
    firebaseSync.recordAudit('Hotel Desk Officer', 'HOTEL_VOUCHER_UPDATE', 'hotel_bookings', bookingId, `Updated status to ${newStatus}`);
    showToast(`Voucher status updated to ${newStatus}!`, 'success');
  };

  const handleCancelBooking = async (bk: any) => {
    if (!window.confirm(`Cancel voucher ${bk.confirmationCode} and issue refund of $${bk.totalUSD} USD to customer?`)) return;
    try {
      await db.cancelHotelBooking(bk.id, bk.userId || 'usr_alade_01', 'Administrative cancellation');
      showToast(`Booking ${bk.confirmationCode} cancelled and $${bk.totalUSD} refunded to customer!`, 'info');
      setDbBookings(db.getHotelBookings());
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    }
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hotels' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Partner Hotels ({hotelsList.length})
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vouchers' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Client Check-in Vouchers ({dbBookings.length})
            </button>
            <button
              onClick={() => setShowAddHotelModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Register Hotel</span>
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
                    {bk.status !== 'Completed' && bk.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(bk.id, 'Completed')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-bold"
                      >
                        Complete
                      </button>
                    )}
                    {bk.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(bk)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
                      >
                        Cancel & Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Partner Hotel Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HotelIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Register China Business Hotel Partner</h3>
              </div>
              <button onClick={() => setShowAddHotelModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hotel English Trade Name</label>
                <input
                  type="text"
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Official Legal Name (中文名)</label>
                <input
                  type="text"
                  value={newHotelZh}
                  onChange={(e) => setNewHotelZh(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-sans outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Trade Hub City</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Guangzhou">Guangzhou (Canton)</option>
                    <option value="Shenzhen">Shenzhen (Huaqiangbei)</option>
                    <option value="Yiwu">Yiwu (Commodity City)</option>
                    <option value="Foshan">Foshan (Furniture / Ceramics)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contract Rate (USD / night)</label>
                  <input
                    type="number"
                    value={newPriceUSD}
                    onChange={(e) => setNewPriceUSD(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Market / Fair Distance Specification</label>
                <input
                  type="text"
                  value={newDistance}
                  onChange={(e) => setNewDistance(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bilingual Taxi Card Translation (出租车中文卡)</label>
                <textarea
                  value={newTaxiCardZh}
                  onChange={(e) => setNewTaxiCardZh(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-sans outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHotelModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingHotel}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isAddingHotel ? 'Saving...' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
