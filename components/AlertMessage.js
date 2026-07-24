'use client';

import React, { useState, useEffect, useCallback } from 'react';

export default function AlertMessage({
  type = 'info', // success, danger, warning, info
  message,
  onClose,
  autoCloseTime = 0, // Time in ms (0 = do not autoclose)
}) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (autoCloseTime > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoCloseTime, handleDismiss]);

  if (!message || !visible) return null;

  // Resolve bootstrap type and Font Awesome icon
  const alertStyles = {
    success: {
      alertClass: 'alert-success border-success-subtle bg-success-subtle text-success-emphasis',
      icon: 'fa-circle-check',
    },
    danger: {
      alertClass: 'alert-danger border-danger-subtle bg-danger-subtle text-danger-emphasis',
      icon: 'fa-circle-exclamation',
    },
    warning: {
      alertClass: 'alert-warning border-warning-subtle bg-warning-subtle text-warning-emphasis',
      icon: 'fa-triangle-exclamation',
    },
    info: {
      alertClass: 'alert-info border-info-subtle bg-info-subtle text-info-emphasis',
      icon: 'fa-circle-info',
    },
  };

  const currentStyle = alertStyles[type] || alertStyles.info;

  return (
    <div 
      className={`alert ${currentStyle.alertClass} d-flex align-items-center justify-content-between p-3 rounded-3 shadow-xs border fade show mb-4`} 
      role="alert"
      id={`alert-message-${type}`}
    >
      <div className="d-flex align-items-center gap-2">
        <i className={`fa-solid ${currentStyle.icon} fs-5 me-2`}></i>
        <div className="fw-medium" style={{ fontSize: '14px' }}>{message}</div>
      </div>
      
      {onClose && (
        <button
          type="button"
          className="btn-close shadow-none border-0 ms-auto"
          aria-label="Close"
          onClick={handleDismiss}
          style={{ cursor: 'pointer' }}
        ></button>
      )}
    </div>
  );
}
