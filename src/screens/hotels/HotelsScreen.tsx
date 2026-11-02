import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { CHINA_HOTELS } from '../../data/mockData';
import { 
  Building, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  ChevronRight, 
  Search, 
  Calendar,
  Ticket
} from 'lucide-react';
import { Hotel } from '../../types';

export const HotelsScreen: React.FC = () => {
  const { navigate, hotelBookings } = useApp();
  const [selectedCity, setSelectedCity] = useState<'All' | 'Guangzhou' | 'Shenzhen' | 'Yiwu'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cities = ['All', 'Guangzhou', 'Shenzhen', 'Yiwu'] as const;

  const filteredHotels = CHINA_HOTELS.filter((hotel) => {
    const matchesCity = selectedCity === 'All' || hotel.city === selectedCity;
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hotel.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hotel.chineseName.includes(searchQuery);
    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="China Trade Hotels" />

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
                <p className="text-[10px] text-blue-200">Tap for Chinese Taxi Driver Card & QR Code</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </div>
        )}

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Canton Fair hotel, Huaqiangbei, Futian..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* City Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCity === city
                  ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              {city === 'All' ? 'All China Trade Cities' : `${city} Hub`}
            </button>
          ))}
        </div>

        {/* Hotel Cards List */}
        <div className="space-y-4">
          {filteredHotels.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => navigate('hotel-detail', hotel.id)}
              className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer overflow-hidden shadow-xl group"
            >
              {/* Hotel Photo */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-slate-800">
                  {hotel.city} • {hotel.district}
                </div>

                <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl text-[10px] font-bold text-amber-400 flex items-center gap-1 border border-slate-800">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{hotel.rating}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white leading-tight">{hotel.name}</h3>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5">{hotel.chineseName}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{hotel.distanceToMarket}</span>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {hotel.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Price and CTA */}
                <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-extrabold text-white num-tabular">
                      ${hotel.pricePerNightUSD}
                    </span>
                    <span className="text-xs text-slate-400 font-medium"> / night</span>
                    <span className="text-[10px] text-emerald-400 ml-2 num-tabular">
                      (¥{hotel.pricePerNightCNY} CNY)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    View Room & Taxi Card
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
