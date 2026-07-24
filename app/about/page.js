'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <div className="d-flex flex-column min-vh-100" id="about-us-page">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-light border-bottom py-5" id="about-hero-section">
        <div className="container text-center py-4">
          <h1 className="display-5 fw-bold text-dark mb-3">Empowering Ghanaian Artisans</h1>
          <p className="text-muted mx-auto lead" style={{ maxWidth: '700px' }}>
            SkillsConnect Ghana is a modern, trust-driven digital marketplace matching verified local artisans with customers who demand excellence.
          </p>
        </div>
      </div>

      {/* Main Mission Content */}
      <div className="container py-5 my-2 text-start">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <h2 className="fw-bold text-dark mb-3">Our Mission</h2>
            <p className="text-secondary fs-6 mb-4" style={{ lineHeight: '1.7' }}>
              In Ghana, finding a reliable, high-quality plumber, electrician, carpenter, or mason often relies on tedious word-of-mouth recommendations that can lead to inconsistent quality, pricing confusion, and missed connections.
            </p>
            <p className="text-secondary fs-6 mb-4" style={{ lineHeight: '1.7' }}>
              SkillsConnect Ghana was founded with a single mission: to build a digital bridge that connects talented, certified local service providers directly with families, property managers, and businesses. We promote professional integrity, fair local wages, and absolute reliability.
            </p>
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-success-subtle text-success p-2.5 rounded-3">
                  <i className="fa-solid fa-circle-check fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">100% Verified Professionals</h6>
                  <p className="text-muted small mb-0">Every artisan listed on our platform undergoes strict manual credential and identity verification.</p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <div className="bg-warning-subtle text-warning p-2.5 rounded-3">
                  <i className="fa-solid fa-star fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Trust-Based Reviews</h6>
                  <p className="text-muted small mb-0">Real clients provide authentic post-service ratings and review logs so quality is transparently proven.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card bg-primary text-white p-4 p-md-5 rounded-4 border-0 shadow" id="about-brand-pillars">
              <h3 className="fw-bold text-white mb-4">Platform Core Pillars</h3>
              <div className="d-flex flex-column gap-4">
                <div className="border-bottom border-light border-opacity-20 pb-3">
                  <h5 className="fw-bold text-warning mb-1">Empowering Local Talents</h5>
                  <p className="text-white-50 small mb-0">We assist independent local service experts in building an online presence, accessing wider client bases, and generating reliable daily trade income.</p>
                </div>
                <div className="border-bottom border-light border-opacity-20 pb-3">
                  <h5 className="fw-bold text-warning mb-1">National Wide Access</h5>
                  <p className="text-white-50 small mb-0">Active across all 16 administrative regions of Ghana, ensuring that whether you are in Accra, Kumasi, Tamale, or Ho, a certified specialist is nearby.</p>
                </div>
                <div>
                  <h5 className="fw-bold text-warning mb-1">Seamless Communication</h5>
                  <p className="text-white-50 small mb-0">Our platform ensures direct communication with no hidden margins. Clients send secure service enquiries directly to the specialists.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stats Callout */}
      <div className="bg-light py-5 border-top border-bottom" id="about-join-community-cta">
        <div className="container text-center py-3">
          <h3 className="fw-bold text-dark mb-3">Ready to find trusted hands?</h3>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '600px' }}>Join thousands of satisfied Ghanaian homeowners and business owners today by hiring top-rated local technicians.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link href="/browse" className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm">
              Browse Artisans
            </Link>
            <Link href="/register" className="btn btn-outline-secondary px-4 py-2.5 rounded-pill bg-white">
              Join as Provider
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
