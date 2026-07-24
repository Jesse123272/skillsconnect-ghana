'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import EnquiryCard from '@/components/EnquiryCard';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerEnquiries() {
  const { user, loading: authLoading } = useAuth();
  
  const [enquiries, setEnquiries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'replied'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnquiries = useCallback(async (currentFilter, page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/enquiries?status=${currentFilter}&page=${page}&limit=5`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const list = result.data.enquiries || result.data || [];
          setEnquiries(list);
          setTotalPages(result.data.totalPages || 1);
        } else {
          setError(result.error || 'Failed to retrieve enquiries.');
        }
      } else {
        setError('Failed to fetch enquiries from server.');
      }
    } catch (err) {
      console.error('Error fetching customer enquiries:', err);
      setError('An unexpected error occurred while loading your inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      fetchEnquiries(filter, currentPage);
    }, 0);
    return () => clearTimeout(timer);
  }, [filter, currentPage, user, authLoading, fetchEnquiries]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 on filter switch
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
    <DashboardLayout role="customer" pageTitle="My Enquiries">
      <div className="container-fluid px-0" id="customer-enquiries-view">
        
        {/* Header Block with CTA */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">Trade Service Enquiries</h4>
            <p className="text-muted mb-0 fs-7">
              Manage and track interactions with local Ghanaian artisans regarding requested trade services.
            </p>
          </div>
          <Link 
            href="/browse" 
            className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm fw-medium d-inline-flex align-items-center gap-2"
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Send New Enquiry</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {/* Filter Tab Pills */}
        <div className="bg-white p-3 rounded-3 border mb-4 shadow-xs" id="enquiry-filter-tabs">
          <ul className="nav nav-pills gap-2">
            {['all', 'pending', 'replied'].map((type) => (
              <li className="nav-item" key={type}>
                <button
                  onClick={() => handleFilterChange(type)}
                  className={`nav-link text-capitalize px-4 py-2 rounded-pill fw-medium border-0 ${
                    filter === type 
                      ? 'active bg-primary text-white shadow-sm' 
                      : 'bg-light text-secondary hover-bg-light'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  {type} Enquiries
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* LIST OR EMPTY OR LOADING STATE */}
        {loading ? (
          <LoadingSpinner message="Retrieving your enquiries..." />
        ) : enquiries.length === 0 ? (
          <EmptyState 
            title={`No ${filter !== 'all' ? filter : ''} enquiries found`} 
            description={
              filter === 'all' 
                ? "You haven't initiated any professional inquiries yet. Browse our verified categories to contact artisans today."
                : `You do not have any enquiries with status "${filter}" at the moment.`
            } 
            icon="fa-envelope-open-text"
            actionText="Browse Artisans"
            actionHref="/artisans"
          />
        ) : (
          <div className="d-flex flex-column gap-4" id="enquiry-cards-list">
            {enquiries.map((enquiry) => {
              const enquiryId = enquiry.enquiry_id || enquiry.id;
              return (
                <div key={enquiryId} className="position-relative bg-white border rounded-3 overflow-hidden shadow-xs p-1">
                  {/* Reuse existing EnquiryCard which takes care of details rendering */}
                  <EnquiryCard enquiry={enquiry} viewerRole="customer" />
                  
                  {/* Action Link inside wrapper */}
                  <div className="px-3 pb-3 pt-0 d-flex justify-content-between align-items-center border-top mt-2">
                    <span className="text-muted fs-8">
                      Enquiry Ref: <strong className="text-dark">#SC-{enquiryId}</strong>
                    </span>
                    <Link 
                      href={`/dashboard/customer/enquiries/${enquiryId}`} 
                      className="btn btn-sm btn-primary px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                    >
                      <span>View Message Thread & Reply</span>
                      <i className="fa-solid fa-arrow-right fs-8"></i>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Pagination widgets */}
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
