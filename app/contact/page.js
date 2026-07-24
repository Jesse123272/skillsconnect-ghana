'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please complete all form fields.');
      return;
    }

    if (message.trim().length < 10) {
      toast.error('Your message must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Your message has been sent successfully! We will contact you soon.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to dispatch contact message.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" id="contact-us-page">
      <Navbar />

      {/* Hero bar */}
      <div className="bg-light border-bottom py-5" id="contact-hero">
        <div className="container text-center py-4">
          <h1 className="display-6 fw-bold text-dark mb-2">Get in Touch</h1>
          <p className="text-muted mx-auto lead" style={{ maxWidth: '600px' }}>
            Have questions about account verification, custom partnerships, or technical support? Our local team is here to assist.
          </p>
        </div>
      </div>

      <div className="container flex-grow-1 py-5 my-2 text-start">
        <div className="row g-5">
          
          {/* Left Column: Contact details cards */}
          <div className="col-lg-5">
            <h3 className="fw-bold text-dark mb-4">Contact Information</h3>
            <p className="text-secondary small mb-4" style={{ lineHeight: '1.7' }}>
              Feel free to reach out to us during standard local working hours (Monday to Friday, 8:00 AM - 5:00 PM GMT). We strive to respond to all inquiries within 24 hours.
            </p>

            <div className="d-flex flex-column gap-3">
              {/* Card 1: Office address */}
              <div className="card border-0 rounded-4 bg-white p-3.5 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                    <i className="fa-solid fa-map-location-dot fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Our Headquarters</h6>
                    <p className="text-muted small mb-0">Ghana Communication Technology University, Accra</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Support Email */}
              <div className="card border-0 rounded-4 bg-white p-3.5 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success-subtle text-success p-3 rounded-circle">
                    <i className="fa-solid fa-envelope-open fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Email Support</h6>
                    <p className="text-muted small mb-0">skillsconnectgh@zohomail.com</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Hotlines */}
              <div className="card border-0 rounded-4 bg-white p-3.5 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                    <i className="fa-solid fa-phone-volume fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Office Hotlines</h6>
                    <p className="text-muted small mb-0">+233530600127</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive contact form */}
          <div className="col-lg-7">
            <div className="card border rounded-4 p-4 p-md-5 bg-white shadow-sm" id="contact-form-card">
              <h4 className="fw-bold text-dark mb-3">Send a Message</h4>
              
              <form onSubmit={handleContactSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-medium">Your Name</label>
                    <input
                      type="text"
                      className="form-control text-secondary small"
                      placeholder="e.g. Ama Serwaa"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-medium">Email Address</label>
                    <input
                      type="email"
                      className="form-control text-secondary small"
                      placeholder="ama@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium">Subject</label>
                  <input
                    type="text"
                    className="form-control text-secondary small"
                    placeholder="e.g. Question about Artisan Verification process"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-medium">Message Body</label>
                  <textarea
                    className="form-control text-secondary small"
                    rows="6"
                    placeholder="Describe your request in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    minLength={10}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4.5 py-2.5 fw-semibold shadow fs-7"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting Message...
                    </>
                  ) : (
                    'Submit Message'
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
