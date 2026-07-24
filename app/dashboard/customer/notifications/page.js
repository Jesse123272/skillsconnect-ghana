'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerNotifications() {
  const { user, loading: authLoading } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch paginated list of notifications
  const fetchNotifications = useCallback(async (page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/notifications?page=${page}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const list = result.data.notifications || result.data || [];
          setNotifications(list);
          setTotalPages(result.data.totalPages || 1);
        } else {
          setError(result.error || 'Failed to retrieve notification logs.');
        }
      } else {
        setError('Server responded with an error while fetching notifications.');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('An unexpected error occurred while loading your notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      fetchNotifications(currentPage);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentPage, user, authLoading, fetchNotifications]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Mark All Notifications as Read Action
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    try {
      setMarkingAll(true);
      setError(null);

      // Call live PUT /api/notifications API
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Set all locally fetched notifications' is_read to 1
          setNotifications((prev) => 
            prev.map((notif) => ({ ...notif, is_read: 1 }))
          );
          setFeedback('All notifications have been successfully marked as read.');
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setError(result.error || 'Failed to mark notifications as read.');
        }
      } else {
        setError('Server responded with an error while updating read states.');
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('An unexpected server error occurred.');
    } finally {
      setMarkingAll(false);
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
    <DashboardLayout role="customer" pageTitle="Notifications Log">
      <div className="container-fluid px-0" id="customer-notifications-view">
        
        {/* Header Title Grid with Actions */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">My Notifications</h4>
            <p className="text-muted mb-0 fs-7">
              Track communication updates, trade enquiry replies, review approvals, and status alerts.
            </p>
          </div>
          {notifications.some(n => n.is_read === 0 || n.is_read === false) && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
              style={{ cursor: 'pointer' }}
            >
              {markingAll ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  <span>Marking...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check-double"></i>
                  <span>Mark All as Read</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Global Notifications and Responses */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {feedback && <AlertMessage type="success" message={feedback} onClose={() => setFeedback(null)} />}

        {/* LOADING, EMPTY, OR HISTORY LOGS */}
        {loading && notifications.length === 0 ? (
          <LoadingSpinner message="Retrieving your notifications history..." />
        ) : notifications.length === 0 ? (
          <EmptyState 
            title="Your inbox is clear!" 
            description="You don't have any trade service notifications at this moment. You will be notified when artisans reply to your enquiries." 
            icon="fa-bell-slash"
          />
        ) : (
          <div id="notifications-list-container">
            <div className="d-flex flex-column gap-3 mb-4" id="notifications-feed-list">
              {notifications.map((notif) => {
                const isUnread = notif.is_read === 0 || notif.is_read === false;
                
                // Decide Icon based on type
                let iconClass = 'fa-solid fa-bell text-secondary';
                let iconBg = 'bg-secondary-subtle';
                
                const type = (notif.type || 'general').toLowerCase();
                if (type === 'review') {
                  iconClass = 'fa-solid fa-star text-warning';
                  iconBg = 'bg-warning-subtle';
                } else if (type === 'enquiry') {
                  iconClass = 'fa-solid fa-envelope-open-text text-primary';
                  iconBg = 'bg-primary-subtle';
                } else if (type === 'system' || type === 'verify') {
                  iconClass = 'fa-solid fa-shield-halved text-success';
                  iconBg = 'bg-success-subtle';
                }

                // Rewrite link dynamically to point inside the customer dashboard if applicable
                let targetLink = notif.link || '#';
                if (targetLink.startsWith('/enquiries/')) {
                  const enqId = targetLink.split('/').pop();
                  targetLink = `/dashboard/customer/enquiries/${enqId}`;
                } else if (targetLink === '/dashboard' || targetLink === '/dashboard/') {
                  targetLink = '/dashboard/customer';
                }

                return (
                  <div 
                    key={notif.notification_id} 
                    className={`card border rounded-3 p-3 shadow-xs position-relative overflow-hidden transition-all ${
                      isUnread ? 'border-primary bg-light-subtle' : 'bg-white'
                    }`}
                    style={{ transition: 'all 0.15s ease' }}
                  >
                    {/* Unread Indicator Bar */}
                    {isUnread && (
                      <div 
                        className="position-absolute h-100" 
                        style={{ width: '4px', left: '0', top: '0', backgroundColor: '#0d6efd' }}
                      ></div>
                    )}

                    <div className="row align-items-start g-3">
                      {/* Icon Circle */}
                      <div className="col-auto">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center p-2.5 ${iconBg}`}
                          style={{ width: '44px', height: '44px' }}
                        >
                          <i className={`${iconClass} fs-5`}></i>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="col flex-grow-1 text-start">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-1.5 mb-1.5">
                          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                            <span>{notif.title}</span>
                            {isUnread && (
                              <span 
                                className="badge bg-primary rounded-circle p-1.5" 
                                style={{ width: '8px', height: '8px', display: 'inline-block' }}
                                title="Unread"
                              ></span>
                            )}
                          </h6>
                          <span className="text-muted fs-8">
                            {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </div>
                        
                        <p className="text-secondary fs-7 mb-2 text-wrap pr-4" style={{ lineHeight: '1.5' }}>
                          {notif.message}
                        </p>

                        {/* Interactive Link Trigger */}
                        {targetLink !== '#' && (
                          <Link 
                            href={targetLink} 
                            className="btn btn-link p-0 fs-7 text-primary fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          >
                            <span>View details & respond</span>
                            <i className="fa-solid fa-arrow-right fs-8"></i>
                          </Link>
                        )}
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
