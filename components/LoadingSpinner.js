import React from 'react';

export default function LoadingSpinner({
  message = 'Loading...',
  fullPage = false,
}) {
  const spinnerElement = (
    <div className="d-flex flex-column align-items-center justify-content-center text-center p-4">
      {/* Interactive dual-ring spinner */}
      <div 
        className="spinner-border text-primary mb-3" 
        role="status" 
        style={{ 
          width: '3.5rem', 
          height: '3.5rem', 
          borderWidth: '0.25em',
          color: 'var(--primary)'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <p className="text-muted fw-semibold mb-0 fs-6 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white z-3"
        style={{ opacity: '0.95', backdropFilter: 'blur(4px)' }}
        id="fullpage-loading-spinner"
      >
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="w-100 d-flex align-items-center justify-content-center my-5" id="inline-loading-spinner">
      {spinnerElement}
    </div>
  );
}
