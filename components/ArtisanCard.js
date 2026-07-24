import React from 'react';
import Link from 'next/link';
import ProfileAvatar from './ProfileAvatar';
import StarRating from './StarRating';
import SaveButton from './SaveButton';

export default function ArtisanCard({ artisan }) {
  if (!artisan) return null;

  // Handle flexible property names from different endpoints
  const artisanId = artisan.user_id || artisan.artisan_id || artisan.id;
  const name = artisan.full_name || artisan.name || 'Anonymous Artisan';
  const category = artisan.category_name || artisan.role || 'Skilled Artisan';
  const rating = parseFloat(artisan.average_rating || artisan.rating || 0);
  const reviewsCount = parseInt(artisan.total_reviews || artisan.reviews || 0, 10);
  const region = artisan.region || 'Ghana';
  const district = artisan.district || '';
  const bio = artisan.bio || 'No professional biography provided yet.';
  const photoUrl = artisan.profile_photo || artisan.image || null;
  const isSaved = artisan.is_saved === true || artisan.is_saved === 1;

  // Build unified location string
  const locationString = district ? `${district}, ${region}` : region;

  return (
    <div className="card custom-card custom-card-hover h-100 overflow-hidden d-flex flex-column" id={`artisan-card-${artisanId}`}>
      {/* Card Header Section */}
      <div className="p-3 bg-light border-bottom position-relative d-flex justify-content-between align-items-start">
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 rounded-pill fs-7 fw-semibold text-capitalize">
          {category}
        </span>
        
        {/* Absolute position / Top right AJAX bookmark toggle */}
        <div className="position-absolute" style={{ top: '12px', right: '12px', zIndex: '10' }}>
          <SaveButton artisanId={artisanId} isInitiallySaved={isSaved} />
        </div>
      </div>

      {/* Main Card Body */}
      <div className="card-body p-4 d-flex flex-column align-items-center text-center flex-grow-1">
        {/* Profile Avatar with fallback */}
        <div className="mb-3">
          <ProfileAvatar name={name} photo_url={photoUrl} size="lg" />
        </div>

        {/* Name with truncation */}
        <h5 className="card-title fw-bold mb-2 text-dark text-truncate w-100 px-2" title={name}>
          {name}
        </h5>

        {/* Rating and Reviews Row */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <StarRating rating={rating} size="sm" />
          <span className="fw-semibold text-dark fs-7" style={{ marginTop: '2px' }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-muted fs-7" style={{ marginTop: '2px' }}>
            ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Location display with pin icon */}
        <p className="card-text text-muted fs-7 mb-3 d-flex align-items-center justify-content-center text-truncate w-100 px-2">
          <i className="fa-solid fa-location-dot text-danger me-1.5 fs-6"></i>
          <span>{locationString}</span>
        </p>

        {/* Bio excerpt with line truncation */}
        <p 
          className="card-text text-secondary fs-7 mb-4 px-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.5',
            minHeight: '3rem'
          }}
        >
          {bio}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-light border-top mt-auto">
        <Link 
          href={`/artisans/${artisanId}`} 
          className="btn btn-outline-primary w-100 py-2 rounded-3 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
          style={{ width: '100%' }}
        >
          <span>View Profile</span>
          <i className="fa-solid fa-arrow-right fs-7"></i>
        </Link>
      </div>
    </div>
  );
}
