import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendEmail, loginAlertEmail } from '@/lib/mailer';
import { sanitizeObject, sanitizeText, RateLimiter } from '@/lib/security';
import { validateEmail } from '@/lib/validators';

const DEFAULT_ADMIN = {
  full_name: 'SkillsConnect Admin',
  email: 'admin@skillsconnect.gh',
  phone: '+233302123456',
  password: 'Admin@2026',
  role: 'admin',
  region: 'Greater Accra',
  district: 'Accra Central'
};

async function ensureAdminExists() {
  const existingAdmin = await query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
  if (!existingAdmin || existingAdmin.length === 0) {
    const password_hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, region, district, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)',
      [
        DEFAULT_ADMIN.full_name,
        DEFAULT_ADMIN.email,
        DEFAULT_ADMIN.phone,
        password_hash,
        DEFAULT_ADMIN.role,
        DEFAULT_ADMIN.region,
        DEFAULT_ADMIN.district
      ]
    );
  }
}

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
    const { email, password, remember_me } = body;
    const cleanedEmail = sanitizeText((email || '').trim().toLowerCase());
    const rememberMe = [true, 'true', '1', 1].includes(remember_me);
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

    // Ensure admin seed exists when the production database is empty or missing the account.
    try {
      await ensureAdminExists();
    } catch (seedError) {
      console.warn('Admin seed check failed:', seedError?.message || seedError);
    }

    // 2. SELECT user by email
    let users = [];
    try {
      users = await query(
        'SELECT user_id, full_name, email, phone, password_hash, role, region, district, profile_photo, is_verified, is_active FROM users WHERE email = ?',
        [cleanedEmail]
      );
    } catch (dbError) {
      console.error('User lookup failed during login:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database lookup failed while signing in. Please try again shortly.' },
        { status: 500 }
      );
    }

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

    // 7.5. Send security login alert email, but never fail login because of mail delivery.
    try {
      const alertHtml = loginAlertEmail(user.full_name, ip);
      await sendEmail({
        to: user.email,
        subject: 'Security Alert: New Sign-in Detected 🚨',
        html: alertHtml
      });
    } catch (emailError) {
      console.warn('Login alert email sending failed:', emailError?.message || emailError);
    }

    // 8. Prepare user data to return (exclude password_hash)
    const { password_hash, ...safeUserData } = user;

    // 9. setAuthCookie on response, return user data
    const response = NextResponse.json({
      success: true,
      data: safeUserData
    });

    setAuthCookie(response, token, {
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : undefined,
    });
    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during login' },
      { status: 500 }
    );
  }
}
