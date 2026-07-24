import React from 'react';
import Link from 'next/link';

export default function CategoryBadge({ category, isActive = false }) {
  if (!category) return null;

  const categoryId = category.category_id || category.id;
  const name = category.category_name || category.name || 'Trade';
  const icon = category.icon_class || 'fa-solid fa-screwdriver-wrench';
  const artisanCount = category.count || category.artisan_count || 0;

  // URL-safe query filter
  const filterUrl = `/artisans?category=${encodeURIComponent(name)}`;

  return (
    <Link 
      href={filterUrl} 
      className="text-decoration-none d-block h-100"
      id={`category-badge-${categoryId}`}
    >
      <div 
        className={`card border shadow-sm rounded-3 p-3 h-100 d-flex flex-row align-items-center gap-3 transition-all ${
          isActive 
            ? 'bg-primary text-white border-primary' 
            : 'bg-white text-dark border-light-subtle custom-card-hover'
        }`}
        style={{ cursor: 'pointer' }}
      >
        {/* Category Icon Circle */}
        <div 
          className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 border`}
          style={{ 
            width: '46px', 
            height: '46px', 
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(26, 107, 60, 0.08)',
            borderColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          <i className={`fa-solid ${icon} ${isActive ? 'text-white' : 'text-primary'} fs-5`}></i>
        </div>

        {/* Text Details */}
        <div className="overflow-hidden">
          <h6 className={`mb-0 fw-bold text-truncate ${isActive ? 'text-white' : 'text-dark'}`} style={{ fontSize: '14px' }}>
            {name}
          </h6>
          <small className={`fw-medium ${isActive ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '11px' }}>
            {artisanCount} {parseInt(artisanCount, 10) === 1 ? 'artisan' : 'artisans'}
          </small>
        </div>
      </div>
    </Link>
  );
}
