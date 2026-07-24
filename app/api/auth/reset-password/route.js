import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/validators';

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, password, confirm_password } = body;

    if (!token || !password || !confirm_password) {
      return NextResponse.json(
        { success: false, error: 'Token, password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.message },
        { status: 400 }
      );
    }

    // Hash token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching reset token
    const users = await query(
      'SELECT user_id, email, full_name, reset_token FROM users WHERE reset_token IS NOT NULL'
    );

    let matchingUser = null;

    for (const u of users) {
      if (u.reset_token && u.reset_token.startsWith(hashedToken)) {
        const parts = u.reset_token.split(':');
        const tokenHash = parts[0];
        const expiry = parseInt(parts[1], 10);

        if (tokenHash === hashedToken && Date.now() < expiry) {
          matchingUser = u;
          break;
        }
      }
    }

    if (!matchingUser) {
      return NextResponse.json(
        { success: false, error: 'Password reset link is invalid or has expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL WHERE user_id = ?',
      [newPasswordHash, matchingUser.user_id]
    );

    // Log action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [matchingUser.user_id, 'PASSWORD_RESET', 'users', matchingUser.user_id, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in.'
    });

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
