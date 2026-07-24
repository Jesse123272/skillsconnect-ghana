'use client';

import React, { useState, useEffect } from 'react';

export default function SearchBar({
  placeholder = 'Search by name, trade, or district...',
  onSearch,
  initialValue = '',
}) {
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [query, setQuery] = useState(initialValue);

  // Sync state if initialValue changes during render to avoid cascading renders
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setQuery(initialValue);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-100" id="search-bar-form">
      <div className="input-group bg-white border rounded-pill overflow-hidden p-1 shadow-sm">
        {/* Search Icon */}
        <span className="input-group-text bg-transparent border-0 text-muted ps-3">
          <i className="fa-solid fa-magnifying-glass"></i>
        </span>

        {/* Input */}
        <input
          type="text"
          className="form-control border-0 shadow-none ps-1 fs-6"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
          style={{ height: '42px' }}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            className="btn bg-transparent border-0 text-muted p-2 me-1"
            onClick={handleClear}
            style={{ cursor: 'pointer' }}
            title="Clear search"
          >
            <i className="fa-solid fa-xmark fs-5"></i>
          </button>
        )}

        {/* Search CTA Button */}
        <button
          type="submit"
          className="btn btn-primary px-4 rounded-pill fw-medium fs-7 d-flex align-items-center gap-1.5"
          style={{ margin: '2px', cursor: 'pointer' }}
        >
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}
