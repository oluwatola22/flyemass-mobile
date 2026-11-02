import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { VETTED_SUPPLIERS } from '../../data/mockData';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  ChevronRight, 
  CheckCircle2, 
  Send,
  Lock,
  Sparkles,
  Users
} from 'lucide-react';
import { Supplier } from '../../types';

export const SuppliersScreen: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Electronics', 'Commodities', 'Solar', 'Textile'];

  const filteredSuppliers = VETTED_SUPPLIERS.filter((sup) => {
    const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sup.chineseName.includes(searchQuery) ||
                          sup.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="VIP Supplier Directory" />

      <div className="p-4 space-y-4">
        {/* Agent Service Shortcut Banner */}
        <div 
          onClick={() => navigate('agent')}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 cursor-pointer flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Need an On-Site Factory Inspector?</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Book a FlyeMass bilingual trade agent in Guangzhou, Yiwu, or Shenzhen.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manufacturer, Chinese name, or city..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Supplier Cards */}
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
            >
              <div className="flex gap-3.5">
                <img
                  src={supplier.image}
                  alt={supplier.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                      {supplier.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{supplier.city}</span>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1 leading-snug">{supplier.name}</h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">{supplier.chineseName}</p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                      {supplier.rating}
                    </span>
                    <span>•</span>
                    <span>{supplier.ordersFulfilled}+ Fulfilled</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{supplier.verifiedYears}y Vetted</span>
                  </div>
                </div>
              </div>

              {/* Main Products Pills */}
              <div className="flex gap-1.5 flex-wrap">
                {supplier.mainProducts.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  Min Order: <strong className="text-slate-200">{supplier.minOrderValue}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      showToast(`WeChat ID (${supplier.wechatId}) copied!`, 'success');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WeChat</span>
                  </button>

                  <button
                    onClick={() => navigate('pay')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Pay Escrow</span>
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
