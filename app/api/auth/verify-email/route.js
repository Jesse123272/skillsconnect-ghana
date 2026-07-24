import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isMockEmailMode, sendEmail, welcomeEmail, verificationEmail } from '@/lib/mailer';

// POST: Verify 6-digit code
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    // Find user
    const users = await query(
      'SELECT user_id, full_name, role, is_verified, verification_token FROM users WHERE email = ?',
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
      return NextResponse.json({
        success: true,
        message: 'Your account is already verified! Please sign in.'
      });
    }

    const isMockMode = isMockEmailMode();
    const isBypass = isMockMode && code.trim() === '123456';
    const isTokenMatch = user.verification_token && user.verification_token.trim() === code.trim();

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

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.'
    });

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
