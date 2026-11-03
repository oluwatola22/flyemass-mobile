import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { RentalProperty, PropertyInquiry } from '../../types';
import { 
  Briefcase, 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  MessageSquare,
  Building2,
  Users,
  Layers,
  Check
} from 'lucide-react';

export const AdminRentalsOfficesScreen: React.FC = () => {
  const { showToast, navigate } = useApp();

  const [activeTab, setActiveTab] = useState<'inquiries' | 'listings'>('inquiries');
  const [inquiriesList, setInquiriesList] = useState<PropertyInquiry[]>(() => db.getPropertyInquiries());
  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());

  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');

  // Add Office Listing Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Pazhou Trade Exhibition Office');
  const [newZhTitle, setNewZhTitle] = useState('琶洲广交会商业写字楼展厅');
  const [newDistrict, setNewDistrict] = useState('Pazhou');
  const [newAddress, setNewAddress] = useState('Xingang East Road, Haizhu District, Guangzhou');
  const [newZhAddress, setNewZhAddress] = useState('广州市海珠区新港东路琶洲国际会展中心');
  const [newRentCNY, setNewRentCNY] = useState('18500');
  const [newFloorArea, setNewFloorArea] = useState('160');
  const [newDesks, setNewDesks] = useState('25');
  const [isAddingListing, setIsAddingListing] = useState(false);

  useEffect(() => {
    const updateData = () => {
      setInquiriesList(db.getPropertyInquiries());
      setRentalProps(db.getRentalProperties());
    };
    return db.subscribe(updateData);
  }, []);

  // Filter only commercial office inquiries
  const officeInquiries = inquiriesList.filter((inq) => {
    const isOffice = inq.propertyType === 'office';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (inq.reference && inq.reference.toLowerCase().includes(q)) ||
      (inq.customerName && inq.customerName.toLowerCase().includes(q)) ||
      (inq.companyName && inq.companyName.toLowerCase().includes(q)) ||
      (inq.propertyName && inq.propertyName.toLowerCase().includes(q));
    const matchesStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
    return isOffice && matchesSearch && matchesStatus;
  });

  // Filter only commercial office listings
  const officeListings = rentalProps.filter((p) => {
    const isOffice = p.propertyType === 'office';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q));
    return isOffice && matchesSearch;
  });

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      await db.updatePropertyInquiryStatus(inquiryId, status, 'China Commercial Realty Desk', 'adm-001');
      showToast(`Commercial inquiry ${inquiryId} updated to ${status}!`, 'success');
      setInquiriesList(db.getPropertyInquiries());
    } catch (err: any) {
      showToast(err.message || 'Failed to update inquiry status', 'error');
    }
  };

  const handleAddOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingListing(true);
    try {
      const rentCNY = parseFloat(newRentCNY) || 15000;
      const propId = `prop-off-${Date.now().toString().slice(-4)}`;

      const newProp: RentalProperty = {
        id: propId,
        title: newTitle,
        chineseTitle: newZhTitle,
        propertyType: 'office',
        district: newDistrict,
        address: newAddress,
        chineseAddress: newZhAddress,
        monthlyRentCNY: rentCNY,
        monthlyRentUSD: Math.round(rentCNY / 7.24),
        depositMonths: 2,
        advanceRentMonths: 1,
        floorAreaSqm: parseFloat(newFloorArea) || 150,
        deskCapacity: parseInt(newDesks) || 20,
        isFurnished: true,
        images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'],
        amenities: ['Dedicated Fiber Internet', 'Boardroom Access', 'Receptionist', '24/7 Security Access', 'Underground Parking'],
        status: 'live',
        createdAt: Date.now()
      };

      await db.createRentalProperty(newProp, 'adm-001');
      showToast(`Commercial office "${newTitle}" published successfully!`, 'success');
      setShowAddModal(false);
      setRentalProps(db.getRentalProperties());
    } catch (err: any) {
      showToast(err.message || 'Failed to create commercial office listing', 'error');
    } finally {
      setIsAddingListing(false);
    }
  };

  return (
    <AdminLayout activeTab="rentals-offices">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Briefcase className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Commercial Office & Showroom Rentals
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guangzhou commercial offices, Canton Fair trade showrooms, and corporate lease viewing applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inquiries' ? 'bg-teal-600 text-white font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Viewing Inquiries ({officeInquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'listings' ? 'bg-teal-600 text-white font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              Office Catalog ({officeListings.length})
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Commercial Space</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === 'inquiries' ? "Search by company, applicant, reference..." : "Search by title, district..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
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
                      ? 'bg-teal-600 text-white font-bold shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Commercial Viewing Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-3">
            {officeInquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                No commercial office viewing requests found.
              </div>
            ) : (
              officeInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{inq.reference}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs font-bold text-white">{inq.propertyName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-teal-400 text-[10px] uppercase font-bold">
                          Commercial
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Company: <strong className="text-teal-400">{inq.companyName || 'Corporate Representative'}</strong> • Applicant: {inq.customerName} ({inq.customerPhone})
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Viewing Requested: <strong>{inq.preferredViewingDate || 'Immediate'}</strong>
                        <span> • Target Move-In: <strong>{inq.preferredMoveInDate || 'Flexible'}</strong></span>
                        <span> • Term: {inq.leaseDuration || '1 Year'}</span>
                        {inq.customNotes && <span> • Notes: "{inq.customNotes}"</span>}
                      </p>

                      {inq.ticketNumber && (
                        <p className="text-[10px] text-teal-300 font-mono">
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate('admin-support')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Open in Concierge Support"
                      >
                        <MessageSquare className="w-3 h-3 text-teal-400" />
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
                          Confirm Viewing
                        </button>
                      )}

                      {inq.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'closed')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Commercial Lease Closed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Commercial Office Catalog */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officeListings.map((prop) => (
              <div key={prop.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="h-36 rounded-2xl bg-slate-950 overflow-hidden relative">
                  <img src={prop.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white">
                    {prop.district} • {prop.floorAreaSqm} m²
                  </div>
                  <div className="absolute top-2 right-2 bg-teal-500 text-slate-950 px-2 py-0.5 rounded-lg text-[9px] font-black">
                    {prop.deskCapacity || 20}+ Desks
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{prop.title}</h4>
                  {prop.chineseTitle && <p className="text-[10px] text-slate-400">{prop.chineseTitle}</p>}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Commercial Rent:</span>
                  <span className="font-bold text-teal-400">¥{prop.monthlyRentCNY.toLocaleString()} CNY (~${prop.monthlyRentUSD})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Commercial Space Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Register Commercial Office / Showroom</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddOffice} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Office Title (English)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Chinese Title (Listing Header)</label>
                <input
                  type="text"
                  value={newZhTitle}
                  onChange={(e) => setNewZhTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Commercial Hub / District</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500"
                  >
                    <option value="Tianhe CBD">Tianhe CBD</option>
                    <option value="Pazhou">Pazhou Exhibition Zone</option>
                    <option value="Yuexiu">Yuexiu</option>
                    <option value="Haizhu">Haizhu</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Monthly Commercial Rent (CNY)</label>
                  <input
                    type="number"
                    value={newRentCNY}
                    onChange={(e) => setNewRentCNY(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Desk Capacity</label>
                  <input
                    type="number"
                    value={newDesks}
                    onChange={(e) => setNewDesks(e.target.value)}
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
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  {isAddingListing ? 'Publishing...' : 'Publish Commercial Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminRentalsOfficesScreen;
