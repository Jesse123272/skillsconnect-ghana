import React from 'react';

export default function EnquiryCard({ enquiry, viewerRole = 'customer' }) {
  if (!enquiry) return null;

  const enquiryId = enquiry.enquiry_id || enquiry.id;
  const artisanName = enquiry.artisan_name || 'Skilled Artisan';
  const customerName = enquiry.customer_name || 'Valued Client';
  const message = enquiry.message || 'No enquiry message details provided.';
  const status = (enquiry.status || 'pending').toLowerCase();
  
  // Format date
  const createdAtStr = enquiry.created_at ? new Date(enquiry.created_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Recently';

  // Badge class resolution
  const getBadgeClass = (statusStr) => {
    switch (statusStr) {
      case 'pending':
        return 'bg-warning text-dark'; // Gold secondary
      case 'accepted':
      case 'approved':
      case 'ongoing':
        return 'bg-info text-white';
      case 'completed':
      case 'resolved':
        return 'bg-success text-white'; // Success green
      case 'rejected':
      case 'declined':
      case 'cancelled':
        return 'bg-danger text-white'; // Danger red
      default:
        return 'bg-secondary text-white';
    }
  };

  // Determine label and name depending on viewer role
  const getHeaderDetails = () => {
    if (viewerRole === 'customer') {
      return {
        icon: 'fa-user-tie',
        label: 'Inquired Artisan',
        name: artisanName,
      };
    } else if (viewerRole === 'artisan') {
      return {
        icon: 'fa-user',
        label: 'Requesting Client',
        name: customerName,
      };
    } else {
      // Admin view
      return {
        icon: 'fa-circle-nodes',
        label: `Client: ${customerName}`,
        name: `Artisan: ${artisanName}`,
      };
    }
  };

  const header = getHeaderDetails();

  return (
    <div className="card border rounded-3 mb-3 bg-white shadow-xs" id={`enquiry-card-${enquiryId}`}>
      {/* Card Header row */}
      <div className="card-header bg-transparent border-0 p-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <div 
            className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted border"
            style={{ width: '40px', height: '40px' }}
          >
            <i className={`fa-solid ${header.icon} text-primary fs-5`}></i>
          </div>
          <div>
            <span className="text-muted d-block uppercase fs-8 tracking-wider fw-semibold" style={{ fontSize: '11px' }}>
              {header.label}
            </span>
            <strong className="text-dark fs-6">{header.name}</strong>
          </div>
        </div>

        {/* Right side: Badge + Date */}
        <div className="d-flex align-items-center gap-3 ms-md-auto w-100 w-md-auto justify-content-between justify-content-md-end">
          <span className="text-muted fs-7">{createdAtStr}</span>
          <span className={`badge ${getBadgeClass(status)} text-capitalize px-2.5 py-1.5 rounded-pill fs-7 fw-semibold`}>
            {status}
          </span>
        </div>
      </div>

      {/* Message segment - starts previewed and collapsible using standard Bootstrap collapse */}
      <div className="card-body pt-0 px-3 pb-3">
        <div className="border-top pt-3">
          <button 
            className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-1.5 mb-2 w-100 text-start shadow-none"
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target={`#enquiryCollapse-${enquiryId}`} 
            aria-expanded="false" 
            aria-controls={`enquiryCollapse-${enquiryId}`}
            style={{ cursor: 'pointer' }}
          >
            <span className="fw-semibold text-dark fs-7">Enquiry Message Details</span>
            <i className="fa-solid fa-chevron-down fs-8"></i>
          </button>
          
          <div className="collapse show" id={`enquiryCollapse-${enquiryId}`}>
            <div className="p-3 bg-light rounded-3 text-secondary fs-7" style={{ lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
