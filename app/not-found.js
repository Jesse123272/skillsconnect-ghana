'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="d-flex flex-column min-vh-100" id="not-found-page">
      <Navbar />

      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container py-4 text-center">
          
          <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-4 animate__animated animate__pulse animate__infinite" style={{ width: '100px', height: '100px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '48px' }}></i>
          </div>

          <h1 className="display-4 fw-bold text-dark mb-2">404 - Page Not Found</h1>
          <p className="text-secondary mx-auto mb-5" style={{ maxWidth: '500px', fontSize: '1.1rem' }}>
            Sorry, we couldn&apos;t find the page or the artisan profile you are looking for. It may have been moved, removed, or doesn&apos;t exist.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <Link href="/" className="btn btn-primary px-4 py-2.5 rounded-pill shadow fw-semibold fs-7">
              <i className="fa-solid fa-house me-1.5"></i>
              Return Home
            </Link>
            <Link href="/browse" className="btn btn-outline-secondary px-4 py-2.5 rounded-pill bg-white fw-semibold fs-7">
              <i className="fa-solid fa-magnifying-glass me-1.5"></i>
              Browse Artisans
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
