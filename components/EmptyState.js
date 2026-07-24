import React from 'react';
import Link from 'next/link';

export default function EmptyState({
  title = 'No records found',
  description = 'There are currently no items to display in this list.',
  icon = 'fa-folder-open',
  actionText,
  actionHref,
}) {
  return (
    <div className="text-center py-5 px-4 my-4 rounded-3 border bg-white shadow-sm d-flex flex-column align-items-center justify-content-center mx-auto" id="empty-state-card" style={{ maxWidth: '520px' }}>
      {/* Icon Circle block */}
      <div 
        className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted mb-4 shadow-sm border border-white"
        style={{ width: '80px', height: '80px' }}
      >
        <i className={`fa-solid ${icon} fs-1 text-secondary`} style={{ color: '#F5A623' }}></i>
      </div>

      {/* Headings */}
      <h4 className="fw-bold text-dark mb-2">{title}</h4>
      <p className="text-muted fs-6 mb-4 px-2" style={{ lineHeight: '1.6' }}>
        {description}
      </p>

      {/* Action CTA Button */}
      {actionText && actionHref && (
        <Link 
          href={actionHref} 
          className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm d-inline-flex align-items-center gap-2 text-decoration-none fw-medium"
        >
          <span>{actionText}</span>
          <i className="fa-solid fa-arrow-right fs-7"></i>
        </Link>
      )}
    </div>
  );
}
