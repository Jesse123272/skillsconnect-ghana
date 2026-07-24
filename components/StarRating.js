'use client';

import React, { useState } from 'react';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  // Set sizing styles
  const sizeMap = {
    sm: '14px',
    md: '18px',
    lg: '24px',
  };

  const fontSize = sizeMap[size] || sizeMap.md;

  const handleClick = (starValue) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (interactive) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const renderStar = (index) => {
    const starValue = index + 1;
    const currentVal = hoverRating || rating;

    // Full star
    if (currentVal >= starValue) {
      return 'fa-solid fa-star star-filled';
    }
    // Half star (only in non-interactive mode for fractional ratings)
    if (!interactive && currentVal >= starValue - 0.5) {
      return 'fa-solid fa-star-half-stroke star-filled';
    }
    // Empty star
    return 'fa-regular fa-star star-empty';
  };

  return (
    <div 
      className={`d-inline-flex align-items-center ${interactive ? 'star-rating-interactive' : ''}`}
      style={{ gap: '4px' }}
    >
      {[...Array(maxStars)].map((_, i) => (
        <i
          key={i}
          className={`${renderStar(i)}`}
          onClick={() => handleClick(i + 1)}
          onMouseEnter={() => handleMouseEnter(i + 1)}
          onMouseLeave={handleMouseLeave}
          style={{
            fontSize,
            cursor: interactive ? 'pointer' : 'default',
            transition: 'transform 0.1s ease, color 0.1s ease',
            color: (hoverRating || rating) >= (i + 1) ? '#F5A623' : '#dee2e6'
          }}
        />
      ))}
    </div>
  );
}
