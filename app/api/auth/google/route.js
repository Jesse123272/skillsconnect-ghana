import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { setAuthCookie, signToken } from '@/lib/auth';
import { randomBytes } from 'node:crypto';

function getAppUrl(req) {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

function getRedirectUri(req) {
  return `${getAppUrl(req).replace(/\/$/, '')}/api/auth/google/callback`;
}

function redirectWithError(req, message) {
  const url = new URL('/login', getAppUrl(req));
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return redirectWithError(req, 'Google sign-in is not configured yet.');
  }

  const state = randomBytes(32).toString('hex');
  const response = NextResponse.redirect(new URL('/api/auth/google/callback', getAppUrl(req)));
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();

  const redirectResponse = NextResponse.redirect(authorizationUrl);
  redirectResponse.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });
  return redirectResponse;
}

export async function POST(req) {
  return GET(req);
}

export async function handleGoogleCallback(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = req.cookies.get('google_oauth_state')?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(req, 'Google sign-in could not be verified. Please try again.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWithError(req, 'Google sign-in is not configured yet.');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) {
      throw new Error('Google token exchange failed.');
    }

    const profileResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`
    );
    const profile = await profileResponse.json();
    if (!profileResponse.ok || profile.aud !== clientId || profile.email_verified !== 'true' || !profile.email) {
      throw new Error('Google account verification failed.');
    }

    const email = profile.email.trim().toLowerCase();
    const fullName = (profile.name || profile.email.split('@')[0]).trim().slice(0, 150);
    const profilePhoto = profile.picture || null;
    let users = await query(
      'SELECT user_id, full_name, email, phone, role, profile_photo, is_verified, is_active FROM users WHERE email = ?',
      [email]
    );

    let user = users[0];
    if (user?.role === 'admin') {
      return redirectWithError(req, 'Use the administrator login for this account.');
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      const result = await query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, profile_photo, google_id, is_verified, is_active)
         VALUES (?, ?, ?, ?, 'customer', ?, ?, 1, 1)`,
        [fullName, email, '+233000000000', passwordHash, profilePhoto, profile.sub]
      );
      user = {
        user_id: result.insertId,
        full_name: fullName,
        email,
        phone: '+233000000000',
        role: 'customer',
        profile_photo: profilePhoto,
        is_verified: 1,
        is_active: 1,
      };
    } else {
      if (user.is_active !== 1) {
        return redirectWithError(req, 'Your account has been suspended or deactivated.');
      }
      await query(
        'UPDATE users SET google_id = ?, is_verified = 1, profile_photo = COALESCE(profile_photo, ?), last_login = NOW() WHERE user_id = ?',
        [profile.sub, profilePhoto, user.user_id]
      );
    }

    const token = await signToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });
    const response = NextResponse.redirect(new URL('/dashboard/customer', getAppUrl(req)));
    setAuthCookie(response, token, {
      maxAge: 30 * 24 * 60 * 60,
      secure: req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://'),
    });
    response.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    console.error('Google sign-in failed:', error?.message || error);
    return redirectWithError(req, 'Google sign-in failed. Please try again.');
  }
}
