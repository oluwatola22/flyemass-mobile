import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { RentalProperty } from '../../types';
import { 
  Briefcase, 
  MapPin, 
  Search, 
  Info, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Building, 
  Home,
  Users,
  Layers,
  ArrowRight
} from 'lucide-react';

export const OfficeRentalsScreen: React.FC = () => {
  const { navigate, userProfile, activeUserId, showToast } = useApp();

  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Commercial Viewing Modal State
  const [selectedOfficeForViewing, setSelectedOfficeForViewing] = useState<RentalProperty | null>(null);
  const [applicantName, setApplicantName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || '+234 803 123 4567');
  const [companyName, setCompanyName] = useState('Alade International Trading Ltd');
  const [preferredViewing, setPreferredViewing] = useState('2026-11-15');
  const [preferredMoveIn, setPreferredMoveIn] = useState('2026-12-01');
  const [leaseDuration, setLeaseDuration] = useState('1 Year');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmittingViewing, setIsSubmittingViewing] = useState(false);

  const officeDistricts = ['All', 'Tianhe CBD', 'Yuexiu', 'Haizhu', 'Pazhou'];

  useEffect(() => {
    const updateData = () => {
      const rList = db.getRentalProperties();
      if (rList && rList.length > 0) setRentalProps(rList);
    };
    updateData();
    return db.subscribe(updateData);
  }, []);

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

  const handleViewingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeForViewing) return;

    setIsSubmittingViewing(true);
    try {
      const res = await db.createPropertyInquiry({
        userId: activeUserId,
        propertyId: selectedOfficeForViewing.id,
        customerName: applicantName,
        customerPhone: applicantPhone,
        companyName,
        preferredMoveInDate: preferredMoveIn,
        preferredViewingDate: preferredViewing,
        leaseDuration,
        customNotes: inquiryNotes
      });

      showToast(`Viewing request ${res.inquiry.reference} scheduled! Support ticket ${res.ticketNumber} created.`, 'success');
      setSelectedOfficeForViewing(null);
      setInquiryNotes('');
      navigate('support-tickets');
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule viewing', 'error');
    } finally {
      setIsSubmittingViewing(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Commercial Office Rentals" />

      <div className="p-4 space-y-4">
        {/* Navigation Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            onClick={() => navigate('hotels')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Switch to Hotels & BNBs</span>
          </button>
          <button
            onClick={() => navigate('rentals-apartments')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Residential Apartments</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Commercial Offices</span>
          </span>
        </div>

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

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Guangzhou commercial offices, Pazhou..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
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
              No commercial office spaces found in {selectedDistrict}.
            </div>
          ) : (
            filteredOffices.map((office) => (
              <div
                key={office.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
              >
                {/* Photo */}
                <div className="relative h-44 w-full bg-slate-950">
                  <img
                    src={office.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                    alt={office.title || 'Commercial Office'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-slate-800">
                    {office.district || 'Guangzhou'} • {office.floorAreaSqm || 120} m²
                  </div>

                  <div className="absolute top-3 right-3 bg-teal-500/90 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-950">
                    {office.deskCapacity || 10}+ Workstations
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-sm font-bold text-white leading-tight">{office.title || 'Guangzhou Commercial Office'}</h3>
                    {office.chineseTitle && <p className="text-[11px] text-slate-300 font-sans mt-0.5">{office.chineseTitle}</p>}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">{office.address || office.englishAddress || office.district}</span>
                  </div>

                  {/* Commercial Amenities */}
                  {(office.amenities || []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {(office.amenities || []).slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Commercial Rent Box */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Commercial Rent</span>
                      <span className="text-base font-extrabold text-white num-tabular">
                        ¥{office.monthlyRentCNY.toLocaleString()} CNY <span className="text-xs text-slate-400 font-normal">(~${office.monthlyRentUSD} USD)</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lease Terms</span>
                      <span className="text-xs text-teal-400 font-bold">Annual / Multi-Year</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOfficeForViewing(office)}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Commercial Viewing & Inquire</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Commercial Viewing Modal */}
      {selectedOfficeForViewing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Commercial Office Viewing Request</h3>
                  <p className="text-[10px] text-slate-400">{selectedOfficeForViewing.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfficeForViewing(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
              Commercial viewings are coordinated directly with building administration by the FlyeMass China Trade Concierge.
            </div>

            <form onSubmit={handleViewingSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Company / Representative Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preferred Viewing Date</label>
                  <input
                    type="date"
                    value={preferredViewing}
                    onChange={(e) => setPreferredViewing(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

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
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Commercial Requirements / Notes</label>
                <textarea
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="Need boardroom access, high-speed fiber internet, showroom area, 24/7 HVAC, etc."
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfficeForViewing(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingViewing}
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  {isSubmittingViewing ? 'Submitting...' : 'Schedule Viewing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OfficeRentalsScreen;
