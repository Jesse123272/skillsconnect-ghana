'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';

export default function ArtisanNotifications() {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // FETCH NOTIFICATIONS
  const fetchNotifications = async (page) => {
    try {
      setLoadingData(true);
      setErrorMsg(null);

      const response = await fetch(`/api/notifications?page=${page}&limit=10`);
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setNotifications(result.data.notifications || []);
        setTotalPages(result.data.totalPages || 1);
        setCurrentPage(result.data.page || 1);
        setTotalCount(result.data.total || 0);
      } else {
        setErrorMsg(result.error || 'Failed to download notification history.');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setErrorMsg('Could not establish contact with notification servers.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        fetchNotifications(currentPage);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, currentPage]);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // MARK ALL AS READ
  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await fetch('/api/notifications', {
        method: 'PUT'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg('All notification records marked as read!');
        // Update local list state
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: 1 })));
      } else {
        setErrorMsg(result.error || 'Could not update notification read status.');
      }
    } catch (err) {
      console.error('Error marking all read:', err);
      setErrorMsg('A connection error occurred. Please retry.');
    } finally {
      setActionLoading(false);
    }
  };

  // MARK SINGLE AS READ
  const handleMarkSingleRead = async (notifId) => {
    if (!notifId) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await fetch(`/api/notifications/${notifId}`, {
        method: 'PUT'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notifId ? { ...notif, is_read: 1 } : notif
          )
        );
      } else {
        setErrorMsg(result.error || 'Failed to mark specific notification as read.');
      }
    } catch (err) {
      console.error('Error marking single read:', err);
      setErrorMsg('Network error while marking notification.');
    }
  };

  // DELETE SINGLE NOTIFICATION
  const handleDeleteSingle = async (notifId) => {
    if (!notifId) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await fetch(`/api/notifications/${notifId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg('Notification record has been deleted.');
        // Remove from local list state
        setNotifications((prev) => prev.filter((notif) => notif.notification_id !== notifId));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        setErrorMsg(result.error || 'Could not delete the notification record.');
      }
    } catch (err) {
      console.error('Error deleting single notification:', err);
      setErrorMsg('Failed to establish connection to delete notification.');
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access notification lists." />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <DashboardLayout role="artisan" pageTitle="Alert Notifications">
      <div className="container-fluid px-0" id="artisan-notifications-view">
        
        {/* Title Block */}
        <div className="mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">Alert Notifications</h4>
            <p className="text-muted mb-0 fs-7">
              Manage real-time system alerts, enquiries, review messages, and approval notifications.
            </p>
          </div>

          {/* Mark All Read Button */}
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="btn btn-outline-primary rounded-pill px-3.5 py-2 fs-7.5 fw-bold d-inline-flex align-items-center gap-2"
              style={{ cursor: actionLoading ? 'not-allowed' : 'pointer' }}
            >
              {actionLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="fa-solid fa-square-check"></i>
              )}
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {errorMsg && <AlertMessage type="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />}
        {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Downloading notifications feed..." />
        ) : notifications.length === 0 ? (
          <div className="card border rounded-3 p-5 bg-white shadow-xs text-center">
            <EmptyState
              title="Inbox is empty!"
              description="You do not have any notification logs or alerts stored in your account history."
              icon="fa-bell-slash"
            />
          </div>
        ) : (
          <div className="card border rounded-3 bg-white shadow-xs overflow-hidden" id="notifications-list-card">
            <div className="card-header bg-light border-bottom p-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark fs-7">Notification History Logs</span>
              <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold fs-8">
                {unreadCount} Unread alerts
              </span>
            </div>

            {/* List holder */}
            <div className="list-group list-group-flush" id="notifications-history-list">
              {notifications.map((notif) => {
                const isUnread = notif.is_read === 0;

                // Determine icon type
                let iconClass = 'fa-bell text-secondary';
                if (notif.type === 'enquiry') iconClass = 'fa-envelope text-info';
                if (notif.type === 'enquiry_reply') iconClass = 'fa-reply text-success';
                if (notif.type === 'review') iconClass = 'fa-star text-warning';

                return (
                  <div
                    key={notif.notification_id}
                    className={`list-group-item p-3.5 d-flex align-items-start gap-3 transition-colors ${isUnread ? 'bg-primary-subtle border-start border-primary border-4' : 'bg-transparent'}`}
                    id={`notif-item-${notif.notification_id}`}
                    style={{ transition: 'background-color 0.2s', borderLeftWidth: isUnread ? '4px' : '0px' }}
                  >
                    
                    {/* Icon circle */}
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0 border"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <i className={`fa-solid ${iconClass} fs-5`}></i>
                    </div>

                    {/* Content text */}
                    <div className="flex-grow-1">
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start mb-1.5 gap-1">
                        <div>
                          <h6 className={`fw-bold mb-0.5 ${isUnread ? 'text-dark' : 'text-secondary'}`}>
                            {notif.title || 'System Notification'}
                          </h6>
                          <small className="text-muted fs-8">
                            {notif.created_at ? new Date(notif.created_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                          </small>
                        </div>

                        {/* Actions block */}
                        <div className="d-flex align-items-center gap-1.5 ms-sm-auto mt-2 mt-sm-0">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => handleMarkSingleRead(notif.notification_id)}
                              className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 fs-8.5 fw-semibold"
                              title="Mark as read"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(notif.notification_id)}
                            className="btn btn-xs btn-link text-danger p-1 fs-8.5 hover-text-danger"
                            title="Delete notification"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>

                      {/* Msg */}
                      <p className={`mb-2 fs-7.5 ${isUnread ? 'text-dark fw-medium' : 'text-secondary'}`}>
                        {notif.message}
                      </p>

                      {/* Link action */}
                      {notif.link && (
                        <div>
                          <Link
                            href={notif.link}
                            onClick={() => {
                              if (isUnread) handleMarkSingleRead(notif.notification_id);
                            }}
                            className="btn btn-xs btn-primary rounded-pill px-3 py-1 fs-8 fw-bold text-decoration-none mt-1 d-inline-flex align-items-center gap-1"
                          >
                            <span>Action View</span>
                            <i className="fa-solid fa-angle-right fs-9"></i>
                          </Link>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* CARD FOOTER INFO */}
            <div className="card-footer bg-light border-top p-3 text-muted fs-8">
              Showing {notifications.length} of {totalCount} total alerts in your log history.
            </div>
          </div>
        )}

        {/* PAGINATION */}
        {!loadingData && totalPages > 1 && (
          <div className="mt-4">
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
