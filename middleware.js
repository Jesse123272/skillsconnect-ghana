import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'skillsconnect_super_secret_jwt_key_2026_gctu'
);

/**
 * Next.js Edge Middleware for route protection and access control
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Extract auth token from cookie
  let token = null;
  const cookie = request.cookies.get('skillsconnect_auth');
  if (cookie) {
    token = cookie.value;
  }

  const isApiRoute = pathname.startsWith('/api/');

  // Define protection rules
  const isDashboard = pathname.startsWith('/dashboard');
  const isEnquiriesApi = pathname.startsWith('/api/enquiries');
  const isReviewsApi = pathname.startsWith('/api/reviews');
  const isSavedApi = pathname.startsWith('/api/saved');
  const isProfileApi = pathname.startsWith('/api/profile');
  const isUploadApi = pathname.startsWith('/api/upload');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isPaymentApi = pathname.startsWith('/api/payment');

  let requiresAuth = false;

  // Apply routing logic
  if (isDashboard) {
    requiresAuth = true;
  } else if (isEnquiriesApi || isReviewsApi) {
    // Only protect POST, PUT, DELETE operations for enquiries and reviews
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      requiresAuth = true;
    }
  } else if (isSavedApi || isProfileApi || isUploadApi || isAdminApi || isPaymentApi) {
    requiresAuth = true;
  }

  // If path does not require authentication, let the request proceed
  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Verify the JWT Token
  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      user = payload;
    } catch (error) {
      // Invalid or expired token
    }
  }

  // Handle unauthenticated requests
  if (!user) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized: Valid authentication token is missing or expired' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    } else {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 1. Admin Verification: Require role 'admin' for /api/admin or /dashboard/admin
  const isTargetingAdmin = pathname.startsWith('/api/admin') || pathname.startsWith('/dashboard/admin');
  if (isTargetingAdmin && user.role !== 'admin') {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Forbidden: Administrative access is required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Artisan View Verification: Require role 'artisan' for /dashboard/artisan
  const isTargetingArtisanDashboard = pathname.startsWith('/dashboard/artisan');
  if (isTargetingArtisanDashboard && user.role !== 'artisan') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Customer View Verification: Require role 'customer' for /dashboard/customer
  const isTargetingCustomerDashboard = pathname.startsWith('/dashboard/customer');
  if (isTargetingCustomerDashboard && user.role !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Let request proceed and inject user headers for downstream server components / API handlers
  const response = NextResponse.next();
  response.headers.set('x-user-id', String(user.user_id));
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-role', user.role);
  response.headers.set('x-user-name', user.full_name);

  return response;
}

// Configured matching path constraints
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/enquiries/:path*',
    '/api/reviews/:path*',
    '/api/saved/:path*',
    '/api/profile/:path*',
    '/api/upload/:path*',
    '/api/admin/:path*',
    '/api/payment/:path*',
  ],
};
