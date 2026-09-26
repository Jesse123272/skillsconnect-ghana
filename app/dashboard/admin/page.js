'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, Briefcase, Star, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSummary() {
      try {
        const response = await authFetch('/api/admin/stats');
        const result = await response.json();
        if (!active) return;
        if (response.ok && result.success) {
          setStats(result.data);
        } else {
          setError(result.error || 'Unable to load the admin summary.');
        }
      } catch (loadError) {
        if (active) setError('Unable to load the admin summary right now.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [authFetch]);

  if (loading) {
    return <LoadingSpinner message="Loading platform overview..." />;
  }

  const summaryCards = [
    { title: 'Total Users', value: stats?.total_users || 0, href: '/dashboard/admin/users', icon: Users, tone: 'primary', action: 'Manage users' },
    { title: 'Total Artisans', value: stats?.total_artisans || 0, href: '/dashboard/admin/artisans', icon: Briefcase, tone: 'success', action: 'Manage artisans' },
    { title: 'Total Reviews', value: stats?.total_reviews || 0, href: '/dashboard/admin/reviews', icon: Star, tone: 'warning', action: 'Review moderation' },
    { title: 'Pending Approvals', value: stats?.pending_approvals || 0, href: '/dashboard/admin/artisans?status=Pending', icon: AlertTriangle, tone: 'danger', action: 'Review applications' },
  ];

  return (
    <div className="container-fluid px-0" id="admin-dashboard-home">
      <div className="mb-4">
        <h2 className="h4 fw-bold text-dark mb-1">Platform overview</h2>
        <p className="text-muted mb-0">Choose a section to review its full details.</p>
      </div>

      {error && <div className="alert alert-warning" role="alert">{error}</div>}

      <div className="row g-3" id="admin-summary-cards">
        {summaryCards.map(({ title, value, href, icon: Icon, tone, action }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={title}>
            <Link href={href} className="card h-100 border shadow-sm p-3 bg-white text-decoration-none">
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <span className="text-muted text-uppercase fw-semibold small">{title}</span>
                  <h3 className="mb-0 mt-1 fw-bold text-dark">{value}</h3>
                </div>
                <span className={`p-3 bg-${tone} bg-opacity-10 text-${tone} rounded-3`}>
                  <Icon size={22} />
                </span>
              </div>
              <span className={`mt-3 pt-2 border-top text-${tone} small fw-semibold d-flex align-items-center gap-1`}>
                {action}<ArrowRight size={14} />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}