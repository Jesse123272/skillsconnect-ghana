import React from 'react';
import Link from 'next/link';
import AiMatchmaker from '@/components/AiMatchmaker';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import ArtisanCard from '@/components/ArtisanCard';
import StarRating from '@/components/StarRating';
import AnimatedCounter from '@/components/AnimatedCounter';
import { query } from '@/lib/db';

export const revalidate = 0; // Ensure live data on every load

export default async function Home() {
  let stats = {
    total_artisans: 0,
    total_reviews: 0,
    total_categories: 10,
    regions_covered: 16
  };

  let categories = [];
  let featuredArtisans = [];
  let testimonials = [];
  const quickSearches = ['Plumbing', 'Electrical', 'Carpentry', 'Tailoring', 'Painting', 'Cleaning'];
  const publicStatsStartAt = process.env.PUBLIC_STATS_START_AT || '2026-08-19 10:00:00';

  try {
    const [
      artisansCountRes,
      reviewsCountRes,
      categoriesCountRes,
      regionsCountRes,
      categoriesRes,
      artisansRes
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 1 AND created_at >= ?", [publicStatsStartAt]),
      query("SELECT COUNT(*) as count FROM reviews WHERE is_approved = 1 AND created_at >= ?", [publicStatsStartAt]),
      query("SELECT COUNT(*) as count FROM categories WHERE is_active = 1"),
      query("SELECT COUNT(DISTINCT region) as count FROM users WHERE role = 'artisan' AND region IS NOT NULL AND region != ''"),
      query("SELECT category_id, category_name, icon_class FROM categories WHERE is_active = 1 ORDER BY category_name ASC"),
      query(`
        SELECT 
          u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo,
          ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at,
          c.category_name, c.icon_class
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        WHERE u.is_active = 1 AND ap.is_approved = 1
        ORDER BY ap.average_rating DESC, ap.total_reviews DESC
        LIMIT 6
      `)
    ]);

    let platformTestimonials = [];
    try {
      platformTestimonials = await query(`
        SELECT t.testimonial_id as review_id, t.customer_id, t.rating, t.testimonial_text as review_text, t.created_at,
               u.full_name as customer_name, u.profile_photo as customer_photo,
               NULL as artisan_name
        FROM testimonials t
        INNER JOIN users u ON t.customer_id = u.user_id
        WHERE t.status = 'approved'
        ORDER BY t.created_at DESC
        LIMIT 3
      `);
    } catch {
      // testimonials table may not exist in all environments
    }

    stats = {
      total_artisans: Number(artisansCountRes[0]?.count) || 0,
      total_reviews: Number(reviewsCountRes[0]?.count) || 0,
      total_categories: categoriesCountRes[0]?.count || 10,
      regions_covered: Math.max(16, regionsCountRes[0]?.count || 16)
    };

    categories = categoriesRes || [];

    featuredArtisans = (artisansRes || []).map(artisan => {
      let areaArray = [];
      if (artisan.service_areas) {
        areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      return { ...artisan, service_areas: areaArray };
    });

    if (platformTestimonials && platformTestimonials.length > 0) {
      testimonials = platformTestimonials;
    } else {
      testimonials = await query(`
        SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.created_at,
               u.full_name as customer_name, u.profile_photo as customer_photo,
               a.full_name as artisan_name
        FROM reviews r
        INNER JOIN users u ON r.customer_id = u.user_id
        INNER JOIN users a ON r.artisan_id = a.user_id
        WHERE r.is_approved = 1
        ORDER BY r.created_at DESC
        LIMIT 3
      `);
    }

  } catch (err) {
    console.error("Home page DB fetch error, falling back to sample data:", err);
    categories = [
      { category_id: 1, category_name: 'Plumbing', icon_class: 'fa-wrench' },
      { category_id: 2, category_name: 'Electrical Work', icon_class: 'fa-bolt' },
      { category_id: 3, category_name: 'Carpentry', icon_class: 'fa-hammer' },
      { category_id: 4, category_name: 'Masonry', icon_class: 'fa-trowel-bricks' },
      { category_id: 5, category_name: 'Tailoring', icon_class: 'fa-scissors' },
      { category_id: 6, category_name: 'Hairdressing', icon_class: 'fa-spray-can-sparkles' }
    ];
  }

  return (
    <div className="d-flex flex-column min-vh-100" id="homepage-container">
      <Navbar />
      <main id="main-content">

        {/* ─── SECTION 1: HERO ─────────────────────────────────────── */}
        <section
          className="position-relative text-white py-5 d-flex align-items-center hero-banner"
          id="homepage-hero-section"
          style={{
            minHeight: '88vh',
            background: 'linear-gradient(135deg, rgba(10,20,60,0.92) 0%, rgba(20,50,130,0.88) 55%, rgba(30,70,160,0.82) 100%), url("https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600") no-repeat center center/cover'
          }}
        >
          <div className="container py-5 text-start">
            <div className="row align-items-center">
              <div className="col-lg-8 col-xl-7">
                <span className="badge text-white px-3 py-2 rounded-pill fw-semibold mb-3 d-inline-flex align-items-center gap-2" style={{ background: 'var(--secondary)' }}>
                  <span>🇬🇭</span>
                  <span>Ghana&apos;s #1 Artisan Network</span>
                </span>

                <h1 className="display-4 fw-bold text-white mb-3 lh-sm">
                  Find Trusted Skilled<br className="d-none d-md-block" />
                  Artisans Near You
                </h1>

                <p className="lead hero-support-text mb-4 fs-5" style={{ lineHeight: '1.75', maxWidth: '560px' }}>
                  Connect with verified professionals — plumbers, electricians, carpenters, and more across all 16 regions of Ghana.
                </p>

                {/* Search bar */}
                <div className="mb-4 hero-search-container">
                  <HeroSearch />
                </div>

                {/* Quick-search pills */}
                <nav className="d-flex flex-wrap gap-2 mb-5" aria-label="Popular searches">
                  {quickSearches.map((term) => (
                    <Link
                      href={`/browse?keyword=${encodeURIComponent(term)}`}
                      key={term}
                      className="btn btn-sm btn-outline-light rounded-pill px-3 py-2 hero-pill"
                    >
                      {term}
                    </Link>
                  ))}
                </nav>

                {/* Stat badges */}
                <div className="d-flex flex-wrap gap-3" id="hero-stats-badges">
                  <div className="hero-stats-badge d-flex align-items-center gap-2">
                    <i className="fa-solid fa-user-check text-white hero-badge-icon" aria-hidden="true"></i>
                    <div>
                      <span className="fw-bold text-white d-block lh-1">
                        <AnimatedCounter value={stats.total_artisans} />
                      </span>
                      <span className="hero-stat-label" style={{ fontSize: '0.75rem' }}>Verified Artisans</span>
                    </div>
                  </div>
                  <div className="hero-stats-badge d-flex align-items-center gap-2">
                    <i className="fa-solid fa-star text-white hero-badge-icon" aria-hidden="true"></i>
                    <div>
                      <span className="fw-bold text-white d-block lh-1">
                        <AnimatedCounter value={stats.total_reviews} />
                      </span>
                      <span className="hero-stat-label" style={{ fontSize: '0.75rem' }}>Verified Reviews</span>
                    </div>
                  </div>
                  <div className="hero-stats-badge d-flex align-items-center gap-2">
                    <i className="fa-solid fa-map-location-dot text-white hero-badge-icon" aria-hidden="true"></i>
                    <div>
                      <span className="fw-bold text-white d-block lh-1">
                        <AnimatedCounter value={stats.regions_covered} />
                      </span>
                      <span className="hero-stat-label" style={{ fontSize: '0.75rem' }}>Regions Covered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right-side trust card — desktop only */}
              <div className="col-lg-4 col-xl-5 d-none d-lg-flex justify-content-end">
                <div className="rounded-4 p-4 text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', maxWidth: '320px', width: '100%' }}>
                  <h2 className="h6 fw-bold text-white mb-3">
                    <i className="fa-solid fa-shield-halved me-2 text-secondary" aria-hidden="true"></i>
                    Why trust SkillsConnect?
                  </h2>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                    {[
                      { icon: 'fa-id-card', text: 'Ghana Card verified artisans' },
                      { icon: 'fa-star', text: 'Real customer ratings & reviews' },
                      { icon: 'fa-map-pin', text: 'Find professionals near you' },
                      { icon: 'fa-comments', text: 'Direct contact — no middleman' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="d-flex align-items-center gap-3">
                        <span className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-10 flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                          <i className={`fa-solid ${icon} text-secondary`} aria-hidden="true"></i>
                        </span>
                        <span className="small" style={{ color: '#ddf0e6' }}>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: HOW IT WORKS ─────────────────────────────── */}
        <section className="py-5 bg-white" id="how-it-works">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Simple Process</span>
              <h2 className="fw-bold text-dark section-heading">How It Works</h2>
              <p className="section-description text-muted">Get your job done in three easy steps</p>
            </div>
            <div className="row g-4">
              {[
                { step: '1', icon: 'fa-magnifying-glass', title: 'Search', desc: 'Browse skilled professionals by trade, location, or keyword across all 16 regions of Ghana.' },
                { step: '2', icon: 'fa-comments', title: 'Connect', desc: 'View verified profiles, check years of experience, and read authentic customer reviews.' },
                { step: '3', icon: 'fa-star-half-stroke', title: 'Review', desc: 'Rate your experience after the job to help maintain high standards across the platform.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="col-md-4 text-center">
                  <div className="feature-card h-100 p-4 p-md-5">
                    <div className="position-relative d-inline-flex mb-4">
                      <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{ width: '68px', height: '68px' }}>
                        <i className={`fa-solid ${icon} fs-4`} aria-hidden="true"></i>
                      </div>
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-white fw-bold" style={{ fontSize: '0.65rem', background: 'var(--secondary)' }}>
                        {step}
                      </span>
                    </div>
                    <h3 className="fw-bold mb-2">{title}</h3>
                    <p className="text-muted mb-0 small">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: BROWSE BY CATEGORY ───────────────────────── */}
        <section className="py-5 bg-light" id="browse-categories">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">All Trades</span>
              <h2 className="fw-bold text-dark section-heading">Browse by Professional Trade</h2>
              <p className="section-description text-muted">Find certified experts in Ghana sorted by professional category</p>
            </div>
            <div className="row g-3">
              {categories.map((cat, idx) => (
                <div key={cat.category_id || `cat-${idx}`} className="col-6 col-md-4 col-lg-3">
                  <Link href={`/browse?category_id=${cat.category_id}`} className="text-decoration-none">
                    <div className="card feature-card border-0 rounded-4 p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                      <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 bg-primary-subtle" style={{ width: '64px', height: '64px' }}>
                        <i className={`fa-solid ${cat.icon_class || 'fa-screwdriver-wrench'} text-primary fs-3`} aria-hidden="true"></i>
                      </div>
                      <h3 className="fw-bold text-dark mb-1 category-name fs-6">{cat.category_name}</h3>
                      <small className="text-primary fw-medium">View experts →</small>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <Link href="/browse" className="btn btn-outline-primary px-5 py-2 rounded-pill fw-semibold">
                Browse All Artisans
              </Link>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: FEATURED ARTISANS ────────────────────────── */}
        <section className="py-5 bg-white" id="featured-artisans">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Top Rated</span>
              <h2 className="fw-bold text-dark section-heading">Featured Highly-Rated Artisans</h2>
              <p className="section-description text-muted">Vetted professionals with exceptional customer feedback</p>
            </div>

            {featuredArtisans.length === 0 ? (
              <div className="text-center py-5">
                <i className="fa-solid fa-user-slash fs-1 text-muted mb-3" aria-hidden="true"></i>
                <p className="text-muted mb-0">No approved artisans available yet. Check back soon.</p>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {featuredArtisans.map((artisan, idx) => (
                  <div key={artisan.user_id || `artisan-${idx}`} className="col">
                    <ArtisanCard artisan={artisan} />
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-5">
              <Link href="/browse" className="btn btn-primary px-5 py-2 rounded-pill fw-semibold shadow-sm">
                Browse All Artisans
                <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true"></i>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: LIVE STATS BANNER ────────────────────────── */}
        <section className="py-5 text-white" id="platform-stats-banner" style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)' }}>
          <div className="container py-3">
            <div className="text-center mb-4 d-none d-md-block">
              <p className="mb-0 small text-uppercase fw-semibold letter-spacing-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Platform at a glance</p>
            </div>
            <div className="row g-4 text-center">
              {[
                { value: stats.total_artisans, label: 'Verified Artisans', icon: 'fa-user-check' },
                { value: stats.total_categories, label: 'Trade Categories', icon: 'fa-briefcase' },
                { value: stats.total_reviews, label: 'Verified Reviews', icon: 'fa-star' },
                { value: stats.regions_covered, label: 'Regions Covered', icon: 'fa-map-location-dot' },
              ].map(({ value, label, icon }) => (
                <div key={label} className="col-6 col-md-3">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style={{ width: '48px', height: '48px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.35)' }}>
                    <i className={`fa-solid ${icon} fs-5`} style={{ color: '#fdba74' }} aria-hidden="true"></i>
                  </div>
                  <div className="display-5 fw-bold text-white mb-1">
                    <AnimatedCounter value={value} />
                  </div>
                  <p className="platform-stat-label mb-0 small">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: WHY SKILLSCONNECT ────────────────────────── */}
        <section className="py-5 bg-white" id="why-skillsconnect">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Our Promise</span>
              <h2 className="fw-bold text-dark section-heading">Why SkillsConnect Ghana?</h2>
              <p className="section-description text-muted">A safe, verified environment for skilled services</p>
            </div>
            <div className="row g-4">
              {[
                { icon: 'fa-user-shield', title: 'Verified Profiles', desc: 'Every provider undergoes background screening, identity verification, and manual credentials validation.' },
                { icon: 'fa-location-crosshairs', title: 'Location-Based Search', desc: 'Filter by region, district, or neighborhood to find professionals nearest to you.' },
                { icon: 'fa-star-half-stroke', title: 'Trusted Reviews', desc: 'Authentic ratings collected exclusively after validated job interactions — no fake reviews.' },
                { icon: 'fa-paper-plane', title: 'Direct Messaging', desc: 'Contact artisans directly, submit job requirements, and get estimates with no middleman fees.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="col-md-6">
                  <div className="d-flex gap-4 p-4 h-100 rounded-4 border bg-light shadow-sm hover-transform">
                    <div className="rounded-3 bg-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                      <i className={`fa-solid ${icon} text-primary fs-5`} aria-hidden="true"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold text-dark mb-1 fs-6">{title}</h3>
                      <p className="text-muted mb-0 small">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: TESTIMONIALS ──────────────────────────────── */}
        <section className="py-5 bg-light" id="testimonials">
          <div className="container py-4">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Real Feedback</span>
              <h2 className="fw-bold text-dark section-heading">Real Client Experiences</h2>
              <p className="section-description text-muted">What clients across Ghana say about their artisan experiences</p>
            </div>
            <div className="row g-4">
              {testimonials.length === 0 ? (
                <>
                  {[
                    { initials: 'EA', name: 'Emmanuel Appiah', location: 'Accra, Ghana', rating: 5, text: 'The plumber arrived within 1 hour and fixed our bathroom leakage efficiently. Very professional and polite! Highly recommend.' },
                    { initials: 'MA', name: 'Mercy Ansah', location: 'Kumasi, Ghana', rating: 5, text: 'Excellent tailoring work! My bridal kente gown was finished 3 days before schedule and fits absolutely perfectly. Will use again.' },
                    { initials: 'KB', name: 'Kwame Boateng', location: 'Tema, Ghana', rating: 5, text: 'Experienced electrician who identified the root phase power problem instantly. Reasonable rates and professional equipment.' },
                  ].map(({ initials, name, location, rating, text }) => (
                    <div key={name} className="col-md-4">
                      <div className="testimonial-card h-100 d-flex flex-column">
                        <div className="mb-3 d-flex gap-1">
                          {Array.from({ length: rating }).map((_, i) => (
                            <i key={i} className="fa-solid fa-star text-warning" aria-hidden="true"></i>
                          ))}
                        </div>
                        <p className="text-secondary mb-4 flex-grow-1" style={{ fontStyle: 'italic', lineHeight: '1.7' }}>
                          &ldquo;{text}&rdquo;
                        </p>
                        <div className="d-flex align-items-center gap-3 mt-auto pt-3 border-top">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                            {initials}
                          </div>
                          <div>
                            <h3 className="fw-bold text-dark mb-0 testimonial-name fs-6">{name}</h3>
                            <small className="text-muted">
                              <i className="fa-solid fa-location-dot me-1" aria-hidden="true"></i>
                              {location}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                testimonials.map((test, idx) => (
                  <div key={test.review_id || test.testimonial_id || `test-${idx}`} className="col-md-4">
                    <div className="testimonial-card h-100 d-flex flex-column">
                      <div className="mb-3">
                        <StarRating rating={test.rating} />
                      </div>
                      <p className="text-secondary mb-4 flex-grow-1" style={{ fontStyle: 'italic', lineHeight: '1.7' }}>
                        &ldquo;{test.review_text}&rdquo;
                      </p>
                      <div className="d-flex align-items-center gap-3 mt-auto pt-3 border-top">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold text-uppercase flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                          {test.customer_name?.substring(0, 2) || 'CL'}
                        </div>
                        <div>
                          <h3 className="fw-bold text-dark mb-0 testimonial-name fs-6">{test.customer_name}</h3>
                          <small className="text-muted">
                            {test.artisan_name ? `Reviewed ${test.artisan_name}` : 'Verified Customer'}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ─── SECTION 8: SUPPORT ───────────────────────────────────── */}
        <section className="py-5 bg-white" id="feedback-support">
          <div className="container py-4">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">We&apos;re Here</span>
                <h2 className="fw-bold text-dark mt-2">Need help or want to report an issue?</h2>
                <p className="text-muted mb-4" style={{ lineHeight: 1.8 }}>
                  Send feedback directly to our support team from anywhere in the app. We route your message to the right team quickly — whether it&apos;s a bug, an onboarding issue, or a service problem.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <Link href="/contact" className="btn btn-primary px-5 py-2 rounded-pill fw-semibold shadow-sm">
                    <i className="fa-solid fa-paper-plane me-2" aria-hidden="true"></i>
                    Send Feedback
                  </Link>
                  <a href="mailto:skillsconnectgh@zohomail.com" className="btn btn-outline-primary px-5 py-2 rounded-pill fw-semibold">
                    Email Support
                  </a>
                </div>              </div>
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 p-4 shadow-sm bg-light">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                      <i className="fa-solid fa-headset fs-4" aria-hidden="true"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0 fs-6">Customer Support</h3>
                      <p className="text-muted small mb-0">Reach our support team by email or phone</p>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border">
                      <i className="fa-solid fa-envelope text-primary" aria-hidden="true"></i>
                      <div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Support email</p>
                        <a href="mailto:skillsconnectgh@zohomail.com" className="text-dark fw-semibold text-decoration-none small">skillsconnectgh@zohomail.com</a>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border">
                      <i className="fa-solid fa-phone text-primary" aria-hidden="true"></i>
                      <div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Support phone</p>
                        <a href="tel:+233530600127" className="text-dark fw-semibold text-decoration-none small" aria-label="Call +233 530 600 127">+233 530 600 127</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 9: INSTALL APP ───────────────────────────────── */}
        <section className="py-5 bg-light border-top" id="install-app">
          <div className="container py-4">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">Progressive Web App</span>
                <h2 className="fw-bold text-dark mt-2">Install SkillsConnect on Your Phone</h2>
                <p className="text-muted mb-0" style={{ lineHeight: 1.8 }}>
                  Access Ghana&apos;s artisan marketplace instantly from your home screen. Enjoy faster navigation, offline-ready pages, and a native-like experience — no app store required.
                </p>
              </div>
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                  <div className="d-flex flex-column gap-3">
                    {[
                      { icon: 'fa-mobile-screen-button', label: 'For iPhone', desc: 'Open Safari, tap Share, then choose Add to Home Screen.' },
                      { icon: 'fa-android fa-brands', label: 'For Android', desc: 'Open Chrome, tap the browser menu, then Add to Home Screen.' },
                      { icon: 'fa-globe', label: 'Anywhere', desc: 'Use the install prompt or bookmark SkillsConnect for quick access.' },
                    ].map(({ icon, label, desc }) => (
                      <div key={label} className="d-flex align-items-start gap-3">
                        <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                          <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
                        </div>
                        <div>
                          <h3 className="fw-semibold mb-0 fs-6">{label}</h3>
                          <p className="mb-0 text-muted small">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 10: ARTISAN CTA ──────────────────────────────── */}
        <section className="py-5 text-white text-center" id="homepage-cta" style={{ background: 'linear-gradient(135deg, #0a1a4a 0%, #1e3a8a 55%, #2563eb 100%)' }}>
          <div className="container py-4">
            <div className="row justify-content-center">
              <div className="col-lg-7">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '64px', height: '64px', background: 'rgba(249,115,22,0.2)', border: '2px solid rgba(249,115,22,0.4)' }}>
                  <i className="fa-solid fa-hammer fs-3" style={{ color: '#fb923c' }} aria-hidden="true"></i>
                </div>
                <h2 className="fw-bold mb-3 text-white display-6">Are You a Skilled Artisan?</h2>
                <p className="lead mb-4 mx-auto" style={{ maxWidth: '520px', color: 'rgba(255,255,255,0.82)' }}>
                  Join thousands growing their business on SkillsConnect Ghana. Showcase your craft, connect with clients, and earn more.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <Link href="/register" className="btn btn-secondary px-5 py-2 rounded-pill fw-bold shadow hover-scale" style={{ fontSize: '1rem' }}>
                    <i className="fa-solid fa-user-plus me-2" aria-hidden="true"></i>
                    Create Artisan Account
                  </Link>
                  <Link href="/about" className="btn btn-outline-light px-5 py-2 rounded-pill fw-semibold">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <AiMatchmaker />
    </div>
  );
}
