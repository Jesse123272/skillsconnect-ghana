import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/validators';

export async function PUT(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { old_password, new_password, confirm_new_password } = body;

    // 1. Check required fields
    if (!old_password || !new_password || !confirm_new_password) {
      return NextResponse.json(
        { success: false, error: 'All password fields are required' },
        { status: 400 }
      );
    }

    // 2. Validate new password match
    if (new_password !== confirm_new_password) {
      return NextResponse.json(
        { success: false, error: 'The new password and confirmation password do not match' },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(new_password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.message },
        { status: 400 }
      );
    }

    // 4. Fetch the existing password hash from DB
    const users = await query('SELECT password_hash FROM users WHERE user_id = ?', [payload.user_id]);
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 5. Compare current password with old_password
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'The current password you entered is incorrect' },
        { status: 401 }
      );
    }

    // 6. Hash new password
    const newHashedPassword = await bcrypt.hash(new_password, 12);

    // 7. Update password hash in users table
    await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHashedPassword, payload.user_id]);

    // 8. Log important actions to activity_logs table
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'CHANGE_PASSWORD', 'users', payload.user_id, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change Password API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while changing your password' },
      { status: 500 }
    );
  }
}
