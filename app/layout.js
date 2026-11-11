/* eslint-disable @next/next/no-page-custom-font */
import ClientShell from '@/components/ClientShell';

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
        <meta name="theme-color" content="#2563EB" />
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
          /* ═══════════════════════════════════════════
             SKILLSCONNECT GHANA — DESIGN SYSTEM v2
             Palette: Royal Blue + Warm Orange
          ═══════════════════════════════════════════ */
          :root {
            --primary:         #2563EB;
            --primary-hover:   #1D4ED8;
            --primary-light:   #3B82F6;
            --primary-subtle:  #EFF6FF;
            --primary-rgb:     37, 99, 235;

            --secondary:       #F97316;
            --secondary-hover: #EA6C0A;
            --secondary-subtle:#FFF7ED;
            --secondary-rgb:   249, 115, 22;

            --background:      #F8FAFF;
            --card:            #FFFFFF;
            --text:            #0F172A;
            --text-soft:       #334155;
            --muted:           #64748B;
            --border:          #E2E8F0;

            --success:         #059669;
            --success-subtle:  #ECFDF5;
            --danger:          #DC2626;
            --danger-subtle:   #FEF2F2;
            --warning:         #D97706;
            --warning-subtle:  #FFFBEB;
            --info:            #0284C7;
            --info-subtle:     #F0F9FF;

            /* Bootstrap overrides */
            --bs-primary:              var(--primary);
            --bs-primary-rgb:          var(--primary-rgb);
            --bs-secondary-color:      var(--muted);
            --bs-success:              var(--success);
            --bs-success-rgb:          5, 150, 105;
            --bs-danger:               var(--danger);
            --bs-danger-rgb:           220, 38, 38;
            --bs-warning:              var(--secondary);
            --bs-warning-rgb:          var(--secondary-rgb);
            --bs-warning-bg-subtle:    var(--secondary-subtle);
            --bs-warning-border-subtle:#FED7AA;
            --bs-warning-text-emphasis:#9A3412;
            --bs-info:                 var(--info);
            --bs-info-rgb:             2, 132, 199;
            --bs-info-bg-subtle:       var(--info-subtle);
            --bs-body-color:           var(--text);
            --bs-body-bg:              var(--background);
            --bs-border-color:         var(--border);
          }

          html { font-size: 16px; }

          body {
            font-family: 'Poppins', sans-serif;
            background-color: var(--background);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            font-size: 1rem;
          }

          small, .small, .fs-7, .fs-8, .fs-9 {
            font-size: 0.875rem !important;
            line-height: 1.5;
          }

          /* ── Buttons ──────────────────────────────── */
          .btn {
            transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          }
          .btn:hover, .btn:focus {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }

          .btn-primary {
            background-color: var(--primary) !important;
            border-color: var(--primary) !important;
            color: #fff !important;
            font-weight: 500;
          }
          .btn-primary:hover, .btn-primary:focus, .btn-primary:active {
            background-color: var(--primary-hover) !important;
            border-color: var(--primary-hover) !important;
            box-shadow: 0 8px 24px rgba(var(--primary-rgb),0.35) !important;
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
            color: #fff !important;
          }

          .btn-secondary {
            background-color: var(--secondary) !important;
            border-color: var(--secondary) !important;
            color: #fff !important;
            font-weight: 500;
          }
          .btn-secondary:hover {
            background-color: var(--secondary-hover) !important;
            border-color: var(--secondary-hover) !important;
          }

          .btn-outline-secondary {
            color: var(--muted) !important;
            border-color: var(--border) !important;
          }

          .btn-outline-light {
            color: #fff !important;
            border-color: rgba(255,255,255,0.85) !important;
          }
          .btn-outline-light:hover, .btn-outline-light:focus {
            color: #fff !important;
            background-color: rgba(255,255,255,0.15) !important;
            border-color: rgba(255,255,255,0.95) !important;
          }

          /* ── Colour utilities ─────────────────────── */
          .text-primary   { color: var(--primary)   !important; }
          .text-secondary { color: var(--muted)     !important; }
          .text-success   { color: var(--success)   !important; }
          .text-warning   { color: var(--warning)   !important; }
          .text-danger    { color: var(--danger)    !important; }
          .text-muted     { color: var(--muted)     !important; }
          .text-white-75  { color: rgba(255,255,255,0.8) !important; }
          .text-orange    { color: var(--secondary) !important; }

          .bg-primary         { background-color: var(--primary)   !important; }
          .bg-secondary       { background-color: var(--secondary) !important; }
          .bg-primary-subtle  { background-color: var(--primary-subtle) !important; }
          .bg-secondary-subtle{ background-color: var(--secondary-subtle) !important; }
          .bg-warning         { background-color: var(--secondary) !important; }

          /* ── Badges (Bootstrap subtle variants) ───── */
          .bg-success-subtle  { background-color: var(--success-subtle)  !important; }
          .bg-danger-subtle   { background-color: var(--danger-subtle)   !important; }
          .bg-warning-subtle  { background-color: var(--warning-subtle)  !important; }
          .bg-info-subtle     { background-color: var(--info-subtle)     !important; }
          .text-success       { color: var(--success) !important; }
          .text-danger        { color: var(--danger)  !important; }
          .text-warning-emphasis { color: #92400E !important; }
          .text-info          { color: var(--info)    !important; }

          /* ── Forms ────────────────────────────────── */
          .form-control:focus, .form-select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.25rem rgba(var(--primary-rgb),0.18);
          }

          /* ── Focus ring ───────────────────────────── */
          :where(a, button, input, select, textarea):focus-visible {
            outline: 3px solid var(--primary) !important;
            outline-offset: 3px;
          }

          /* ── Scroll offset for sticky nav ─────────── */
          :where(section, [id]) { scroll-margin-top: 90px; }

          /* ── Navbar ───────────────────────────────── */
          .navbar {
            backdrop-filter: saturate(180%) blur(20px);
            background-color: rgba(255,255,255,0.97) !important;
          }
          .navbar-brand { font-weight: 700; letter-spacing: -0.02em; }
          .navbar-nav .nav-link { transition: color 0.18s ease; }
          .navbar-nav .nav-link:hover { color: var(--primary) !important; }

          /* ── Hero ─────────────────────────────────── */
          .hero-banner { position: relative; overflow: hidden; }
          .hero-banner::after {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse at top right,  rgba(249,115,22,0.22) 0%, transparent 45%),
              radial-gradient(ellipse at bottom left, rgba(37,99,235,0.14)  0%, transparent 45%);
            pointer-events: none;
          }
          .hero-stats-badge {
            border: 1px solid rgba(255,255,255,0.22);
            background-color: rgba(255,255,255,0.13);
            padding: 0.8rem 1rem;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            backdrop-filter: blur(8px);
          }
          .hero-pill {
            transition: transform 0.18s ease, background-color 0.18s ease, opacity 0.18s ease;
            opacity: 0.88;
            backdrop-filter: blur(6px);
          }
          .hero-pill:hover, .hero-pill:focus {
            opacity: 1;
            transform: translateY(-1px);
            background-color: rgba(255,255,255,0.18);
          }
          .hero-search-container {
            max-width: 760px;
            border-radius: 32px;
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          }
          .hero-search-container .form-control {
            min-height: 60px;
          }
          .hero-search-container .form-control::placeholder {
            color: rgba(15,23,42,0.5);
          }
          .hero-support-text,
          .hero-stat-label,
          .platform-stat-label {
            color: rgba(255,255,255,0.85) !important;
          }

          /* ── Section layout ───────────────────────── */
          .section-heading    { letter-spacing: -0.03em; }
          .section-description {
            max-width: 680px;
            margin: 0 auto;
            color: var(--muted);
          }
          .letter-spacing-1 { letter-spacing: 0.06em; }

          /* ── Feature / How-it-works cards ─────────── */
          .feature-card {
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: #ffffff;
            box-shadow: 0 4px 16px rgba(15,23,42,0.05);
          }
          .feature-card:hover {
            transform: translateY(-6px);
            border-color: rgba(var(--primary-rgb),0.25);
            box-shadow: 0 16px 40px rgba(var(--primary-rgb),0.12);
          }

          /* ── Artisan cards ────────────────────────── */
          .card.custom-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          }
          .custom-card-hover:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 44px rgba(var(--primary-rgb),0.12);
            border-color: var(--primary) !important;
          }

          /* ── Hover-transform utility ──────────────── */
          .hover-transform {
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .hover-transform:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 36px rgba(var(--primary-rgb),0.1);
          }
          .hover-scale {
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .hover-scale:hover {
            transform: scale(1.03);
            box-shadow: 0 20px 40px rgba(15,23,42,0.12);
          }

          /* ── Testimonial cards ────────────────────── */
          .testimonial-card {
            border: 1px solid var(--border);
            border-radius: 20px;
            background: #ffffff;
            padding: 1.75rem;
            box-shadow: 0 4px 16px rgba(15,23,42,0.05);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .testimonial-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 40px rgba(var(--primary-rgb),0.1);
          }

          /* ── Stats cards ──────────────────────────── */
          .stat-card {
            background: var(--card);
            border-radius: 14px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* ── Quick action cards ───────────────────── */
          .quick-action-card {
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.96);
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          }
          .quick-action-card:hover {
            transform: translateY(-3px);
            border-color: rgba(var(--primary-rgb),0.2);
            box-shadow: 0 16px 36px rgba(var(--primary-rgb),0.08);
          }
          .quick-action-card .icon-box {
            width: 46px; height: 46px;
            display: inline-flex; align-items: center; justify-content: center;
            border-radius: 12px;
            background: var(--primary-subtle);
            color: var(--primary);
          }

          /* ── Footer ───────────────────────────────── */
          .footer-heading { color: var(--secondary) !important; }
          .footer-copy, .footer-link { color: rgba(255,255,255,0.82) !important; }
          .footer-link:hover, .footer-link:focus-visible {
            color: #ffffff !important;
            text-decoration: none;
          }
          .footer-social-icon:hover {
            background-color: rgba(255,255,255,0.15) !important;
            border-color: rgba(255,255,255,0.6) !important;
          }

          /* ── Star rating ──────────────────────────── */
          .star-filled { color: var(--secondary); }
          .star-empty  { color: #CBD5E1; }
          .text-warning { color: var(--secondary) !important; }

          /* ── Category cards ───────────────────────── */
          .category-name { overflow-wrap: anywhere; }

          /* ── Sidebar (dashboard) ──────────────────── */
          .dashboard-container {
            display: flex; min-height: calc(100vh - 72px);
            width: 100%; max-width: 100%;
          }
          .dashboard-main-panel {
            min-width: 0; width: 100%;
            background: var(--background);
          }
          .dashboard-content-shell {
            width: 100%; max-width: 100%;
            overflow-x: hidden; padding: 0.25rem;
          }
          .sidebar-nav {
            width: 260px;
            background: #ffffff;
            border-right: 1px solid var(--border);
            flex-shrink: 0; display: flex;
            flex-direction: column; z-index: 1020;
          }
          .sidebar-link {
            display: flex; align-items: center;
            padding: 0.75rem 1.25rem;
            color: var(--text);
            text-decoration: none;
            border-radius: 10px;
            margin: 0.15rem 0.75rem;
            font-size: 0.9rem; font-weight: 500;
            transition: all 0.18s ease;
            min-width: 0; overflow: hidden;
          }
          .sidebar-link:hover {
            background-color: var(--primary-subtle);
            color: var(--primary);
          }
          .sidebar-link.active {
            background-color: var(--primary-subtle) !important;
            color: var(--primary) !important;
            font-weight: 600;
          }
          .sidebar-more {
            margin: 0.45rem 0.75rem 0;
            border-top: 1px solid var(--border);
            padding-top: 0.4rem;
          }
          .sidebar-more-toggle {
            list-style: none; cursor: pointer;
            padding: 0.55rem 0.5rem;
            color: var(--muted); font-size: 0.78rem;
            font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .sidebar-more-toggle::-webkit-details-marker { display: none; }
          .sidebar-more-toggle::after { content: '+'; float: right; font-size: 1rem; line-height: 1; }
          .sidebar-more[open] .sidebar-more-toggle::after { content: '-'; }
          .sidebar-more .sidebar-link { font-size: 0.84rem; }
          .sidebar-badge {
            margin-left: auto; font-size: 0.75rem;
            padding: 0.25em 0.6em; border-radius: 50rem;
          }

          /* ── Staggered animation ──────────────────── */
          .staggered-container {
            transition: max-height 0.35s ease, opacity 0.35s ease;
            overflow: hidden;
          }
          .staggered-container.expanded  { opacity: 1; max-height: 2000px; }
          .staggered-container.collapsed { opacity: 0; max-height: 0; }
          .staggered-card { opacity: 0; transform: translateY(12px); }
          .staggered-container.expanded .staggered-card {
            animation: staggerIn 0.35s ease forwards;
          }
          .staggered-container.expanded  .staggered-card:nth-child(1) { animation-delay: 0.05s; }
          .staggered-container.expanded  .staggered-card:nth-child(2) { animation-delay: 0.15s; }
          .staggered-container.expanded  .staggered-card:nth-child(3) { animation-delay: 0.25s; }
          .staggered-container.expanded  .staggered-card:nth-child(4) { animation-delay: 0.35s; }
          .staggered-container.collapsed .staggered-card { animation: staggerOut 0.25s ease forwards; }
          .staggered-container.collapsed .staggered-card:nth-child(1) { animation-delay: 0.35s; }
          .staggered-container.collapsed .staggered-card:nth-child(2) { animation-delay: 0.25s; }
          .staggered-container.collapsed .staggered-card:nth-child(3) { animation-delay: 0.15s; }
          .staggered-container.collapsed .staggered-card:nth-child(4) { animation-delay: 0.05s; }
          .chevron-icon { transition: transform 0.25s ease; }
          .rotate-180 { transform: rotate(180deg); }
          @keyframes staggerIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          @keyframes staggerOut { from { opacity:1; transform:translateY(0); }   to { opacity:0; transform:translateY(12px); } }

          /* ── Sticky filter sidebar ────────────────── */
          @media (min-width: 768px) {
            #filters-sidebar {
              position: sticky; top: 84px;
              max-height: calc(100vh - 104px);
              overflow-y: auto; scrollbar-width: thin;
              scrollbar-color: rgba(var(--primary-rgb),0.2) transparent;
            }
            #filters-sidebar::-webkit-scrollbar { width: 4px; }
            #filters-sidebar::-webkit-scrollbar-track { background: transparent; }
            #filters-sidebar::-webkit-scrollbar-thumb {
              background-color: rgba(var(--primary-rgb),0.2);
              border-radius: 4px;
            }
          }

          /* ── Responsive + accessibility ───────────── */
          html, body { overflow-x: hidden; width: 100%; max-width: 100vw; }
          img, svg, video, canvas { max-width: 100%; height: auto; }
          p, span, h1, h2, h3, h4, h5, h6, td, th {
            overflow-wrap: break-word; word-break: break-word;
          }
          .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

          @media (max-width: 991.98px) {
            .dashboard-container { display: block; min-height: auto; }
            .dashboard-main-panel { padding: 0.75rem !important; }
            .dashboard-content-shell { padding: 0 !important; }
          }
          @media (max-width: 576px) {
            .container, .container-fluid { padding-left: 1rem !important; padding-right: 1rem !important; }
            .btn { min-height: 44px; }
            .modal-dialog { margin: 0.5rem; }
            .fs-4 { font-size: 1.25rem !important; }
            .fs-5 { font-size: 1.1rem !important; }
            .dashboard-main-panel { padding: 0.5rem !important; }
            .dashboard-content-shell { padding: 0.75rem !important; }
            .quick-action-card .icon-box { width: 38px; height: 38px; }
            .table { min-width: 540px; }
          }
          @media (min-width: 1600px) {
            .container { max-width: 1480px; }
          }
        ` }} />
      </head>
      <body suppressHydrationWarning>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
