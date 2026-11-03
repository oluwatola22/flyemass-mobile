import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { CHINA_HOTELS } from '../../data/mockData';
import { Hotel, RentalProperty } from '../../types';
import { 
  Building, 
  Building2,
  Home,
  Briefcase,
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  ChevronRight, 
  Search, 
  Calendar,
  Ticket,
  Users,
  Info,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const HotelsScreen: React.FC = () => {
  const { navigate, hotelBookings, userProfile, activeUserId, showToast } = useApp();

  // Main Tabs: Hotels & BNBs | Apartments & Houses | Office Rentals
  const [mainTab, setMainTab] = useState<'hotels' | 'apartments' | 'offices'>('hotels');

  // Hotels State
  const [hotelsList, setHotelsList] = useState<Hotel[]>(() => {
    const list = db.getHotels();
    return list.length > 0 ? list : CHINA_HOTELS;
  });
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-11-12');
  const [checkOutDate, setCheckOutDate] = useState('2026-11-16');
  const [guestCount, setGuestCount] = useState<number>(2);

  // Rental Properties State
  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Inquiry Modal State (Apartments & Offices)
  const [selectedPropForInquiry, setSelectedPropForInquiry] = useState<RentalProperty | null>(null);
  const [applicantName, setApplicantName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || '+234 803 123 4567');
  const [companyName, setCompanyName] = useState('Alade International Trading Ltd');
  const [preferredMoveIn, setPreferredMoveIn] = useState('2026-12-01');
  const [preferredViewing, setPreferredViewing] = useState('2026-11-15');
  const [leaseDuration, setLeaseDuration] = useState('1 Year');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // 9 Destination Cities for Hotels
  const hotelCities = [
    'All',
    'Guangzhou',
    'Yiwu',
    'Shenzhen',
    'Shanghai',
    'Beijing',
    'Foshan',
    'Hangzhou',
    'Dongguan',
    'Hong Kong'
  ];

  // Guangzhou Districts for Apartments & Offices
  const apartmentDistricts = ['All', 'Tianhe CBD', 'Yuexiu', 'Haizhu', 'Baiyun', 'Panyu', 'Liwan'];
  const officeDistricts = ['All', 'Tianhe CBD', 'Yuexiu', 'Haizhu', 'Pazhou'];

  useEffect(() => {
    const updateData = () => {
      const hList = db.getHotels();
      if (hList.length > 0) setHotelsList(hList);
      const rList = db.getRentalProperties();
      if (rList.length > 0) setRentalProps(rList);
    };
    updateData();
    return db.subscribe(updateData);
  }, []);

  // Filter Hotels
  const filteredHotels = (hotelsList || []).filter((hotel) => {
    if (!hotel) return false;
    const hotelCity = hotel.city || '';
    const matchesCity = selectedCity === 'All' || hotelCity.toLowerCase() === selectedCity.toLowerCase();
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch =
      !query ||
      (hotel.name && hotel.name.toLowerCase().includes(query)) ||
      (hotel.district && hotel.district.toLowerCase().includes(query)) ||
      (hotel.city && hotel.city.toLowerCase().includes(query)) ||
      (hotel.chineseName && hotel.chineseName.includes(searchQuery));
    return matchesCity && matchesSearch;
  });

  // Filter Apartments / Houses
  const filteredApartments = (rentalProps || []).filter((p) => {
    if (!p) return false;
    const isResidential = p.propertyType === 'apartment' || p.propertyType === 'house';
    const districtStr = p.district || '';
    const matchesDistrict = selectedDistrict === 'All' || districtStr.toLowerCase().includes(selectedDistrict.toLowerCase());
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch =
      !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.district && p.district.toLowerCase().includes(query)) ||
      (p.chineseTitle && p.chineseTitle.includes(searchQuery));
    return isResidential && matchesDistrict && matchesSearch;
  });

  // Filter Offices
  const filteredOffices = (rentalProps || []).filter((p) => {
    if (!p) return false;
    const isOffice = p.propertyType === 'office';
    const districtStr = p.district || '';
    const matchesDistrict = selectedDistrict === 'All' || districtStr.toLowerCase().includes(selectedDistrict.toLowerCase());
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch =
      !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.district && p.district.toLowerCase().includes(query)) ||
      (p.chineseTitle && p.chineseTitle.includes(searchQuery));
    return isOffice && matchesDistrict && matchesSearch;
  });

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForInquiry) return;

    setIsSubmittingInquiry(true);
    try {
      const res = await db.createPropertyInquiry({
        userId: activeUserId,
        propertyId: selectedPropForInquiry.id,
        customerName: applicantName,
        customerPhone: applicantPhone,
        companyName: selectedPropForInquiry.propertyType === 'office' ? companyName : '',
        preferredMoveInDate: preferredMoveIn,
        preferredViewingDate: selectedPropForInquiry.propertyType === 'office' ? preferredViewing : '',
        leaseDuration,
        customNotes: inquiryNotes
      });

      showToast(`Inquiry ${res.inquiry.reference} submitted! Created support ticket ${res.ticketNumber}.`, 'success');
      setSelectedPropForInquiry(null);
      setInquiryNotes('');

      // Redirect directly to support concierge
      navigate('support-tickets');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="China Accommodation & Realty" />

      <div className="p-4 space-y-4">
        {/* Active Vouchers Bar */}
        {hotelBookings.length > 0 && (
          <div 
            onClick={() => navigate('hotel-bookings')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-800/60 flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="text-xs font-bold text-white">You Have {hotelBookings.length} Active Hotel Voucher</h4>
                <p className="text-[10px] text-blue-200">Tap for Chinese Taxi Driver Card, QR Token & PDF Voucher</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </div>
        )}

        {/* 3 Main Workflow Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setMainTab('hotels'); setSelectedCity('All'); }}
            className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mainTab === 'hotels'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Hotels & BNBs</span>
          </button>

          <button
            onClick={() => { setMainTab('apartments'); setSelectedDistrict('All'); }}
            className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mainTab === 'apartments'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Apartments</span>
          </button>

          <button
            onClick={() => { setMainTab('offices'); setSelectedDistrict('All'); }}
            className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              mainTab === 'offices'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Offices</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mainTab === 'hotels'
                ? "Search Canton Fair, Huaqiangbei, Yiwu, Westin..."
                : mainTab === 'apartments'
                ? "Search Tianhe CBD, Yuexiu, Haizhu apartments..."
                : "Search Guangzhou commercial offices, Pazhou..."
            }
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* ========================================================= */}
        {/* 1. HOTELS & BNBS WORKFLOW */}
        {/* ========================================================= */}
        {mainTab === 'hotels' && (
          <div className="space-y-4">
            {/* Date Range & Guest Picker */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Check-In</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Check-Out</label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stay Duration</label>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold flex items-center justify-between">
                  <span>{calculateNights()} Nights</span>
                  <span className="text-[10px] text-slate-400">{guestCount} Guests</span>
                </div>
              </div>
            </div>

            {/* 9 Destination Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {hotelCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCity === city
                      ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  {city === 'All' ? 'All China Trade Cities (9)' : `${city} Hub`}
                </button>
              ))}
            </div>

            {/* Hotel Cards List */}
            <div className="space-y-4">
              {filteredHotels.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  No trade hotels found matching your search.
                </div>
              ) : (
                filteredHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    onClick={() => navigate('hotel-detail', hotel.id)}
                    className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer overflow-hidden shadow-xl group"
                  >
                    {/* Hotel Photo */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                      <img
                        src={hotel.image || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                        alt={hotel.name || 'Trade Hotel'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-slate-800">
                        {hotel.city || 'China'} • {hotel.district || 'Trade Zone'}
                      </div>

                      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl text-[10px] font-bold text-amber-400 flex items-center gap-1 border border-slate-800">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{hotel.rating || 4.8}</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-sm font-bold text-white leading-tight">{hotel.name || 'Partner Hotel'}</h3>
                        {hotel.chineseName && <p className="text-[11px] text-slate-300 font-sans mt-0.5">{hotel.chineseName}</p>}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                      {hotel.distanceToMarket && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{hotel.distanceToMarket}</span>
                        </div>
                      )}

                      {/* Amenities / Tags */}
                      {((hotel.tags && hotel.tags.length > 0) ? hotel.tags : (hotel.amenities || [])).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {((hotel.tags && hotel.tags.length > 0) ? hotel.tags : (hotel.amenities || [])).slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Room types preview */}
                      {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{hotel.roomTypes.length} Room Categories Available</span>
                        </div>
                      )}

                      {/* Price and CTA */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-extrabold text-white num-tabular">
                            ${hotel.pricePerNightUSD || 120}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> / night</span>
                          {hotel.pricePerNightCNY && (
                            <span className="text-[10px] text-emerald-400 ml-2 num-tabular">
                              (¥{hotel.pricePerNightCNY} CNY)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                        >
                          Book Stay
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. APARTMENTS & HOUSES WORKFLOW */}
        {/* ========================================================= */}
        {mainTab === 'apartments' && (
          <div className="space-y-4">
            {/* Guangzhou Focus & Offline Notice Banner */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Guangzhou Residential Rentals (Tianhe, Yuexiu, Haizhu)
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Furnished apartments and houses for medium-to-long term trade visits. 
                Move-in terms typically require <strong className="text-emerald-400">2 months deposit + 1 month advance rent</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200">
                  <strong>Notice:</strong> Rental payments and security deposits are handled directly with the FlyeMass China team. No wallet payment is taken in the app for apartment rentals.
                </p>
              </div>
            </div>

            {/* Guangzhou District Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {apartmentDistricts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedDistrict === d
                      ? 'bg-slate-900 border-indigo-500 text-indigo-300 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  {d === 'All' ? 'All Guangzhou Districts' : d}
                </button>
              ))}
            </div>

            {/* Apartments List */}
            <div className="space-y-4">
              {filteredApartments.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  No apartments found in {selectedDistrict}.
                </div>
              ) : (
                filteredApartments.map((prop) => {
                  const upfrontMoveInCNY = (Number(prop.depositMonths || 2) + Number(prop.advanceRentMonths || 1)) * Number(prop.monthlyRentCNY || 0);
                  const upfrontMoveInUSD = Math.round(upfrontMoveInCNY / 7.24);

                  return (
                    <div
                      key={prop.id}
                      className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
                    >
                      {/* Photo */}
                      <div className="relative h-44 w-full bg-slate-950">
                        <img
                          src={prop.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'}
                          alt={prop.title || 'Apartment'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-slate-800">
                          {prop.district || 'Guangzhou'} • {prop.floorAreaSqm || 60} m²
                        </div>

                        <div className="absolute top-3 right-3 bg-emerald-500/90 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-950">
                          {prop.bedrooms || 1} Bed • {prop.isFurnished ? 'Furnished' : 'Unfurnished'}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-sm font-bold text-white leading-tight">{prop.title || 'Guangzhou Apartment'}</h3>
                          {prop.chineseTitle && <p className="text-[11px] text-slate-300 font-sans mt-0.5">{prop.chineseTitle}</p>}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{prop.address || prop.englishAddress || prop.district}</span>
                        </div>

                        {/* Amenities */}
                        {(prop.amenities || []).length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {(prop.amenities || []).slice(0, 4).map((a) => (
                              <span
                                key={a}
                                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Upfront Move-in Calculation Box */}
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Monthly Rent:</span>
                            <span className="font-extrabold text-white num-tabular">
                              ¥{prop.monthlyRentCNY.toLocaleString()} CNY <span className="text-slate-400 font-normal">(~${prop.monthlyRentUSD} USD)</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Deposit & Advance:</span>
                            <span className="text-indigo-300 font-bold">
                              {prop.depositMonths}m Deposit + {prop.advanceRentMonths}m Advance
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold">Est. Upfront Move-In Cost:</span>
                            <span className="font-mono font-black text-emerald-400 num-tabular">
                              ¥{upfrontMoveInCNY.toLocaleString()} CNY <span className="text-[10px] text-slate-400 font-normal">(~${upfrontMoveInUSD} USD)</span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPropForInquiry(prop)}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Show Interest & Inquire with China Desk</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. OFFICE RENTALS WORKFLOW */}
        {/* ========================================================= */}
        {mainTab === 'offices' && (
          <div className="space-y-4">
            {/* Commercial Office Notice */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Guangzhou Commercial Offices & Trade Showrooms
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Turnkey commercial offices with high-speed fiber Wi-Fi, boardrooms, and metro connections for international trading companies.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200">
                  <strong>Notice:</strong> Leases and deposits are settled directly with building management via our China Trade Desk. Schedule an in-person viewing below.
                </p>
              </div>
            </div>

            {/* Commercial District Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {officeDistricts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedDistrict === d
                      ? 'bg-slate-900 border-teal-500 text-teal-300 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  {d === 'All' ? 'All Commercial Hubs' : d}
                </button>
              ))}
            </div>

            {/* Offices List */}
            <div className="space-y-4">
              {filteredOffices.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  No commercial offices found in {selectedDistrict}.
                </div>
              ) : (
                filteredOffices.map((prop) => {
                  const upfrontMoveInCNY = (Number(prop.depositMonths || 2) + Number(prop.advanceRentMonths || 1)) * Number(prop.monthlyRentCNY || 0);

                  return (
                    <div
                      key={prop.id}
                      className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
                    >
                      {/* Photo */}
                      <div className="relative h-44 w-full bg-slate-950">
                        <img
                          src={prop.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                          alt={prop.title || 'Commercial Office'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-slate-800">
                          {prop.district || 'Guangzhou'} • {prop.floorAreaSqm || 100} m²
                        </div>

                        <div className="absolute top-3 right-3 bg-teal-500/90 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-950">
                          {prop.deskCapacity || 20} Desks Capacity
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-sm font-bold text-white leading-tight">{prop.title || 'Turnkey Office'}</h3>
                          {prop.chineseTitle && <p className="text-[11px] text-slate-300 font-sans mt-0.5">{prop.chineseTitle}</p>}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{prop.address || prop.englishAddress || prop.district}</span>
                        </div>

                        {/* Commercial Amenities */}
                        {(prop.amenities || []).length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {(prop.amenities || []).map((a) => (
                              <span
                                key={a}
                                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Upfront Move-in Calculation Box */}
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Monthly Rent:</span>
                            <span className="font-extrabold text-white num-tabular">
                              ¥{prop.monthlyRentCNY.toLocaleString()} CNY <span className="text-slate-400 font-normal">(~${prop.monthlyRentUSD} USD)</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Terms:</span>
                            <span className="text-teal-300 font-bold">
                              {prop.depositMonths}m Deposit + {prop.advanceRentMonths}m Advance
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-teal-400 font-bold">Est. Upfront Move-In Cost:</span>
                            <span className="font-mono font-black text-teal-400 num-tabular">
                              ¥{upfrontMoveInCNY.toLocaleString()} CNY
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPropForInquiry(prop)}
                          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule Viewing & Inquire (China Desk)</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* INQUIRY MODAL (APARTMENTS & OFFICES) */}
      {/* ========================================================= */}
      {selectedPropForInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {selectedPropForInquiry.propertyType === 'office' ? (
                  <Briefcase className="w-5 h-5 text-teal-400" />
                ) : (
                  <Home className="w-5 h-5 text-indigo-400" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {selectedPropForInquiry.propertyType === 'office' ? 'Office Viewing Request' : 'Apartment Inquiry'}
                  </h3>
                  <p className="text-[10px] text-slate-400">{selectedPropForInquiry.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPropForInquiry(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Offline notice reminder */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
              No wallet deduction will occur in the app. Your dedicated China Desk representative will contact you to coordinate property inspection and contract execution.
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Applicant Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {selectedPropForInquiry.propertyType === 'office' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Registered Trade Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Target Move-In Date</label>
                  <input
                    type="date"
                    value={preferredMoveIn}
                    onChange={(e) => setPreferredMoveIn(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    {selectedPropForInquiry.propertyType === 'office' ? 'Viewing Date' : 'Lease Duration'}
                  </label>
                  {selectedPropForInquiry.propertyType === 'office' ? (
                    <input
                      type="date"
                      value={preferredViewing}
                      onChange={(e) => setPreferredViewing(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      required
                    />
                  ) : (
                    <select
                      value={leaseDuration}
                      onChange={(e) => setLeaseDuration(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Special Requirements / Notes</label>
                <textarea
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="Need English-speaking landlord, proximity to metro, Canton Fair shuttle, etc."
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPropForInquiry(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isSubmittingInquiry ? 'Connecting...' : 'Submit to China Desk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
