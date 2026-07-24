'use client';

import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  // If there's only 1 page, don't show the pagination widget
  if (totalPages <= 1) return null;

  const handlePageClick = (page, e) => {
    e.preventDefault();
    if (page >= 1 && page <= totalPages && page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  // Generate page numbers array (with simple sliding window if totalPages is large)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav aria-label="Page navigation" className="d-flex justify-content-center my-4" id="pagination-nav">
      <ul className="pagination mb-0 gap-1">
        {/* Previous Button */}
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <a
            className="page-link rounded-3 border px-3 py-2 d-flex align-items-center justify-content-center text-primary"
            href="#"
            onClick={(e) => handlePageClick(currentPage - 1, e)}
            aria-disabled={currentPage === 1 ? 'true' : undefined}
            style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fa-solid fa-chevron-left me-1 fs-7"></i>
            <span>Prev</span>
          </a>
        </li>

        {/* Page numbers */}
        {pages.map((page) => (
          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
            <a
              className="page-link rounded-3 border px-3.5 py-2 d-flex align-items-center justify-content-center fw-medium"
              href="#"
              onClick={(e) => handlePageClick(page, e)}
              style={{
                cursor: 'pointer',
                backgroundColor: page === currentPage ? 'var(--primary)' : 'transparent',
                borderColor: page === currentPage ? 'var(--primary)' : '#dee2e6',
                color: page === currentPage ? '#ffffff' : 'var(--text)',
                transition: 'all 0.15s ease'
              }}
            >
              {page}
            </a>
          </li>
        ))}

        {/* Next Button */}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <a
            className="page-link rounded-3 border px-3 py-2 d-flex align-items-center justify-content-center text-primary"
            href="#"
            onClick={(e) => handlePageClick(currentPage + 1, e)}
            aria-disabled={currentPage === totalPages ? 'true' : undefined}
            style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <span>Next</span>
            <i className="fa-solid fa-chevron-right ms-1 fs-7"></i>
          </a>
        </li>
      </ul>
    </nav>
  );
}
