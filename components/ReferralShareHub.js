'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import StarRating from './StarRating';

export default function ReferralShareHub({ artisanId, artisanName, categoryName, averageRating, district, region }) {
  const [friendName, setFriendName] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState('Highly Recommended');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic profile URL
  const getProfileUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/artisan/${artisanId}`;
    }
    return `https://skillsconnect.gh/artisan/${artisanId}`;
  };

  // Generate WhatsApp text
  const generateShareText = () => {
    const url = getProfileUrl();
    const salutation = friendName ? `Hi ${friendName}! ` : 'Hi! ';
    const ratingStars = '★'.repeat(Math.round(averageRating || 5)) + '☆'.repeat(5 - Math.round(averageRating || 5));
    
    return `${salutation}I highly recommend ${artisanName} for any ${categoryName} needs! 🛠️🇬🇭\n\n` +
           `• Specialty: ${categoryName}\n` +
           `• Highlights: ${selectedHighlight}\n` +
           `• Rating: ${parseFloat(averageRating || 5).toFixed(1)}/5.0 ${ratingStars}\n` +
           `• Location: ${district}, ${region}\n\n` +
           `You can view their verified portfolio and contact them directly here on SkillsConnect:\n${url}`;
  };

  // Copy link
  const handleCopyLink = () => {
    const url = getProfileUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Profile link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp click
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="card border rounded-4 p-4 bg-white shadow-sm mb-4" id="referral-share-hub">
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          <i className="fa-solid fa-share-nodes text-warning fs-5"></i>
        </div>
        <div>
          <h5 className="fw-bold text-dark mb-0">Referral & Sharing Hub</h5>
          <small className="text-muted">Easily recommend {artisanName} to others</small>
        </div>
      </div>

      <div className="p-3 bg-light rounded-3 border mb-3">
        <p className="small text-secondary mb-0 leading-relaxed">
          Help friends and neighbors in Ghana find verified talent. Use our WhatsApp recommendation builder to instantly generate a professional message with rating stats and contact links!
        </p>
      </div>

      <div className="row g-3 mb-3">
        {/* Recipient Input */}
        <div className="col-12">
          <label className="form-label text-secondary small fw-medium mb-1">Friend&apos;s Name (Optional)</label>
          <input 
            type="text" 
            className="form-control text-dark font-medium" 
            style={{ fontSize: '14px', borderRadius: '8px' }}
            placeholder="e.g. Auntie Ama, Uncle Kofi"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
          />
        </div>

        {/* Quality Highlight */}
        <div className="col-12">
          <label className="form-label text-secondary small fw-medium mb-1">Key Recommendation Highlight</label>
          <div className="d-flex flex-wrap gap-2">
            {[
              'Highly Recommended',
              'Exceptional Quality Craft',
              'Extremely Punctual & Polite',
              'Fair & Honest Pricing',
              'Very Fast & Tidy Execution'
            ].map((highlight) => (
              <button
                key={highlight}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 transition-all ${selectedHighlight === highlight ? 'btn-primary' : 'btn-outline-secondary border-secondary-subtle bg-white text-muted'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedHighlight(highlight)}
              >
                {highlight}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sharing Actions */}
      <div className="row g-2 mt-2">
        <div className="col-sm-6">
          <button
            type="button"
            className="btn btn-success w-100 rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white border-0"
            style={{ backgroundColor: '#25D366' }}
            onClick={handleWhatsAppShare}
          >
            <i className="fa-brands fa-whatsapp fs-5"></i>
            Recommend on WhatsApp
          </button>
        </div>
        <div className="col-sm-6">
          <button
            type="button"
            className="btn btn-outline-primary w-100 rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <i className="fa-solid fa-check text-success"></i>
                Link Copied!
              </>
            ) : (
              <>
                <i className="fa-regular fa-copy"></i>
                Copy Profile Link
              </>
            )}
          </button>
        </div>
        <div className="col-12 mt-2">
          <button
            type="button"
            className="btn btn-light border w-100 rounded-pill py-2.5 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2"
            onClick={() => setShowQrModal(true)}
          >
            <i className="fa-solid fa-qrcode text-primary"></i>
            Show Digital Share Card & QR Code
          </button>
        </div>
      </div>

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '1050' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <button 
                  type="button" 
                  className="btn-close ms-auto" 
                  onClick={() => setShowQrModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center p-4 pt-0">
                {/* Visual Digital Business Card */}
                <div 
                  className="card p-4 text-white rounded-4 shadow-sm mb-4 border-0 position-relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1A6B3C, #124C2A)'
                  }}
                >
                  {/* Ghana Flag Diagonal Stripe Design decoration */}
                  <div className="position-absolute" style={{ top: 0, right: 0, width: '120px', height: '10px', display: 'flex' }}>
                    <div className="flex-grow-1 h-100" style={{ backgroundColor: '#ED1C24' }}></div>
                    <div className="flex-grow-1 h-100" style={{ backgroundColor: '#FCD116' }}></div>
                    <div className="flex-grow-1 h-100" style={{ backgroundColor: '#006B3F' }}></div>
                  </div>

                  <span className="badge bg-warning text-dark px-3 py-1 rounded-pill mb-3 fw-semibold uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    RECOMMENDED SKILLED ARTISAN
                  </span>
                  
                  <h4 className="fw-bold mb-1 text-white">{artisanName}</h4>
                  <p className="small text-white-50 mb-3">{categoryName} • {district}, {region}</p>
                  
                  {/* SVG QR Code */}
                  <div className="bg-white p-3 rounded-4 d-inline-block shadow-sm mx-auto mb-3" style={{ width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                      {/* Borders and corners */}
                      <rect x="5" y="5" width="20" height="20" fill="#1A6B3C" />
                      <rect x="8" y="8" width="14" height="14" fill="#ffffff" />
                      <rect x="11" y="11" width="8" height="8" fill="#1A6B3C" />

                      <rect x="75" y="5" width="20" height="20" fill="#1A6B3C" />
                      <rect x="78" y="8" width="14" height="14" fill="#ffffff" />
                      <rect x="81" y="11" width="8" height="8" fill="#1A6B3C" />

                      <rect x="5" y="75" width="20" height="20" fill="#1A6B3C" />
                      <rect x="8" y="78" width="14" height="14" fill="#ffffff" />
                      <rect x="11" y="81" width="8" height="8" fill="#1A6B3C" />

                      {/* Random aesthetic QR-like pixels */}
                      <rect x="35" y="10" width="4" height="4" fill="#1A6B3C" />
                      <rect x="45" y="15" width="4" height="8" fill="#1A6B3C" />
                      <rect x="55" y="5" width="8" height="4" fill="#1A6B3C" />
                      <rect x="65" y="12" width="4" height="4" fill="#1A6B3C" />
                      
                      <rect x="10" y="35" width="8" height="4" fill="#1A6B3C" />
                      <rect x="15" y="45" width="4" height="8" fill="#1A6B3C" />
                      <rect x="5" y="55" width="4" height="4" fill="#1A6B3C" />
                      
                      <rect x="30" y="30" width="12" height="12" fill="#1A6B3C" />
                      <rect x="33" y="33" width="6" height="6" fill="#ffffff" />
                      
                      <rect x="50" y="35" width="16" height="4" fill="#1A6B3C" />
                      <rect x="45" y="45" width="8" height="8" fill="#1A6B3C" />
                      <rect x="60" y="50" width="12" height="4" fill="#1A6B3C" />
                      <rect x="55" y="60" width="4" height="12" fill="#1A6B3C" />

                      <rect x="35" y="75" width="8" height="4" fill="#1A6B3C" />
                      <rect x="30" y="85" width="4" height="8" fill="#1A6B3C" />
                      <rect x="45" y="80" width="12" height="4" fill="#1A6B3C" />
                      <rect x="65" y="75" width="4" height="12" fill="#1A6B3C" />
                      
                      <rect x="80" y="35" width="4" height="8" fill="#1A6B3C" />
                      <rect x="85" y="45" width="10" height="4" fill="#1A6B3C" />
                      <rect x="75" y="55" width="4" height="12" fill="#1A6B3C" />
                      <rect x="85" y="65" width="8" height="8" fill="#1A6B3C" />

                      {/* Center Emblem - Ghana Black Star */}
                      <rect x="44" y="44" width="12" height="12" fill="#FCD116" rx="2" />
                      <path d="M 50,45 L 51.5,49 L 55.5,49 L 52.3,51.2 L 53.5,55 L 50,52.8 L 46.5,55 L 47.7,51.2 L 44.5,49 L 48.5,49 Z" fill="#000000" />
                    </svg>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-center gap-1 mt-1 small">
                    <StarRating rating={averageRating} size="sm" />
                    <span className="fw-bold text-warning">{parseFloat(averageRating || 5).toFixed(1)}/5.0 Stars</span>
                  </div>

                  <p className="fs-8 text-white-50 mt-2 mb-0">
                    Scan with mobile phone to view full verified profile
                  </p>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary rounded-pill px-4"
                    onClick={handleCopyLink}
                  >
                    <i className="fa-solid fa-copy me-1.5"></i>
                    Copy Profile URL
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary text-dark rounded-pill px-4"
                    onClick={() => setShowQrModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
