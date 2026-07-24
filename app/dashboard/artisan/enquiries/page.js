'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';

export default function ArtisanEnquiriesList() {
  const { user, loading: authLoading } = useAuth();

  const [enquiries, setEnquiries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'pending', 'replied'
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // FETCH ENQUIRIES
  const fetchEnquiries = async (tab, page) => {
    try {
      setLoadingData(true);
      setError(null);

      const response = await fetch(`/api/enquiries?status=${tab}&page=${page}&limit=10`);
      const result = await response.json();

      if (response.ok && result.success) {
        setEnquiries(result.data?.enquiries || []);
        setTotalPages(result.data?.totalPages || 1);
        setCurrentPage(result.data?.page || 1);
      } else {
        setError(result.error || 'Failed to download enquiries list from servers.');
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError('An error occurred. Check your internet connection.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      // Trigger timer to prevent React cascading render warnings
      const timer = setTimeout(() => {
        fetchEnquiries(statusTab, currentPage);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, statusTab, currentPage]);

  const handleTabChange = (tab) => {
    setStatusTab(tab);
    setCurrentPage(1); // Reset to page 1 on tab shift
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // CLIENT-SIDE FILTER BY SEARCH
  const filteredEnquiries = enquiries.filter((enq) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const nameMatches = enq.customer_name && enq.customer_name.toLowerCase().includes(q);
    const subjectMatches = enq.subject && enq.subject.toLowerCase().includes(q);
    const msgMatches = enq.message && enq.message.toLowerCase().includes(q);

    return nameMatches || subjectMatches || msgMatches;
  });

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access received enquiries." />
      </div>
    );
  }

  return (
    <DashboardLayout role="artisan" pageTitle="Received Enquiries">
      <div className="container-fluid px-0" id="artisan-enquiries-index-view">
        
        {/* Title Block */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Service Enquiries</h4>
          <p className="text-muted mb-0 fs-7">
            Review and reply to client work requests and communication enquiries received.
          </p>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {/* Filter Navigation and Search */}
        <div className="card border rounded-3 bg-white p-3 shadow-xs mb-4">
          <div className="row g-3 align-items-center">
            
            {/* TABS */}
            <div className="col-12 col-md-7">
              <div className="nav nav-pills gap-1.5" id="enquiry-filter-tabs">
                <button
                  type="button"
                  onClick={() => handleTabChange('all')}
                  className={`btn px-3.5 py-2 rounded-pill fs-7 fw-semibold ${statusTab === 'all' ? 'btn-primary' : 'btn-light text-secondary'}`}
                >
                  All Requests
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('unread')}
                  className={`btn px-3.5 py-2 rounded-pill fs-7 fw-semibold ${statusTab === 'unread' ? 'btn-info text-white' : 'btn-light text-secondary'}`}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('pending')}
                  className={`btn px-3.5 py-2 rounded-pill fs-7 fw-semibold ${statusTab === 'pending' ? 'btn-warning text-dark' : 'btn-light text-secondary'}`}
                >
                  Pending Response
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('replied')}
                  className={`btn px-3.5 py-2 rounded-pill fs-7 fw-semibold ${statusTab === 'replied' ? 'btn-success text-white' : 'btn-light text-secondary'}`}
                >
                  Replied
                </button>
              </div>
            </div>

            {/* SEARCH */}
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted pr-1">
                  <i className="fa-solid fa-magnifying-glass fs-7"></i>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control border-start-0 shadow-none py-2 fs-7"
                  placeholder="Search by customer name or subject..."
                />
              </div>
            </div>

          </div>
        </div>

        {/* ENQUIRIES CONTENT */}
        {loadingData ? (
          <LoadingSpinner message="Assembling enquiries list..." />
        ) : filteredEnquiries.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No matching enquiries found" : `No ${statusTab === 'all' ? '' : statusTab} enquiries`}
            description={searchQuery ? "Try altering your query parameters to search for another contact or subject description." : "You do not have any received enquiries matching this segment. Keep your profile detailed to receive messages!"}
            icon="fa-folder-open"
          />
        ) : (
          <div className="d-flex flex-column gap-3" id="enquiries-list-holder">
            {filteredEnquiries.map((enq) => {
              const id = enq.enquiry_id || enq.id;
              let badgeBg = 'bg-warning text-dark';
              if (enq.status === 'replied') badgeBg = 'bg-success text-white';

              return (
                <div key={id} className={`card border rounded-3 p-3.5 shadow-xs ${enq.is_read_artisan === 0 ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`} id={`enquiry-row-${id}`}>
                  <div className="row align-items-center g-3">
                    {/* Customer Identity */}
                    <div className="col-12 col-md-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div 
                          className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center"
                          style={{ width: '42px', height: '42px', fontSize: '13.5px' }}
                        >
                          {(enq.customer_name || 'Client').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0.5">{enq.customer_name || 'Client'}</h6>
                          <small className="text-muted fs-8">
                            {enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-GH') : 'Recent'}
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Subject and Preview */}
                    <div className="col-12 col-md-5">
                      <strong className="text-dark d-block fs-7.5">{enq.subject}</strong>
                      <p className="text-secondary mb-0 fs-8 text-truncate" style={{ maxWidth: '400px' }}>
                        {enq.message}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="col-6 col-md-2">
                      <span className={`badge ${badgeBg} rounded-pill px-2.5 py-1.5 fs-8 text-capitalize fw-semibold`}>
                        {enq.status || 'pending'}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="col-6 col-md-2 text-end">
                      <Link
                        href={`/dashboard/artisan/enquiries/${id}`}
                        className="btn btn-sm btn-outline-primary px-3.5 py-1.5 rounded-pill fw-semibold fs-7.5"
                      >
                        {enq.status === 'replied' ? 'View Details' : 'Reply Now'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-3">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
