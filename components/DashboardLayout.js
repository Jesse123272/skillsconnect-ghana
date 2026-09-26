'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfileAvatar from '@/components/ProfileAvatar';
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
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react';

export default function DashboardLayout({ children, pageTitle = 'Dashboard' }) {
  const { user, logout, loading, unreadNotifications, unreadEnquiries, pendingArtisansCount } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const closeSidebar = () => {
    if (sidebarRef.current?.contains(document.activeElement)) {
      menuButtonRef.current?.focus();
    }
    setSidebarOpen(false);
  };
  

  // Handle redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

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

  // Keep the first-level navigation focused on the tasks users visit most.
  const getSidebarItems = () => {
    switch (user.role) {
      case 'customer':
        return {
          primary: [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/customer' },
          { icon: Search, label: 'Discover Artisans', href: '/dashboard/customer/discover' },
          { icon: MessageSquare, label: 'My Enquiries', href: '/dashboard/customer/enquiries', badge: unreadEnquiries },
          ],
          secondary: [
          { icon: CreditCard, label: 'My Payments', href: '/dashboard/customer/payments' },
          { icon: Heart, label: 'Saved Artisans', href: '/dashboard/customer/saved' },
          { icon: Star, label: 'My Reviews', href: '/dashboard/customer/reviews' },
          { icon: FileText, label: 'Platform Testimonials', href: '/dashboard/customer/testimonials' },
          { icon: Bell, label: 'Notifications', href: '/dashboard/customer/notifications', badge: unreadNotifications },
          { icon: HelpCircle, label: 'Support', href: '/contact' },
          { icon: User, label: 'Profile Settings', href: '/dashboard/customer/settings' },
          ],
        };
      case 'artisan':
        return {
          primary: [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/artisan' },
          { icon: User, label: 'My Profile', href: '/dashboard/artisan/profile' },
          { icon: MessageSquare, label: 'Enquiries', href: '/dashboard/artisan/enquiries', badge: unreadEnquiries },
          ],
          secondary: [
          { icon: ImageIcon, label: 'My Gallery', href: '/dashboard/artisan/gallery' },
          { icon: CreditCard, label: 'Earnings & Payments', href: '/dashboard/artisan/transactions' },
          { icon: Star, label: 'My Reviews', href: '/dashboard/artisan/reviews' },
          { icon: Bell, label: 'Notifications', href: '/dashboard/artisan/notifications', badge: unreadNotifications },
          { icon: HelpCircle, label: 'Support', href: '/contact' },
          { icon: Settings, label: 'Account Settings', href: '/dashboard/artisan/settings' },
          { icon: User, label: 'Preview Profile', href: `/artisan/${user.user_id}` },
          ],
        };
      case 'admin':
        return {
          primary: [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
          { icon: Users, label: 'Manage Artisans', href: '/dashboard/admin/artisans', badge: pendingArtisansCount },
          { icon: FileText, label: 'Reports', href: '/dashboard/admin/reports' },
          ],
          secondary: [
          { icon: Users, label: 'Manage Users', href: '/dashboard/admin/users' },
          { icon: Users, label: 'Manage Customers', href: '/dashboard/admin/customers' },
          { icon: FolderPlus, label: 'Categories', href: '/dashboard/admin/categories' },
          { icon: Star, label: 'Reviews', href: '/dashboard/admin/reviews' },
          { icon: MessageSquare, label: 'Enquiries', href: '/dashboard/admin/enquiries' },
          { icon: CreditCard, label: 'Transactions', href: '/dashboard/admin/transactions' },
          { icon: HelpCircle, label: 'Support', href: '/contact' },
          { icon: Activity, label: 'Activity Logs', href: '/dashboard/admin/logs' },
          { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
          ],
        };
      default:
        return { primary: [], secondary: [] };
    }
  };

  const navGroups = getSidebarItems();

  const isLinkActive = (href) => {
    if (!pathname) return false;
    if (['/dashboard/customer', '/dashboard/artisan', '/dashboard/admin'].includes(href)) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
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

  const renderNavItems = (items) => items.map((item, index) => {
    const Icon = item.icon;
    const active = isLinkActive(item.href);
    return (
      <Link
        key={item.href || index}
        href={item.href}
        onClick={closeSidebar}
        className={`sidebar-link ${active ? 'active' : ''}`}
      >
        <Icon size={18} className="me-3 flex-shrink-0" />
        <span>{item.label}</span>
        {item.badge > 0 && (
          <span className={`sidebar-badge badge ${active ? 'bg-dark text-white' : 'bg-danger text-white'}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  });

  const hasActiveSecondaryItem = navGroups.secondary.some((item) => isLinkActive(item.href));

  const sidebarContent = (
    <div className="d-flex flex-column h-100">
      {/* Brand Header */}
      <div className="px-3 py-3 border-bottom d-flex align-items-center gap-2">
        <span className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
          <i className="fa-solid fa-wrench"></i>
        </span>
        <span id="sidebarOffcanvasLabel" className="fs-6 fw-bold text-primary" style={{ letterSpacing: '-0.5px' }}>
          SkillsConnect<span className="text-secondary">Ghana</span>
        </span>
        <button type="button" className="btn border-0 ms-auto p-2" onClick={closeSidebar} aria-label="Close dashboard menu">
          <X size={20} />
        </button>
      </div>

      {/* User Info card */}
      <div className="px-3 py-3 mx-2 my-2 bg-light rounded-3 text-center border">
        <div className="d-flex align-items-center justify-content-center mx-auto mb-2">
          <ProfileAvatar name={user.full_name} photo_url={user.profile_photo} size="lg" />
        </div>
        <h6 className="mb-0 text-dark fw-semibold text-truncate">{user.full_name}</h6>
        <span className="badge bg-secondary text-dark text-capitalize mt-1 font-semibold" style={{ fontSize: '11px' }}>
          {user.role}
        </span>
      </div>

      {/* Nav Links list */}
      <div className="flex-grow-1 overflow-y-auto px-2" style={{ minHeight: 0 }}>
        {renderNavItems(navGroups.primary)}
        <details
          key={pathname}
          className="sidebar-more"
          ref={(element) => {
            if (element) element.open = hasActiveSecondaryItem;
          }}
        >
          <summary className="sidebar-more-toggle">More options</summary>
          <div>{renderNavItems(navGroups.secondary)}</div>
        </details>
      </div>

      {/* Logout button bottom */}
      <div className="p-3 border-top mt-auto">
        <button 
          onClick={() => {
            closeMobileSidebar();
            logout();
          }}
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
          {/* Dashboard menu toggle and page title */}
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn border-0 p-2"
              type="button"
              ref={menuButtonRef}
              aria-label={sidebarOpen ? 'Close dashboard menu' : 'Open dashboard menu'}
              aria-controls="sidebarOffcanvas"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((isOpen) => !isOpen)}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h5 className="mb-0 fw-bold text-dark ms-2">
              {pageTitle}
            </h5>
          </div>

          {/* Right: Notifications, Settings, Dropdown */}
          <div className="d-flex align-items-center gap-2 gap-sm-3 ms-auto">
            {/* Notification Bell Icon */}
            <Link 
              href={user?.role === 'admin' ? '/dashboard/admin/logs' : `/dashboard/${user?.role === 'artisan' ? 'artisan' : 'customer'}/notifications`} 
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
                <ProfileAvatar name={user.full_name} photo_url={user.profile_photo} size="sm" />
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
        {sidebarOpen && (
          <div
            className="offcanvas-backdrop fade show"
            onClick={closeSidebar}
            aria-hidden="true"
            style={{ zIndex: 1190 }}
          />
        )}

        <div 
          className={`offcanvas offcanvas-start ${sidebarOpen ? 'show' : ''}`}
          tabIndex="-1" 
          id="sidebarOffcanvas" 
          ref={sidebarRef}
          aria-labelledby="sidebarOffcanvasLabel"
          aria-hidden={!sidebarOpen}
          role="dialog"
          style={{ width: 'min(86vw, 320px)', visibility: sidebarOpen ? 'visible' : 'hidden', zIndex: 1200 }}
        >
          <div className="offcanvas-body p-0 h-100">
            {sidebarContent}
          </div>
        </div>

        {/* Main Content Pane */}
        <main className="dashboard-main-panel flex-grow-1 p-3 p-md-4 overflow-x-hidden">
          <div className="dashboard-content-shell">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
