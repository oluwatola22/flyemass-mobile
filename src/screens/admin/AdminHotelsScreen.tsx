import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { Hotel, HotelRoomType, RentalProperty, PropertyInquiry } from '../../types';
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
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  Power,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Phone,
  MessageSquare,
  AlertTriangle,
  QrCode,
  FileText
} from 'lucide-react';

const STANDARD_AMENITIES = [
  'Free Wi-Fi',
  'Breakfast included',
  'Air conditioning',
  'Airport shuttle',
  'Elevator',
  '24/7 reception',
  'Laundry service',
  'Gym',
  'Swimming pool',
  'Restaurant',
  'Parking',
  'English-speaking staff'
];

const RENTAL_AMENITIES = [
  'Metro Direct Access',
  '24/7 Security & CCTV',
  'Elevator Access',
  'Central Air Conditioning',
  'High-Speed Fiber Internet',
  'Executive Meeting Room',
  'Dedicated Parking Space',
  'Fitness Gym & Club',
  'Balcony / Skyline View',
  'Full Kitchenette / Pantry',
  'Furnished Desks & Chairs',
  'Reception & Mail Handling'
];

export const AdminHotelsScreen: React.FC = () => {
  const { showToast, navigate } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());

  // Active Tab matching Screenshot 1
  const [activeTab, setActiveTab] = useState<'hotels' | 'bookings' | 'rentals' | 'inquiries'>('hotels');

  // Search & Filter States
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [rentalSearchQuery, setRentalSearchQuery] = useState('');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('all');
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');

  // ==========================================
  // HOTEL DRAWER STATE (Screenshots 2 & 3)
  // ==========================================
  const [showHotelDrawer, setShowHotelDrawer] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelTitle, setHotelTitle] = useState('');
  const [hotelCity, setHotelCity] = useState('Guangzhou');
  const [hotelAddressEng, setHotelAddressEng] = useState('');
  const [hotelAddressZh, setHotelAddressZh] = useState('');
  const [hotelDescription, setHotelDescription] = useState('');
  const [hotelStarRating, setHotelStarRating] = useState('4.5');
  const [hotelAvailable, setHotelAvailable] = useState(true);

  // Nightly Pricing
  const [priceUSD, setPriceUSD] = useState('');
  const [priceCNY, setPriceCNY] = useState('');
  const [priceNGN, setPriceNGN] = useState('');

  // Room Types
  const [roomTypes, setRoomTypes] = useState<Array<{ name: string; surcharge: number; isAvailable?: boolean }>>([
    { name: '', surcharge: 0, isAvailable: true }
  ]);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Photos
  const [hotelPhotos, setHotelPhotos] = useState<string[]>([]);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [isSubmittingHotel, setIsSubmittingHotel] = useState(false);

  // ==========================================
  // RENTAL PROPERTY DRAWER STATE
  // ==========================================
  const [showRentalDrawer, setShowRentalDrawer] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [rentalTitle, setRentalTitle] = useState('');
  const [rentalZhTitle, setRentalZhTitle] = useState('');
  const [rentalType, setRentalType] = useState<'apartment' | 'house' | 'office'>('apartment');
  const [rentalCity, setRentalCity] = useState('Guangzhou');
  const [rentalDistrict, setRentalDistrict] = useState('Tianhe CBD');
  const [rentalAddressEng, setRentalAddressEng] = useState('');
  const [rentalAddressZh, setRentalAddressZh] = useState('');
  const [rentalDescription, setRentalDescription] = useState('');
  const [rentalRentUSD, setRentalRentUSD] = useState('950');
  const [rentalRentCNY, setRentalRentCNY] = useState('6800');
  const [rentalRentNGN, setRentalRentNGN] = useState('1450000');
  const [rentalDepositMonths, setRentalDepositMonths] = useState('2');
  const [rentalAdvanceMonths, setRentalAdvanceMonths] = useState('1');
  const [rentalFloorArea, setRentalFloorArea] = useState('120');
  const [rentalBedrooms, setRentalBedrooms] = useState('3');
  const [rentalFurnished, setRentalFurnished] = useState<'Furnished' | 'Unfurnished' | 'Semi-Furnished'>('Furnished');
  const [rentalAmenities, setRentalAmenities] = useState<string[]>([
    'Metro Direct Access',
    '24/7 Security & CCTV',
    'Elevator Access',
    'High-Speed Fiber Internet'
  ]);
  const [rentalPhotos, setRentalPhotos] = useState<string[]>([]);
  const [rentalAvailable, setRentalAvailable] = useState(true);
  const [isSubmittingRental, setIsSubmittingRental] = useState(false);

  // ==========================================
  // INQUIRY REVIEW DRAWER STATE
  // ==========================================
  const [reviewDrawerInquiry, setReviewDrawerInquiry] = useState<PropertyInquiry | null>(null);
  const [inquiryStatusInput, setInquiryStatusInput] = useState<string>('new');
  const [inquiryAssignedStaff, setInquiryAssignedStaff] = useState<string>('');
  const [inquiryAdminNotes, setInquiryAdminNotes] = useState<string>('');
  const [isUpdatingInquiry, setIsUpdatingInquiry] = useState(false);

  // ==========================================
  // BOOKING VOUCHER MODAL STATE
  // ==========================================
  const [voucherModalBooking, setVoucherModalBooking] = useState<any | null>(null);

  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
  }, []);

  const dbState = db.getState();

  // 1. HOTELS LIST & METRICS
  const hotelsList: Hotel[] = Object.values(dbState.hotels || {});
  const totalHotelsCount = hotelsList.length;
  const liveHotelsCount = hotelsList.filter(h => h.isPublished !== false).length;
  const soldOutHotelsCount = hotelsList.filter(h => h.isPublished === false).length;
  const citiesCoveredCount = new Set(hotelsList.map(h => (h.city || '').trim()).filter(Boolean)).size;

  const filteredHotels = hotelsList.filter(h => {
    if (!hotelSearchQuery.trim()) return true;
    const q = hotelSearchQuery.toLowerCase();
    const name = (h.name || '').toLowerCase();
    const zh = (h.chineseName || '').toLowerCase();
    const city = (h.city || '').toLowerCase();
    const district = (h.district || '').toLowerCase();
    return name.includes(q) || zh.includes(q) || city.includes(q) || district.includes(q);
  });

  // 2. BOOKINGS LIST & METRICS
  const bookingsList: any[] = Object.values(dbState.hotel_bookings || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const totalBookingsCount = bookingsList.length;
  const confirmedBookingsCount = bookingsList.filter(b => b.status === 'confirmed').length;
  const checkedInBookingsCount = bookingsList.filter(b => b.status === 'checked_in' || b.status === 'checked-in').length;
  const completedBookingsCount = bookingsList.filter(b => b.status === 'completed').length;
  const cancelledBookingsCount = bookingsList.filter(b => b.status === 'cancelled').length;

  const revenueUSD = bookingsList.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (Number(b.totalUSD) || 0), 0);

  const filteredBookings = bookingsList.filter(b => {
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
    if (!bookingSearchQuery.trim()) return true;
    const q = bookingSearchQuery.toLowerCase();
    const ref = (b.reference || b.id || '').toLowerCase();
    const guest = (b.guestName || '').toLowerCase();
    const email = (b.guestEmail || '').toLowerCase();
    const hotel = (b.hotelName || '').toLowerCase();
    return ref.includes(q) || guest.includes(q) || email.includes(q) || hotel.includes(q);
  });

  // 3. RENTALS LIST & METRICS
  const rentalsList: RentalProperty[] = Object.values(dbState.rental_properties || {});
  const totalRentalsCount = rentalsList.length;
  const liveRentalsCount = rentalsList.filter(r => r.status === 'live').length;
  const rentedRentalsCount = rentalsList.filter(r => r.status === 'rented').length;
  const rentalDistrictsCount = new Set(rentalsList.map(r => r.district).filter(Boolean)).size;

  const filteredRentals = rentalsList.filter(r => {
    if (rentalTypeFilter !== 'all' && r.propertyType !== rentalTypeFilter) return false;
    if (!rentalSearchQuery.trim()) return true;
    const q = rentalSearchQuery.toLowerCase();
    const title = (r.title || '').toLowerCase();
    const zh = (r.chineseTitle || '').toLowerCase();
    const district = (r.district || '').toLowerCase();
    const address = (r.englishAddress || r.address || '').toLowerCase();
    return title.includes(q) || zh.includes(q) || district.includes(q) || address.includes(q);
  });

  // 4. INQUIRIES LIST & METRICS
  const inquiriesList: PropertyInquiry[] = Object.values(dbState.property_inquiries || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const totalInquiriesCount = inquiriesList.length;
  const newInquiriesCount = inquiriesList.filter(i => i.status === 'new').length;
  const viewingScheduledCount = inquiriesList.filter(i => i.status === 'viewing_scheduled').length;
  const agreementInProgressCount = inquiriesList.filter(i => i.status === 'agreement_in_progress').length;

  const filteredInquiries = inquiriesList.filter(i => {
    if (inquiryStatusFilter !== 'all' && i.status !== inquiryStatusFilter) return false;
    if (!inquirySearchQuery.trim()) return true;
    const q = inquirySearchQuery.toLowerCase();
    const ref = (i.reference || i.id || '').toLowerCase();
    const name = (i.customerName || '').toLowerCase();
    const phone = (i.customerPhone || '').toLowerCase();
    const company = (i.companyName || '').toLowerCase();
    const prop = (i.propertyName || i.propertyTitle || '').toLowerCase();
    return ref.includes(q) || name.includes(q) || phone.includes(q) || company.includes(q) || prop.includes(q);
  });

  // ==========================================
  // HOTEL ACTIONS
  // ==========================================
  const handleOpenNewHotelDrawer = () => {
    setEditingHotelId(null);
    setHotelTitle('');
    setHotelCity('Guangzhou');
    setHotelAddressEng('');
    setHotelAddressZh('');
    setHotelDescription('');
    setHotelStarRating('4.5');
    setHotelAvailable(true);
    setPriceUSD('');
    setPriceCNY('');
    setPriceNGN('');
    setRoomTypes([
      { name: '', surcharge: 0, isAvailable: true }
    ]);
    setSelectedAmenities([]);
    setHotelPhotos([]);
    setShowHotelDrawer(true);
  };

  const handleEditHotel = (h: Hotel) => {
    setEditingHotelId(h.id);
    setHotelTitle(h.name);
    setHotelCity(h.city || 'Guangzhou');
    setHotelAddressEng(h.englishAddress || '');
    setHotelAddressZh(h.chineseAddress || '');
    setHotelDescription(h.description || '');
    setHotelStarRating(String(h.rating || 4.5));
    setHotelAvailable(h.isPublished !== false);
    setPriceUSD(h.pricePerNightUSD ? String(h.pricePerNightUSD) : '');
    setPriceCNY(h.pricePerNightCNY ? String(h.pricePerNightCNY) : '');
    setPriceNGN(h.pricePerNightNGN ? String(h.pricePerNightNGN) : '');
    
    if (h.roomTypes && h.roomTypes.length > 0) {
      setRoomTypes(h.roomTypes.map(r => ({
        name: r.name,
        surcharge: r.nightlySurchargeUSD || 0,
        isAvailable: (r as any).isAvailable !== false
      })));
    } else {
      setRoomTypes([{ name: h.roomType || 'Standard Room', surcharge: 0, isAvailable: true }]);
    }

    setSelectedAmenities(Array.isArray(h.amenities) && h.amenities.length > 0 ? h.amenities : STANDARD_AMENITIES.slice(0, 4));
    setHotelPhotos(Array.isArray(h.images) && h.images.length > 0 ? h.images : (h.image ? [h.image] : []));
    setShowHotelDrawer(true);
  };

  const handleToggleHotelStatus = async (hotel: Hotel) => {
    try {
      await db.toggleHotelStatus(hotel.id, 'adm-001');
      showToast(`Hotel ${hotel.name} status updated!`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to toggle hotel status', 'error');
    }
  };

  const handleDeleteHotel = async (hotel: Hotel) => {
    if (!window.confirm(`Are you sure you want to permanently delete hotel listing "${hotel.name}"?`)) return;
    try {
      await db.deleteHotel(hotel.id, 'adm-001');
      showToast(`Hotel listing "${hotel.name}" deleted successfully.`, 'info');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to delete hotel', 'error');
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddRoomType = () => {
    setRoomTypes(prev => [...prev, { name: '', surcharge: 0 }]);
  };

  const handleUpdateRoomType = (index: number, field: 'name' | 'surcharge', value: any) => {
    setRoomTypes(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleRemoveRoomType = (index: number) => {
    if (roomTypes.length <= 1) {
      showToast('Hotel must have at least one room type', 'error');
      return;
    }
    setRoomTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 8 * 1024 * 1024) {
        showToast(`File ${file.name} exceeds 8MB limit`, 'error');
        continue;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHotelPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    showToast(`Added ${files.length} photo(s)`, 'success');
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrlInput.trim()) return;
    setHotelPhotos(prev => [...prev, newPhotoUrlInput.trim()]);
    setNewPhotoUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setHotelPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublishHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelTitle.trim()) {
      showToast('Property title is required', 'error');
      return;
    }

    const usdVal = parseFloat(priceUSD) || 0;
    const cnyVal = parseFloat(priceCNY) || 0;
    const ngnVal = parseFloat(priceNGN) || 0;

    if (usdVal <= 0 && cnyVal <= 0 && ngnVal <= 0) {
      showToast('At least one currency price must be greater than zero', 'error');
      return;
    }

    const validRooms: HotelRoomType[] = roomTypes
      .filter(r => r.name.trim().length > 0)
      .map((r, i) => ({
        id: `rm-${i + 1}`,
        name: r.name.trim(),
        nightlySurchargeUSD: Number(r.surcharge) || 0,
        maxGuests: 2,
        description: `${r.name} with modern amenities and high-speed Wi-Fi`,
        amenities: selectedAmenities.slice(0, 3),
        isAvailable: (r as any).isAvailable !== false
      } as any));

    if (validRooms.length === 0) {
      showToast('Please provide at least one valid room type name', 'error');
      return;
    }

    setIsSubmittingHotel(true);
    try {
      const hotelId = editingHotelId || `hotel-${hotelCity.toLowerCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
      const hotelPayload: Hotel = {
        id: hotelId,
        name: hotelTitle.trim(),
        chineseName: hotelAddressZh ? hotelTitle.trim() : hotelTitle.trim(),
        city: hotelCity,
        district: `${hotelCity} Commercial Center`,
        englishAddress: hotelAddressEng.trim() || `${hotelCity}, China`,
        chineseAddress: hotelAddressZh.trim() || `${hotelCity}市`,
        description: hotelDescription.trim() || `Premier partner accommodation in ${hotelCity}.`,
        pricePerNightUSD: usdVal,
        pricePerNightCNY: cnyVal,
        pricePerNightNGN: ngnVal,
        priceUSD: usdVal,
        priceCNY: cnyVal,
        priceNGN: ngnVal,
        rating: parseFloat(hotelStarRating) || 4.5,
        reviewsCount: editingHotelId ? (dbState.hotels?.[editingHotelId]?.reviewsCount || 180) : 120,
        image: hotelPhotos[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
        images: hotelPhotos.length > 0 ? hotelPhotos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        tags: ['Business Partner', 'English Concierge', 'Executive Desk'],
        distanceToMarket: 'Close to transit & trade centers',
        amenities: selectedAmenities,
        roomType: validRooms[0].name,
        roomTypes: validRooms,
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable after check-in date.',
        isPublished: hotelAvailable,
        taxiCardZh: hotelAddressZh ? `师傅，请带我去：${hotelTitle}（${hotelAddressZh}）。谢谢！` : `请带我去：${hotelTitle}。谢谢！`
      };

      await db.createHotel(hotelPayload, 'adm-001');
      showToast(`Hotel listing "${hotelTitle}" ${editingHotelId ? 'updated' : 'published'} successfully!`, 'success');
      setShowHotelDrawer(false);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to publish hotel listing', 'error');
    } finally {
      setIsSubmittingHotel(false);
    }
  };

  // ==========================================
  // BOOKING ACTIONS
  // ==========================================
  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await db.updateHotelBookingStatus(bookingId, status, 'Updated by Stays Operations Desk', 'adm-001');
      showToast(`Booking ${bookingId} status updated to ${status.toUpperCase()}!`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to update booking status', 'error');
    }
  };

  const handleCancelAndRefundBooking = async (b: any) => {
    if (!window.confirm(`Cancel booking ${b.reference || b.id} and refund ${b.currency || 'USD'} ${(b.amountDebited || b.totalUSD)?.toLocaleString()} back to customer wallet?`)) return;
    try {
      await db.cancelHotelBooking(b.id, b.userId, 'Cancelled by Admin Stays Desk with full refund');
      showToast(`Booking cancelled. Funds refunded to customer wallet with balanced double-entry ledger.`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel booking', 'error');
    }
  };

  // ==========================================
  // RENTAL ACTIONS
  // ==========================================
  const handleOpenNewRentalDrawer = () => {
    setEditingRentalId(null);
    setRentalTitle('');
    setRentalZhTitle('');
    setRentalType('apartment');
    setRentalCity('Guangzhou');
    setRentalDistrict('Tianhe CBD');
    setRentalAddressEng('');
    setRentalAddressZh('');
    setRentalDescription('');
    setRentalRentUSD('950');
    setRentalRentCNY('6800');
    setRentalRentNGN('1450000');
    setRentalDepositMonths('2');
    setRentalAdvanceMonths('1');
    setRentalFloorArea('120');
    setRentalBedrooms('3');
    setRentalFurnished('Furnished');
    setRentalAmenities([
      'Metro Direct Access',
      '24/7 Security & CCTV',
      'Elevator Access',
      'High-Speed Fiber Internet'
    ]);
    setRentalPhotos(['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']);
    setRentalAvailable(true);
    setShowRentalDrawer(true);
  };

  const handleEditRental = (r: RentalProperty) => {
    setEditingRentalId(r.id);
    setRentalTitle(r.title);
    setRentalZhTitle(r.chineseTitle || '');
    setRentalType(r.propertyType);
    setRentalCity(r.city || 'Guangzhou');
    setRentalDistrict(r.district || 'Tianhe CBD');
    setRentalAddressEng(r.englishAddress || r.address || '');
    setRentalAddressZh(r.chineseAddress || '');
    setRentalDescription(r.description || '');
    setRentalRentUSD(r.monthlyRentUSD ? String(r.monthlyRentUSD) : '950');
    setRentalRentCNY(r.monthlyRentCNY ? String(r.monthlyRentCNY) : '6800');
    setRentalRentNGN(r.estimatedRentNGN ? String(r.estimatedRentNGN) : '1450000');
    setRentalDepositMonths(String(r.depositMonths || 2));
    setRentalAdvanceMonths(String(r.advanceRentMonths || 1));
    setRentalFloorArea(String(r.floorAreaSqm || 120));
    setRentalBedrooms(String(r.bedrooms || 3));
    setRentalFurnished(r.furnishedStatus || 'Furnished');
    setRentalAmenities(r.amenities || RENTAL_AMENITIES.slice(0, 4));
    setRentalPhotos(r.images && r.images.length > 0 ? r.images : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80']);
    setRentalAvailable(r.status === 'live');
    setShowRentalDrawer(true);
  };

  const handleToggleRentalStatus = async (r: RentalProperty) => {
    try {
      await db.toggleRentalPropertyStatus(r.id, undefined, 'adm-001');
      showToast(`Property "${r.title}" status toggled!`, 'success');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteRental = async (r: RentalProperty) => {
    if (!window.confirm(`Permanently delete rental property "${r.title}"?`)) return;
    try {
      await db.deleteRentalProperty(r.id, 'adm-001');
      showToast(`Rental property "${r.title}" deleted.`, 'info');
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to delete property', 'error');
    }
  };

  const handlePublishRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalTitle.trim()) {
      showToast('Property title is required', 'error');
      return;
    }
    setIsSubmittingRental(true);
    try {
      const propId = editingRentalId || `prop_${Date.now()}`;
      const payload: RentalProperty = {
        id: propId,
        title: rentalTitle.trim(),
        chineseTitle: rentalZhTitle.trim() || rentalTitle.trim(),
        propertyType: rentalType,
        city: rentalCity,
        district: rentalDistrict,
        englishAddress: rentalAddressEng.trim() || `${rentalDistrict}, ${rentalCity}, China`,
        chineseAddress: rentalAddressZh.trim() || `${rentalCity}市${rentalDistrict}`,
        monthlyRentCNY: parseFloat(rentalRentCNY) || 6800,
        monthlyRentUSD: parseFloat(rentalRentUSD) || 950,
        estimatedRentNGN: parseFloat(rentalRentNGN) || 1450000,
        depositMonths: parseInt(rentalDepositMonths) || 2,
        advanceRentMonths: parseInt(rentalAdvanceMonths) || 1,
        floorAreaSqm: parseFloat(rentalFloorArea) || 120,
        bedrooms: parseInt(rentalBedrooms) || 3,
        furnishedStatus: rentalFurnished,
        isFurnished: rentalFurnished !== 'Unfurnished',
        amenities: rentalAmenities,
        images: rentalPhotos.length > 0 ? rentalPhotos : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        status: rentalAvailable ? 'live' : 'hidden',
        description: rentalDescription.trim() || `Prime ${rentalType} in ${rentalDistrict}.`,
        createdAt: editingRentalId ? (dbState.rental_properties?.[editingRentalId]?.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
      };

      await db.createRentalProperty(payload, 'adm-001');
      showToast(`Rental listing "${rentalTitle}" ${editingRentalId ? 'updated' : 'published'} successfully!`, 'success');
      setShowRentalDrawer(false);
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to save rental property', 'error');
    } finally {
      setIsSubmittingRental(false);
    }
  };

  // ==========================================
  // INQUIRY ACTIONS
  // ==========================================
  const handleOpenReviewInquiry = (inq: PropertyInquiry) => {
    setReviewDrawerInquiry(inq);
    setInquiryStatusInput(inq.status || 'new');
    setInquiryAssignedStaff(inq.assignedStaff || 'China Real Estate Desk');
    setInquiryAdminNotes(inq.adminNotes || '');
  };

  const handleSaveInquiryUpdates = async () => {
    if (!reviewDrawerInquiry) return;
    setIsUpdatingInquiry(true);
    try {
      await db.updatePropertyInquiryStatus(
        reviewDrawerInquiry.id,
        inquiryStatusInput,
        inquiryAdminNotes,
        inquiryAssignedStaff,
        'adm-001'
      );
      showToast(`Inquiry #${reviewDrawerInquiry.reference} updated to ${inquiryStatusInput.toUpperCase()}!`, 'success');
      setReviewDrawerInquiry(null);
      setDbRev(db.getStateRevision());
    } catch (e: any) {
      showToast(e.message || 'Failed to update inquiry', 'error');
    } finally {
      setIsUpdatingInquiry(false);
    }
  };

  return (
    <AdminLayout activeTab="hotels">
      <div className="space-y-6">
        {/* Header matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">China Stays</h1>
            <p className="text-sm text-slate-500 mt-1">
              Publish hotels, Guangzhou apartments and offices, and follow up on bookings and rental enquiries.
            </p>
          </div>
        </div>

        {/* 4 Tabs Matching Screenshot 1 */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 border border-slate-300/60 shadow-inner">
          <button
            onClick={() => setActiveTab('hotels')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hotels'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage hotels
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Booking queue
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rentals'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Apartments & offices
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rental enquiries
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: MANAGE HOTELS (Matching Screenshot 1) */}
        {/* ======================================================== */}
        {activeTab === 'hotels' && (
          <div className="space-y-6">
            {/* 4 Operational Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    TOTAL LISTINGS
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{totalHotelsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100">
                  <HotelIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    LIVE NOW
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{liveHotelsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <Power className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    SOLD OUT
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{soldOutHotelsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
                  <X className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    CITIES COVERED
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{citiesCoveredCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={hotelSearchQuery}
                  onChange={(e) => setHotelSearchQuery(e.target.value)}
                  placeholder="Search title or city"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 shadow-sm"
                />
              </div>

              <button
                onClick={handleOpenNewHotelDrawer}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New listing</span>
              </button>
            </div>

            {/* Hotel Listings Table matching Screenshot 1 */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-5">Property</th>
                    <th className="py-3.5 px-5">City</th>
                    <th className="py-3.5 px-5">Nightly (RMB / NGN)</th>
                    <th className="py-3.5 px-5">Rooms</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHotels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No hotel listings found matching your search. Click "+ New listing" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredHotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Property Image & Title */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={hotel.image || (hotel.images && hotel.images[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80'}
                              alt={hotel.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80';
                              }}
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {hotel.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-medium">
                                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {hotel.rating || 4.5}
                                </span>
                                <span>•</span>
                                <span>{(hotel.images?.length || (hotel.image ? 1 : 0)) || 1} photos</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* City */}
                        <td className="py-3.5 px-5 font-medium text-slate-700">
                          {hotel.city}
                        </td>

                        {/* Nightly Prices */}
                        <td className="py-3.5 px-5 font-mono text-slate-700 font-semibold text-[11px]">
                          ¥{hotel.pricePerNightCNY?.toFixed(2)} RMB • ₦{hotel.pricePerNightNGN ? hotel.pricePerNightNGN.toLocaleString() + '.00' : Math.round((hotel.pricePerNightUSD || 45) * 1600).toLocaleString() + '.00'}
                        </td>

                        {/* Rooms Count */}
                        <td className="py-3.5 px-5 font-medium text-slate-700">
                          {hotel.roomTypes?.length || 1}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          {hotel.isPublished !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              LIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              UNPUBLISHED
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleHotelStatus(hotel)}
                              title={hotel.isPublished !== false ? 'Unpublish listing' : 'Publish listing'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                hotel.isPublished !== false
                                  ? 'text-emerald-500 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditHotel(hotel)}
                              title="Edit listing"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteHotel(hotel)}
                              title="Delete listing"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BOOKING QUEUE */}
        {/* ======================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Operational Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Bookings</span>
                <span className="text-2xl font-black text-slate-900 mt-1">{totalBookingsCount}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Hotel reservation ledger</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Confirmed</span>
                <span className="text-2xl font-black text-emerald-600 mt-1">{confirmedBookingsCount}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Paid & upcoming</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Checked-In</span>
                <span className="text-2xl font-black text-blue-600 mt-1">{checkedInBookingsCount}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Active guests</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Completed</span>
                <span className="text-2xl font-black text-purple-600 mt-1">{completedBookingsCount}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Bookings settled</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Revenue</span>
                <span className="text-xl font-black text-slate-900 font-mono mt-1">¥{Math.round(revenueUSD * 7.24).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">≈ ₦{Math.round(revenueUSD * 1485).toLocaleString()} NGN</span>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  placeholder="Search guest, booking ref, hotel..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 shadow-sm"
                />
              </div>

              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                {['all', 'confirmed', 'checked_in', 'completed', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                      bookingStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">Guest Profile</th>
                    <th className="py-3.5 px-4">Hotel & Room</th>
                    <th className="py-3.5 px-4">Dates & Stay</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No customer hotel bookings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {bk.reference || bk.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Code: {bk.confirmationCode || 'CONF-OK'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {bk.guestName || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bk.guestPhone || bk.guestEmail}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {bk.hotelName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {bk.roomType || 'Standard Room'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-700">
                            {bk.checkIn} → {bk.checkOut}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bk.nights} nights • {bk.guestCount || 1} guest(s)
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-emerald-600">
                            {bk.currency === 'NGN' ? '₦' : bk.currency === 'CNY' ? '¥' : '$'}
                            {(bk.amountDebited || bk.totalUSD)?.toLocaleString()} {bk.currency || 'USD'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Booking Confirmed
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            bk.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : bk.status === 'checked_in'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : bk.status === 'completed'
                              ? 'bg-purple-50 text-purple-600 border border-purple-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                            {bk.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {bk.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'checked_in')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Check-in
                              </button>
                            )}

                            {bk.status === 'checked_in' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'completed')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Complete Stay
                              </button>
                            )}

                            {bk.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancelAndRefundBooking(bk)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Cancel & Refund
                              </button>
                            )}

                            <button
                              onClick={() => setVoucherModalBooking(bk)}
                              title="View Bilingual Voucher & Taxi Card"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: APARTMENTS & OFFICES */}
        {/* ======================================================== */}
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            {/* 4 Operational Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    TOTAL LISTINGS
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{totalRentalsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100">
                  <Home className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    AVAILABLE NOW
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{liveRentalsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    RENTED / OCCUPIED
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{rentedRentalsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    DISTRICTS COVERED
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{rentalDistrictsCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-500 border border-teal-100">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={rentalSearchQuery}
                    onChange={(e) => setRentalSearchQuery(e.target.value)}
                    placeholder="Search property, address, district..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 shadow-sm"
                  />
                </div>

                <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                  {['all', 'apartment', 'house', 'office'].map(t => (
                    <button
                      key={t}
                      onClick={() => setRentalTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                        rentalTypeFilter === t
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t === 'all' ? 'All Types' : t + 's'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenNewRentalDrawer}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New rental property</span>
              </button>
            </div>

            {/* Rentals Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-5">Property</th>
                    <th className="py-3.5 px-5">Type & District</th>
                    <th className="py-3.5 px-5">Monthly Rent (RMB / NGN)</th>
                    <th className="py-3.5 px-5">Area & Specs</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRentals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No apartments, houses, or offices found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRentals.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={(r.images && r.images[0]) || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=120&q=80'}
                              alt={r.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {r.title}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {r.chineseTitle || r.englishAddress}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-0.5 ${
                            r.propertyType === 'office'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {r.propertyType}
                          </span>
                          <div className="text-slate-600 font-medium text-[11px]">
                            {r.district}, {r.city || 'Guangzhou'}
                          </div>
                        </td>

                        <td className="py-3.5 px-5 font-mono text-slate-700 font-semibold text-[11px]">
                          ¥{r.monthlyRentCNY?.toLocaleString()} RMB • ₦{r.estimatedRentNGN?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900">
                            {r.floorAreaSqm} sqm
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.propertyType === 'office' ? `${r.deskCapacity || 20} Desks` : `${r.bedrooms || 2} Bedrooms`} • {r.furnishedStatus || 'Furnished'}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1.5 ${
                            r.status === 'live'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : r.status === 'rented'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'live' ? 'bg-emerald-500' : r.status === 'rented' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {r.status || 'live'}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleRentalStatus(r)}
                              title={r.status === 'live' ? 'Hide property' : 'Publish property'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                r.status === 'live'
                                  ? 'text-emerald-500 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditRental(r)}
                              title="Edit rental property"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteRental(r)}
                              title="Delete rental property"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RENTAL ENQUIRIES */}
        {/* ======================================================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            {/* Operational Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    TOTAL INQUIRIES
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{totalInquiriesCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    NEW REQUESTS
                  </span>
                  <div className="text-3xl font-black text-amber-500 mt-1">{newInquiriesCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    VIEWINGS SCHEDULED
                  </span>
                  <div className="text-3xl font-black text-blue-600 mt-1">{viewingScheduledCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    IN PROGRESS
                  </span>
                  <div className="text-3xl font-black text-emerald-600 mt-1">{agreementInProgressCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inquirySearchQuery}
                  onChange={(e) => setInquirySearchQuery(e.target.value)}
                  placeholder="Search client, property, phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 shadow-sm"
                />
              </div>

              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold overflow-x-auto">
                {['all', 'new', 'contacted', 'viewing_scheduled', 'agreement_in_progress', 'closed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setInquiryStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all cursor-pointer ${
                      inquiryStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-4">Inquiry Ref</th>
                    <th className="py-3.5 px-4">Client Profile</th>
                    <th className="py-3.5 px-4">Requested Property</th>
                    <th className="py-3.5 px-4">Dates & Move-in</th>
                    <th className="py-3.5 px-4">Assigned Staff</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No property rental inquiries recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {inq.reference || inq.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ticket: {inq.ticketNumber || 'FM-RNT'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {inq.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {inq.customerPhone} {inq.companyName && `• ${inq.companyName}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {inq.propertyName || inq.propertyTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            {inq.propertyType} • {inq.district}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-700">
                            Move-in: {inq.preferredMoveInDate || 'Flexible'}
                          </div>
                          {inq.preferredViewingDate && (
                            <div className="text-[11px] text-blue-600 font-medium">
                              Viewing: {inq.preferredViewingDate}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium text-[11px]">
                          {inq.assignedStaff || 'China Real Estate Desk'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inq.status === 'new'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : inq.status === 'viewing_scheduled'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : inq.status === 'agreement_in_progress'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {(inq.status || 'new').replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReviewInquiry(inq)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                          >
                            Manage
                          </button>
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

      {/* ======================================================== */}
      {/* HOTEL MODAL: CREATE / EDIT (Matching Screenshots 2 & 3) */}
      {/* ======================================================== */}
      {showHotelDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 my-auto max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-in fade-in zoom-in-95">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingHotelId ? 'Edit listing' : 'New listing'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Photos are stored privately and served via signed URLs.
                  </p>
                </div>
                <button
                  onClick={() => setShowHotelDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublishHotel} className="space-y-5">
                {/* 1. PROPERTY CARD */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PROPERTY
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        TITLE
                      </label>
                      <input
                        type="text"
                        value={hotelTitle}
                        onChange={(e) => setHotelTitle(e.target.value)}
                        placeholder="e.g. Canton Trade Tower Hotel"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        CITY
                      </label>
                      <select
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      >
                        <option value="Guangzhou">Guangzhou</option>
                        <option value="Yiwu">Yiwu</option>
                        <option value="Shenzhen">Shenzhen</option>
                        <option value="Shanghai">Shanghai</option>
                        <option value="Beijing">Beijing</option>
                        <option value="Foshan">Foshan</option>
                        <option value="Hangzhou">Hangzhou</option>
                        <option value="Dongguan">Dongguan</option>
                        <option value="Hong Kong">Hong Kong</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        ADDRESS (ENGLISH)
                      </label>
                      <input
                        type="text"
                        value={hotelAddressEng}
                        onChange={(e) => setHotelAddressEng(e.target.value)}
                        placeholder="e.g. 888 Xingang East Road, Haizhu, Guangzhou"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        ADDRESS (中文)
                      </label>
                      <input
                        type="text"
                        value={hotelAddressZh}
                        onChange={(e) => setHotelAddressZh(e.target.value)}
                        placeholder="e.g. 广州市海珠区新港东路888号"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                      DESCRIPTION
                    </label>
                    <textarea
                      value={hotelDescription}
                      onChange={(e) => setHotelDescription(e.target.value)}
                      rows={2}
                      placeholder="Contemporary business hotel located near Canton Fair Complex with free shuttles..."
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="w-40">
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        STAR RATING (0-5)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={hotelStarRating}
                        onChange={(e) => setHotelStarRating(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={hotelAvailable}
                        onChange={(e) => setHotelAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Available for booking
                      </span>
                    </label>
                  </div>
                </div>

                {/* 2. NIGHTLY PRICING CARD */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    NIGHTLY PRICING (PER WALLET CURRENCY)
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input
                        type="number"
                        step="0.01"
                        value={priceUSD}
                        onChange={(e) => setPriceUSD(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        CNY
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceCNY}
                        onChange={(e) => setPriceCNY(e.target.value)}
                        placeholder="320.00"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        NGN
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={priceNGN}
                        onChange={(e) => setPriceNGN(e.target.value)}
                        placeholder="72000"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Guests can only pay with a currency that has a price above zero.
                  </p>
                </div>

                {/* 3. ROOM TYPES CARD - Matching Screenshot 2 (surcharge box on left, room name in middle, trash on right) */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ROOM TYPES
                  </h3>

                  <div className="space-y-2">
                    {roomTypes.map((room, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {/* Surcharge box on left matching Screenshot 2 */}
                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            value={room.surcharge}
                            onChange={(e) => handleUpdateRoomType(idx, 'surcharge', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-slate-900 shadow-sm text-center"
                          />
                        </div>

                        {/* Room type name in middle */}
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => handleUpdateRoomType(idx, 'name', e.target.value)}
                          placeholder="Room type name"
                          className="flex-1 p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                        />

                        {/* Room availability toggle */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRoomType(idx, 'isAvailable' as any, (room as any).isAvailable === false ? true : false)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${
                            (room as any).isAvailable !== false
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {(room as any).isAvailable !== false ? 'Available' : 'Sold Out'}
                        </button>

                        {/* Trash button on right */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomType(idx)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRoomType}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add room type</span>
                  </button>

                  <p className="text-[11px] text-slate-500">
                    Extra amount is added per night, in the currency the guest pays with.
                  </p>
                </div>

                {/* 4. AMENITIES CARD - Matching Screenshot 3 */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    AMENITIES
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {STANDARD_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => handleToggleAmenity(amenity)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. PHOTOS CARD - Matching Screenshot 3 */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PHOTOS
                  </h3>

                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photos Grid */}
                  {hotelPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {hotelPhotos.map((photo, pIdx) => (
                        <div key={pIdx} className="relative rounded-xl overflow-hidden border border-slate-200 group aspect-video">
                          <img
                            src={photo}
                            alt="Hotel photo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(pIdx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons Matching Screenshot 3 */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowHotelDrawer(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingHotel}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {isSubmittingHotel ? 'Publishing...' : 'Publish listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RENTAL PROPERTY MODAL (CREATE / EDIT) */}
      {/* ======================================================== */}
      {showRentalDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 my-auto max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-in fade-in zoom-in-95">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingRentalId ? 'Edit Rental Property' : 'New Rental Property'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Residential apartments, houses, and commercial office spaces in China.
                  </p>
                </div>
                <button
                  onClick={() => setShowRentalDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublishRental} className="space-y-5">
                {/* 1. PROPERTY CARD */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PROPERTY INFORMATION
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        PROPERTY TITLE
                      </label>
                      <input
                        type="text"
                        value={rentalTitle}
                        onChange={(e) => setRentalTitle(e.target.value)}
                        placeholder="e.g. Zhujiang New Town Sky Apartment"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        PROPERTY TYPE
                      </label>
                      <select
                        value={rentalType}
                        onChange={(e: any) => setRentalType(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm capitalize"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">Residential House</option>
                        <option value="office">Commercial Office</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        CITY & DISTRICT
                      </label>
                      <input
                        type="text"
                        value={rentalDistrict}
                        onChange={(e) => setRentalDistrict(e.target.value)}
                        placeholder="e.g. Tianhe CBD, Guangzhou"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        CHINESE TITLE
                      </label>
                      <input
                        type="text"
                        value={rentalZhTitle}
                        onChange={(e) => setRentalZhTitle(e.target.value)}
                        placeholder="e.g. 珠江新城高层景观公寓"
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                      DESCRIPTION
                    </label>
                    <textarea
                      value={rentalDescription}
                      onChange={(e) => setRentalDescription(e.target.value)}
                      rows={2}
                      placeholder="High-floor luxury residence with balcony views and direct metro line 3/5 access..."
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rentalAvailable}
                        onChange={(e) => setRentalAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Available for viewing and lease
                      </span>
                    </label>
                  </div>
                </div>

                {/* 2. PRICING & LEASE TERMS */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    MONTHLY RENT & DEPOSIT TERMS
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        MONTHLY CNY (¥)
                      </label>
                      <input
                        type="number"
                        value={rentalRentCNY}
                        onChange={(e) => setRentalRentCNY(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none"
                        required
                      />
                    </div>

                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input
                        type="number"
                        value={rentalRentUSD}
                        onChange={(e) => setRentalRentUSD(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        EST. NGN (₦)
                      </label>
                      <input
                        type="number"
                        value={rentalRentNGN}
                        onChange={(e) => setRentalRentNGN(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        SECURITY DEPOSIT (MONTHS)
                      </label>
                      <input
                        type="number"
                        value={rentalDepositMonths}
                        onChange={(e) => setRentalDepositMonths(e.target.value)}
                        placeholder="2"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        ADVANCE RENT (MONTHS)
                      </label>
                      <input
                        type="number"
                        value={rentalAdvanceMonths}
                        onChange={(e) => setRentalAdvanceMonths(e.target.value)}
                        placeholder="1"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SPECIFICATIONS */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    SPECIFICATIONS
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        FLOOR AREA (SQM)
                      </label>
                      <input
                        type="number"
                        value={rentalFloorArea}
                        onChange={(e) => setRentalFloorArea(e.target.value)}
                        placeholder="120"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        {rentalType === 'office' ? 'DESK CAPACITY' : 'BEDROOMS'}
                      </label>
                      <input
                        type="number"
                        value={rentalBedrooms}
                        onChange={(e) => setRentalBedrooms(e.target.value)}
                        placeholder="3"
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                        FURNISHED STATUS
                      </label>
                      <select
                        value={rentalFurnished}
                        onChange={(e: any) => setRentalFurnished(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                      >
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. FACILITIES & AMENITIES */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    FACILITIES & AMENITIES
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {RENTAL_AMENITIES.map((am) => {
                      const isSel = rentalAmenities.includes(am);
                      return (
                        <button
                          key={am}
                          type="button"
                          onClick={() => setRentalAmenities(prev => 
                            prev.includes(am) ? prev.filter(x => x !== am) : [...prev, am]
                          )}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            isSel
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {am}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. PHOTOS */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PROPERTY PHOTOS
                  </h3>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Upload photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        for (let i = 0; i < files.length; i++) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setRentalPhotos(prev => [...prev, ev.target!.result as string]);
                            }
                          };
                          reader.readAsDataURL(files[i]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {rentalPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {rentalPhotos.map((p, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group">
                          <img src={p} alt="Rental" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setRentalPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowRentalDrawer(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRental}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    {isSubmittingRental ? 'Publishing...' : 'Publish property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INQUIRY REVIEW DRAWER */}
      {/* ======================================================== */}
      {reviewDrawerInquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-white p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Rental Inquiry Review</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {reviewDrawerInquiry.propertyType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Ref: {reviewDrawerInquiry.reference || reviewDrawerInquiry.id}
                  </p>
                </div>
                <button
                  onClick={() => setReviewDrawerInquiry(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Profile */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  CLIENT PROFILE
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{reviewDrawerInquiry.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono text-slate-900">{reviewDrawerInquiry.customerPhone}</span>
                </div>
                {reviewDrawerInquiry.companyName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Company:</span>
                    <span className="text-slate-800">{reviewDrawerInquiry.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer ID:</span>
                  <span className="font-mono text-slate-600">{reviewDrawerInquiry.userId}</span>
                </div>
              </div>

              {/* Property Requested */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  REQUESTED PROPERTY
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-bold text-slate-900">{reviewDrawerInquiry.propertyName || reviewDrawerInquiry.propertyTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">District:</span>
                  <span className="text-slate-800">{reviewDrawerInquiry.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-mono font-bold text-slate-900">¥{(reviewDrawerInquiry.monthlyRentCNY || 0).toLocaleString()} / month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preferred Move-in:</span>
                  <span className="text-slate-800">{reviewDrawerInquiry.preferredMoveInDate || 'Flexible'}</span>
                </div>
                {reviewDrawerInquiry.preferredViewingDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Viewing Date:</span>
                    <span className="font-bold text-blue-600">{reviewDrawerInquiry.preferredViewingDate}</span>
                  </div>
                )}
              </div>

              {/* Client Notes */}
              {reviewDrawerInquiry.customNotes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">CLIENT REQUIREMENTS / NOTES</span>
                  <p className="text-slate-700 italic">"{reviewDrawerInquiry.customNotes}"</p>
                </div>
              )}

              {/* Internal Management Controls */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    INQUIRY STATUS
                  </label>
                  <select
                    value={inquiryStatusInput}
                    onChange={(e) => setInquiryStatusInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none capitalize shadow-sm"
                  >
                    <option value="new">New Inquiry</option>
                    <option value="contacted">Contacted Customer</option>
                    <option value="viewing_scheduled">Viewing Scheduled</option>
                    <option value="agreement_in_progress">Agreement in Progress</option>
                    <option value="closed">Closed / Finalized</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    ASSIGNED DESK STAFF
                  </label>
                  <input
                    type="text"
                    value={inquiryAssignedStaff}
                    onChange={(e) => setInquiryAssignedStaff(e.target.value)}
                    placeholder="e.g. Agent Zhang (China Real Estate Desk)"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    VIEWING ARRANGEMENTS & INTERNAL NOTES
                  </label>
                  <textarea
                    value={inquiryAdminNotes}
                    onChange={(e) => setInquiryAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Record meeting location, on-site agent phone, landlord communication, or lease signing details..."
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none shadow-sm"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Zero Wallet Debit Policy
                  </div>
                  <p>
                    Property rental inquiries do not automatically debit the customer's wallet. Security deposits, landlord vetting, and keys handover are finalized directly with FlyeMass China Desk.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${(reviewDrawerInquiry.customerPhone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDrawerInquiry(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdatingInquiry}
                  onClick={handleSaveInquiryUpdates}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  {isUpdatingInquiry ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BILINGUAL HOTEL VOUCHER MODAL */}
      {/* ======================================================== */}
      {voucherModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">OFFICIAL CONFIRMATION</span>
                <h3 className="text-lg font-black text-slate-900">China Hotel Stay Voucher</h3>
                <p className="text-xs font-mono text-slate-500">Booking: {voucherModalBooking.reference || voucherModalBooking.id}</p>
              </div>
              <button
                onClick={() => setVoucherModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Confirmation Code:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{voucherModalBooking.confirmationCode || 'WST-CAN-992144'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hotel Name:</span>
                <span className="font-bold text-slate-900">{voucherModalBooking.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Type:</span>
                <span className="text-slate-800">{voucherModalBooking.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-semibold text-slate-900">{voucherModalBooking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stay Duration:</span>
                <span className="text-slate-800">{voucherModalBooking.checkIn} → {voucherModalBooking.checkOut} ({voucherModalBooking.nights} nights)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-mono font-bold text-emerald-600">{voucherModalBooking.currency === 'USD' ? 'CNY' : (voucherModalBooking.currency || 'CNY')} {(voucherModalBooking.amountDebited || voucherModalBooking.totalCNY || voucherModalBooking.totalUSD)?.toLocaleString()}</span>
              </div>
            </div>

            {/* Taxi Driver Card in Chinese */}
            {voucherModalBooking.taxiCardZh && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">TAXI DRIVER CARD (TAXI PRINT-OUT)</span>
                <p className="text-sm font-bold text-slate-900 leading-relaxed font-sans">{voucherModalBooking.taxiCardZh}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setVoucherModalBooking(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminHotelsScreen;
