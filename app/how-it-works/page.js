'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HowItWorks() {
  const [activeSegment, setActiveSegment] = useState('customer'); // 'customer' or 'artisan'

  return (
    <div className="d-flex flex-column min-vh-100" id="how-it-works-page">
      <Navbar />

      {/* Hero bar */}
      <div className="bg-light border-bottom py-5" id="how-it-works-hero">
        <div className="container text-center py-4">
          <h1 className="display-6 fw-bold text-dark mb-2">How SkillsConnect Ghana Works</h1>
          <p className="text-muted mx-auto lead" style={{ maxWidth: '650px' }}>
            A transparent, trust-first domestic trade ecosystem engineered for quality-minded customers and local professional providers.
          </p>
        </div>
      </div>

      <div className="container flex-grow-1 py-5 text-start">
        
        {/* Toggle Switch */}
        <div className="d-flex justify-content-center mb-5">
          <div className="bg-white p-1.5 rounded-pill border d-flex gap-1 shadow-sm" id="how-it-works-toggle-switch">
            <button
              onClick={() => setActiveSegment('customer')}
              className={`btn px-4 py-2 rounded-pill fw-semibold border-0 fs-7 ${activeSegment === 'customer' ? 'btn-primary text-white' : 'btn-light text-muted bg-transparent'}`}
              type="button"
            >
              I am a Customer
            </button>
            <button
              onClick={() => setActiveSegment('artisan')}
              className={`btn px-4 py-2 rounded-pill fw-semibold border-0 fs-7 ${activeSegment === 'artisan' ? 'btn-primary text-white' : 'btn-light text-muted bg-transparent'}`}
              type="button"
            >
              I am an Artisan
            </button>
          </div>
        </div>

        {/* Dynamic Column Breakdown */}
        {activeSegment === 'customer' ? (
          /* FOR CUSTOMER TIMELINE */
          <div className="row justify-content-center" id="customer-guide">
            <div className="col-lg-10">
              <div className="row g-4">
                
                {/* Step 1 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4">1</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Search Specialty</h5>
                    <p className="text-secondary small mb-0">Browse through certified listings by specialty (plumber, painter, welder), location/region, and real-time reviews to match your exact needs.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4">2</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Submit Enquiry</h5>
                    <p className="text-secondary small mb-0">Directly contact your preferred artisan by entering work specifications and location. No broker margins, commissions, or hidden platform fees.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4">3</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Work & Review</h5>
                    <p className="text-secondary small mb-0">Once the trade job is completed, leave an honest, public review and rating on their profile page to build platform integrity and assist other neighbors.</p>
                  </div>
                </div>

              </div>

              {/* Callout Customer card */}
              <div className="card border rounded-4 bg-light p-4 mt-5">
                <div className="row align-items-center">
                  <div className="col-md-8 text-start">
                    <h5 className="fw-bold text-dark mb-1">Looking for high quality hands right now?</h5>
                    <p className="text-muted small mb-0">Find top-rated technicians with confirmed experience in all 16 regions of Ghana.</p>
                  </div>
                  <div className="col-md-4 mt-3 mt-md-0 d-flex justify-content-md-end">
                    <Link href="/browse" className="btn btn-primary rounded-pill px-4 py-2.5 shadow-sm fw-semibold">
                      Start Browsing Artisans
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* FOR ARTISAN TIMELINE */
          <div className="row justify-content-center" id="artisan-guide">
            <div className="col-lg-10">
              <div className="row g-4">
                
                {/* Step 1 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4 text-dark">1</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Register Specialty</h5>
                    <p className="text-secondary small mb-0">Sign up as an artisan, specify your local craft, biography, years active, and upload past work photos to make your gallery stand out to prospective clients.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4 text-dark">2</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Direct Service Leads</h5>
                    <p className="text-secondary small mb-0">Receive email alerts and internal notifications immediately when customers request your services. Negotiate details, schedules, and pricing directly.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="col-md-4">
                  <div className="card border-0 rounded-4 p-4 bg-white shadow-sm h-100 text-center">
                    <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4 text-dark">3</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Build Trade Status</h5>
                    <p className="text-secondary small mb-0">Deliver amazing service to get 5-star ratings. Higher ratings rank you at the top of local browse results, generating consistent, sustainable income flows.</p>
                  </div>
                </div>

              </div>

              {/* Callout Artisan card */}
              <div className="card border rounded-4 bg-light p-4 mt-5">
                <div className="row align-items-center">
                  <div className="col-md-8 text-start">
                    <h5 className="fw-bold text-dark mb-1">Want to expand your domestic trade customer base?</h5>
                    <p className="text-muted small mb-0">Register your specialty trade, get verified, and access hundreds of leads right in your district.</p>
                  </div>
                  <div className="col-md-4 mt-3 mt-md-0 d-flex justify-content-md-end">
                    <Link href="/register" className="btn btn-primary rounded-pill px-4 py-2.5 shadow-sm fw-semibold">
                      Register as Provider
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
