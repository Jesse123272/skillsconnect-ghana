'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function SaveButton({ artisanId, isInitiallySaved }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [loading, setLoading] = useState(false);

  // Only render and allow toggling for logged-in customers
  if (!user || user.role !== 'customer') {
    return null;
  }

  const handleToggleSave = async (e) => {
    // Prevent button click from navigating
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artisan_id: artisanId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsSaved(result.data.saved);
          if (result.data.saved) {
            toast.success('Artisan added to your saved list!');
          } else {
            toast.success('Artisan removed from your saved list.');
          }
        } else {
          toast.error(result.error || 'Failed to update saved list.');
        }
      } else {
        toast.error('Unable to bookmark artisan at this time.');
      }
    } catch (error) {
      console.error('AJAX bookmark toggle failed:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`btn rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm border ${
        isSaved ? 'bg-danger-subtle border-danger text-danger' : 'bg-white border-light text-muted'
      }`}
      style={{ 
        width: '40px', 
        height: '40px', 
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title={isSaved ? 'Unsave Artisan' : 'Save Artisan'}
    >
      <Heart 
        size={20} 
        fill={isSaved ? 'var(--danger)' : 'none'} 
        className={loading ? 'opacity-50' : ''}
      />
    </button>
  );
}
