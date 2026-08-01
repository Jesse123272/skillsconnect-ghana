'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import StarRating from '@/components/StarRating';
import ProfileAvatar from '@/components/ProfileAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerEnquiryDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [enquiry, setEnquiry] = useState(null);
  const [artisanProfile, setArtisanProfile] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Real-time Chat States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const chatBottomRef = useRef(null);

  // Paystack Payment States
  const [payAmount, setPayAmount] = useState('150');
  const [payNote, setPayNote] = useState('');
  const [initializingPay, setInitializingPay] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePayArtisan = async (e) => {
    e.preventDefault();
    const amtGhs = parseFloat(payAmount);
    if (!payAmount || isNaN(amtGhs) || amtGhs <= 0) {
      setPayError('Please enter a valid positive amount in Ghana Cedis (GHS).');
      return;
    }

    try {
      setInitializingPay(true);
      setPayError('');
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amtGhs,
          enquiry_id: id,
          artisan_id: enquiry?.artisan_id,
          note: payNote || `Service payment for "${enquiry?.subject || 'Artisan Service'}"`
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        setPayError(data.error || 'Failed to initialize Paystack payment gateway.');
      }
    } catch (err) {
      console.error('Paystack initialization error:', err);
      setPayError('A network error occurred while initializing Paystack payment.');
    } finally {
      setInitializingPay(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEnquiry((prev) => prev ? { ...prev, status: newStatus } : prev);
      } else {
        setError(data.error || 'Failed to update enquiry status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('An error occurred while updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Fetch parent details
  const fetchEnquiryDetails = useCallback(async () => {
    try {
      // Fetch Enquiry Detail
      const enqRes = await fetch(`/api/enquiries/${id}`);
      if (!enqRes.ok) {
        throw new Error('Failed to retrieve enquiry thread details.');
      }
      
      const enqData = await enqRes.json();
      if (!enqData.success || !enqData.data) {
        throw new Error(enqData.error || 'Enquiry details could not be found.');
      }

      const enquiryObj = enqData.data;
      setEnquiry(enquiryObj);

      // Fetch Artisan Full Profile to get rating, category etc.
      const artisanRes = await fetch(`/api/artisans/${enquiryObj.artisan_id}`);
      if (artisanRes.ok) {
        const artisanData = await artisanRes.json();
        if (artisanData.success && artisanData.data) {
          setArtisanProfile(artisanData.data);
        }
      }

      // Fetch My Reviews to check if I have already reviewed this artisan
      const reviewCheckRes = await fetch('/api/reviews?user_id=me');
      if (reviewCheckRes.ok) {
        const reviewData = await reviewCheckRes.json();
        if (reviewData.success && Array.isArray(reviewData.data)) {
          const alreadyReviewed = reviewData.data.some(
            (r) => parseInt(r.artisan_id, 10) === parseInt(enquiryObj.artisan_id, 10)
          );
          setHasReviewed(alreadyReviewed);
        }
      }

    } catch (err) {
      console.error('Error fetching enquiry details:', err);
      setError(err.message || 'An error occurred while loading this enquiry page.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch thread messages
  const fetchMessages = useCallback(async (showLoading = false) => {
    try {
      const res = await fetch(`/api/enquiries/${id}/messages`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          // Compare length before setting state to prevent excess re-renders
          setMessages((prev) => {
            if (prev.length !== result.data.length) {
              return result.data;
            }
            // Check if last message timestamp changed
            if (prev.length > 0 && result.data.length > 0 && 
                prev[prev.length - 1].message_id !== result.data[result.data.length - 1].message_id) {
              return result.data;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching thread messages:', err);
    }
  }, [id]);

  // Initial loads
  useEffect(() => {
    if (authLoading || !user) return;
    if (id) {
      const timer = setTimeout(() => {
        fetchEnquiryDetails();
        fetchMessages();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [id, user, authLoading, fetchEnquiryDetails, fetchMessages]);

  // Real-time polling every 3 seconds
  useEffect(() => {
    if (authLoading || !user || !id) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [id, user, authLoading, fetchMessages]);

  // Scroll to bottom on messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      message_id: tempId,
      sender_id: user.user_id,
      sender_name: user.full_name,
      sender_photo: user.profile_photo,
      sender_role: 'customer',
      message_text: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/enquiries/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message_text: messageText })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Replace optimistic message with actual DB message
          setMessages((prev) => 
            prev.map((msg) => msg.message_id === tempId ? result.data : msg)
          );
        } else {
          setError(result.error || 'Failed to transmit message.');
          // Remove optimistic message on failure
          setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
        }
      } else {
        setError('Failed to contact server to transmit message.');
        setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('A connection exception occurred while sending your message.');
      setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user) {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Redirecting to login..." />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Retrieving communication thread..." />;
  }

  if (error || !enquiry) {
    return (
      <DashboardLayout role="customer" pageTitle="Enquiry Details">
        <div className="p-4" id="enquiry-error-view">
          <AlertMessage type="danger" message={error || 'Enquiry details could not be loaded.'} />
          <Link href="/dashboard/customer/enquiries" className="btn btn-primary rounded-pill">
            <i className="fa-solid fa-arrow-left me-2"></i>
            <span>Back to My Enquiries</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const rating = parseFloat(artisanProfile?.average_rating || 0);
  const totalReviews = parseInt(artisanProfile?.total_reviews || 0, 10);
  const status = (enquiry.status || 'pending').toLowerCase();

  return (
    <DashboardLayout role="customer" pageTitle={`Enquiry Ref: #SC-${enquiry.enquiry_id}`}>
      <div className="container-fluid px-0" id="customer-enquiry-thread">
        
        {/* Back navigation Row */}
        <div className="mb-4">
          <Link 
            href="/dashboard/customer/enquiries" 
            className="btn btn-outline-secondary px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5 hover-bg-light"
          >
            <i className="fa-solid fa-arrow-left fs-7"></i>
            <span>Back to Enquiries</span>
          </Link>
        </div>

        {/* 1. ARTISAN INFO HEADER CARD */}
        <div className="card border rounded-3 p-4 bg-light mb-4 shadow-xs" id="enquiry-artisan-header-card">
          <div className="row align-items-center g-3">
            <div className="col-auto">
              <ProfileAvatar 
                name={enquiry.artisan_name} 
                photo_url={enquiry.artisan_photo} 
                size="lg" 
              />
            </div>
            <div className="col flex-grow-1">
              <span className="badge bg-primary text-white text-capitalize rounded-pill px-2.5 py-1 mb-2 fs-8">
                {artisanProfile?.category_name || 'Verified Artisan'}
              </span>
              <h4 className="fw-bold text-dark mb-1">{enquiry.artisan_name}</h4>
              
              <div className="d-flex flex-wrap align-items-center gap-3 fs-7 text-secondary mt-1">
                {/* Rating row */}
                <div className="d-flex align-items-center gap-1.5">
                  <StarRating rating={rating} size="sm" />
                  <strong className="text-dark">{rating.toFixed(1)}</strong>
                  <span className="text-muted">({totalReviews} reviews)</span>
                </div>
                
                {/* Location row */}
                {artisanProfile && (
                  <div className="d-flex align-items-center gap-1">
                    <i className="fa-solid fa-location-dot text-danger"></i>
                    <span>{artisanProfile.district ? `${artisanProfile.district}, ${artisanProfile.region}` : artisanProfile.region}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-12 col-md-auto text-md-end">
              <Link 
                href={`/artisans/${enquiry.artisan_id}`} 
                className="btn btn-sm btn-outline-primary px-4 py-2 rounded-pill fw-semibold"
              >
                View Profile Page
              </Link>
            </div>
          </div>
        </div>

        {/* 2. SUBJECT HEADING BLOCK WITH STATUS CONTROL */}
        <div className="bg-white p-3.5 rounded-3 border mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-xs" id="enquiry-subject-bar">
          <div>
            <span className="text-muted fs-8 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '11px' }}>
              Enquiry Subject
            </span>
            <h5 className="fw-bold text-dark mb-0">{enquiry.subject}</h5>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className={`badge px-3 py-2 rounded-pill fs-7 text-capitalize ${
              status === 'completed' ? 'bg-success text-white' : status === 'in_progress' ? 'bg-primary text-white' : 'bg-warning text-dark'
            }`}>
              Status: {status.replace('_', ' ')}
            </span>
            {status !== 'completed' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('completed')}
                disabled={updatingStatus}
                className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-bold text-white d-inline-flex align-items-center gap-1 shadow-2xs"
              >
                {updatingStatus ? <span className="spinner-border spinner-border-sm" role="status"></span> : <i className="fa-solid fa-check-circle fs-8"></i>}
                <span>Mark Service Completed</span>
              </button>
            )}
            {status === 'pending' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={updatingStatus}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold"
              >
                <span>Mark In Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* PAYSTACK SECURE PAYMENT CARD */}
        <div className="card border-primary border-opacity-25 rounded-3 p-4 bg-white mb-4 shadow-sm" id="paystack-payment-card">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-7">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fs-8 fw-bold">
                  <i className="fa-solid fa-lock me-1"></i> Paystack Ghana Escrow
                </span>
                <span className="text-muted fs-8">MTN MoMo • Telecel • Cards</span>
              </div>
              <h5 className="fw-bold text-dark mb-1">
                Pay {enquiry.artisan_name} Securely
              </h5>
              <p className="text-secondary fs-7.5 mb-0">
                Send service payments or deposits directly to this artisan. Payments are held safely until you confirm job satisfaction.
              </p>
            </div>

            <div className="col-12 col-lg-5">
              <form onSubmit={handlePayArtisan} className="p-3 bg-light rounded-3 border">
                {payError && (
                  <div className="alert alert-danger py-1.5 px-2.5 fs-8 mb-2.5 rounded-2 d-flex align-items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation fs-9"></i>
                    <span>{payError}</span>
                  </div>
                )}
                
                <div className="mb-2.5">
                  <label className="form-label fs-8 fw-bold text-dark mb-1">Payment Amount (GHS)</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white fw-bold text-dark">GHS</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-control fw-bold text-dark shadow-none"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="e.g. 150"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm text-secondary shadow-none fs-8"
                    placeholder="Payment note (optional, e.g. Deposit for materials)"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={initializingPay || !payAmount}
                  className="btn btn-success w-100 py-2 rounded-pill fw-bold text-white fs-7 d-flex align-items-center justify-content-center gap-2 shadow-2xs"
                >
                  {initializingPay ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Connecting Paystack...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-credit-card fs-8"></i>
                      <span>Pay GHS {payAmount || '0'} via Paystack</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 3. CONVERSATION THREAD */}
        <div className="card border rounded-3 p-0 bg-white mb-4 shadow-sm overflow-hidden" id="enquiry-conversation-thread">
          <div className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="fw-bold text-dark fs-6 d-inline-flex align-items-center gap-2">
              <i className="fa-regular fa-comments text-primary"></i>
              <span>Real-Time Discussion Thread</span>
            </span>
            <span className="text-muted fs-8 d-flex align-items-center gap-1.5">
              <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '8px', height: '8px' }}></span>
              <span>Live discussion active</span>
            </span>
          </div>

          {/* CHAT MESSAGES PANEL */}
          <div 
            className="px-4 py-4 d-flex flex-column gap-3.5" 
            style={{ 
              maxHeight: '450px', 
              overflowY: 'auto', 
              backgroundColor: '#fafafb' 
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted fs-7.5">Loading message history...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMyMessage = msg.sender_role === 'customer' || msg.sender_id === user.user_id;
                
                return (
                  <div 
                    key={msg.message_id} 
                    className={`d-flex flex-column ${isMyMessage ? 'align-items-end' : 'align-items-start'}`}
                  >
                    {/* Timestamp & Sender Name */}
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

                    {/* Chat Bubble Group */}
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

          {/* CHAT INPUT FORM FOOTER */}
          <div className="p-3 bg-white border-top">
            <form onSubmit={handleSendMessage} className="d-flex gap-2.5">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value.substring(0, 1000))}
                placeholder="Type your message here to discuss project requirements, trade pricing, or availability..."
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
                    <span className="fs-8">Send</span>
                  </>
                )}
              </button>
            </form>
            <div className="form-text text-muted fs-8.5 mt-1.5 d-flex justify-content-between">
              <span>Press Enter to send, Shift+Enter for new line.</span>
              <span>Maximum 1000 characters.</span>
            </div>
          </div>
        </div>

        {/* 4. ACTIONS / WRITE REVIEW CTA BLOCK */}
        {!hasReviewed ? (
          <div className={`card border rounded-3 p-4 text-center ${status === 'completed' ? 'bg-warning-subtle border-warning' : 'bg-light'} shadow-xs animate__animated animate__fadeIn mb-4`} id="enquiry-review-cta-card">
            <div className="rounded-circle bg-warning text-dark p-3 d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="fa-solid fa-star fs-3"></i>
            </div>
            <h5 className="fw-bold text-dark mb-1">
              {status === 'completed' ? 'Service Completed! Leave Your Rating & Review' : `How was your interaction with ${enquiry.artisan_name}?`}
            </h5>
            <p className="text-secondary fs-7 mb-4 px-2" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Your feedback is crucial for maintaining top quality standards on SkillsConnect Ghana! Share your ratings on speed, work quality, communication, and cost honesty.
            </p>
            <Link 
              href={`/dashboard/customer/reviews/new?artisan_id=${enquiry.artisan_id}`} 
              className="btn btn-warning px-5 py-2.5 rounded-pill shadow-sm fw-bold text-dark d-inline-flex align-items-center gap-2 mx-auto"
            >
              <i className="fa-solid fa-pen-nib"></i>
              <span>{status === 'completed' ? 'Write Review Now ★★★★★' : 'Leave a Review for this Artisan'}</span>
            </Link>
          </div>
        ) : (
          <div className="card border rounded-3 p-3 bg-success-subtle text-success text-center mb-4" id="review-already-submitted-badge">
            <span className="fs-7.5 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
              <i className="fa-solid fa-circle-check fs-6"></i>
              <span>You have already submitted a rating & review for {enquiry.artisan_name}. Thank you!</span>
            </span>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
