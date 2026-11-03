import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { RentalProperty, PropertyInquiry } from '../../types';
import { 
  Home, 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Send, 
  MessageSquare,
  Users,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';

export const AdminRentalsApartmentsScreen: React.FC = () => {
  const { showToast, navigate } = useApp();

  const [activeTab, setActiveTab] = useState<'inquiries' | 'listings'>('inquiries');
  const [inquiriesList, setInquiriesList] = useState<PropertyInquiry[]>(() => db.getPropertyInquiries());
  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());

  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');

  // Add Apartment Listing Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Tianhe CBD Executive Apartment');
  const [newZhTitle, setNewZhTitle] = useState('天河CBD高端商务公寓');
  const [newDistrict, setNewDistrict] = useState('Tianhe CBD');
  const [newAddress, setNewAddress] = useState('Zhujiang New Town, Tianhe District, Guangzhou');
  const [newZhAddress, setNewZhAddress] = useState('广州市天河区珠江新城花城大道');
  const [newRentCNY, setNewRentCNY] = useState('6500');
  const [newDepositMonths, setNewDepositMonths] = useState('2');
  const [newAdvanceMonths, setNewAdvanceMonths] = useState('1');
  const [newFloorArea, setNewFloorArea] = useState('85');
  const [newBedrooms, setNewBedrooms] = useState('2');
  const [isFurnished, setIsFurnished] = useState(true);
  const [isAddingListing, setIsAddingListing] = useState(false);

  useEffect(() => {
    const updateData = () => {
      setInquiriesList(db.getPropertyInquiries());
      setRentalProps(db.getRentalProperties());
    };
    return db.subscribe(updateData);
  }, []);

  // Filter only residential inquiries
  const residentialInquiries = inquiriesList.filter((inq) => {
    const isResidential = inq.propertyType === 'apartment' || inq.propertyType === 'house';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (inq.reference && inq.reference.toLowerCase().includes(q)) ||
      (inq.customerName && inq.customerName.toLowerCase().includes(q)) ||
      (inq.propertyName && inq.propertyName.toLowerCase().includes(q));
    const matchesStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
    return isResidential && matchesSearch && matchesStatus;
  });

  // Filter only residential listings
  const residentialListings = rentalProps.filter((p) => {
    const isResidential = p.propertyType === 'apartment' || p.propertyType === 'house';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q));
    return isResidential && matchesSearch;
  });

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      await db.updatePropertyInquiryStatus(inquiryId, status, 'China Residential Concierge', 'adm-001');
      showToast(`Residential inquiry ${inquiryId} updated to ${status}!`, 'success');
      setInquiriesList(db.getPropertyInquiries());
    } catch (err: any) {
      showToast(err.message || 'Failed to update inquiry status', 'error');
    }
  };

  const handleAddApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingListing(true);
    try {
      const rentCNY = parseFloat(newRentCNY) || 6000;
      const propId = `prop-apt-${Date.now().toString().slice(-4)}`;

      const newProp: RentalProperty = {
        id: propId,
        title: newTitle,
        chineseTitle: newZhTitle,
        propertyType: 'apartment',
        district: newDistrict,
        address: newAddress,
        chineseAddress: newZhAddress,
        monthlyRentCNY: rentCNY,
        monthlyRentUSD: Math.round(rentCNY / 7.24),
        depositMonths: parseInt(newDepositMonths) || 2,
        advanceRentMonths: parseInt(newAdvanceMonths) || 1,
        floorAreaSqm: parseFloat(newFloorArea) || 85,
        bedrooms: parseInt(newBedrooms) || 2,
        isFurnished,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        amenities: ['Central AC', 'Washing Machine', 'Smart TV', 'Elevator', '24/7 Security', 'Balcony'],
        status: 'live',
        createdAt: Date.now()
      };

      await db.createRentalProperty(newProp, 'adm-001');
      showToast(`Residential apartment "${newTitle}" published successfully!`, 'success');
      setShowAddModal(false);
      setRentalProps(db.getRentalProperties());
    } catch (err: any) {
      showToast(err.message || 'Failed to create apartment listing', 'error');
    } finally {
      setIsAddingListing(false);
    }
  };

  return (
    <AdminLayout activeTab="rentals-apartments">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Home className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Residential Apartments & Housing Management
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guangzhou medium-to-long term furnished flats, tenant viewing applications, and offline lease agreements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inquiries' ? 'bg-indigo-600 text-white font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Tenant Inquiries ({residentialInquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'listings' ? 'bg-indigo-600 text-white font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Apartment Catalog ({residentialListings.length})
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Apartment</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === 'inquiries' ? "Search by applicant, reference, property..." : "Search by title, district..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeTab === 'inquiries' && (
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['all', 'new', 'contacted', 'viewing_scheduled', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setInquiryStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                    inquiryStatusFilter === status
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Tenant Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-3">
            {residentialInquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                No residential apartment inquiries found.
              </div>
            ) : (
              residentialInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      <Home className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{inq.reference}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs font-bold text-white">{inq.propertyName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-indigo-400 text-[10px] uppercase font-bold">
                          Residential
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Applicant: <strong>{inq.customerName}</strong> ({inq.customerPhone})
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Target Move-In: <strong>{inq.preferredMoveInDate || 'Flexible'}</strong>
                        <span> • Lease Duration: {inq.leaseDuration || '1 Year'}</span>
                        {inq.customNotes && <span> • Notes: "{inq.customNotes}"</span>}
                      </p>

                      {inq.ticketNumber && (
                        <p className="text-[10px] text-indigo-300 font-mono">
                          Linked Support Concierge Ticket: #{inq.ticketNumber}
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
                      <button
                        onClick={() => navigate('admin-support')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Open in Concierge Support"
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span>Chat</span>
                      </button>

                      {inq.status === 'new' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'contacted')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Mark Contacted
                        </button>
                      )}

                      {inq.status !== 'viewing_scheduled' && inq.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'viewing_scheduled')}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Schedule Viewing
                        </button>
                      )}

                      {inq.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'closed')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Lease Signed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Apartment Catalog */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {residentialListings.map((prop) => (
              <div key={prop.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="h-36 rounded-2xl bg-slate-950 overflow-hidden relative">
                  <img src={prop.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white">
                    {prop.district} • {prop.floorAreaSqm} m²
                  </div>
                  <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-lg text-[9px] font-black">
                    {prop.bedrooms || 1} Bed
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{prop.title}</h4>
                  {prop.chineseTitle && <p className="text-[10px] text-slate-400">{prop.chineseTitle}</p>}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Rent:</span>
                  <span className="font-bold text-emerald-400">¥{prop.monthlyRentCNY.toLocaleString()} CNY (~${prop.monthlyRentUSD})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Apartment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Register Guangzhou Residential Apartment</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddApartment} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Apartment Title (English)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Title (Listing Header)</label>
                <input
                  type="text"
                  value={newZhTitle}
                  onChange={(e) => setNewZhTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">District</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Tianhe CBD">Tianhe CBD</option>
                    <option value="Yuexiu">Yuexiu</option>
                    <option value="Haizhu">Haizhu</option>
                    <option value="Baiyun">Baiyun</option>
                    <option value="Panyu">Panyu</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Monthly Rent (CNY)</label>
                  <input
                    type="number"
                    value={newRentCNY}
                    onChange={(e) => setNewRentCNY(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={newBedrooms}
                    onChange={(e) => setNewBedrooms(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Floor Area (m²)</label>
                  <input
                    type="number"
                    value={newFloorArea}
                    onChange={(e) => setNewFloorArea(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Furnished?</label>
                  <select
                    value={isFurnished ? 'yes' : 'no'}
                    onChange={(e) => setIsFurnished(e.target.value === 'yes')}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="yes">Furnished</option>
                    <option value="no">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingListing}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {isAddingListing ? 'Publishing...' : 'Publish Apartment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminRentalsApartmentsScreen;
