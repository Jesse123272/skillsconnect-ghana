'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// DashboardLayout provided by app/dashboard/layout.js; per-page wrapper removed
import ProfileAvatar from '@/components/ProfileAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';

export default function ArtisanEnquiryDetail() {
  const {  user, loading: authLoading , authFetch } = useAuth();
  const router = useRouter();
  const params = useParams();
  const enquiryId = params.id;

  const [enquiry, setEnquiry] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Real-time Chat States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const chatBottomRef = useRef(null);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      const res = await authFetch(`/api/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEnquiry((prev) => prev ? { ...prev, status: newStatus } : prev);
        setSuccessMsg(`Job status updated to ${newStatus.replace('_', ' ')}!`);
      } else {
        setError(data.error || 'Failed to update job status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('An error occurred while updating job status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // FETCH ENQUIRY DETAIL
  const fetchEnquiryDetail = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const response = await authFetch(`/api/enquiries/${enquiryId}`);
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setEnquiry(result.data);
      } else {
        setError(result.error || 'Failed to download enquiry details.');
      }
    } catch (err) {
      console.error('Error fetching enquiry details:', err);
      setError('Could not establish contact with servers.');
    } finally {
      setLoadingData(false);
    }
  }, [enquiryId, authFetch]);

  // FETCH CHAT MESSAGES
  const fetchMessages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/enquiries/${enquiryId}/messages`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          // Compare before setting state
          setMessages((prev) => {
            if (prev.length !== result.data.length) {
              return result.data;
            }
            if (prev.length > 0 && result.data.length > 0 && 
                prev[prev.length - 1].message_id !== result.data[result.data.length - 1].message_id) {
              return result.data;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  }, [enquiryId, authFetch]);

  // Initial loads
  useEffect(() => {
    if (!authLoading && user && enquiryId) {
      const timer = setTimeout(() => {
        fetchEnquiryDetail();
        fetchMessages();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, enquiryId, fetchEnquiryDetail, fetchMessages]);

  // Real-time polling every 3 seconds
  useEffect(() => {
    if (authLoading || !user || !enquiryId) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [enquiryId, user, authLoading, fetchMessages]);

  // Scroll to bottom on message list update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // SUBMIT REPLY
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError(null);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      message_id: tempId,
      sender_id: user.user_id,
      sender_name: user.full_name,
      sender_photo: user.profile_photo,
      sender_role: 'artisan',
      message_text: messageText,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await authFetch(`/api/enquiries/${enquiryId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message_text: messageText })
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        // Replace optimistic message
        setMessages((prev) => 
          prev.map((msg) => msg.message_id === tempId ? result.data : msg)
        );
        setSuccessMsg('Message successfully delivered to customer!');
        // Silently refresh enquiry details to ensure status changes (e.g. status='replied') are kept updated
        fetchEnquiryDetail();
      } else {
        setError(result.error || 'An error occurred while submitting your message.');
        setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError('A connection exception occurred while transmitting your message.');
      setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can reply to enquiries." />
      </div>
    );
  }

  const cleanPhone = enquiry?.customer_phone ? enquiry.customer_phone.replace(/[^0-9]/g, '') : '';
  const waUrl = `https://wa.me/${cleanPhone}`;

  return (
    <>
      <div className="container-fluid px-0" id="artisan-enquiry-detail-view">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <Link href="/dashboard/artisan/enquiries" className="btn btn-sm btn-light text-secondary rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1.5">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Enquiries</span>
          </Link>
          <span className="text-muted fs-8">Enquiry ID: #{enquiryId}</span>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Retrieving enquiry details..." />
        ) : !enquiry ? (
          <div className="text-center py-5">
            <p className="text-muted">No details found for this enquiry ID.</p>
          </div>
        ) : (
          <div className="row g-4">
            
            {/* LEFT COLUMN: REAL-TIME MESSAGING INTERFACE */}
            <div className="col-12 col-lg-7">
              <div className="card border rounded-3 p-0 bg-white shadow-xs overflow-hidden h-100 d-flex flex-column" style={{ minHeight: '550px' }}>
                
                {/* Header info */}
                <div className="px-4 py-3 border-bottom bg-light d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                  <div>
                    <span className="text-muted fs-8.5 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '10px' }}>
                      Work Request Discussion
                    </span>
                    <h5 className="fw-bold text-dark mb-0">{enquiry.subject}</h5>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className={`badge px-2.5 py-1.5 rounded-pill fs-8 text-capitalize ${
                      enquiry.status === 'completed' ? 'bg-success text-white' : enquiry.status === 'in_progress' ? 'bg-primary text-white' : 'bg-warning text-dark'
                    }`}>
                      {enquiry.status ? enquiry.status.replace('_', ' ') : 'Pending'}
                    </span>
                    {enquiry.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={updatingStatus}
                        className="btn btn-sm btn-success rounded-pill px-2.5 py-1 fw-bold text-white fs-8 d-inline-flex align-items-center gap-1"
                      >
                        {updatingStatus ? <span className="spinner-border spinner-border-sm"></span> : <i className="fa-solid fa-check fs-8"></i>}
                        <span>Mark Service Done</span>
                      </button>
                    )}
                    {enquiry.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('in_progress')}
                        disabled={updatingStatus}
                        className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 fw-semibold fs-8"
                      >
                        <span>Mark In Progress</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* MESSAGES THREAD COMPONENT */}
                <div 
                  className="px-4 py-4 d-flex flex-column gap-3.5 flex-grow-1" 
                  style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    backgroundColor: '#fafafb' 
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted fs-7.5">Loading discussion history...</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMyMessage = msg.sender_role === 'artisan' || msg.sender_id === user.user_id;
                      
                      return (
                        <div 
                          key={msg.message_id} 
                          className={`d-flex flex-column ${isMyMessage ? 'align-items-end' : 'align-items-start'}`}
                        >
                          {/* Sender Name & Timestamp */}
                          <div className="d-flex align-items-center gap-2 mb-1">
                            {!isMyMessage && (
                              <span className="fw-bold text-dark fs-7.5">{msg.sender_name}</span>
                            )}
                            <span className="text-muted fs-8">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                            {isMyMessage && (
                              <span className="fw-semibold text-secondary fs-8">You</span>
                            )}
                          </div>

                          {/* Bubble and avatar */}
                          <div className="d-flex gap-2.5 w-100 align-items-start justify-content-start" style={{ flexDirection: isMyMessage ? 'row-reverse' : 'row' }}>
                            <div className="flex-shrink-0">
                              <ProfileAvatar 
                                name={msg.sender_name} 
                                photo_url={msg.sender_photo} 
                                size="xs" 
                              />
                            </div>
                            <div 
                              className="p-3 rounded-3 shadow-2xs fs-7.5" 
                              style={{ 
                                backgroundColor: isMyMessage ? '#1A6B3C' : '#ffffff', 
                                color: isMyMessage ? '#ffffff' : '#1e293b', 
                                border: isMyMessage ? 'none' : '1px solid #e2e8f0',
                                borderRadius: isMyMessage ? '16px 16px 0px 16px' : '0px 16px 16px 16px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-line',
                                maxWidth: '75%'
                              }}
                            >
                              {msg.message_text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* MESSAGE INPUT AREA */}
                <div className="p-3 bg-white border-top">
                  <form onSubmit={handleSendMessage} className="d-flex gap-2.5">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value.substring(0, 1000))}
                      placeholder="Type a response message here... Be polite, clarify scope, coordinate price quotes or timing."
                      className="form-control shadow-none fs-7.5"
                      rows="2"
                      style={{ resize: 'none' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      required
                    ></textarea>
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn btn-primary px-4 fw-bold rounded-3 d-flex flex-column align-items-center justify-content-center gap-1"
                      style={{ minWidth: '100px' }}
                    >
                      {sending ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane fs-6"></i>
                          <span className="fs-8">Reply</span>
                        </>
                      )}
                    </button>
                  </form>
                  <div className="form-text text-muted fs-8.5 mt-1.5 d-flex justify-content-between">
                    <span>Press Enter to send, Shift+Enter for new line.</span>
                    <span>Max 1000 characters.</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: ACTION & CONTACT */}
            <div className="col-12 col-lg-5">
              
              {/* CONTACT BOX */}
              <div className="card border rounded-3 p-4 bg-white shadow-xs mb-4">
                <h5 className="fw-bold text-dark mb-3">Client Information</h5>
                
                <div className="d-flex align-items-center gap-3 mb-4 p-2 bg-light rounded-3 border-0">
                  <div 
                    className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: '52px', height: '52px', fontSize: '16px' }}
                  >
                    {enquiry.customer_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <strong className="text-dark fs-6 d-block">{enquiry.customer_name}</strong>
                    <span className="text-muted fs-8 uppercase tracking-wider fw-semibold">SkillsConnect Customer</span>
                  </div>
                </div>

                {/* Quick Info contacts */}
                <div className="d-flex flex-column gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="rounded-2 bg-light p-2 text-muted" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-envelope fs-7"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block fs-8.5">Email Address</small>
                      <a href={`mailto:${enquiry.customer_email}`} className="text-primary text-decoration-none fs-7 fw-semibold">
                        {enquiry.customer_email}
                      </a>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2.5">
                    <div className="rounded-2 bg-light p-2 text-muted" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-phone fs-7"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block fs-8.5">Phone Number</small>
                      <a href={`tel:${enquiry.customer_phone}`} className="text-dark text-decoration-none fs-7 fw-semibold">
                        {enquiry.customer_phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* WHATSAPP LINK */}
                {enquiry.customer_phone && (
                  <div className="border-top pt-3.5 mt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success w-100 py-2.5 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                    >
                      <i className="fa-brands fa-whatsapp fs-5"></i>
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>

              {/* COMMUNICATING PRECAUTIONS */}
              <div className="card border rounded-3 p-4 bg-amber-50 border-amber-200">
                <h6 className="fw-bold text-amber-950 mb-2 d-flex align-items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved text-amber-600"></i>
                  <span>Secure Trade Guidelines</span>
                </h6>
                <ul className="text-amber-900 fs-8 mb-0 ps-3 d-flex flex-column gap-1.5" style={{ lineHeight: '1.4' }}>
                  <li>Discuss scope requirements and milestone expectations before beginning.</li>
                  <li>Keep discussions polite and reference clear trade rates.</li>
                  <li>Do not share passwords or payment credentials over messages.</li>
                </ul>
              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
}
