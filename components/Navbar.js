'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench, LogOut, User, LayoutDashboard, Menu } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Helper to check active path
  const isActive = (path) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname?.startsWith(path);
  };

  // Helper to get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top bg-white shadow-sm py-3" id="main-navbar">
      <div className="container">
        {/* Logo */}
        <Link href="/" className="navbar-brand d-flex align-items-center text-primary text-decoration-none">
          <Wrench className="me-2 text-primary" size={24} />
          <span className="fs-4 fw-bold">
            SkillsConnect<span className="text-secondary">Ghana</span>
          </span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#skillsConnectNav"
          aria-controls="skillsConnectNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <Menu size={24} className="text-dark" />
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="skillsConnectNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link fw-medium ${isActive('/') ? 'text-primary' : 'text-dark'}`}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/artisans"
                className={`nav-link fw-medium ${isActive('/artisans') ? 'text-primary' : 'text-dark'}`}
              >
                Browse Artisans
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/#how-it-works"
                className="nav-link fw-medium text-dark"
              >
                How It Works
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/about"
                className={`nav-link fw-medium ${isActive('/about') ? 'text-primary' : 'text-dark'}`}
              >
                About Us
              </Link>
            </li>
          </ul>

          {/* Right Side Controls */}
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <div className="dropdown">
                <button
                  className="btn d-flex align-items-center gap-2 border-0 p-1 dropdown-toggle shadow-none"
                  type="button"
                  id="userDropdownMenu"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div
                    className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold"
                    style={{ width: '40px', height: '40px', fontSize: '14px' }}
                  >
                    {getInitials(user.full_name)}
                  </div>
                  <span className="d-none d-md-inline text-dark fw-medium fs-6">
                    {user.full_name?.split(' ')[0]}
                  </span>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2 rounded-3"
                  aria-labelledby="userDropdownMenu"
                  style={{ minWidth: '220px' }}
                >
                  <li className="px-3 py-2 border-b">
                    <span className="fw-semibold text-dark d-block text-truncate">
                      {user.full_name}
                    </span>
                    <span className="text-muted small text-capitalize">{user.role} Account</span>
                  </li>
                  <li><hr className="dropdown-divider my-2" /></li>
                  <li>
                    <Link href="/dashboard" className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2">
                      <LayoutDashboard size={16} className="text-muted" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link href={user.role === 'artisan' ? '/dashboard/artisan/profile' : (user.role === 'admin' ? '/dashboard/admin/settings' : '/dashboard/customer/settings')} className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2">
                      <User size={16} className="text-muted" />
                      <span>My Profile</span>
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-2" /></li>
                  <li>
                    <button
                      onClick={logout}
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2 text-danger bg-transparent border-0"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link href="/login" className="btn btn-outline-primary px-4 py-2 rounded-pill text-decoration-none">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary px-4 py-2 rounded-pill text-decoration-none">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
