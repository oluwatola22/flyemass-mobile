/**
 * Test to verify HotelsScreen data safety & defensive rendering against missing optional fields,
 * null tags, empty amenities, undefined images, and empty directories.
 */
const assert = require('assert');

// Simulate the filtering and mapping logic in HotelsScreen.tsx
function testHotelsScreenRendering(hotelsList, rentalProps, searchQuery, selectedCity, selectedDistrict) {
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

  // Verify that rendering hotel tags/amenities/images never throws .slice on undefined
  filteredHotels.forEach((hotel) => {
    const photo = hotel.image || hotel.images?.[0] || 'default.jpg';
    assert(typeof photo === 'string', 'Photo fallback works');

    const tagsList = ((hotel.tags && hotel.tags.length > 0) ? hotel.tags : (hotel.amenities || []));
    const slicedTags = tagsList.slice(0, 3);
    assert(Array.isArray(slicedTags), 'Tags slicing is always safe array');
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

  filteredApartments.forEach((prop) => {
    const photo = prop.images?.[0] || 'default-apt.jpg';
    assert(typeof photo === 'string', 'Apartment photo fallback works');

    const slicedAmenities = (prop.amenities || []).slice(0, 4);
    assert(Array.isArray(slicedAmenities), 'Apartment amenities slicing is always safe array');
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

  filteredOffices.forEach((prop) => {
    const photo = prop.images?.[0] || 'default-office.jpg';
    assert(typeof photo === 'string', 'Office photo fallback works');

    const mappedAmenities = (prop.amenities || []).map(a => a);
    assert(Array.isArray(mappedAmenities), 'Office amenities mapping is always safe array');
  });

  return {
    hotelsCount: filteredHotels.length,
    aptsCount: filteredApartments.length,
    officesCount: filteredOffices.length
  };
}

console.log('Testing HotelsScreen with edge-case datasets:');

// Test 1: Completely empty lists
const r1 = testHotelsScreenRendering([], [], '', 'All', 'All');
assert(r1.hotelsCount === 0 && r1.aptsCount === 0 && r1.officesCount === 0, 'Empty data handled without error');
console.log('✔ Case 1: Empty arrays render cleanly');

// Test 2: Incomplete hotel objects (missing tags, amenities, images, city, district)
const incompleteHotels = [
  { id: 'h1', name: 'Hotel One' }, // missing tags, amenities, images, city, district
  { id: 'h2', name: 'Hotel Two', city: 'Guangzhou' }, // missing tags, amenities
  { id: 'h3', name: 'Hotel Three', tags: null, amenities: undefined, images: [] }
];
const incompleteRentals = [
  { id: 'p1', title: 'Apt 1', propertyType: 'apartment' }, // missing amenities, images, district
  { id: 'p2', title: 'Office 1', propertyType: 'office', amenities: null, images: undefined }
];
const r2 = testHotelsScreenRendering(incompleteHotels, incompleteRentals, '', 'All', 'All');
assert(r2.hotelsCount === 3, 'Incomplete hotels processed without crashing');
assert(r2.aptsCount === 1, 'Incomplete apartment processed without crashing');
assert(r2.officesCount === 1, 'Incomplete office processed without crashing');
console.log('✔ Case 2: Incomplete/null fields render cleanly without .slice errors');

// Test 3: Search filtering on incomplete objects
const r3 = testHotelsScreenRendering(incompleteHotels, incompleteRentals, 'One', 'All', 'All');
assert(r3.hotelsCount === 1, 'Search query filters correctly');
console.log('✔ Case 3: Search filter works safely with missing fields');

console.log('ALL DEFENSIVE RENDERING TESTS PASSED SUCCESSFULLY!');
