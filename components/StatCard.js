import React from 'react';

export default function StatCard({
  title,
  value,
  icon,
  trend,
  colorClass = 'text-primary',
  bgClass = 'bg-primary-subtle',
}) {
  return (
    <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100" id={`stat-card-${title?.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="d-flex align-items-center justify-content-between">
        {/* Metric Value & Title */}
        <div className="d-flex flex-column">
          <span className="text-muted text-uppercase fw-semibold tracking-wider fs-7 mb-1">
            {title}
          </span>
          <h3 className="fw-bold mb-1 text-dark fs-3">
            {value}
          </h3>
          
          {/* Trend percentage indicator */}
          {trend && (
            <div className="d-flex align-items-center gap-1.5 mt-1">
              <span className={`fw-semibold fs-7 d-flex align-items-center ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                <i className={`fa-solid ${trend.isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} me-1`}></i>
                {trend.value}
              </span>
              <span className="text-muted fs-8">vs last month</span>
            </div>
          )}
        </div>

        {/* Icon container */}
        {icon && (
          <div 
            className={`rounded-circle d-flex align-items-center justify-content-center p-3 ${bgClass}`}
            style={{ width: '56px', height: '56px' }}
          >
            <i className={`fa-solid ${icon} ${colorClass} fs-4`}></i>
          </div>
        )}
      </div>
    </div>
  );
}
