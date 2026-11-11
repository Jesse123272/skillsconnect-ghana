import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-white pt-5 pb-0 mt-auto" id="main-footer" style={{ background: 'linear-gradient(160deg, #0a1a4a 0%, #1e3a8a 100%)' }}>
      <div className="container">
        <div className="row g-5 pb-5">

          {/* Column 1: Brand + description */}
          <div className="col-lg-4 col-md-12">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="fa-solid fa-wrench text-secondary fs-5" aria-hidden="true"></i>
              <span className="fw-bold fs-5">
                SkillsConnect<span style={{ color: '#FFD166' }}>Ghana</span>
              </span>
            </div>
            <p className="footer-copy mb-4" style={{ fontSize: '14px', lineHeight: '1.75', maxWidth: '300px' }}>
              Connecting skilled Ghanaian professionals with clients securely. Search by trade, verify credentials, and make direct contact.
            </p>
            {/* Social links */}
            <div className="d-flex gap-3">
              {[
                { href: 'https://facebook.com', icon: 'fa-facebook-f', label: 'Facebook' },
                { href: 'https://twitter.com', icon: 'fa-x-twitter', label: 'Twitter / X' },
                { href: 'https://instagram.com', icon: 'fa-instagram', label: 'Instagram' },
                { href: 'https://wa.me/233530600127', icon: 'fa-whatsapp', label: 'WhatsApp' },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="d-flex align-items-center justify-content-center rounded-circle text-white border border-white border-opacity-25 footer-social-icon"
                  style={{ width: '36px', height: '36px', transition: 'background 0.2s, border-color 0.2s' }}
                >
                  <i className={`fa-brands ${icon}`} style={{ fontSize: '14px' }} aria-hidden="true"></i>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="col-lg-2 col-md-4 col-6">
            <h2 className="footer-heading fw-bold mb-4 text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
              Explore
            </h2>
            <nav aria-label="Explore links">
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/browse', label: 'Browse Artisans' },
                  { href: '/how-it-works', label: 'How It Works' },
                  { href: '/about', label: 'About Us' },
                  { href: '/contact', label: 'Contact' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3: Account */}
          <div className="col-lg-2 col-md-4 col-6">
            <h2 className="footer-heading fw-bold mb-4 text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
              Account
            </h2>
            <nav aria-label="Account links">
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {[
                  { href: '/login', label: 'Login' },
                  { href: '/register', label: 'Register' },
                  { href: '/forgot-password', label: 'Reset Password' },
                  { href: '/terms', label: 'Terms of Use' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 4: Contact */}
          <div className="col-lg-4 col-md-4">
            <h2 className="footer-heading fw-bold mb-4 text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
              Contact Us
            </h2>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
              <li className="d-flex align-items-start gap-2">
                <i className="fa-solid fa-envelope text-secondary mt-1 flex-shrink-0" aria-hidden="true"></i>
                <a href="mailto:skillsconnectgh@zohomail.com" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                  skillsconnectgh@zohomail.com
                </a>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="fa-solid fa-phone text-secondary mt-1 flex-shrink-0" aria-hidden="true"></i>
                <a href="tel:+233530600127" className="footer-link text-decoration-none" style={{ fontSize: '14px' }} aria-label="Call +233 530 600 127">
                  +233 530 600 127
                </a>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="fa-solid fa-location-dot text-secondary mt-1 flex-shrink-0" aria-hidden="true"></i>
                <span className="footer-copy" style={{ fontSize: '14px' }}>Accra, Greater Accra, Ghana</span>
              </li>
            </ul>
            <div className="mt-4">
              <Link
                href="/contact"
                className="btn btn-outline-light rounded-pill px-4 py-2 fw-semibold"
                style={{ fontSize: '14px', borderColor: 'rgba(255,255,255,0.35)' }}
              >
                <i className="fa-solid fa-paper-plane me-2" aria-hidden="true"></i>
                Send a Message
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container py-4">
          <div className="row align-items-center g-2">
            <div className="col-md-8">
              <p className="footer-copy mb-0" style={{ fontSize: '13px' }}>
                &copy; {currentYear} SkillsConnect Ghana. A local directory for Ghanaian professionals.
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <p className="footer-copy mb-0" style={{ fontSize: '13px' }}>
                Built for practical connections. 🇬🇭
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
