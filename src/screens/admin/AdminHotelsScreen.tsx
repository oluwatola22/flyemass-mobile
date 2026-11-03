import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { CHINA_HOTELS } from '../../data/mockData';
import { Hotel, HotelRoomType } from '../../types';
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
  Calendar,
  Home,
  Briefcase,
  Users,
  Eye,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Check,
  Ban
} from 'lucide-react';

export const AdminHotelsScreen: React.FC = () => {
  const { hotelBookings, showToast, navigate } = useApp();

  // Active Tab: purely Hotel Bookings or Hotel Catalog
  const [activeTab, setActiveTab] = useState<'bookings' | 'hotels'>('bookings');

  // Hotels State
  const [hotelsList, setHotelsList] = useState<Hotel[]>(() => {
    const list = db.getHotels();
    return list.length > 0 ? list : CHINA_HOTELS;
  });

  // Bookings State
  const [dbBookings, setDbBookings] = useState<any[]>(() => {
    const list = db.getHotelBookings();
    return list.length > 0 ? list : hotelBookings;
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Booking Detail Modal
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<any | null>(null);

  // Register Hotel Modal State
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelName, setNewHotelName] = useState('Guangzhou Garden Hotel');
  const [newHotelZh, setNewHotelZh] = useState('广州花园酒店');
  const [newCity, setNewCity] = useState('Guangzhou');
  const [newDistrict, setNewDistrict] = useState('Yuexiu Commercial Hub');
  const [newEngAddress, setNewEngAddress] = useState('368 Huanshi East Road, Yuexiu District, Guangzhou');
  const [newZhAddress, setNewZhAddress] = useState('广州市越秀区环市东路368号');
  const [newPriceUSD, setNewPriceUSD] = useState('140');
  const [newDistance, setNewDistance] = useState('15 mins direct to Pazhou Canton Fair');
  const [newTaxiCardZh, setNewTaxiCardZh] = useState('请带我到：广州市越秀区环市东路368号 花园酒店。谢谢！');
  const [isAddingHotel, setIsAddingHotel] = useState(false);

  useEffect(() => {
    const updateData = () => {
      const hList = db.getHotels();
      if (hList.length > 0) setHotelsList(hList);
      const bList = db.getHotelBookings();
      if (bList.length > 0) setDbBookings(bList);
    };
    updateData();
    return db.subscribe(updateData);
  }, []);

  // Compute live booking metrics
  const totalBookingsCount = dbBookings.length;
  const confirmedCount = dbBookings.filter((b) => b.status === 'confirmed').length;
  const checkedInCount = dbBookings.filter((b) => b.status === 'checked_in' || b.status === 'checked-in').length;
  const completedCount = dbBookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = dbBookings.filter((b) => b.status === 'cancelled').length;

  const revenueUSD = dbBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.totalUSD) || 0), 0);
  const revenueCNY = Math.round(revenueUSD * 7.24);
  const revenueNGN = Math.round(revenueUSD * 1485);

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await db.updateHotelBookingStatus(bookingId, status, 'China Hotels Desk', 'adm-001');
      showToast(`Booking ${bookingId} status updated to ${status}!`, 'success');
      setDbBookings(db.getHotelBookings());
    } catch (err: any) {
      showToast(err.message || 'Failed to update booking status', 'error');
    }
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingHotel(true);
    try {
      const priceUSD = parseFloat(newPriceUSD) || 120;
      const hotelId = `hotel-${newCity.toLowerCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;

      const newHotelObj: Hotel = {
        id: hotelId,
        name: newHotelName,
        chineseName: newHotelZh,
        city: newCity,
        district: newDistrict,
        englishAddress: newEngAddress,
        chineseAddress: newZhAddress,
        pricePerNightUSD: priceUSD,
        pricePerNightCNY: Math.round(priceUSD * 7.24),
        rating: 4.88,
        reviewsCount: 160,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
        tags: ['Canton Fair Shuttle', 'English Concierge', 'Executive Desk'],
        distanceToMarket: newDistance,
        amenities: ['Canton Fair Shuttle', 'High-Speed Wi-Fi', 'Western Breakfast', 'Airport Transfer', 'Halal Kitchen'],
        roomType: 'Standard King Room',
        roomTypes: [
          { id: 'rm-std', name: 'Standard Room', nightlySurchargeUSD: 0, maxGuests: 2, description: 'Comfortable king bed, city view, high-speed Wi-Fi', amenities: ['King Bed', 'Free Wi-Fi', 'Rain Shower'] },
          { id: 'rm-dlx', name: 'Deluxe Double', nightlySurchargeUSD: 30, maxGuests: 3, description: 'Spacious double bed suite, complimentary executive breakfast', amenities: ['Twin Double Beds', 'Breakfast Included', 'Work Desk'] },
          { id: 'rm-ste', name: 'Executive Suite', nightlySurchargeUSD: 80, maxGuests: 4, description: 'Luxury 65sqm suite with private meeting lounge & panoramic skyline view', amenities: ['Separate Living Area', 'Executive Lounge Access', 'Bathtub', 'Airport Transfer'] }
        ],
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
        isPublished: true,
        taxiCardZh: newTaxiCardZh
      };

      await db.createHotel(newHotelObj, 'adm-001');
      showToast(`Hotel partner ${newHotelName} registered successfully!`, 'success');
      setShowAddHotelModal(false);
      setHotelsList(db.getHotels());
    } catch (err: any) {
      showToast(err.message || 'Failed to add hotel', 'error');
    } finally {
      setIsAddingHotel(false);
    }
  };

  return (
    <AdminLayout activeTab="hotels">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <HotelIcon className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                China Business Hotel Bookings & Vouchers
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guangzhou Canton Fair, Yiwu, Shenzhen & Shanghai partner hotels, taxi translation cards & escrow reservations.
            </p>
          </div>

          {/* Quick switcher tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bookings' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Bookings ({dbBookings.length})
            </button>

            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hotels' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Hotels Catalog ({hotelsList.length})
            </button>

            <button
              onClick={() => setShowAddHotelModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Register Hotel</span>
            </button>

            <button
              onClick={() => navigate('admin-rentals-apartments')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-all"
              title="Go to Residential Apartments"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Apartments</span>
            </button>

            <button
              onClick={() => navigate('admin-rentals-offices')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-all"
              title="Go to Commercial Offices"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Offices</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Bookings</span>
            <span className="text-xl font-extrabold text-white num-tabular">{totalBookingsCount}</span>
            <span className="text-[10px] text-emerald-400 block">{confirmedCount} Upcoming</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Checked-In</span>
            <span className="text-xl font-extrabold text-blue-400 num-tabular">{checkedInCount}</span>
            <span className="text-[10px] text-slate-400 block">Current in China</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Completed</span>
            <span className="text-xl font-extrabold text-purple-400 num-tabular">{completedCount}</span>
            <span className="text-[10px] text-slate-400 block">Stays Concluded</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Cancelled</span>
            <span className="text-xl font-extrabold text-rose-400 num-tabular">{cancelledCount}</span>
            <span className="text-[10px] text-slate-400 block">Refunded to Wallets</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total USD Settled</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono num-tabular">
              ${revenueUSD.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">Hotel Escrow Volume</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">CNY & NGN Volume</span>
            <span className="text-xs font-mono font-bold text-white block">
              ¥{revenueCNY.toLocaleString()} CNY
            </span>
            <span className="text-[10px] text-indigo-300 font-mono block">
              ₦{revenueNGN.toLocaleString()} NGN
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: HOTEL BOOKINGS & VOUCHERS */}
        {/* ========================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 w-4 h-4 text-slate-500 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by BK-2026 reference, confirmation code, guest name, hotel..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-sky-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Bookings Table / Cards */}
            <div className="space-y-3">
              {dbBookings
                .filter((bk) => {
                  const query = searchQuery.toLowerCase();
                  const matchesSearch =
                    !searchQuery ||
                    (bk.reference && bk.reference.toLowerCase().includes(query)) ||
                    (bk.confirmationCode && bk.confirmationCode.toLowerCase().includes(query)) ||
                    (bk.guestName && bk.guestName.toLowerCase().includes(query)) ||
                    (bk.hotelName && bk.hotelName.toLowerCase().includes(query)) ||
                    (bk.hotel?.name && bk.hotel.name.toLowerCase().includes(query));
                  const matchesStatus =
                    bookingStatusFilter === 'all' ||
                    (bk.status || '').toLowerCase() === bookingStatusFilter.toLowerCase() ||
                    (bookingStatusFilter === 'checked_in' && (bk.status === 'checked-in' || bk.status === 'Checked-in'));
                  return matchesSearch && matchesStatus;
                })
                .map((bk) => {
                  const isCancelled = bk.status === 'cancelled' || bk.status === 'Cancelled';
                  const isCheckedIn = bk.status === 'checked_in' || bk.status === 'checked-in' || bk.status === 'Checked-in';
                  const isCompleted = bk.status === 'completed' || bk.status === 'Completed';

                  return (
                    <div
                      key={bk.id}
                      className={`p-5 rounded-3xl bg-slate-900 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
                        isCancelled ? 'border-rose-900/50 opacity-75' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold shrink-0">
                          <HotelIcon className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-sky-400">{bk.reference || bk.id}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs font-bold text-white">{bk.hotelName || bk.hotel?.name}</span>
                            {bk.confirmationCode && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-emerald-400 text-[10px] font-bold">
                                Pin: {bk.confirmationCode}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300">
                            Guest: <strong>{bk.guestName}</strong> ({bk.guestPhone || 'No Phone'}) • Room: {bk.roomType || 'Standard'}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            Check-In: <strong>{bk.checkIn}</strong> • Check-Out: <strong>{bk.checkOut}</strong> ({bk.nights || 1} Nights, {bk.guestsCount || 1} Guests)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            isCancelled
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : isCheckedIn
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              : isCompleted
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {bk.status}
                          </span>
                          <p className="text-xs font-mono font-bold text-white mt-1">
                            ${(bk.totalUSD || bk.amountDebited || 0).toLocaleString()} USD
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedBookingForDetail(bk)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>Voucher</span>
                          </button>

                          {!isCancelled && !isCheckedIn && !isCompleted && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, 'checked_in')}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Check In
                            </button>
                          )}

                          {isCheckedIn && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PARTNER HOTELS CATALOG */}
        {/* ========================================================= */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelsList.map((hotel) => (
                <div key={hotel.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                  <div className="h-36 rounded-2xl bg-slate-950 overflow-hidden relative">
                    <img src={hotel.image || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white">
                      {hotel.city} • {hotel.district}
                    </div>
                    <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-slate-950" />
                      <span>{hotel.rating}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{hotel.name}</h4>
                    {hotel.chineseName && <p className="text-[10px] text-slate-400">{hotel.chineseName}</p>}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                    <span className="text-slate-400">Nightly Rate:</span>
                    <span className="font-bold text-emerald-400">${hotel.pricePerNightUSD} USD (¥{hotel.pricePerNightCNY} CNY)</span>
                  </div>

                  {hotel.taxiCardZh && (
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 font-sans truncate">
                      🚖 {hotel.taxiCardZh}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Voucher #{selectedBookingForDetail.reference || selectedBookingForDetail.id}</h3>
                  <p className="text-[10px] text-slate-400">Escrow Account: liabilities:hotel_escrow:{selectedBookingForDetail.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBookingForDetail(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Hotel Information</span>
                <p className="font-bold text-white text-sm">{selectedBookingForDetail.hotelName || selectedBookingForDetail.hotel?.name}</p>
                <p className="text-indigo-300 font-sans">{selectedBookingForDetail.chineseName || selectedBookingForDetail.hotel?.chineseName}</p>
                <p className="text-slate-400 text-[11px]">{selectedBookingForDetail.hotel?.englishAddress || selectedBookingForDetail.hotel?.district}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Primary Guest</span>
                  <span className="font-bold text-white">{selectedBookingForDetail.guestName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Room Category</span>
                  <span className="font-bold text-white">{selectedBookingForDetail.roomType || 'Standard Room'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Check-In / Out</span>
                  <span className="font-bold text-white">{selectedBookingForDetail.checkIn} - {selectedBookingForDetail.checkOut}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Settlement</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {selectedBookingForDetail.currency || 'USD'} {(selectedBookingForDetail.amountDebited || selectedBookingForDetail.totalUSD).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Chinese Taxi Driver Directions</span>
                <p className="font-sans text-xs text-white select-all">
                  {selectedBookingForDetail.taxiCardZh}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Hotel Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HotelIcon className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-extrabold text-white">Register China Partner Hotel</h3>
              </div>
              <button onClick={() => setShowAddHotelModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hotel English Name</label>
                <input
                  type="text"
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Hotel Name (酒店中文名称)</label>
                <input
                  type="text"
                  value={newHotelZh}
                  onChange={(e) => setNewHotelZh(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-sans outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">City Hub</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none"
                  >
                    <option value="Guangzhou">Guangzhou (广州)</option>
                    <option value="Yiwu">Yiwu (义乌)</option>
                    <option value="Shenzhen">Shenzhen (深圳)</option>
                    <option value="Shanghai">Shanghai (上海)</option>
                    <option value="Beijing">Beijing (北京)</option>
                    <option value="Foshan">Foshan (佛山)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Price Per Night ($ USD)</label>
                  <input
                    type="number"
                    value={newPriceUSD}
                    onChange={(e) => setNewPriceUSD(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Commercial District</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Taxi Driver Instructions Card</label>
                <textarea
                  value={newTaxiCardZh}
                  onChange={(e) => setNewTaxiCardZh(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans text-white outline-none focus:border-sky-500 resize-none"
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
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  {isAddingHotel ? 'Registering...' : 'Confirm Hotel Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminHotelsScreen;
