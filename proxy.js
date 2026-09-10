import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'skillsconnect_super_secret_jwt_key_2026_gctu'
);

/**
 * Next.js proxy for route protection and access control
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  let token = null;
  const cookie = request.cookies.get('skillsconnect_auth');
  if (cookie) {
    token = cookie.value;
  }

  const isApiRoute = pathname.startsWith('/api/');
  const isDashboard = pathname.startsWith('/dashboard');
  const isEnquiriesApi = pathname.startsWith('/api/enquiries');
  const isReviewsApi = pathname.startsWith('/api/reviews');
  const isSavedApi = pathname.startsWith('/api/saved');
  const isProfileApi = pathname.startsWith('/api/profile');
  const isUploadApi = pathname.startsWith('/api/uploads');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isPaymentApi = pathname.startsWith('/api/payments');
  const isPaystackWebhook = pathname === '/api/payments/webhook' && method === 'POST';

  let requiresAuth = false;

  if (isPaystackWebhook) {
    requiresAuth = false;
  } else if (isDashboard) {
    requiresAuth = true;
  } else if (isEnquiriesApi || isReviewsApi) {
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      requiresAuth = true;
    }
  } else if (isSavedApi || isProfileApi || isUploadApi || isAdminApi || isPaymentApi) {
    requiresAuth = true;
  }

  if (!requiresAuth) {
    return NextResponse.next();
  }

  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      user = payload;
    } catch (error) {
      // Invalid or expired tokens are handled as unauthenticated requests.
    }
  }

  if (!user) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized: Valid authentication token is missing or expired' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isTargetingAdmin = pathname.startsWith('/api/admin') || pathname.startsWith('/dashboard/admin');
  if (isTargetingAdmin && user.role !== 'admin') {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Forbidden: Administrative access is required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isTargetingArtisanDashboard = pathname.startsWith('/dashboard/artisan');
  if (isTargetingArtisanDashboard && user.role !== 'artisan') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isTargetingCustomerDashboard = pathname.startsWith('/dashboard/customer');
  if (isTargetingCustomerDashboard && user.role !== 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', String(user.user_id));
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-role', user.role);
  response.headers.set('x-user-name', user.full_name);

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/enquiries/:path*',
    '/api/reviews/:path*',
    '/api/saved/:path*',
    '/api/profile/:path*',
    '/api/uploads/:path*',
    '/api/admin/:path*',
    '/api/payments/:path*',
  ],
};