'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ArtisanCard from '@/components/ArtisanCard';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';

export default function SavedArtisans() {
  const { user, loading: authLoading } = useAuth();
  
  const [saved, setSaved] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchSavedArtisans = useCallback(async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/saved?page=${page}&limit=6`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const list = result.data.saved_artisans || result.data || [];
          setSaved(list);
          setTotalPages(result.data.totalPages || 1);
        } else {
          setError(result.error || 'Failed to retrieve saved artisans.');
        }
      } else {
        setError('Server responded with an error while fetching bookmarked list.');
      }
    } catch (err) {
      console.error('Error fetching bookmarked artisans:', err);
      setError('An unexpected error occurred while loading your saved list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      fetchSavedArtisans(currentPage);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentPage, user, authLoading, fetchSavedArtisans]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Instant Unsave Action
  const handleUnsave = async (e, artisanId, artisanName) => {
    e.preventDefault();
    e.stopPropagation();
    
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
        if (result.success && !result.data.saved) {
          // Filter out the unsaved artisan from the local state list
          setSaved((prev) => prev.filter((item) => (item.user_id || item.id) !== artisanId));
          setFeedback({
            type: 'success',
            message: `Successfully removed ${artisanName || 'artisan'} from your bookmarked list.`
          });
          
          // Auto clear feedback message
          setTimeout(() => setFeedback(null), 3000);

          // If current page is empty after deletion and not first page, go back a page
          if (saved.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          setError('Failed to unsave artisan correctly.');
        }
      } else {
        setError('Failed to communicate with the save artisan service.');
      }
    } catch (err) {
      console.error('Error unsaving artisan:', err);
      setError('An error occurred while unsaving the artisan profile.');
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying authentication..." fullPage />;
  }

  if (!user) {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Redirecting to login..." />
      </div>
    );
  }

  return (
    <DashboardLayout role="customer" pageTitle="Saved Artisans">
      <div className="container-fluid px-0" id="customer-saved-artisans-view">
        
        {/* Title Header Row */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">My Bookmarks</h4>
            <p className="text-muted mb-0 fs-7">
              Access and manage your curated shortlist of vetted local trade artisans.
            </p>
          </div>
          <Link 
            href="/artisans" 
            className="btn btn-outline-primary px-4 py-2.5 rounded-pill fw-semibold shadow-xs d-inline-flex align-items-center gap-1.5"
          >
            <span>Browse All Categories</span>
            <i className="fa-solid fa-chevron-right fs-8"></i>
          </Link>
        </div>

        {/* Global Feedback Notifications */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {feedback && (
          <AlertMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback(null)} 
          />
        )}

        {/* LOADING, EMPTY, OR GRID CONTAINER */}
        {loading ? (
          <LoadingSpinner message="Loading your curated bookmarks..." />
        ) : saved.length === 0 ? (
          <EmptyState 
            title="Your saved list is empty" 
            description="Shortlist plumbers, carpenters, masonry tradesmen, or electricians to easily contact or hire them later!" 
            icon="fa-heart-circle-xmark"
            actionText="Find Local Artisans"
            actionHref="/artisans"
          />
        ) : (
          <div id="saved-artisans-content">
            <div className="row g-4" id="saved-artisans-grid">
              {saved.map((artisan) => {
                const artisanId = artisan.user_id || artisan.id;
                return (
                  <div key={artisanId} className="col-12 col-md-6 col-lg-4">
                    <div className="position-relative h-100 d-flex flex-column border rounded-3 overflow-hidden bg-white shadow-xs">
                      {/* Standard Artisan Card */}
                      <div className="flex-grow-1">
                        {/* Explicitly tell ArtisanCard it is saved */}
                        <ArtisanCard artisan={{ ...artisan, is_saved: true }} />
                      </div>

                      {/* Action Bar at very bottom of card for direct removal */}
                      <div className="p-3 bg-light border-top text-center mt-auto d-grid">
                        <button
                          type="button"
                          onClick={(e) => handleUnsave(e, artisanId, artisan.full_name || artisan.name)}
                          className="btn btn-sm btn-outline-danger py-2 rounded-3 fw-medium d-inline-flex align-items-center justify-content-center gap-1.5 fs-7 border-dashed"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="fa-solid fa-trash-can fs-8"></i>
                          <span>Remove from Bookmarks</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
