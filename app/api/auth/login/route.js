import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendEmail, loginAlertEmail } from '@/lib/mailer';
import { sanitizeObject, sanitizeText, RateLimiter } from '@/lib/security';
import { validateEmail } from '@/lib/validators';

const loginLimiter = new RateLimiter(8, 60000);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    let parsedBody = {};

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        parsedBody = Object.fromEntries(params.entries());
      }
    }

    const body = sanitizeObject(parsedBody);
    const { email, password } = body;
    const cleanedEmail = sanitizeText((email || '').trim().toLowerCase());
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    if (!loginLimiter.allow(ip)) {
      return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again shortly.' }, { status: 429 });
    }

    // 1. Validate email and password present
    if (!cleanedEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(cleanedEmail)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // 2. SELECT user by email
    const users = await query(
      'SELECT user_id, full_name, email, phone, password_hash, role, region, district, profile_photo, is_verified, is_active FROM users WHERE email = ?',
      [cleanedEmail]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 3. Check is_active=1 (return 403 if suspended)
    if (user.is_active !== 1) {
      return NextResponse.json(
        { success: false, error: 'Your account has been suspended or deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // 4. bcrypt.compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4.5. Check is_verified = 1
    if (user.is_verified !== 1) {
      return NextResponse.json(
        { success: false, error: 'unverified', email: user.email },
        { status: 403 }
      );
    }

    // 5. On success: signToken({user_id, email, role, full_name})
    const token = await signToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });

    // 6. UPDATE users SET last_login=NOW() WHERE user_id=?
    await query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    // 7. Log to activity_logs: action='USER_LOGIN'
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [user.user_id, 'USER_LOGIN', 'users', user.user_id, ip]
    );

    // 7.5. Send security login alert email
    try {
      const alertHtml = loginAlertEmail(user.full_name, ip);
      await sendEmail({
        to: user.email,
        subject: 'Security Alert: New Sign-in Detected 🚨',
        html: alertHtml
      });
    } catch (emailError) {
      console.error('Login alert email sending failed:', emailError);
    }

    // 8. Prepare user data to return (exclude password_hash)
    const { password_hash, ...safeUserData } = user;

    // 9. setAuthCookie on response, return user data
    const response = NextResponse.json({
      success: true,
      data: safeUserData
    });

    setAuthCookie(response, token);
    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during login' },
      { status: 500 }
    );
  }
}
