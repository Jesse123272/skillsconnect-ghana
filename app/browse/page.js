'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import ArtisanCard from '@/components/ArtisanCard';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import NearbyArtisans from '@/components/NearbyArtisans';

// List of all 16 regions in Ghana
const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Eastern',
  'Western',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti',
  'Western North'
];

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derived from URL directly - zero extra state synchronization!
  const keyword = searchParams.get('keyword') || '';
  const selectedCategory = searchParams.get('category_id') || '';
  const selectedRegion = searchParams.get('region') || '';
  const selectedDistrict = searchParams.get('district') || searchParams.get('city') || '';
  const selectedRating = searchParams.get('min_rating') || '';
  const selectedSort = searchParams.get('sort') || 'rating';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for city text input
  const [prevDistrict, setPrevDistrict] = useState(selectedDistrict);
  const [cityInput, setCityInput] = useState(selectedDistrict);

  // Sync state if selectedDistrict changes in URL
  if (selectedDistrict !== prevDistrict) {
    setPrevDistrict(selectedDistrict);
    setCityInput(selectedDistrict);
  }

  // Data fetching states
  const [categories, setCategories] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [totalArtisans, setTotalArtisans] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [usedLocationSearch, setUsedLocationSearch] = useState(false);

  // Popular Ghanaian Cities/Districts
  const POPULAR_CITIES = [
    'Accra', 'Kumasi', 'Tema', 'Madina', 'East Legon', 'Spintex', 'Osu',
    'Takoradi', 'Cape Coast', 'Tamale', 'Koforidua', 'Sunyani', 'Ho', 'Obuasi'
  ];

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch artisans when searchParams change
  useEffect(() => {
    async function loadArtisans() {
      setIsLoading(true);
      setErrorMsg('');
      setLocationHint('');
      setUsedLocationSearch(false);

      try {
        const useGeoSearch = !selectedRegion && !selectedDistrict && !keyword;
        const params = new URLSearchParams();

        if (selectedCategory) params.append('category_id', selectedCategory);
        if (selectedRegion) params.append('region', selectedRegion);
        if (selectedDistrict) params.append('district', selectedDistrict);
        if (selectedRating) params.append('min_rating', selectedRating);
        if (selectedSort) params.append('sort', selectedSort);
        params.append('page', currentPage.toString());
        params.append('limit', '9'); // 9 per page

        if (useGeoSearch && navigator.geolocation) {
          setLocationHint('Searching for artisans closest to your current location...');
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              maximumAge: 5 * 60 * 1000,
              timeout: 10000
            });
          });

          params.append('latitude', position.coords.latitude.toString());
          params.append('longitude', position.coords.longitude.toString());
          params.append('radius', '25');
          setUsedLocationSearch(true);
        }

        const res = await fetch(`/api/artisans?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setArtisans(json.data.artisans || []);
          setTotalArtisans(json.data.total || 0);
          setTotalPages(json.data.totalPages || 1);
          if (json.warning) {
            setLocationHint(json.warning);
          }
        } else {
          setErrorMsg(json.error || 'Failed to retrieve artisans.');
          if (useGeoSearch) {
            setLocationHint('Unable to use location. Showing default artisan listings.');
          }
        }
      } catch (err) {
        console.error('Error fetching artisans:', err);
        setErrorMsg('Unable to reach the server. Please try again.');
        if (navigator.geolocation) {
          setLocationHint('Permission denied or location lookup failed. Showing default listings instead.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadArtisans();
  }, [searchParams, selectedCategory, selectedRegion, selectedDistrict, selectedRating, selectedSort, currentPage, keyword]);

  // Handle updates to search and filter and push to URL
  const applyFilters = (newFilters = {}) => {
    const updatedKeyword = newFilters.keyword !== undefined ? newFilters.keyword : keyword;
    const updatedCategory = newFilters.category_id !== undefined ? newFilters.category_id : selectedCategory;
    const updatedRegion = newFilters.region !== undefined ? newFilters.region : selectedRegion;
    const updatedDistrict = newFilters.district !== undefined ? newFilters.district : (newFilters.city !== undefined ? newFilters.city : selectedDistrict);
    const updatedRating = newFilters.min_rating !== undefined ? newFilters.min_rating : selectedRating;
    const updatedSort = newFilters.sort !== undefined ? newFilters.sort : selectedSort;
    const updatedPage = newFilters.page !== undefined ? newFilters.page : 1; // reset page to 1 on filter changes unless page is explicit

    const params = new URLSearchParams();
    if (updatedKeyword) params.append('keyword', updatedKeyword);
    if (updatedCategory) params.append('category_id', updatedCategory);
    if (updatedRegion) params.append('region', updatedRegion);
    if (updatedDistrict) params.append('district', updatedDistrict);
    if (updatedRating) params.append('min_rating', updatedRating);
    if (updatedSort) params.append('sort', updatedSort);
    if (updatedPage > 1) params.append('page', updatedPage.toString());

    router.push(`/browse?${params.toString()}`);
  };

  const handleSearchSubmit = (searchVal) => {
    applyFilters({ keyword: searchVal, page: 1 });
  };

  const handleCategoryCheckboxChange = (catId) => {
    const nextCat = selectedCategory === catId.toString() ? '' : catId.toString();
    applyFilters({ category_id: nextCat, page: 1 });
  };

  const handleRegionSelect = (e) => {
    applyFilters({ region: e.target.value, page: 1 });
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    applyFilters({ district: cityInput.trim(), page: 1 });
  };

  const handleQuickCityClick = (city) => {
    const nextCity = selectedDistrict.toLowerCase() === city.toLowerCase() ? '' : city;
    setCityInput(nextCity);
    applyFilters({ district: nextCity, page: 1 });
  };

  const handleRatingRadio = (val) => {
    applyFilters({ min_rating: val, page: 1 });
  };

  const handleSortSelect = (e) => {
    applyFilters({ sort: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    applyFilters({ page });
  };

  const clearAllFilters = (e) => {
    e.preventDefault();
    setCityInput('');
    router.push('/browse');
  };

  return (
    <div className="d-flex flex-column min-vh-100" id="browse-artisans-page">
      <Navbar />

      {/* Hero Header bar */}
      <div className="bg-light border-bottom py-4" id="browse-header-banner">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-start">
              <h1 className="h3 fw-bold text-dark mb-1">Browse Skilled Artisans</h1>
              <p className="text-muted mb-0 small">Find and connect with verified local professionals across Ghana</p>
            </div>
            <div className="col-md-6 mt-3 mt-md-0 d-flex justify-content-md-end">
              <div className="w-100" style={{ maxWidth: '420px' }}>
                <SearchBar 
                  placeholder="Search by name, bio, keywords..." 
                  initialValue={keyword}
                  onSearch={handleSearchSubmit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-grow-1 py-5">
        <div className="row g-4">
          
          {/* LEFT SIDEBAR (Filters) */}
          <aside className="col-lg-3 col-md-4">
            <div className="card border rounded-3 p-4 bg-white shadow-sm" id="filters-sidebar">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h5 className="fw-bold mb-0 text-dark">Filters</h5>
                <a href="#" onClick={clearAllFilters} className="text-primary small fw-semibold text-decoration-none">
                  Clear All
                </a>
              </div>

              {/* Filter by Category (Checkboxes) */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Professional Trade</h6>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {categories.length === 0 ? (
                    <p className="text-muted small">Loading trades...</p>
                  ) : (
                    categories.map((cat, idx) => (
                      <div className="form-check" key={cat.category_id || `cat-${idx}`}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`cat-${cat.category_id}`}
                          checked={selectedCategory === cat.category_id.toString()}
                          onChange={() => handleCategoryCheckboxChange(cat.category_id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label text-secondary small" htmlFor={`cat-${cat.category_id}`} style={{ cursor: 'pointer' }}>
                          {cat.category_name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Filter by Region (Select) */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Region of Ghana</h6>
                <select
                  className="form-select text-secondary small"
                  value={selectedRegion}
                  onChange={handleRegionSelect}
                >
                  <option value="">All 16 Regions</option>
                  {REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by City / District (Input & Quick Chips) */}
              <div className="mb-4" id="city-district-filter-section">
                <h6 className="fw-bold text-dark mb-2">City or District</h6>
                <form onSubmit={handleCitySubmit} className="mb-2">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="fa-solid fa-location-dot fs-8 text-primary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control text-secondary small border-start-0"
                      placeholder="e.g. Accra, Madina, Kumasi..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                    />
                    <button className="btn btn-outline-primary fw-semibold" type="submit">
                      Go
                    </button>
                  </div>
                </form>

                {/* Popular Cities Quick Chips */}
                <span className="text-muted fs-8 fw-semibold d-block mb-1.5" style={{ fontSize: '11px' }}>
                  Popular Cities & Hubs:
                </span>
                <div className="d-flex flex-wrap gap-1.5" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                  {POPULAR_CITIES.map((c) => {
                    const isSelected = selectedDistrict.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleQuickCityClick(c)}
                        className={`btn btn-2xs rounded-pill px-2 py-0.5 fs-8.5 ${
                          isSelected ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary bg-light text-secondary'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {isSelected && <i className="fa-solid fa-check me-1 fs-9"></i>}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter by Rating (Radios) */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Minimum Rating</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rating-filter"
                      id="rating-any"
                      checked={selectedRating === ''}
                      onChange={() => handleRatingRadio('')}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-secondary small" htmlFor="rating-any" style={{ cursor: 'pointer' }}>
                      Any Rating
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rating-filter"
                      id="rating-3"
                      checked={selectedRating === '3'}
                      onChange={() => handleRatingRadio('3')}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-secondary small d-flex align-items-center gap-1" htmlFor="rating-3" style={{ cursor: 'pointer' }}>
                      3.0+ Stars <span className="text-warning">★</span>
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rating-filter"
                      id="rating-4"
                      checked={selectedRating === '4'}
                      onChange={() => handleRatingRadio('4')}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-secondary small d-flex align-items-center gap-1" htmlFor="rating-4" style={{ cursor: 'pointer' }}>
                      4.0+ Stars <span className="text-warning">★</span>
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rating-filter"
                      id="rating-5"
                      checked={selectedRating === '5'}
                      onChange={() => handleRatingRadio('5')}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-secondary small d-flex align-items-center gap-1" htmlFor="rating-5" style={{ cursor: 'pointer' }}>
                      5.0 Stars <span className="text-warning">★</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Apply & Clear CTA */}
              <button
                className="btn btn-primary w-100 rounded-pill mb-2 py-2 fs-7 fw-semibold"
                onClick={() => applyFilters()}
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT (Artisans list) */}
          <main className="col-lg-9 col-md-8 text-start">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
              <div>
                <p className="text-muted mb-0 small">
                  {isLoading ? 'Searching...' : `Showing ${artisans.length} of ${totalArtisans} artisans`}
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary small text-nowrap">Sort By:</span>
                <select
                  className="form-select form-select-sm text-secondary rounded-pill px-3"
                  value={selectedSort}
                  onChange={handleSortSelect}
                  style={{ width: '160px' }}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest Join</option>
                </select>
              </div>
            </div>

            {/* ACTIVE FILTERS PILLS BAR */}
            {(selectedCategory || selectedRegion || selectedDistrict || selectedRating || keyword) && (
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4 p-2.5 bg-light rounded-3 border" id="active-filters-badges-bar">
                <span className="text-dark fw-bold fs-8 me-1">Active Filters:</span>
                {keyword && (
                  <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill fs-8 fw-medium d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-magnifying-glass text-primary fs-9"></i>
                    <span>&quot;{keyword}&quot;</span>
                    <button type="button" onClick={() => applyFilters({ keyword: '', page: 1 })} className="btn-close border-0 p-0 ms-1" style={{ fontSize: '10px' }}></button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill fs-8 fw-medium d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-briefcase text-primary fs-9"></i>
                    <span>Trade: {categories.find((c) => c.category_id.toString() === selectedCategory)?.category_name || selectedCategory}</span>
                    <button type="button" onClick={() => applyFilters({ category_id: '', page: 1 })} className="btn-close border-0 p-0 ms-1" style={{ fontSize: '10px' }}></button>
                  </span>
                )}
                {selectedRegion && (
                  <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill fs-8 fw-medium d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-map-location-dot text-primary fs-9"></i>
                    <span>Region: {selectedRegion}</span>
                    <button type="button" onClick={() => applyFilters({ region: '', page: 1 })} className="btn-close border-0 p-0 ms-1" style={{ fontSize: '10px' }}></button>
                  </span>
                )}
                {selectedDistrict && (
                  <span className="badge bg-primary text-white px-2.5 py-1.5 rounded-pill fs-8 fw-bold d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-location-dot fs-9"></i>
                    <span>City/District: {selectedDistrict}</span>
                    <button type="button" onClick={() => { setCityInput(''); applyFilters({ district: '', page: 1 }); }} className="btn-close btn-close-white border-0 p-0 ms-1" style={{ fontSize: '10px' }}></button>
                  </span>
                )}
                {usedLocationSearch && !selectedRegion && !selectedDistrict && !keyword && (
                  <span className="badge bg-info text-dark border px-2.5 py-1.5 rounded-pill fs-8 fw-medium d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-location-crosshairs fs-9"></i>
                    <span>Using your current location to rank artisans</span>
                  </span>
                )}
                {selectedRating && (
                  <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill fs-8 fw-medium d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i className="fa-solid fa-star text-warning fs-9"></i>
                    <span>{selectedRating}.0+ Stars</span>
                    <button type="button" onClick={() => applyFilters({ min_rating: '', page: 1 })} className="btn-close border-0 p-0 ms-1" style={{ fontSize: '10px' }}></button>
                  </span>
                )}
                <button type="button" onClick={clearAllFilters} className="btn btn-link text-danger fs-8 fw-bold text-decoration-none p-0 ms-auto">
                  Reset All
                </button>
              </div>
            )}

            {locationHint && (
              <div className="alert alert-info py-3 mb-4" role="alert">
                {locationHint}
              </div>
            )}

            <div className="mb-4">
              <NearbyArtisans />
            </div>

            {/* Main results list or loader */}
            {isLoading ? (
              <div className="py-5 text-center">
                <LoadingSpinner />
                <p className="text-muted mt-3">Fetching artisan roster...</p>
              </div>
            ) : errorMsg ? (
              <div className="alert alert-danger" role="alert">
                {errorMsg}
              </div>
            ) : artisans.length === 0 ? (
              <EmptyState
                title="No artisans found"
                description="We couldn't find any certified artisans matching your precise criteria. Try widening your filters or clearing search terms."
                actionText="Reset All Filters"
                actionHref="/browse"
              />
            ) : (
              <>
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {artisans.map((artisan, idx) => (
                    <div key={artisan.user_id || `artisan-${idx}`} className="col">
                      <ArtisanCard artisan={artisan} />
                    </div>
                  ))}
                </div>

                {/* Pagination Component */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><LoadingSpinner /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
