import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { CHINA_HOTELS } from '../../data/mockData';
import { Hotel } from '../../types';
import { 
  Building, 
  MapPin, 
  Star, 
  Search, 
  Ticket, 
  ChevronRight, 
  Home, 
  Briefcase,
  Layers
} from 'lucide-react';

export const HotelsScreen: React.FC = () => {
  const { navigate, hotelBookings, showToast } = useApp();

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

  useEffect(() => {
    const updateData = () => {
      const hList = db.getHotels();
      if (hList && hList.length > 0) {
        setHotelsList((prev) => {
          if (prev && prev.length === hList.length && prev.every((h, i) => h.id === hList[i]?.id && h.priceUSD === hList[i]?.priceUSD)) {
            return prev;
          }
          return hList;
        });
      }
    };
    updateData();
    return db.subscribe(updateData);
  }, []);

  // Filter Hotels
  const filteredHotels = (hotelsList || []).filter((hotel) => {
    if (!hotel) return false;
    if (hotel.isPublished === false) return false;
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

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="China Business Hotels & BNBs" />

      <div className="p-4 space-y-4">
        {/* Navigation Switcher Pills to Sister Realty Services */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
            <Building className="w-3.5 h-3.5" />
            <span>Hotels & BNBs</span>
          </span>
          <button
            onClick={() => navigate('rentals-apartments')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Apartments & Houses</span>
          </button>
          <button
            onClick={() => navigate('rentals-offices')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Commercial Offices</span>
          </button>
        </div>

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

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Canton Fair, Huaqiangbei, Yiwu, Westin..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

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
                      {hotel.pricePerNightUSD && hotel.pricePerNightUSD > 0 ? (
                        <>
                          <span className="text-base font-extrabold text-white num-tabular">
                            ${hotel.pricePerNightUSD}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> / night</span>
                        </>
                      ) : hotel.pricePerNightCNY && hotel.pricePerNightCNY > 0 ? (
                        <>
                          <span className="text-base font-extrabold text-white num-tabular">
                            ¥{hotel.pricePerNightCNY}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> CNY / night</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-extrabold text-white num-tabular">
                            ₦{(hotel.pricePerNightNGN || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> NGN / night</span>
                        </>
                      )}

                      <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                        {hotel.pricePerNightCNY && hotel.pricePerNightCNY > 0 && hotel.pricePerNightUSD && hotel.pricePerNightUSD > 0 && (
                          <span className="text-emerald-400 font-mono">¥{hotel.pricePerNightCNY.toLocaleString()} CNY</span>
                        )}
                        {hotel.pricePerNightNGN && hotel.pricePerNightNGN > 0 && (
                          <span className="text-slate-400 font-mono">₦{hotel.pricePerNightNGN.toLocaleString()} NGN</span>
                        )}
                      </div>
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
    </div>
  );
};
export default HotelsScreen;
