/* eslint-disable @next/next/no-page-custom-font */
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AiMatchmaker from '@/components/AiMatchmaker';
import InstallAppPrompt from '@/components/InstallAppPrompt';
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata = {
  title: 'SkillsConnect Ghana - Local Artisan Marketplace',
  description: 'Connecting skilled Ghanaian professionals with clients securely.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Resource Preconnection for Fast External Assets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        {/* Bootstrap 5.3 CSS */}
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
          crossOrigin="anonymous" 
        />
        {/* Font Awesome 6.4 */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" 
          integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-512.svg" />
        <meta name="theme-color" content="#1A6B3C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SkillsConnect" />
        <meta name="application-name" content="SkillsConnect Ghana" />
        {/* Bootstrap 5.3 Bundle JS */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" 
          crossOrigin="anonymous"
          async
        ></script>
        
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: #1A6B3C;
            --secondary: #F5A623;
            --background: #F8F9FA;
            --card: #FFFFFF;
            --text: #212529;
            --danger: #DC3545;
            --success: #198754;
            --muted: #6C757D;
          }

          html {
            font-size: 13px;
          }

          body {
            font-family: 'Poppins', sans-serif;
            background-color: var(--background);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            font-size: 0.9rem;
          }

          /* Custom styling and overrides */
          .btn-primary {
            background-color: var(--primary) !important;
            border-color: var(--primary) !important;
            color: #ffffff !important;
            font-weight: 500;
          }
          .btn-primary:hover, .btn-primary:focus, .btn-primary:active {
            background-color: #14542F !important;
            border-color: #14542F !important;
          }

          .btn-outline-primary {
            color: var(--primary) !important;
            border-color: var(--primary) !important;
            background-color: transparent !important;
            font-weight: 500;
          }
          .btn-outline-primary:hover, .btn-outline-primary:focus, .btn-outline-primary:active {
            background-color: var(--primary) !important;
            border-color: var(--primary) !important;
            color: #ffffff !important;
          }

          .btn-secondary {
            background-color: var(--secondary) !important;
            border-color: var(--secondary) !important;
            color: #212529 !important;
            font-weight: 500;
          }
          .btn-secondary:hover {
            background-color: #e09316 !important;
            border-color: #e09316 !important;
          }

          .text-primary {
            color: var(--primary) !important;
          }
          .text-secondary {
            color: var(--secondary) !important;
          }
          .text-success {
            color: var(--success) !important;
          }
          .text-danger {
            color: var(--danger) !important;
          }

          .bg-primary {
            background-color: var(--primary) !important;
          }
          .bg-secondary {
            background-color: var(--secondary) !important;
          }

          .navbar {
            backdrop-filter: saturate(180%) blur(20px);
            background-color: rgba(255,255,255,0.92);
          }

          .btn {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }
          .btn:hover, .btn:focus {
            transform: translateY(-1px);
            box-shadow: 0 16px 30px rgba(0, 0, 0, 0.12);
          }
          .hover-scale {
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .hover-scale:hover {
            transform: scale(1.03);
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
          }

          .hero-banner {
            position: relative;
            overflow: hidden;
          }
          .hero-banner::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top right, rgba(245,166,35,0.20), transparent 32%), radial-gradient(circle at bottom left, rgba(26,107,60,0.12), transparent 28%);
            pointer-events: none;
          }
          .hero-stats-badge {
            border: 1px solid rgba(255,255,255,0.2);
            background-color: rgba(255,255,255,0.12);
            padding: 0.85rem 1rem;
            border-radius: 18px;
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
          }

          .section-heading {
            letter-spacing: -0.03em;
          }
          .section-description {
            max-width: 760px;
            margin: 0 auto;
            color: rgba(33, 37, 41, 0.75);
          }

          .feature-card {
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 24px;
            background: rgba(255,255,255,0.98);
            box-shadow: 0 18px 38px rgba(15,23,42,0.06);
          }
          .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(26,107,60,0.18);
            box-shadow: 0 24px 40px rgba(15,23,42,0.12);
          }

          .testimonial-card {
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 24px;
            background: #ffffff;
            padding: 1.75rem;
            box-shadow: 0 16px 36px rgba(15,23,42,0.06);
          }
          .testimonial-card blockquote {
            margin: 0 0 1rem;
            color: #455560;
            font-size: 0.97rem;
            line-height: 1.8;
          }

          .footer-link {
            transition: color 0.2s ease;
          }
          .footer-link:hover {
            color: #ffffff !important;
            text-decoration: none;
          }

          .bg-primary-subtle {
            background-color: rgba(26,107,60,0.08) !important;
          }
          .text-white-75 {
            color: rgba(255,255,255,0.75) !important;
          }

          .hero-search-container {
            border-radius: 32px;
            border: 1px solid rgba(255,255,255,0.16);
            box-shadow: 0 24px 70px rgba(15,23,42,0.08);
          }

          .section-cta .btn {
            min-width: 190px;
          }

          .form-control:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.25rem rgba(26,107,60,0.15);
          }

          .card.custom-card {
            background: var(--card);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .custom-card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
            border-color: var(--primary);
          }

          /* Stat Cards */
          .stat-card {
            background: var(--card);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* Dashboard Sidebar Styling */
          .dashboard-container {
            display: flex;
            min-height: calc(100vh - 72px);
          }
          .sidebar-nav {
            width: 260px;
            background: #ffffff;
            border-right: 1px solid rgba(0, 0, 0, 0.08);
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            z-index: 1020;
          }
          .sidebar-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.25rem;
            color: var(--text);
            text-decoration: none;
            border-radius: 8px;
            margin: 0.2rem 0.75rem;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .sidebar-link:hover {
            background-color: rgba(26, 107, 60, 0.08);
            color: var(--primary);
          }
          .sidebar-link.active {
            background-color: var(--secondary) !important;
            color: #212529 !important;
            font-weight: 600;
          }
          .sidebar-badge {
            margin-left: auto;
            font-size: 0.75rem;
            padding: 0.25em 0.6em;
            border-radius: 50rem;
          }
          .hover-transform {
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .hover-transform:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          }

          .quick-action-card {
            border: 1px solid rgba(15, 23, 42, 0.06);
            background: rgba(255,255,255,0.96);
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          }
          .quick-action-card:hover {
            transform: translateY(-3px);
            border-color: rgba(26, 107, 60, 0.16);
            box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
          }
          .quick-action-card .icon-box {
            width: 46px;
            height: 46px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: rgba(26, 107, 60, 0.08);
            color: var(--primary);
          }
          .quick-action-card .icon-box i {
            font-size: 1.1rem;
          }

          .staggered-container {
            transition: max-height 0.35s ease, opacity 0.35s ease;
            overflow: hidden;
          }
          .staggered-container.expanded {
            opacity: 1;
            max-height: 2000px;
          }
          .staggered-container.collapsed {
            opacity: 0;
            max-height: 0;
          }
          .staggered-card {
            opacity: 0;
            transform: translateY(12px);
          }
          .staggered-container.expanded .staggered-card {
            animation: staggerIn 0.35s ease forwards;
          }
          .staggered-container.expanded .staggered-card:nth-child(1) {
            animation-delay: 0.05s;
          }
          .staggered-container.expanded .staggered-card:nth-child(2) {
            animation-delay: 0.15s;
          }
          .staggered-container.expanded .staggered-card:nth-child(3) {
            animation-delay: 0.25s;
          }
          .staggered-container.expanded .staggered-card:nth-child(4) {
            animation-delay: 0.35s;
          }
          .staggered-container.collapsed .staggered-card {
            animation: staggerOut 0.25s ease forwards;
          }
          .staggered-container.collapsed .staggered-card:nth-child(1) {
            animation-delay: 0.35s;
          }
          .staggered-container.collapsed .staggered-card:nth-child(2) {
            animation-delay: 0.25s;
          }
          .staggered-container.collapsed .staggered-card:nth-child(3) {
            animation-delay: 0.15s;
          }
          .staggered-container.collapsed .staggered-card:nth-child(4) {
            animation-delay: 0.05s;
          }
          .chevron-icon {
            transition: transform 0.25s ease;
          }
          .rotate-180 {
            transform: rotate(180deg);
          }
          @keyframes staggerIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes staggerOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(12px);
            }
          }

          /* General Badges */
          .badge-primary {
            background-color: var(--primary);
            color: #fff;
          }
          .badge-secondary {
            background-color: var(--secondary);
            color: #212529;
          }

          /* Navigation and headers */
          .navbar-brand {
            font-weight: 700;
            letter-spacing: -0.5px;
          }

          /* Star colors */
          .star-filled {
            color: var(--secondary);
          }
          .star-empty {
            color: #dee2e6;
          }

          /* Responsiveness & Touch Target Enhancements */
          html, body {
            overflow-x: hidden;
            width: 100%;
            max-width: 100vw;
          }

          img, svg, video, canvas {
            max-width: 100%;
            height: auto;
          }

          p, span, h1, h2, h3, h4, h5, h6, td, th {
            overflow-wrap: break-word;
            word-break: break-word;
          }

          .table-responsive {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          @media (max-width: 576px) {
            .container, .container-fluid {
              padding-left: 1rem !important;
              padding-right: 1rem !important;
            }
            .btn {
              min-height: 44px;
            }
            .modal-dialog {
              margin: 0.5rem;
            }
            .fs-4 {
              font-size: 1.25rem !important;
            }
            .fs-5 {
              font-size: 1.1rem !important;
            }
          }

          @media (min-width: 1600px) {
            .container {
              max-width: 1480px;
            }
          }
        ` }} />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Toaster position="top-right" />
          <ServiceWorkerRegister />
          <InstallAppPrompt />
          <NotificationPermissionPrompt />
          {children}
          <AiMatchmaker />
        </AuthProvider>
      </body>
    </html>
  );
}
