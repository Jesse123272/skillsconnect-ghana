'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function HeroSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location.trim()) {
      // Check if location matches a region, otherwise pass as district/city
      const matchedRegion = REGIONS.find(r => r.toLowerCase() === location.trim().toLowerCase());
      if (matchedRegion) {
        params.append('region', matchedRegion);
      } else {
        params.append('district', location.trim());
      }
    }
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-100" id="hero-location-search-form" style={{ maxWidth: '680px' }}>
      <div className="bg-white rounded-4 p-2 shadow-lg d-flex flex-column flex-md-row align-items-stretch gap-2 border">
        
        {/* Trade/Skill Field */}
        <div className="d-flex align-items-center flex-grow-1 px-3 py-1.5 border-bottom border-md-0 border-md-end">
          <i className="fa-solid fa-magnifying-glass text-muted me-2.5 fs-6"></i>
          <input
            type="text"
            className="form-control border-0 shadow-none px-0 text-dark fs-6"
            placeholder="What trade do you need? (e.g. Plumber)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Location/City/Region Field */}
        <div className="d-flex align-items-center flex-grow-1 px-3 py-1.5">
          <i className="fa-solid fa-location-dot text-primary me-2.5 fs-6"></i>
          <input
            type="text"
            className="form-control border-0 shadow-none px-0 text-dark fs-6"
            placeholder="City or Region (e.g. Accra, Kumasi)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            list="ghana-locations-list"
          />
          <datalist id="ghana-locations-list">
            <option value="Accra" />
            <option value="Kumasi" />
            <option value="Tema" />
            <option value="Madina" />
            <option value="East Legon" />
            <option value="Spintex" />
            <option value="Osu" />
            <option value="Takoradi" />
            <option value="Cape Coast" />
            <option value="Tamale" />
            <option value="Greater Accra" />
            <option value="Ashanti" />
            <option value="Western" />
            <option value="Central" />
          </datalist>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary rounded-3 px-4 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 text-nowrap shadow-sm"
        >
          <span>Find Artisans</span>
          <i className="fa-solid fa-arrow-right fs-7"></i>
        </button>

      </div>
    </form>
  );
}

