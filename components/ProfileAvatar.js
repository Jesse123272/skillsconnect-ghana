/* eslint-disable @next/next/no-img-element */
import React from 'react';

export default function ProfileAvatar({ name, photo_url, size = 'md', decorative = false }) {
  // Compute initials
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Resolve pixel dimensions based on simple size classes
  const sizeMap = {
    sm: { box: '32px', font: '12px' },
    md: { box: '48px', font: '15px' },
    lg: { box: '80px', font: '24px' },
    xl: { box: '120px', font: '36px' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const initials = getInitials(name);

  // Vibrant, diverse avatar background palette — blue, orange, teal, violet, rose
  const bgColors = [
    '#2563EB', // Royal blue (primary)
    '#F97316', // Warm orange (secondary)
    '#0891B2', // Cyan teal
    '#7C3AED', // Violet
    '#DB2777', // Rose pink
    '#0D9488', // Teal green
    '#EA580C', // Deep orange
    '#4F46E5', // Indigo
  ];
  
  // Calculate index deterministically
  const charSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bgColor = bgColors[charSum % bgColors.length];

  return (
    <div className="d-inline-block position-relative">
      {photo_url ? (
        <img
          src={photo_url}
          alt={decorative ? '' : name || 'User Profile Photo'}
          className="rounded-circle border border-2 border-white shadow-sm object-fit-cover"
          referrerPolicy="no-referrer"
          style={{
            width: currentSize.box,
            height: currentSize.box,
            objectFit: 'cover'
          }}
        />
      ) : (
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm border border-2 border-white"
          style={{
            width: currentSize.box,
            height: currentSize.box,
            fontSize: currentSize.font,
            backgroundColor: bgColor,
            userSelect: 'none'
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
