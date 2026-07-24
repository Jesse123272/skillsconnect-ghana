'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Bar, 
  Doughnut, 
  Line, 
  Pie 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  MapPin, 
  Star, 
  Award, 
  UserCheck, 
  FileDown, 
  Printer, 
  Maximize2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticalReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadReports() {
      try {
        const res = await fetch('/api/admin/reports', { credentials: 'include' });
        const resData = await res.json();
        if (resData.success && active) {
          setData(resData.data);
        } else if (active) {
          toast.error(resData.error || 'Failed to retrieve analytical data.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error building reporting matrix.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReports();
    return () => { active = false; };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="System Reports">
        <LoadingSpinner message="Assembling platform database metrics..." />
      </DashboardLayout>
    );
  }

  // Set up Chart.js Configurations
  const regChartData = {
    labels: data?.registrations_chart?.labels || [],
    datasets: [{
      fill: true,
      label: 'Monthly New Signups',
      data: data?.registrations_chart?.data || [],
      borderColor: '#198754',
      backgroundColor: 'rgba(25, 135, 84, 0.12)',
      tension: 0.3,
      borderWidth: 2,
    }]
  };

  const enqChartData = {
    labels: data?.enquiries_chart?.labels || [],
    datasets: [{
      fill: true,
      label: 'Monthly Trade Enquiries',
      data: data?.enquiries_chart?.data || [],
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.12)',
      tension: 0.3,
      borderWidth: 2,
    }]
  };

  const categoryDoughnutData = {
    labels: data?.category_distribution?.labels || [],
    datasets: [{
      label: 'Registered Artisans',
      data: data?.category_distribution?.data || [],
      backgroundColor: [
        '#198754', '#0d6efd', '#ffc107', '#dc3545', '#6f42c1', 
        '#fd7e14', '#20c997', '#0dcaf0', '#6c757d', '#adb5bd'
      ],
      borderWidth: 1,
    }]
  };

  const ratingsBarData = {
    labels: data?.ratings_distribution?.labels || [],
    datasets: [{
      label: 'Reviews Distribution',
      data: data?.ratings_distribution?.data || [],
      backgroundColor: '#ffc107',
      borderRadius: 4,
    }]
  };

  const regionBarData = {
    labels: data?.region_distribution?.labels || [],
    datasets: [{
      label: 'Artisans by Region',
      data: data?.region_distribution?.data || [],
      backgroundColor: '#6f42c1',
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f8f9fa' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <DashboardLayout pageTitle="Analytics & Business Intelligence">
      {/* Action header Row */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom text-dark d-print-none">
        <span className="text-muted small">Comprehensive platform performance metrics aggregated as of today.</span>
        <div className="d-flex gap-2">
          <button 
            onClick={handlePrint}
            className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="row g-4 text-dark" id="reports-grid">
        {/* ROW 1: Registrations & Enquiries Line Charts */}
        <div className="col-lg-6">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <TrendingUp size={18} className="text-success" />
              <span>User Registrations Trend (Last 12 Months)</span>
            </h6>
            <div style={{ height: '240px', position: 'relative' }}>
              <Line data={regChartData} options={{ ...chartOptions, plugins: { legend: { display: true } } }} />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <span>Customer Enquiries Trend (Last 12 Months)</span>
            </h6>
            <div style={{ height: '240px', position: 'relative' }}>
              <Line data={enqChartData} options={{ ...chartOptions, plugins: { legend: { display: true } } }} />
            </div>
          </div>
        </div>

        {/* ROW 2: Category Distribution Doughnut & Ratings Bar */}
        <div className="col-lg-5">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Award size={18} className="text-warning" />
              <span>Artisans Category Distribution</span>
            </h6>
            <div style={{ height: '240px', position: 'relative' }} className="d-flex align-items-center justify-content-center">
              {data?.category_distribution?.data?.length > 0 ? (
                <Doughnut data={categoryDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <span className="text-muted small">No category data recorded yet.</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Star size={18} className="text-warning" />
              <span>Ratings Score Distribution (Stars)</span>
            </h6>
            <div style={{ height: '240px', position: 'relative' }}>
              <Bar data={ratingsBarData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* ROW 3: Regional Density Distribution */}
        <div className="col-lg-12">
          <div className="card shadow-sm border bg-white p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <MapPin size={18} className="text-primary" />
              <span>Artisan Density Across Ghanaian Regions</span>
            </h6>
            <div style={{ height: '260px', position: 'relative' }}>
              <Bar data={regionBarData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* ROW 4: Analytical Data Tables */}
        <div className="col-lg-6">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Award size={18} className="text-warning" />
              <span>Top 5 Highest Rated Approved Artisans</span>
            </h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '12.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Artisan Name</th>
                    <th>Category</th>
                    <th className="text-end">Avg Rating</th>
                    <th className="text-end">Reviews Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top_rated_artisans?.length > 0 ? (
                    data.top_rated_artisans.map((art, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{art.full_name}</td>
                        <td>{art.category_name}</td>
                        <td className="text-end fw-bold text-warning d-flex align-items-center justify-content-end gap-1">
                          <Star size={12} className="fill-warning text-warning" />
                          <span>{Number(art.average_rating).toFixed(1)}</span>
                        </td>
                        <td className="text-end text-muted">{art.total_reviews} reviews</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">No rated artisans available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border bg-white p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <UserCheck size={18} className="text-primary" />
              <span>Top 5 Most Engaged Platform Customers</span>
            </h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '12.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Customer Name</th>
                    <th className="text-end">Enquiries Sent</th>
                    <th className="text-end">Reviews Written</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.most_active_customers?.length > 0 ? (
                    data.most_active_customers.map((cust, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{cust.full_name}</td>
                        <td className="text-end text-primary fw-medium">{cust.enquiries_count} enquiries</td>
                        <td className="text-end text-muted">{cust.reviews_count} reviews</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-3 text-muted">No active customer interactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
