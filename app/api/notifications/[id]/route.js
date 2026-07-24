import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// PUT: Mark a specific notification as read (belongs to user)
export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId) || notificationId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Verify notification exists and belongs to this user
    const notifications = await query(
      'SELECT notification_id, user_id FROM notifications WHERE notification_id = ?',
      [notificationId]
    );

    if (!notifications || notifications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notification = notifications[0];

    if (notification.user_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Access denied.' },
        { status: 403 }
      );
    }

    // Update is_read state to 1
    await query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [notificationId]);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read successfully'
    });

  } catch (error) {
    console.error('Update Specific Notification API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific notification (belongs to user)
export async function DELETE(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId) || notificationId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Verify notification exists and belongs to this user
    const notifications = await query(
      'SELECT notification_id, user_id FROM notifications WHERE notification_id = ?',
      [notificationId]
    );

    if (!notifications || notifications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notification = notifications[0];

    if (notification.user_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Access denied.' },
        { status: 403 }
      );
    }

    // DELETE notification
    await query('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete Specific Notification API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
