import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: Retrieve all notifications for the logged-in user
export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [payload.user_id]
    );
    const total = countResult[0]?.total || 0;

    const notifications = await query(
      `SELECT notification_id, type, title, message, is_read, link, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [payload.user_id, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List Notifications API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while loading notifications' },
      { status: 500 }
    );
  }
}

// PUT: Mark all notifications as read for the logged-in user
export async function PUT(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [payload.user_id]);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark Notifications Read API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
