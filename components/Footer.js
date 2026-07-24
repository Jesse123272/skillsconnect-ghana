import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-5 pb-4 mt-auto" id="main-footer" style={{ backgroundColor: '#1A6B3C' }}>
      <div className="container text-md-left">
        <div className="row text-md-left">
          
          {/* Column 1: About */}
          <div className="col-md-4 col-lg-4 col-xl-4 mx-auto mt-3">
            <h5 className="text-uppercase mb-4 font-weight-bold text-secondary fw-bold" style={{ color: '#F5A623' }}>
              <i className="fa-solid fa-wrench me-2"></i>SkillsConnect Ghana
            </h5>
            <p className="text-white-50" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              SkillsConnect Ghana is the premier verified marketplace connecting highly skilled local artisans and tradespeople with homeowners and corporate clients across the nation.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
            <h6 className="text-uppercase mb-4 font-weight-bold text-secondary fw-bold" style={{ color: '#F5A623' }}>
              Quick Links
            </h6>
            <p className="mb-2">
              <Link href="/" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                Home
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/artisans" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                Browse Artisans
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/register" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                Register
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/login" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                Login
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/about" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                About Us
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/contact" className="text-white-50 text-decoration-none hover:text-white" style={{ fontSize: '14px' }}>
                Contact
              </Link>
            </p>
          </div>

          {/* Column 3: Contact Us */}
          <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
            <h6 className="text-uppercase mb-4 font-weight-bold text-secondary fw-bold" style={{ color: '#F5A623' }}>
              Contact Us
            </h6>
            <p className="text-white-50 mb-2" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-envelope me-2"></i> skillsconnectgh@zohomail.com
            </p>
            <p className="text-white-50 mb-2" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-phone me-2"></i> +233530600127
            </p>
            <p className="text-white-50 mb-3" style={{ fontSize: '14px' }}>
              <i className="fa-solid fa-map-marker-alt me-2"></i> Accra, Greater Accra, Ghana
            </p>
            
            {/* Social Icons */}
            <div className="d-flex gap-3 mt-3">
              <a href="https://facebook.com" className="text-white-50 hover:text-white fs-5" aria-label="Facebook">
                <i className="fa-brands fa-facebook"></i>
              </a>
              <a href="https://twitter.com" className="text-white-50 hover:text-white fs-5" aria-label="Twitter">
                <i className="fa-brands fa-twitter"></i>
              </a>
              <a href="https://instagram.com" className="text-white-50 hover:text-white fs-5" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" className="text-white-50 hover:text-white fs-5" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin"></i>
              </a>
            </div>
          </div>

        </div>

        <hr className="mb-4 mt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Bottom copyright bar */}
        <div className="row align-items-center">
          <div className="col-md-7 col-lg-8">
            <p className="text-white-50 mb-0" style={{ fontSize: '13px' }}>
              &copy; 2026 SkillsConnect Ghana. Made with pride for Ghanaian professionals 🇬🇭.
            </p>
          </div>
          <div className="col-md-5 col-lg-4 text-md-end mt-2 mt-md-0">
            <p className="text-white-50 mb-0" style={{ fontSize: '13px' }}>
              All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
