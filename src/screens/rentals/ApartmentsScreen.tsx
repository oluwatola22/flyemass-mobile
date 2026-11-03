import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { RentalProperty } from '../../types';
import { 
  Home, 
  MapPin, 
  Search, 
  Info, 
  Send, 
  CheckCircle2, 
  Building, 
  Briefcase,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const ApartmentsScreen: React.FC = () => {
  const { navigate, userProfile, activeUserId, showToast } = useApp();

  const [rentalProps, setRentalProps] = useState<RentalProperty[]>(() => db.getRentalProperties());
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Inquiry Modal State
  const [selectedPropForInquiry, setSelectedPropForInquiry] = useState<RentalProperty | null>(null);
  const [applicantName, setApplicantName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || '+234 803 123 4567');
  const [preferredMoveIn, setPreferredMoveIn] = useState('2026-12-01');
  const [leaseDuration, setLeaseDuration] = useState('1 Year');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  const apartmentDistricts = ['All', 'Tianhe CBD', 'Yuexiu', 'Haizhu', 'Baiyun', 'Panyu', 'Liwan'];

  useEffect(() => {
    const updateData = () => {
      const rList = db.getRentalProperties();
      if (rList && rList.length > 0) setRentalProps(rList);
    };
    updateData();
    return db.subscribe(updateData);
  }, []);

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
        companyName: '',
        preferredMoveInDate: preferredMoveIn,
        preferredViewingDate: '',
        leaseDuration,
        customNotes: inquiryNotes
      });

      showToast(`Inquiry ${res.inquiry.reference} submitted! Created support ticket ${res.ticketNumber}.`, 'success');
      setSelectedPropForInquiry(null);
      setInquiryNotes('');
      navigate('support-tickets');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Apartments & House Rentals" />

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
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
            <Home className="w-3.5 h-3.5" />
            <span>Apartments & Houses</span>
          </span>
          <button
            onClick={() => navigate('rentals-offices')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Commercial Offices</span>
          </button>
        </div>

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

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tianhe CBD, Yuexiu, Haizhu apartments..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
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
              No residential apartments found in {selectedDistrict}.
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

      {/* Inquiry Modal */}
      {selectedPropForInquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Residential Apartment Inquiry</h3>
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

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
              No wallet deduction will occur in the app. Your dedicated China Desk representative will contact you to coordinate property inspection and lease agreements.
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
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Lease Duration</label>
                  <select
                    value={leaseDuration}
                    onChange={(e) => setLeaseDuration(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                  </select>
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
export default ApartmentsScreen;
