import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userId = parseInt(id, 10);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    // Fetch user details
    const users = await query(
      `SELECT user_id, full_name, email, phone, role, region, district, is_verified, is_active, last_login, created_at 
       FROM users 
       WHERE user_id = ?`,
      [userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const user = users[0];

    // Fetch user activity logs
    const activityLogs = await query(
      `SELECT log_id, action, entity_type, entity_id, ip_address, created_at 
       FROM activity_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    // Fetch reviews written by this user (if customer) or received (if artisan)
    let reviews = [];
    if (user.role === 'customer') {
      reviews = await query(
        `SELECT r.review_id, r.rating, r.review_text, r.is_approved, r.created_at, u.full_name as artisan_name
         FROM reviews r
         INNER JOIN users u ON r.artisan_id = u.user_id
         WHERE r.customer_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );
    } else {
      reviews = await query(
        `SELECT r.review_id, r.rating, r.review_text, r.is_approved, r.created_at, u.full_name as customer_name
         FROM reviews r
         INNER JOIN users u ON r.customer_id = u.user_id
         WHERE r.artisan_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );
    }

    // Fetch enquiries sent/received
    let enquiries = [];
    if (user.role === 'customer') {
      enquiries = await query(
        `SELECT e.enquiry_id, e.subject, e.message, e.status, e.created_at, u.full_name as artisan_name
         FROM enquiries e
         INNER JOIN users u ON e.artisan_id = u.user_id
         WHERE e.customer_id = ?
         ORDER BY e.created_at DESC`,
        [userId]
      );
    } else {
      enquiries = await query(
        `SELECT e.enquiry_id, e.subject, e.message, e.status, e.created_at, u.full_name as customer_name
         FROM enquiries e
         INNER JOIN users u ON e.customer_id = u.user_id
         WHERE e.artisan_id = ?
         ORDER BY e.created_at DESC`,
        [userId]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        activityLogs,
        reviews,
        enquiries
      }
    });

  } catch (error) {
    console.error('Admin Fetch User Detail Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve user account detail.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userId = parseInt(id, 10);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json({ success: false, error: 'is_active field is required.' }, { status: 400 });
    }

    const actVal = is_active ? 1 : 0;
    await query('UPDATE users SET is_active = ? WHERE user_id = ?', [actVal, userId]);

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, actVal ? 'ACTIVATE_USER' : 'SUSPEND_USER', 'users', userId, ip]
    );

    return NextResponse.json({
      success: true,
      message: `User accounts status successfully updated.`
    });

  } catch (error) {
    console.error('Admin Update User Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user account.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userId = parseInt(id, 10);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid user ID.' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE user_id = ?', [userId]);

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_USER', 'users', userId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'User account permanently deleted successfully.'
    });

  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user account.' }, { status: 500 });
  }
}
