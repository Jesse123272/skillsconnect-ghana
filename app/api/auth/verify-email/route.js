import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isMockEmailMode, sendEmail, welcomeEmail, verificationEmail } from '@/lib/mailer';
import { setAuthCookie, signGoogleVerificationChallenge, signToken, verifyGoogleVerificationChallenge } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

// POST: Verify 6-digit code
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, code, redirect } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const challenge = await verifyGoogleVerificationChallenge(
      req.cookies.get('google_verification_challenge')?.value
    );
    const isGoogleChallenge = challenge?.email === normalizedEmail;

    // Find user
    const users = await query(
      'SELECT user_id, full_name, role, is_verified, verification_token FROM users WHERE email = ?',
      [email.trim()]
    );

    let user = users?.[0];

    if (!user) {
      if (!isGoogleChallenge || challenge.verification_code !== code.trim()) {
        return NextResponse.json(
          { success: false, error: 'User account not found or verification session expired. Please start Google sign-in again.' },
          { status: 404 }
        );
      }

      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      const result = await query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, profile_photo, google_id, is_verified, is_active)
         VALUES (?, ?, ?, ?, 'customer', ?, ?, 1, 1)`,
        [challenge.full_name, challenge.email, '+233000000000', passwordHash, challenge.profile_photo, challenge.google_id]
      );
      user = {
        user_id: result.insertId,
        full_name: challenge.full_name,
        email: challenge.email,
        role: 'customer',
        is_verified: 1,
        is_active: 1,
      };
    }

    if (user.is_verified === 1 && !isGoogleChallenge) {
      return NextResponse.json({
        success: true,
        message: 'Your account is already verified! Please sign in.'
      });
    }

    const isMockMode = isMockEmailMode();
    const isBypass = isMockMode && code.trim() === '123456';
    const isTokenMatch = isGoogleChallenge
      ? challenge.verification_code === code.trim()
      : user.verification_token && user.verification_token.trim() === code.trim();

    // Compare verification token or allow bypass in mock mode
    if (!isTokenMatch && !isBypass) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // Update user to verified
    await query(
      'UPDATE users SET is_verified = 1, verification_token = NULL WHERE user_id = ?',
      [user.user_id]
    );

    if (user.role === 'artisan') {
      let approvalMode = 'auto';
      try {
        const settings = await query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'artisan_approval_mode' LIMIT 1"
        );
        approvalMode = settings?.[0]?.setting_value === 'manual' ? 'manual' : 'auto';
      } catch (settingsError) {
        console.warn('Artisan approval mode lookup failed; using automatic approval:', settingsError?.message || settingsError);
      }
      if (approvalMode === 'auto') {
        await query('UPDATE artisan_profiles SET is_approved = 1 WHERE user_id = ?', [user.user_id]);
      }
    }

    // Log verification action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [user.user_id, 'USER_VERIFY', 'users', user.user_id, ip]
    );

    // Now send the formal Welcome Email since they verified successfully
    try {
      const emailHtml = welcomeEmail(user.full_name, user.role);
      await sendEmail({
        to: email.trim(),
        subject: 'Welcome to SkillsConnect Ghana! 🎉',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Welcome email sending on verification failed:', emailError);
    }

    const dashboardRedirect = user.role === 'artisan'
      ? '/dashboard/artisan'
      : '/dashboard/customer';

    const shouldAutoLogin = user.role !== 'admin' && (
      isGoogleChallenge || redirect === '/dashboard/customer' || redirect === '/dashboard/artisan'
    );

    if (shouldAutoLogin) {
      const token = await signToken({
        user_id: user.user_id,
        email: normalizedEmail,
        role: user.role,
        full_name: user.full_name,
      });
      const response = NextResponse.json({
        success: true,
        autoLogin: true,
        redirect: dashboardRedirect,
        message: 'Your account has been successfully verified. Redirecting to your dashboard.'
      });
      setAuthCookie(response, token, {
        secure: req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://'),
      });
      response.cookies.set('google_verification_challenge', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been successfully verified! You can now log in.'
    });

  } catch (error) {
    console.error('Verify Email API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}

// PUT: Resend verification code
export async function PUT(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required for resend.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const challenge = await verifyGoogleVerificationChallenge(
      req.cookies.get('google_verification_challenge')?.value
    );

    // Find user
    const users = await query(
      'SELECT user_id, full_name, is_verified FROM users WHERE email = ?',
      [email.trim()]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.is_verified === 1) {
      return NextResponse.json(
        { success: false, error: 'This account is already verified.' },
        { status: 400 }
      );
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update in database
    await query(
      'UPDATE users SET verification_token = ? WHERE user_id = ?',
      [verificationCode, user.user_id]
    );

    // Send email via mailer
    try {
      const emailHtml = verificationEmail(user.full_name, verificationCode);
      await sendEmail({
        to: email.trim(),
        subject: 'Verify your SkillsConnect Ghana Account 🛡️',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Resend verification email failed:', emailError);
    }

    const response = NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.'
    });

    if (challenge?.email === normalizedEmail) {
      const refreshedChallenge = await signGoogleVerificationChallenge({
        email: normalizedEmail,
        full_name: challenge.full_name,
        google_id: challenge.google_id,
        profile_photo: challenge.profile_photo,
        verification_code: verificationCode,
      });
      response.cookies.set('google_verification_challenge', refreshedChallenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60,
        path: '/',
      });
    }

    return response;

  } catch (error) {
    console.error('Resend Verify Email API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}

// GET: Check if email service is in mock/sandbox mode
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      mockMode: isMockEmailMode(),
    });
  } catch (error) {
    return NextResponse.json({ success: true, mockMode: true });
  }
}
