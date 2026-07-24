import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin authorization required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const targetUserId = parseInt(id, 10);

    if (isNaN(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID parameter' },
        { status: 400 }
      );
    }

    // Admins cannot suspend themselves
    if (targetUserId === payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You are not allowed to suspend your own administrator account.' },
        { status: 400 }
      );
    }

    // Retrieve the target user
    const users = await query('SELECT user_id, full_name, is_active FROM users WHERE user_id = ?', [targetUserId]);
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target user account not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    const toggledStatus = user.is_active === 1 ? 0 : 1;

    // UPDATE user state
    await query('UPDATE users SET is_active = ? WHERE user_id = ?', [toggledStatus, targetUserId]);

    // Log the toggle action
    const actionName = toggledStatus === 1 ? 'ACTIVATE_USER' : 'SUSPEND_USER';
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, actionName, 'users', targetUserId, ip]
    );

    return NextResponse.json({
      success: true,
      message: `User account has been successfully ${toggledStatus === 1 ? 'activated' : 'suspended'}`,
      data: {
        is_active: toggledStatus
      }
    });

  } catch (error) {
    console.error('Toggle User Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating user status' },
      { status: 500 }
    );
  }
}
