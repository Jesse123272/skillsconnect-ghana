'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().substring(0, 2);
  };

  const navLinks = [
    { href: '/browse', label: 'Browse Artisans' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About Us' },
  ];

  return (
    <header>
      <nav
        className="navbar navbar-expand-lg sticky-top shadow-sm py-0"
        id="main-navbar"
        aria-label="Primary navigation"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', minHeight: '68px' }}
      >
        <div className="container">
          {/* Logo */}
          <Link href="/" className="navbar-brand d-flex align-items-center text-primary text-decoration-none py-3">
            <Wrench className="me-2 text-primary" size={22} aria-hidden="true" />
            <span className="fs-5 fw-bold lh-1">
              SkillsConnect<span className="text-secondary">Ghana</span>
            </span>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0 shadow-none p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#skillsConnectNav"
            aria-controls="skillsConnectNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav Links */}
          <div className="collapse navbar-collapse py-3 py-lg-0" id="skillsConnectNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1">
              {navLinks.map(({ href, label }) => (
                <li key={href} className="nav-item">
                  <Link
                    href={href}
                    className={`nav-link fw-medium px-3 py-2 rounded-3 ${
                      isActive(href)
                        ? 'text-primary bg-primary-subtle'
                        : 'text-dark'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth Controls */}
            <div className="d-flex align-items-center gap-2 pb-2 pb-lg-0">
              {user ? (
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center gap-2 border rounded-pill px-3 py-2 shadow-none bg-white"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div
                      className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold flex-shrink-0"
                      style={{ width: '32px', height: '32px', fontSize: '12px' }}
                    >
                      {getInitials(user.full_name)}
                    </div>
                    <span className="d-none d-md-inline text-dark fw-medium fs-6 text-truncate" style={{ maxWidth: '120px' }}>
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <i className="fa-solid fa-chevron-down text-muted" style={{ fontSize: '10px' }} aria-hidden="true"></i>
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-2 rounded-4"
                    style={{ minWidth: '220px' }}
                  >
                    <li className="px-3 py-2">
                      <span className="fw-semibold text-dark d-block text-truncate" title={user.full_name}>
                        {user.full_name}
                      </span>
                      <span className="text-muted small text-capitalize">{user.role} Account</span>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <Link href="/dashboard" className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3">
                        <LayoutDashboard size={15} className="text-muted" aria-hidden="true" />
                        <span>Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={
                          user.role === 'artisan'
                            ? '/dashboard/artisan/profile'
                            : user.role === 'admin'
                            ? '/dashboard/admin/settings'
                            : '/dashboard/customer/settings'
                        }
                        className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3"
                      >
                        <User size={15} className="text-muted" aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button
                        onClick={logout}
                        className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger"
                        type="button"
                      >
                        <LogOut size={15} aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Link href="/login" className="btn btn-outline-primary px-4 py-2 rounded-pill fw-medium">
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary px-4 py-2 rounded-pill fw-medium">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
