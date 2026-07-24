import React from 'react';
import StarRating from './StarRating';

export default function ReviewCard({ review }) {
  if (!review) return null;

  const reviewerName = review.reviewer_name || review.customer_name || 'Anonymous Client';
  const rating = parseFloat(review.rating || 0);
  const comment = review.comment || 'No comment text provided.';
  const createdAt = review.created_at ? new Date(review.created_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Recently';

  const replyText = review.reply_text || null;
  const replyAt = review.reply_at ? new Date(review.reply_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Recently';

  // Compute initials for the reviewer avatar
  const getInitials = (fullName) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="card border-0 border-bottom rounded-0 py-4 bg-transparent" id={`review-card-${review.review_id || 'item'}`}>
      <div className="d-flex align-items-start gap-3">
        {/* Reviewer Avatar Circle */}
        <div 
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
          style={{ width: '48px', height: '48px', fontSize: '15px' }}
        >
          {getInitials(reviewerName)}
        </div>

        {/* Review Content */}
        <div className="flex-grow-1">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-2 gap-1">
            <h6 className="fw-bold mb-0 text-dark">{reviewerName}</h6>
            <small className="text-muted fs-8">{createdAt}</small>
          </div>

          {/* Stars Row */}
          <div className="mb-2">
            <StarRating rating={rating} size="sm" />
          </div>

          {/* Comment Text */}
          <p className="text-secondary mb-0 fs-7" style={{ lineHeight: '1.6' }}>
            {comment}
          </p>

          {/* Nested Artisan Reply */}
          {replyText && (
            <div 
              className="border-start border-warning border-4 bg-light p-3 rounded-3 mt-3 ms-2 ms-sm-4"
              style={{ borderLeftColor: 'var(--secondary) !important' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="fw-bold text-dark fs-7 d-flex align-items-center gap-1.5">
                  <i className="fa-solid fa-reply text-secondary"></i>
                  <span>Artisan Response</span>
                </span>
                <small className="text-muted fs-8">{replyAt}</small>
              </div>
              <p className="text-secondary mb-0 fs-7 italic" style={{ fontStyle: 'italic', lineHeight: '1.5' }}>
                &quot;{replyText}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
