import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { CHINA_HOTELS } from '../../data/mockData';
import { Hotel, RentalProperty, PropertyInquiry, HotelRoomType } from '../../types';
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
  EyeOff,
  MessageSquare,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Ban
} from 'lucide-react';

export const AdminHotelsScreen: React.FC = () => {
  const { hotelBookings, showToast, navigate } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'bookings' | 'hotels' | 'inquiries' | 'rentals'>('bookings');

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

  // Rental Inquiries & Properties State
  const [inquiriesList, setInquiriesList] = useState<PropertyInquiry[]>(() => db.getPropertyInquiries());
  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('all');

  // Booking Detail Modal
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<any | null>(null);

  // Inquiry Detail Modal
  const [selectedInquiryForDetail, setSelectedInquiryForDetail] = useState<PropertyInquiry | null>(null);
  const [inquiryAdminNotes, setInquiryAdminNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('China Trade Concierge');

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

  // Register Rental Listing Modal State
  const [showAddRentalModal, setShowAddRentalModal] = useState(false);
  const [newRentalTitle, setNewRentalTitle] = useState('Tianhe CBD Executive Apartment');
  const [newRentalZhTitle, setNewRentalZhTitle] = useState('天河CBD高端商务公寓');
  const [newRentalType, setNewRentalType] = useState<'apartment' | 'house' | 'office'>('apartment');
  const [newRentalDistrict, setNewRentalDistrict] = useState('Tianhe CBD');
  const [newRentalAddress, setNewRentalAddress] = useState('Zhujiang New Town, Tianhe District, Guangzhou');
  const [newRentalZhAddress, setNewRentalZhAddress] = useState('广州市天河区珠江新城花城大道');
  const [newRentCNY, setNewRentCNY] = useState('6500');
  const [newDepositMonths, setNewDepositMonths] = useState('2');
  const [newAdvanceMonths, setNewAdvanceMonths] = useState('1');
  const [newFloorArea, setNewFloorArea] = useState('85');
  const [newBedroomsOrDesks, setNewBedroomsOrDesks] = useState('2');
  const [isFurnished, setIsFurnished] = useState(true);
  const [isAddingRental, setIsAddingRental] = useState(false);

  useEffect(() => {
    const refreshData = () => {
      const bList = db.getHotelBookings();
      if (bList.length > 0) setDbBookings(bList);
      const hList = db.getHotels();
      if (hList.length > 0) setHotelsList(hList);
      const iList = db.getPropertyInquiries();
      if (iList.length > 0) setInquiriesList(iList);
      const rList = db.getRentalProperties();
      if (rList.length > 0) setRentalProps(rList);
    };

    refreshData();
    return db.subscribe(refreshData);
  }, []);

  // Financial Metrics Calculation from Real Bookings
  const totalBookingsCount = dbBookings.length;
  const confirmedCount = dbBookings.filter(b => b.status === 'confirmed' || b.status === 'Confirmed').length;
  const checkedInCount = dbBookings.filter(b => b.status === 'checked_in' || b.status === 'checked-in' || b.status === 'Checked-in').length;
  const completedCount = dbBookings.filter(b => b.status === 'completed' || b.status === 'Completed').length;
  const cancelledCount = dbBookings.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;

  let revenueUSD = 0;
  let revenueCNY = 0;
  let revenueNGN = 0;

  dbBookings.forEach((b) => {
    if (b.status !== 'cancelled' && b.status !== 'Cancelled') {
      const usd = Number(b.totalUSD) || 0;
      revenueUSD += usd;
      if (b.currency === 'CNY') {
        revenueCNY += Number(b.amountDebited) || Math.round(usd * 7.24);
      } else if (b.currency === 'NGN') {
        revenueNGN += Number(b.amountDebited) || Math.round(usd * 1485);
      } else {
        revenueCNY += Math.round(usd * 7.24);
        revenueNGN += Math.round(usd * 1485);
      }
    }
  });

  // Handlers for Hotel Bookings
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string, notes: string = '') => {
    try {
      await db.updateHotelBookingStatus(bookingId, newStatus, notes, 'adm-001');
      setDbBookings(db.getHotelBookings());
      showToast(`Reservation status updated to ${newStatus}!`, 'success');
      if (selectedBookingForDetail && selectedBookingForDetail.id === bookingId) {
        setSelectedBookingForDetail({ ...selectedBookingForDetail, status: newStatus });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update booking status', 'error');
    }
  };

  const handleCancelBooking = async (bk: any) => {
    if (!window.confirm(`Issue administrative cancellation and refund ${bk.currency || 'USD'} ${bk.amountDebited || bk.totalUSD} to customer?`)) return;
    try {
      await db.cancelHotelBooking(bk.id, bk.userId || 'usr_alade_01', 'Administrative cancellation');
      showToast(`Booking ${bk.reference || bk.confirmationCode} cancelled and refunded!`, 'info');
      setDbBookings(db.getHotelBookings());
      if (selectedBookingForDetail) setSelectedBookingForDetail(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    }
  };

  // Handlers for Rental Inquiries
  const handleUpdateInquiryStatus = async (inqId: string, newStatus: string) => {
    try {
      await db.updatePropertyInquiryStatus(inqId, newStatus, inquiryAdminNotes, assignedStaff, 'adm-001');
      setInquiriesList(db.getPropertyInquiries());
      showToast(`Inquiry marked as ${newStatus}!`, 'success');
      if (selectedInquiryForDetail && selectedInquiryForDetail.id === inqId) {
        setSelectedInquiryForDetail({ ...selectedInquiryForDetail, status: newStatus as any });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update inquiry status', 'error');
    }
  };

  // Handlers for Hotel Partners Creation
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

  // Handlers for Rental Property Creation
  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingRental(true);
    try {
      const rentCNY = parseFloat(newRentCNY) || 5000;
      const propId = `prop-${newRentalType.slice(0, 3)}-${Date.now().toString().slice(-4)}`;

      const newProp: RentalProperty = {
        id: propId,
        title: newRentalTitle,
        chineseTitle: newRentalZhTitle,
        propertyType: newRentalType,
        district: newRentalDistrict,
        address: newRentalAddress,
        chineseAddress: newRentalZhAddress,
        monthlyRentCNY: rentCNY,
        monthlyRentUSD: Math.round(rentCNY / 7.24),
        depositMonths: parseInt(newDepositMonths) || 2,
        advanceRentMonths: parseInt(newAdvanceMonths) || 1,
        floorAreaSqm: parseFloat(newFloorArea) || 80,
        bedrooms: newRentalType !== 'office' ? parseInt(newBedroomsOrDesks) || 2 : undefined,
        deskCapacity: newRentalType === 'office' ? parseInt(newBedroomsOrDesks) || 20 : undefined,
        isFurnished,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        amenities: newRentalType === 'office' 
          ? ['Dedicated Fiber Internet', 'Boardroom Access', 'Receptionist', '24/7 Security Access', 'Underground Parking']
          : ['Central AC', 'Washing Machine', 'Smart TV', 'Elevator', '24/7 Security', 'Balcony'],
        status: 'live',
        createdAt: Date.now()
      };

      await db.createRentalProperty(newProp, 'adm-001');
      showToast(`Rental listing "${newRentalTitle}" published successfully!`, 'success');
      setShowAddRentalModal(false);
      setRentalProps(db.getRentalProperties());
    } catch (err: any) {
      showToast(err.message || 'Failed to create rental property', 'error');
    } finally {
      setIsAddingRental(false);
    }
  };

  return (
    <AdminLayout activeTab="hotels">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Accommodation & Realty Operations</h1>
            <p className="text-xs text-slate-400">
              Manage China business hotels, bilingual reservation vouchers, and Guangzhou residential/office leases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bookings' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Bookings ({dbBookings.length})
            </button>

            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hotels' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Hotels ({hotelsList.length})
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inquiries' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Rental Inquiries ({inquiriesList.length})
            </button>

            <button
              onClick={() => setActiveTab('rentals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rentals' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Properties ({rentalProps.length})
            </button>

            {activeTab === 'hotels' && (
              <button
                onClick={() => setShowAddHotelModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Register Hotel</span>
              </button>
            )}

            {activeTab === 'rentals' && (
              <button
                onClick={() => setShowAddRentalModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-400 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Rental Listing</span>
              </button>
            )}
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
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-emerald-500"
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
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-400">{bk.reference || bk.id}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs font-bold text-white">{bk.hotelName || bk.hotel?.name} ({bk.hotel?.city || 'China'})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Guest: <strong className="text-slate-200">{bk.guestName}</strong> • {bk.roomType || 'Standard Room'} • {bk.nights} nights ({bk.checkIn} - {bk.checkOut})
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Confirmation Code: <strong className="text-emerald-400">{bk.confirmationCode}</strong> | QR: {bk.qrVerificationToken ? 'Active Token' : 'Standard'}
                          </p>
                          {bk.taxiCardZh && (
                            <p className="text-[10px] text-slate-400 font-sans bg-slate-950 p-2 rounded-xl border border-slate-800/80 mt-1">
                              🚕 {bk.taxiCardZh}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
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
                          <p className="text-xs font-mono font-extrabold text-white mt-1">
                            {bk.currency || 'USD'} {(bk.amountDebited || bk.totalUSD).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedBookingForDetail(bk)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            title="View Voucher Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isCheckedIn && !isCompleted && !isCancelled && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, 'checked_in', 'Guest verified at hotel reception')}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                            >
                              Check In
                            </button>
                          )}

                          {isCheckedIn && !isCompleted && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, 'completed', 'Guest stay completed')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold"
                            >
                              Complete
                            </button>
                          )}

                          {!isCancelled && !isCompleted && (
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
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HOTEL PARTNERS (DIRECTORY INVENTORY) */}
        {/* ========================================================= */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotelsList.map((hotel) => (
                <div
                  key={hotel.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-slate-950">
                      <img
                        src={hotel.image || hotel.images?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'}
                        alt={hotel.name || 'Partner Hotel'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-emerald-400 border border-slate-800">
                        {hotel.city || 'China'} Trade Hub
                      </div>
                      <div className="absolute top-2 right-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-400 flex items-center gap-1 border border-slate-800">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{hotel.rating || 4.8}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-xs font-bold text-white">{hotel.name}</h3>
                      <p className="text-[11px] text-indigo-300 font-sans">{hotel.chineseName}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{hotel.englishAddress || hotel.district}</span>
                      </p>
                      {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                        <p className="text-[10px] text-slate-500">
                          {hotel.roomTypes.length} configured room types (Standard to Executive)
                        </p>
                      )}
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RENTAL INQUIRIES (CHINA REAL ESTATE DESK) */}
        {/* ========================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 w-4 h-4 text-slate-500 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by inquiry reference (INQ-APT, INQ-OFF), customer name, property..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={inquiryTypeFilter}
                  onChange={(e) => setInquiryTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="apartment">Apartments</option>
                  <option value="house">Houses</option>
                  <option value="office">Commercial Offices</option>
                </select>

                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New Inquiries</option>
                  <option value="contacted">Contacted</option>
                  <option value="viewing_scheduled">Viewing Scheduled</option>
                  <option value="closed">Closed / Leased</option>
                </select>
              </div>
            </div>

            {/* Inquiries Table / Cards */}
            <div className="space-y-3">
              {inquiriesList
                .filter((inq) => {
                  const query = searchQuery.toLowerCase();
                  const matchesSearch =
                    !searchQuery ||
                    (inq.reference && inq.reference.toLowerCase().includes(query)) ||
                    (inq.customerName && inq.customerName.toLowerCase().includes(query)) ||
                    (inq.propertyName && inq.propertyName.toLowerCase().includes(query)) ||
                    (inq.companyName && inq.companyName.toLowerCase().includes(query));
                  const matchesType = inquiryTypeFilter === 'all' || inq.propertyType === inquiryTypeFilter;
                  const matchesStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
                  return matchesSearch && matchesType && matchesStatus;
                })
                .map((inq) => {
                  const isOffice = inq.propertyType === 'office';

                  return (
                    <div
                      key={inq.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                            isOffice ? 'bg-teal-500/10 text-teal-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}
                        >
                          {isOffice ? <Briefcase className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white">{inq.reference}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs font-bold text-white">{inq.propertyName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] uppercase">
                              {inq.propertyType}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300">
                            Applicant: <strong>{inq.customerName}</strong> ({inq.customerPhone})
                            {inq.companyName && <span className="text-teal-400 font-bold"> • Company: {inq.companyName}</span>}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            Target Move-In: <strong>{inq.preferredMoveInDate || 'Flexible'}</strong>
                            {inq.preferredViewingDate && <span> • Viewing Requested: <strong>{inq.preferredViewingDate}</strong></span>}
                            <span> • Lease: {inq.leaseDuration || '1 Year'}</span>
                          </p>

                          {inq.ticketNumber && (
                            <p className="text-[10px] text-indigo-300 font-mono">
                              Linked Support Ticket: #{inq.ticketNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              inq.status === 'new'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : inq.status === 'contacted'
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                : inq.status === 'viewing_scheduled'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {inq.status.replace('_', ' ')}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Est. Upfront: ¥{(inq.upfrontCostEstimateCNY || 0).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Open Concierge Support Ticket Link */}
                          <button
                            onClick={() => navigate('admin-support')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1"
                            title="Open in Support Concierge"
                          >
                            <MessageSquare className="w-3 h-3 text-indigo-400" />
                            <span>Chat</span>
                          </button>

                          {inq.status === 'new' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'contacted')}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                            >
                              Contacted
                            </button>
                          )}

                          {inq.status !== 'viewing_scheduled' && inq.status !== 'closed' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'viewing_scheduled')}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold"
                            >
                              Schedule Viewing
                            </button>
                          )}

                          {inq.status !== 'closed' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'closed')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold"
                            >
                              Close
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
        {/* TAB 4: RENTAL PROPERTIES (INVENTORY MANAGEMENT) */}
        {/* ========================================================= */}
        {activeTab === 'rentals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rentalProps.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-slate-950">
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'}
                        alt={prop.title || 'Rental Listing'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white border border-slate-800">
                        {prop.district || 'Guangzhou'} • {prop.floorAreaSqm || 60} m²
                      </div>
                      <div className="absolute top-2 right-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-emerald-400 border border-slate-800 uppercase">
                        {prop.propertyType || 'rental'}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-xs font-bold text-white">{prop.title}</h3>
                      <p className="text-[11px] text-slate-400 font-sans">{prop.chineseTitle}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{prop.address}</span>
                      </p>
                      <div className="text-[10px] text-slate-400">
                        {prop.propertyType === 'office'
                          ? `${prop.deskCapacity || 20} Desks Capacity`
                          : `${prop.bedrooms || 2} Bedrooms • ${prop.isFurnished ? 'Furnished' : 'Unfurnished'}`}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-white">¥{prop.monthlyRentCNY.toLocaleString()} CNY</span>
                      <span className="text-[10px] text-slate-400 block">/ month (~${prop.monthlyRentUSD})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                      {prop.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Drawer / Modal */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-400" />
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
                <span className="text-[10px] font-bold text-slate-500 uppercase">QR Verification Token</span>
                <p className="font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedBookingForDetail.qrVerificationToken || `FLYEMASS|${selectedBookingForDetail.reference || selectedBookingForDetail.id}|hotel`}
                </p>
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
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
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
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
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
                    <option value="Yiwu">Yiwu (Commodity City)</option>
                    <option value="Shenzhen">Shenzhen (Huaqiangbei)</option>
                    <option value="Shanghai">Shanghai (Financial Hub)</option>
                    <option value="Beijing">Beijing (Capital Hub)</option>
                    <option value="Foshan">Foshan (Furniture/Ceramics)</option>
                    <option value="Hangzhou">Hangzhou (E-Commerce)</option>
                    <option value="Dongguan">Dongguan (Manufacturing)</option>
                    <option value="Hong Kong">Hong Kong (Trade Gateway)</option>
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
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">District / Zone</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">English Address</label>
                <input
                  type="text"
                  value={newEngAddress}
                  onChange={(e) => setNewEngAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Address (中文地址)</label>
                <input
                  type="text"
                  value={newZhAddress}
                  onChange={(e) => setNewZhAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-sans outline-none focus:border-emerald-500"
                  required
                />
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

      {/* Add Rental Property Modal */}
      {showAddRentalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-extrabold text-white">Add Guangzhou Rental Listing</h3>
              </div>
              <button onClick={() => setShowAddRentalModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRental} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Property English Title</label>
                <input
                  type="text"
                  value={newRentalTitle}
                  onChange={(e) => setNewRentalTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Title (中文标题)</label>
                <input
                  type="text"
                  value={newRentalZhTitle}
                  onChange={(e) => setNewRentalZhTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-sans outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Property Type</label>
                  <select
                    value={newRentalType}
                    onChange={(e: any) => setNewRentalType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House / Villa</option>
                    <option value="office">Commercial Office</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">District</label>
                  <select
                    value={newRentalDistrict}
                    onChange={(e) => setNewRentalDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none"
                  >
                    <option value="Tianhe CBD">Tianhe CBD</option>
                    <option value="Yuexiu District">Yuexiu District</option>
                    <option value="Haizhu District">Haizhu District</option>
                    <option value="Pazhou Complex Zone">Pazhou Complex Zone</option>
                    <option value="Baiyun District">Baiyun District</option>
                    <option value="Panyu District">Panyu District</option>
                    <option value="Liwan District">Liwan District</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Monthly Rent (CNY)</label>
                  <input
                    type="number"
                    value={newRentCNY}
                    onChange={(e) => setNewRentCNY(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    {newRentalType === 'office' ? 'Desk Capacity' : 'Bedrooms'}
                  </label>
                  <input
                    type="number"
                    value={newBedroomsOrDesks}
                    onChange={(e) => setNewBedroomsOrDesks(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">English Address</label>
                <input
                  type="text"
                  value={newRentalAddress}
                  onChange={(e) => setNewRentalAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Address (中文地址)</label>
                <input
                  type="text"
                  value={newRentalZhAddress}
                  onChange={(e) => setNewRentalZhAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-sans outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRentalModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingRental}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {isAddingRental ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
