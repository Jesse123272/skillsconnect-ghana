/* eslint-disable @next/next/no-img-element */
import React from 'react';

export default function ProfileAvatar({ name, photo_url, size = 'md' }) {
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

  // Use a nice background palette derived from the user name for variance
  const bgColors = [
    '#1A6B3C', // Primary green
    '#2E7D32', // Medium green
    '#388E3C', // Accent green
    '#4CAF50', // Soft green
    '#2F4F4F', // Dark slate
  ];
  
  // Calculate index deterministically
  const charSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bgColor = bgColors[charSum % bgColors.length];

  return (
    <div className="d-inline-block position-relative">
      {photo_url ? (
        <img
          src={photo_url}
          alt={name || 'User Profile Photo'}
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
