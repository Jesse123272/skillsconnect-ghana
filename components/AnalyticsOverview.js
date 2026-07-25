'use client';

import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AnalyticsOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analytics/overview', { credentials: 'include' });
        const json = await res.json();
        if (json.success) {
          setMetrics(json.data);
        } else {
          setError(json.error || 'Unable to load analytics.');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div className="text-center py-4"><LoadingSpinner /></div>;
  if (error) return <div className="alert alert-warning">{error}</div>;

  const cards = [
    { title: 'Platform users', value: metrics?.users ?? 0, icon: 'fa-users' },
    { title: 'Approved artisans', value: metrics?.artisans ?? 0, icon: 'fa-hammer' },
    { title: 'New enquiries', value: metrics?.enquiries ?? 0, icon: 'fa-envelope-open-text' },
    { title: 'Reviews', value: metrics?.reviews ?? 0, icon: 'fa-star' }
  ];

  return (
    <div className="border rounded-3 bg-white p-3 p-md-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-1">Analytics overview</h5>
          <p className="text-muted small mb-0">Live engagement metrics for your marketplace.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-md-3 col-sm-6" key={card.title}>
            <div className="border rounded-3 p-3 h-100 bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="small text-muted">{card.title}</div>
                  <div className="fs-4 fw-bold">{card.value}</div>
                </div>
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 text-primary">
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-3 p-3 bg-light">
        <h6 className="fw-semibold">Recent activity</h6>
        <ul className="mb-0 small text-muted">
          <li>{metrics?.recentViews ?? 0} profile views in the last 30 days.</li>
          <li>{metrics?.featured ?? 0} artisans currently featured.</li>
        </ul>
      </div>
    </div>
  );
}
