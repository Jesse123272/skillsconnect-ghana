import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-5 pb-4 mt-auto" id="main-footer" style={{ backgroundColor: '#1A6B3C' }}>
      <div className="container text-md-left">
        <div className="row text-md-left">
          
          {/* Column 1: About */}
          <div className="col-md-4 col-lg-4 col-xl-4 mx-auto mt-3">
            <h2 className="text-uppercase mb-4 font-weight-bold footer-heading fw-bold">
              <i className="fa-solid fa-wrench me-2" aria-hidden="true"></i>SkillsConnect Ghana
            </h2>
            <p className="footer-copy" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              SkillsConnect Ghana helps people find local tradespeople for everyday repairs, renovations, events, and services. Search by trade, check the details, and make the first contact yourself.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
            <h2 className="text-uppercase mb-4 font-weight-bold footer-heading fw-bold">
              Explore
            </h2>
            <nav aria-label="Explore">
              <ul className="list-unstyled mb-0">
              <li className="mb-2">
              <Link href="/" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                Home
              </Link>
              </li><li className="mb-2">
              <Link href="/artisans" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                Browse Artisans
              </Link>
              </li><li className="mb-2">
              <Link href="/register" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                Register
              </Link>
              </li><li className="mb-2">
              <Link href="/login" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                Login
              </Link>
              </li><li className="mb-2">
              <Link href="/about" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                About Us
              </Link>
              </li><li className="mb-2">
              <Link href="/contact" className="footer-link text-decoration-none" style={{ fontSize: '14px' }}>
                Contact
              </Link>
              </li></ul>
            </nav>
          </div>

          {/* Column 3: Contact Us */}
          <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
            <h2 className="text-uppercase mb-4 font-weight-bold footer-heading fw-bold">
              Contact Us
            </h2>
            <p className="footer-copy mb-2" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-envelope me-2" aria-hidden="true"></i> skillsconnectgh@zohomail.com
            </p>
            <p className="footer-copy mb-2" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-phone me-2" aria-hidden="true"></i> +233530600127
            </p>
            <p className="footer-copy mb-3" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-map-marker-alt me-2" aria-hidden="true"></i> Accra, Greater Accra, Ghana
            </p>
            
            {/* Social Icons */}
            <div className="d-flex gap-3 mt-3">
              <Link href="/contact" className="footer-link text-decoration-none small">
                Have a question? Contact the team
              </Link>
            </div>
          </div>

        </div>

        <hr className="mb-4 mt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Bottom copyright bar */}
        <div className="row align-items-center">
          <div className="col-md-7 col-lg-8">
            <p className="footer-copy mb-0" style={{ fontSize: '13px' }}>
              &copy; 2026 SkillsConnect Ghana. A local directory project for Ghanaian professionals.
            </p>
          </div>
          <div className="col-md-5 col-lg-4 text-md-end mt-2 mt-md-0">
            <p className="footer-copy mb-0" style={{ fontSize: '13px' }}>
              Built for practical connections.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
