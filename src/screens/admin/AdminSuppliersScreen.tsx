import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { VETTED_SUPPLIERS } from '../../data/mockData';
import { Supplier } from '../../types';
import { 
  Building2, 
  MapPin, 
  Star, 
  Search, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AdminSuppliersScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [activeTab, setActiveTab] = useState<'catalog' | 'passes'>('catalog');
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(VETTED_SUPPLIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Register Supplier Modal
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newName, setNewName] = useState('Guangdong Audio Tech Co., Ltd');
  const [newZhName, setNewZhName] = useState('广东声学科技有限公司');
  const [newCity, setNewCity] = useState('Guangzhou');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newMoq, setNewMoq] = useState('500 units');
  const [newWechat, setNewWechat] = useState('factory_audio_gz');
  const [newPhone, setNewPhone] = useState('+86 138 2938 1029');
  const [newRating, setNewRating] = useState('4.9');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  useEffect(() => {
    return db.subscribe(() => setDbState({ ...db.getState() }));
  }, []);

  const categories = ['All', 'Electronics', 'Commodities', 'Solar', 'Textile', 'Machinery'];

  // Filter suppliers
  const filteredSuppliers = suppliersList.filter((sup) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      sup.name.toLowerCase().includes(q) ||
      sup.chineseName.includes(searchQuery) ||
      sup.city.toLowerCase().includes(q) ||
      sup.category.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'All' || sup.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // VIP Pass subscriptions list
  const subscriptions = Object.values(dbState.supplier_subscriptions || {});

  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSupplier(true);
    try {
      const newSup: Supplier = {
        id: `sup-${Date.now().toString().slice(-4)}`,
        name: newName,
        chineseName: newZhName,
        category: newCategory,
        city: newCity,
        verifiedYears: 4,
        rating: parseFloat(newRating) || 4.9,
        badge: 'Gold Manufacturer',
        ordersFulfilled: 120,
        minOrderValue: newMoq,
        mainProducts: [newCategory],
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
        inspectionPassed: true,
        wechatId: newWechat
      };

      setSuppliersList((prev) => [newSup, ...prev]);
      showToast(`Supplier "${newName}" registered in VIP catalog!`, 'success');
      setShowAddSupplierModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to register supplier', 'error');
    } finally {
      setIsAddingSupplier(false);
    }
  };

  return (
    <AdminLayout activeTab="suppliers">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                VIP Supplier Directory & Pass Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Vetted Chinese factories, physical audit scores, direct WeChat/phone enclave contacts, and 30-day VIP pass subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'catalog' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Factory Catalog ({suppliersList.length})
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'passes' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              VIP Access Passes ({subscriptions.length})
            </button>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Register Factory</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by factory name, Chinese name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Factory Catalog */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((sup) => (
              <div key={sup.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{sup.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        {sup.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{sup.chineseName}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{sup.city} • {sup.category}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{sup.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{sup.verifiedYears} yrs verified</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Min. Order Value</span>
                    <strong className="text-white">{sup.minOrderValue}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">WeChat ID</span>
                    <strong className="text-emerald-400 font-mono text-[11px]">{sup.wechatId || 'Protected'}</strong>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Inspection Status</span>
                    <span className="font-bold inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Audit Passed</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: VIP Access Passes */}
        {activeTab === 'passes' && (
          <div className="space-y-3">
            <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                    <th className="py-3 px-4 font-semibold">Subscription Ref</th>
                    <th className="py-3 px-4 font-semibold">Customer User</th>
                    <th className="py-3 px-4 font-semibold">Factory / Supplier ID</th>
                    <th className="py-3 px-4 font-semibold">Fee Paid</th>
                    <th className="py-3 px-4 font-semibold">Unlocked At</th>
                    <th className="py-3 px-4 font-semibold">Expires At</th>
                    <th className="py-3 px-4 font-semibold text-right">Pass Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No customer VIP pass subscriptions active yet.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{sub.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{sub.userId}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{sub.supplierId}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">${sub.amountUSD || 50} USD</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(sub.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(sub.expiresAt || (Date.now() + 30 * 86400000)).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active 30-Day
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Register Verified Chinese Manufacturer</h3>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRegisterSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Factory Name (English)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Factory Name</label>
                <input
                  type="text"
                  value={newZhName}
                  onChange={(e) => setNewZhName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">City Hub</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Industry Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Solar">Solar</option>
                    <option value="Textile">Textile</option>
                    <option value="Machinery">Machinery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">WeChat ID</label>
                  <input
                    type="text"
                    value={newWechat}
                    onChange={(e) => setNewWechat(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Minimum Order Value / Quantity</label>
                <input
                  type="text"
                  value={newMoq}
                  onChange={(e) => setNewMoq(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingSupplier}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isAddingSupplier ? 'Registering...' : 'Register Factory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminSuppliersScreen;
