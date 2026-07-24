'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsAndConditions() {
  return (
    <div className="d-flex flex-column min-vh-100" id="terms-conditions-page">
      <Navbar />

      {/* Header bar */}
      <div className="bg-light border-bottom py-5" id="terms-header">
        <div className="container text-center py-4">
          <h1 className="display-6 fw-bold text-dark mb-1">Terms & Conditions</h1>
          <p className="text-muted small">Effective date: July 17, 2026 | SkillsConnect Ghana</p>
        </div>
      </div>

      {/* Content */}
      <div className="container flex-grow-1 py-5 text-start" style={{ maxWidth: '800px' }}>
        <article className="text-secondary" style={{ lineHeight: '1.8' }}>
          
          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">1. Agreement to Terms</h4>
            <p>
              Welcome to SkillsConnect Ghana (the &quot;Platform&quot;). These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;) and SkillsConnect Ghana, concerning your access to and use of our web application.
            </p>
            <p>
              By accessing the Platform, registering an account, or requesting domestic artisan services, you acknowledge that you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these terms, then you are expressly prohibited from using the Platform and must discontinue use immediately.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">2. Description of Services</h4>
            <p>
              SkillsConnect Ghana is a digital intermediary marketplace that allows customers (individuals seeking service) to locate, communicate with, and submit service enquiries to verified independent service providers (artisans, such as plumbers, electricians, carpenters, etc.).
            </p>
            <p>
              <strong>Please Note:</strong> SkillsConnect Ghana is not an employer, general contractor, or agent of any artisan. All service agreements, project pricing, timelines, payment schedules, and actual craft deliverables are negotiated and entered into directly between the customer and the artisan. We do not guarantee or supervise artisan performance or accept liability for any project outcomes.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">3. User Accounts & Verification</h4>
            <p>
              To access core features of the platform, you must register for an account as either a &quot;Customer&quot; or a &quot;Service Provider&quot; (Artisan). You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete registration data.</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
              <li>Promptly notify us if you discover or suspect any security breaches related to your account.</li>
            </ul>
            <p>
              Artisans must undergo manual background and skill checks by our registration team prior to profile approval. We reserve the right to suspend or terminate any accounts that provide false information or violate trade ethics.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">4. Rules of Communication & Job Enquiries</h4>
            <p>
              Customers may submit project enquiries directly to approved artisans using our platform. You agree not to:
            </p>
            <ul>
              <li>Submit fraudulent, harassing, spam, or abusive enquiries.</li>
              <li>Offer or solicit trade jobs that violate local laws or regulations in Ghana.</li>
              <li>Expose private contact details publicly on profile pages.</li>
            </ul>
          </section>

          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">5. Reviews & Platform Integrity</h4>
            <p>
              Clients may write reviews and rate artisans after service delivery. Reviews must reflect honest, firsthand experiences. Fake reviews, self-reviews, or coerced ratings are strictly prohibited and will result in permanent account termination and removal from search directories.
            </p>
          </section>

          <section className="mb-5">
            <h4 className="fw-bold text-dark mb-3">6. Modifications and Interruptions</h4>
            <p>
              We reserve the right to change, modify, or remove the contents of the Platform at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Platform.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold text-dark mb-3">7. Contact Us</h4>
            <p>
              If you have any questions or require clarifications regarding these Terms & Conditions, please contact us at: <strong className="text-dark">skillsconnectgh@zohomail.com</strong> or write to us through our official <a href="/contact" className="text-primary text-decoration-none fw-semibold">Contact Page</a>.
            </p>
          </section>

        </article>
      </div>

      <Footer />
    </div>
  );
}
