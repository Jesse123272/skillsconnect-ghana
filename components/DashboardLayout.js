'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  MessageSquare, 
  Heart, 
  Star, 
  User, 
  Bell, 
  LogOut, 
  Image as ImageIcon, 
  Sliders, 
  Users, 
  FolderPlus, 
  FileText, 
  CreditCard, 
  Activity, 
  Menu, 
  Settings, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function DashboardLayout({ children, pageTitle = 'Dashboard' }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingArtisansCount, setPendingArtisansCount] = useState(0);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);

  // Fetch badges/counts on mount
  useEffect(() => {
    if (!user) return;

    async function fetchBadges() {
      try {
        // Fetch Notifications
        const notifRes = await fetch('/api/notifications?limit=100');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.success && notifData.data && notifData.data.notifications) {
            const unread = notifData.data.notifications.filter(n => !n.is_read).length;
            setUnreadNotifications(unread);
          }
        }

        // Fetch unread enquiries
        const enquiryRes = await fetch('/api/enquiries');
        if (enquiryRes.ok) {
          const enquiryData = await enquiryRes.json();
          const items = Array.isArray(enquiryData?.data)
            ? enquiryData.data
            : Array.isArray(enquiryData?.data?.enquiries)
              ? enquiryData.data.enquiries
              : [];

          if (enquiryData.success) {
            const unread = items.filter(e => e?.status === 'pending').length;
            setUnreadEnquiries(unread);
          }
        }

        // Fetch pending artisans for Admin
        if (user.role === 'admin') {
          const pendingRes = await fetch('/api/admin/pending-artisans');
          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            if (pendingData.success && pendingData.data) {
              setPendingArtisansCount(pendingData.data.length);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard layout badges:', err);
      }
    }

    fetchBadges();
    // Poll notifications every 45 seconds
    const interval = setInterval(fetchBadges, 45000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted fw-medium">Loading SkillsConnect Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Define sidebar menu configurations
  const getSidebarItems = () => {
    switch (user.role) {
      case 'customer':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/customer' },
          { icon: Search, label: 'Browse Artisans', href: '/artisans' },
          { icon: MessageSquare, label: 'My Enquiries', href: '/dashboard/customer/enquiries', badge: unreadEnquiries },
          { icon: CreditCard, label: 'My Payments', href: '/dashboard/customer/payments' },
          { icon: Heart, label: 'Saved Artisans', href: '/dashboard/customer/saved' },
          { icon: Star, label: 'My Reviews', href: '/dashboard/customer/reviews' },
          { icon: FileText, label: 'Platform Testimonials', href: '/dashboard/customer/testimonials' },
          { icon: Bell, label: 'Notifications', href: '/dashboard/customer/notifications', badge: unreadNotifications },
          { icon: User, label: 'Profile Settings', href: '/dashboard/customer/settings' },
        ];
      case 'artisan':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/artisan' },
          { icon: User, label: 'My Profile', href: '/dashboard/artisan/profile' },
          { icon: ImageIcon, label: 'My Gallery', href: '/dashboard/artisan/gallery' },
          { icon: MessageSquare, label: 'Enquiries', href: '/dashboard/artisan/enquiries', badge: unreadEnquiries },
          { icon: CreditCard, label: 'Earnings & Payments', href: '/dashboard/artisan/transactions' },
          { icon: Star, label: 'My Reviews', href: '/dashboard/artisan/reviews' },
          { icon: Bell, label: 'Notifications', href: '/dashboard/artisan/notifications', badge: unreadNotifications },
          { icon: Settings, label: 'Account Settings', href: '/dashboard/artisan/settings' },
          { icon: User, label: 'Preview Profile', href: `/artisans/${user.user_id}` },
        ];
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
          { icon: Users, label: 'Manage Artisans', href: '/dashboard/admin/artisans', badge: pendingArtisansCount },
          { icon: Users, label: 'Manage Customers', href: '/dashboard/admin/customers' },
          { icon: FolderPlus, label: 'Categories', href: '/dashboard/admin/categories' },
          { icon: Star, label: 'Reviews', href: '/dashboard/admin/reviews' },
          { icon: MessageSquare, label: 'Enquiries', href: '/dashboard/admin/enquiries' },
          { icon: FileText, label: 'Reports', href: '/dashboard/admin/reports' },
          { icon: CreditCard, label: 'Transactions', href: '/dashboard/admin/transactions' },
          { icon: Activity, label: 'Activity Logs', href: '/dashboard/admin/logs' },
          { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getSidebarItems();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const isLinkActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Helper to generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return (
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0 py-2">
          <li className="breadcrumb-item">
            <Link href="/" className="text-muted text-decoration-none">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/dashboard" className="text-muted text-decoration-none">Dashboard</Link>
          </li>
          {segments.slice(1).map((seg, i) => {
            const url = `/dashboard/${segments.slice(2, 2 + i).join('/')}`;
            const isLast = i === segments.length - 2;
            return (
              <li key={i} className={`breadcrumb-item text-capitalize ${isLast ? 'active text-primary' : ''}`} aria-current={isLast ? 'page' : undefined}>
                {isLast ? seg : <Link href={url} className="text-muted text-decoration-none">{seg}</Link>}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  const sidebarContent = (
    <div className="d-flex flex-column h-100">
      {/* Brand Header */}
      <div className="p-4 border-bottom d-flex align-items-center gap-2">
        <span className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
          <i className="fa-solid fa-wrench"></i>
        </span>
        <span className="fs-5 fw-bold text-primary">
          SkillsConnect<span className="text-secondary">Ghana</span>
        </span>
      </div>

      {/* User Info card */}
      <div className="p-3 mx-3 my-3 bg-light rounded-3 text-center border">
        <div 
          className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold mx-auto mb-2"
          style={{ width: '60px', height: '60px', fontSize: '20px' }}
        >
          {getInitials(user.full_name)}
        </div>
        <h6 className="mb-0 text-dark fw-semibold text-truncate">{user.full_name}</h6>
        <span className="badge bg-secondary text-dark text-capitalize mt-1 font-semibold" style={{ fontSize: '11px' }}>
          {user.role}
        </span>
      </div>

      {/* Nav Links list */}
      <div className="flex-grow-1 overflow-y-auto px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          return (
            <Link 
              key={index}
              href={item.href}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon size={18} className="me-3" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`sidebar-badge badge ${active ? 'bg-dark text-white' : 'bg-danger text-white'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Logout button bottom */}
      <div className="p-3 border-top mt-auto">
        <button 
          onClick={logout}
          className="btn btn-outline-danger w-full d-flex align-items-center justify-content-center gap-2 py-2.5 rounded-3 border-0"
          style={{ width: '100%' }}
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column bg-light" id="dashboard-root">
      {/* Top Header Bar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top py-2 px-3 z-3">
        <div className="container-fluid">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn d-lg-none border-0 p-1"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarOffcanvas"
              aria-controls="sidebarOffcanvas"
            >
              <Menu size={24} />
            </button>
            <h5 className="mb-0 fw-bold d-none d-sm-inline-block text-dark ms-2">
              {pageTitle}
            </h5>
          </div>

          {/* Right: Notifications, Settings, Dropdown */}
          <div className="d-flex align-items-center gap-2 gap-sm-3 ms-auto">
            {/* Notification Bell Icon */}
            <Link 
              href={`/dashboard/${user?.role === 'admin' ? 'admin/logs' : (user?.role === 'artisan' ? 'artisan' : 'customer')}/notifications`} 
              className="position-relative text-dark p-2 rounded-circle hover-bg-light"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="position-absolute top-1 start-50 translate-middle badge rounded-pill bg-danger border border-white" style={{ fontSize: '10px' }}>
                  {unreadNotifications}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="dropdown">
              <button 
                className="btn border-0 p-0 dropdown-toggle d-flex align-items-center gap-2 shadow-none" 
                type="button" 
                id="headerUserDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <div 
                  className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold"
                  style={{ width: '36px', height: '36px', fontSize: '14px' }}
                >
                  {getInitials(user.full_name)}
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2 rounded-3" aria-labelledby="headerUserDropdown" style={{ minWidth: '200px' }}>
                <li className="px-3 py-2 text-dark">
                  <strong className="d-block text-truncate">{user.full_name}</strong>
                  <span className="text-muted small text-capitalize">{user.role}</span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link href={user.role === 'artisan' ? '/dashboard/artisan/profile' : (user.role === 'admin' ? '/dashboard/admin/settings' : '/dashboard/customer/settings')} className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2">
                    <User size={16} className="text-muted" />
                    <span>My Profile</span>
                  </Link>
                </li>
                <li>
                  <Link href={user.role === 'artisan' ? '/dashboard/artisan/settings' : (user.role === 'admin' ? '/dashboard/admin/settings' : '/dashboard/customer/settings')} className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2">
                    <Settings size={16} className="text-muted" />
                    <span>Settings</span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button onClick={logout} className="dropdown-item py-2 rounded-2 text-danger bg-transparent border-0 d-flex align-items-center gap-2">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Master Layout Grid */}
      <div className="dashboard-container flex-grow-1">
        {/* Desktop Sidebar */}
        <aside className="sidebar-nav d-none d-lg-block">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar (Offcanvas) */}
        <div 
          className="offcanvas offcanvas-start d-lg-none" 
          tabIndex="-1" 
          id="sidebarOffcanvas" 
          aria-labelledby="sidebarOffcanvasLabel"
          style={{ width: '280px' }}
        >
          <div className="offcanvas-body p-0 h-100">
            {sidebarContent}
          </div>
        </div>

        {/* Main Content Pane */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-x-hidden">
          {/* Breadcrumbs and Section header info */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
            <div>
              {getBreadcrumbs()}
            </div>
          </div>

          {/* Main card wrapper */}
          <div className="card border-0 shadow-sm p-2.5 p-sm-3 p-md-4 rounded-3 bg-white" style={{ minHeight: '80%' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
