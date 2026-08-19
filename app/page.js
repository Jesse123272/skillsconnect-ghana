import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import ArtisanCard from '@/components/ArtisanCard';
import StarRating from '@/components/StarRating';
import { query } from '@/lib/db';

export const revalidate = 0; // Ensure live data on every load

export default async function Home() {
  let stats = {
    total_artisans: 0,
    total_reviews: 0,
    total_categories: 0,
    regions_covered: 16
  };

  let categories = [];
  let featuredArtisans = [];
  let testimonials = [];
  const quickSearches = ['Plumbing', 'Electrical', 'Carpentry', 'Tailoring', 'Painting', 'Cleaning'];

  try {
    // Run queries in parallel for maximum performance
    const [
      artisansCountRes,
      reviewsCountRes,
      categoriesCountRes,
      regionsCountRes,
      categoriesRes,
      artisansRes
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 1"),
      query("SELECT COUNT(*) as count FROM reviews WHERE is_approved = 1"),
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
    } catch (testimonialErr) {
      console.warn('Testimonials table unavailable in production DB, using reviews fallback.');
    }

    // Keep the public counters honest until the platform has real activity to report.
    stats = {
      total_artisans: 0,
      total_reviews: 0,
      total_categories: 0,
      regions_covered: 16
    };

    categories = categoriesRes || [];

    featuredArtisans = (artisansRes || []).map(artisan => {
      let areaArray = [];
      if (artisan.service_areas) {
        areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...artisan,
        service_areas: areaArray
      };
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
    // Graceful fallbacks so page never crashes
    categories = [
      { category_id: 1, category_name: 'Plumbing', icon_class: 'fa-wrench' },
      { category_id: 2, category_name: 'Electrical Work', icon_class: 'fa-bolt' },
      { category_id: 3, category_name: 'Carpentry', icon_class: 'fa-hammer' },
      { category_id: 4, category_name: 'Masonry', icon_class: 'fa-trowel-bricks' },
      { category_id: 5, category_name: 'Tailoring', icon_class: 'fa-scissors' },
      { category_id: 6, category_name: 'Hairdressing', icon_class: 'fa-spray-can-sparkles' },
      { category_id: 7, category_name: 'Painting', icon_class: 'fa-paint-roller' },
      { category_id: 8, category_name: 'Welding', icon_class: 'fa-fire' },
      { category_id: 9, category_name: 'Mechanics', icon_class: 'fa-car' },
      { category_id: 10, category_name: 'Fashion Design', icon_class: 'fa-shirt' },
      { category_id: 11, category_name: 'Cleaning Services', icon_class: 'fa-broom' },
      { category_id: 12, category_name: 'Pest Control', icon_class: 'fa-bug' },
      { category_id: 13, category_name: 'Gardening & Landscaping', icon_class: 'fa-seedling' },
      { category_id: 14, category_name: 'Appliance Repair', icon_class: 'fa-tv' },
      { category_id: 15, category_name: 'ICT & Device Repair', icon_class: 'fa-laptop' },
      { category_id: 16, category_name: 'Event Decoration', icon_class: 'fa-ribbon' },
      { category_id: 17, category_name: 'Catering', icon_class: 'fa-utensils' },
      { category_id: 18, category_name: 'Beauty Services', icon_class: 'fa-spa' },
      { category_id: 19, category_name: 'Photography', icon_class: 'fa-camera' },
      { category_id: 20, category_name: 'Security Services', icon_class: 'fa-shield-halved' }
    ];
  }

  return (
    <div className="d-flex flex-column min-vh-100" id="homepage-container">
      <Navbar />

      {/* SECTION 1 - HERO */}
      <section 
        className="position-relative text-white py-5 d-flex align-items-center hero-banner"
        id="homepage-hero-section"
        style={{
          minHeight: '85vh',
          background: 'linear-gradient(rgba(10, 40, 20, 0.85), rgba(10, 40, 20, 0.92)), url("/images/hero-ghana.svg") no-repeat center center/cover'
        }}
      >
        <div className="container py-5 text-start">
          <div className="row">
            <div className="col-lg-8">
              <span className="badge bg-secondary text-dark px-3 py-2 rounded-pill fw-semibold mb-3">
                A practical directory for local jobs in Ghana
              </span>
              <h1 className="display-4 fw-bold text-white mb-3 lh-sm">
                Find someone who can do the job properly
              </h1>
              <p className="lead text-white-50 mb-4 fs-5" style={{ lineHeight: '1.7' }}>
                Search by trade and location, compare profiles, then contact a professional directly. Start with a job in your area.
              </p>

              {/* SearchBar component client component */}
              <div className="mb-4 hero-search-container">
                <HeroSearch />
              </div>

              <div className="d-flex flex-wrap gap-2 gap-sm-3 mb-4">
                {quickSearches.map((term) => (
                  <Link
                    href={`/browse?keyword=${encodeURIComponent(term)}`}
                    key={term}
                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-2 text-white-75 border-white-25 hero-pill"
                  >
                    {term}
                  </Link>
                ))}
              </div>

              {/* Stats badges */}
              <div className="d-flex flex-wrap gap-3 mt-4" id="hero-stats-badges">
                <div className="badge bg-white bg-opacity-10 border border-white border-opacity-10 px-3 py-2.5 rounded-3 d-flex align-items-center gap-2">
                  <i className="fa-solid fa-user-check text-secondary"></i>
                  <span className="fw-semibold">{stats.total_artisans}</span>
                  <span className="text-white-50">Verified Artisans</span>
                </div>
                <div className="badge bg-white bg-opacity-10 border border-white border-opacity-10 px-3 py-2.5 rounded-3 d-flex align-items-center gap-2">
                  <i className="fa-solid fa-star text-secondary"></i>
                  <span className="fw-semibold">{stats.total_reviews}</span>
                  <span className="text-white-50">Completed Reviews</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10 shadow-sm d-block d-md-none">
                <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
                  <div>
                    <h5 className="text-white mb-1">Keep the directory close</h5>
                    <p className="text-white-50 mb-0 small">
                      Add this page to your phone home screen so it is ready the next time a repair or project comes up.
                    </p>
                  </div>
                  <a href="#install-app" className="btn btn-outline-light rounded-pill px-4 py-2">
                    Learn how
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - INSTALL APP PROMO */}
      <section className="py-5 bg-secondary bg-opacity-10 border-bottom" id="install-app">
        <div className="container py-4">
          <div className="row align-items-center gx-5">
            <div className="col-lg-7">
              <h2 className="fw-bold text-dark">Keep SkillsConnect handy</h2>
              <p className="text-muted fs-5">
                This site works well from a phone. Add it to your home screen when you regularly need local tradespeople.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-primary text-white rounded-3 p-3">
                    <i className="fa-solid fa-mobile-screen-button fa-lg"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold">For iPhone</h5>
                    <p className="mb-0 text-muted small">Open Safari, tap Share, then choose Add to Home Screen.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-primary text-white rounded-3 p-3">
                    <i className="fa-brands fa-android fa-lg"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold">For Android</h5>
                    <p className="mb-0 text-muted small">Open Chrome, tap the browser menu, then Add to Home screen.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white rounded-3 p-3">
                    <i className="fa-solid fa-globe fa-lg"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold">Anywhere</h5>
                    <p className="mb-0 text-muted small">Use the install prompt or bookmark SkillsConnect for quick access.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS */}
      <section className="py-5 bg-white border-bottom" id="how-it-works">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">How It Works</h2>
            <p className="text-muted">Get your jobs done in three simple steps</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 text-center">
              <div className="feature-card h-100 p-4">
                <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                  <i className="fa-solid fa-magnifying-glass fs-4"></i>
                </div>
                <h5 className="fw-bold mb-2">1. Search</h5>
                <p className="text-muted mb-0 small">Browse skilled professionals by their trade specialty and location details.</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="feature-card h-100 p-4">
                <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                  <i className="fa-solid fa-comments fs-4"></i>
                </div>
                <h5 className="fw-bold mb-2">2. Connect</h5>
                <p className="text-muted mb-0 small">View vetted profiles, verify years of experience, and read real customer reviews.</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="feature-card h-100 p-4">
                <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                  <i className="fa-solid fa-star-half-stroke fs-4"></i>
                </div>
                <h5 className="fw-bold mb-2">3. Review</h5>
                <p className="text-muted mb-0 small">Rate your work experience to help maintain high standards across Ghana.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - BROWSE BY CATEGORY */}
      <section className="py-5" id="browse-categories">
        <div className="container py-3">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">Browse by Professional Trade</h2>
            <p className="text-muted">Choose a trade to see people offering that service</p>
          </div>
          <div className="row g-4">
            {categories.map((cat, idx) => (
              <div key={cat.category_id || `cat-${idx}`} className="col-6 col-md-4 col-lg-3">
                <Link 
                  href={`/browse?category_id=${cat.category_id}`} 
                  className="text-decoration-none"
                >
                  <div className="card feature-card border-0 rounded-3 p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 bg-light" style={{ width: '64px', height: '64px' }}>
                      <i className={`fa-solid ${cat.icon_class || 'fa-screwdriver-wrench'} text-primary fs-3`}></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1 text-truncate w-100">{cat.category_name}</h6>
                    <small className="text-muted">View experts</small>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - FEATURED ARTISANS */}
      <section className="py-5 bg-light border-top border-bottom" id="featured-artisans">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">Featured Highly-Rated Artisans</h2>
            <p className="text-muted">Vetted and recommended professionals with exceptional customer feedback</p>
          </div>

          {featuredArtisans.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No approved artisans available yet.</p>
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
            <Link href="/browse" className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm">
              Browse All Artisans
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 - LIVE PLATFORM STATS BANNER */}
      <section className="py-5 text-white bg-primary" id="platform-stats-banner">
        <div className="container py-3">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <h1 className="display-5 fw-bold text-white mb-1">{stats.total_artisans}</h1>
              <p className="text-white-50 mb-0 small uppercase tracking-wider">Total Artisans</p>
            </div>
            <div className="col-6 col-md-3">
              <h1 className="display-5 fw-bold text-white mb-1">{stats.total_categories}</h1>
              <p className="text-white-50 mb-0 small uppercase tracking-wider">Total Categories</p>
            </div>
            <div className="col-6 col-md-3">
              <h1 className="display-5 fw-bold text-white mb-1">{stats.total_reviews}</h1>
              <p className="text-white-50 mb-0 small uppercase tracking-wider">Total Reviews</p>
            </div>
            <div className="col-6 col-md-3">
              <h1 className="display-5 fw-bold text-white mb-1">{stats.regions_covered}</h1>
              <p className="text-white-50 mb-0 small uppercase tracking-wider">Regions Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - WHY SKILLSCONNECT */}
      <section className="py-5 bg-white border-bottom" id="why-skillsconnect">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">Why SkillsConnect Ghana?</h2>
            <p className="text-muted">Providing a safe, verified environment for domestic services</p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex gap-3 p-3 h-100 rounded-3 border bg-light shadow-sm">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                  <i className="fa-solid fa-user-shield text-primary fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">Verified Profiles</h5>
                  <p className="text-muted mb-0 small">Every service provider undergoes background screening, identity verification, and manual credentials validation.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-3 p-3 h-100 rounded-3 border bg-light shadow-sm">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                  <i className="fa-solid fa-location-crosshairs text-primary fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">Location-Based Search</h5>
                  <p className="text-muted mb-0 small">Filter results quickly by specific region, district, or neighborhood area to find professionals near you.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-3 p-3 h-100 rounded-3 border bg-light shadow-sm">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                  <i className="fa-solid fa-star-half-stroke text-primary fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">Trusted Reviews</h5>
                  <p className="text-muted mb-0 small">Read authentic customer feedback and star ratings collected exclusively after validated job interactions.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-3 p-3 h-100 rounded-3 border bg-light shadow-sm">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                  <i className="fa-solid fa-paper-plane text-primary fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">Direct Messaging</h5>
                  <p className="text-muted mb-0 small">Connect with artisans directly, submit job requirements, and get quick price estimations with no third-party cuts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 - FEEDBACK & SUPPORT */}
      <section className="py-5 bg-white border-top border-bottom" id="feedback-support">
        <div className="container py-4">
          <div className="row align-items-center gx-5">
            <div className="col-lg-6">
              <h2 className="fw-bold text-dark">Need help or want to report an issue?</h2>
              <p className="text-muted fs-6 mb-4" style={{ lineHeight: 1.8 }}>
                Send feedback directly to our admin support team from anywhere in the app. If you notice a bug, onboarding issue, or service problem, we will route your message to the right team quickly.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link href="/contact" className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm">
                  Send Feedback
                </Link>
                <a href="mailto:skillsconnectgh@zohomail.com" className="btn btn-outline-primary px-4 py-2.5 rounded-pill">
                  Email Support
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border rounded-4 p-4 shadow-sm bg-light">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px' }}>
                    <i className="fa-solid fa-headset fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Customer Support</h5>
                    <p className="text-muted small mb-0">Reach our admin support team by email or submit feedback through the contact form.</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-secondary mb-1 small">Support email</p>
                  <a href="mailto:skillsconnectgh@zohomail.com" className="d-block text-dark fw-semibold">skillsconnectgh@zohomail.com</a>
                </div>
                <div>
                  <p className="text-secondary mb-1 small">Support phone</p>
                  <a href="tel:+233530600127" className="d-block text-dark fw-semibold">+233 530 600 127</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 - TESTIMONIALS */}
      <section className="py-5 bg-light" id="testimonials">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">Real Client Experiences</h2>
            <p className="text-muted">What clients across Ghana say about their experience with our professionals</p>
          </div>
          <div className="row g-4">
            {testimonials.length === 0 ? (
              <>
                <div className="col-md-4">
                  <div className="testimonial-card h-100">
                    <div className="mb-3">
                      <StarRating rating={5} />
                    </div>
                    <p className="text-secondary italic mb-4" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                      &quot;The plumber arrived within 1 hour and fixed our bathroom leakage efficiently. Very professional and polite! Highly recommend.&quot;
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-auto">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                        EA
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-7">Emmanuel Appiah</h6>
                        <small className="text-muted">Accra, Ghana</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="testimonial-card h-100">
                    <div className="mb-3">
                      <StarRating rating={5} />
                    </div>
                    <p className="text-secondary italic mb-4" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                      &quot;Excellent tailoring work! My bridal kente gown was finished 3 days before schedule and fits absolutely perfectly. Will use again.&quot;
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-auto">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                        MA
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-7">Mercy Ansah</h6>
                        <small className="text-muted">Kumasi, Ghana</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="testimonial-card h-100">
                    <div className="mb-3">
                      <StarRating rating={5} />
                    </div>
                    <p className="text-secondary italic mb-4" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                      &quot;Experienced electrician who identified the root phase power problem instantly. Reasonable rates and professional tool equipment.&quot;
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-auto">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                        KB
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-7">Kwame Boateng</h6>
                        <small className="text-muted">Tema, Ghana</small>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              testimonials.map((test, idx) => (
                <div key={test.review_id || test.testimonial_id || `test-${idx}`} className="col-md-4">
                  <div className="card h-100 border-0 p-4 rounded-3 shadow-sm bg-white d-flex flex-column">
                    <div className="mb-3">
                      <StarRating rating={test.rating} />
                    </div>
                    <p className="text-secondary italic mb-4" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                      &quot;{test.review_text}&quot;
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-auto">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold text-uppercase" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                        {test.customer_name?.substring(0, 2) || 'CL'}
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-7">{test.customer_name}</h6>
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

      {/* SECTION 8 - CTA BANNER */}
      <section className="py-5 bg-primary text-white text-center" id="homepage-cta">
        <div className="container py-4">
          <h2 className="fw-bold mb-2 text-white">Are You a Skilled Artisan?</h2>
          <p className="lead text-white-50 mb-4" style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Join thousands growing their business on SkillsConnect Ghana. Showcase your craft, connect with clients, and earn more.
          </p>
          <Link href="/register" className="btn btn-light text-primary px-4 py-2.5 rounded-pill fw-bold hover-scale shadow">
            Create Artisan Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
