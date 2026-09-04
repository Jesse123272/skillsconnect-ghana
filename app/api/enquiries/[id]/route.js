import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req, { params }) {
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
    const enquiryId = parseInt(id, 10);

    if (isNaN(enquiryId) || enquiryId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid enquiry ID' },
        { status: 400 }
      );
    }

    // Fetch the enquiry details with customer and artisan name, email, phone, photo
    const enquiries = await query(
      `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.status, e.is_read_customer, e.is_read_artisan, e.created_at, e.replied_at,
              c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.profile_photo as customer_photo,
              a.full_name as artisan_name, a.email as artisan_email, a.phone as artisan_phone, a.profile_photo as artisan_photo
       FROM enquiries e
       INNER JOIN users c ON e.customer_id = c.user_id
       INNER JOIN users a ON e.artisan_id = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    const enquiry = enquiries[0];

    // Verify permission: Must be customer, artisan, or admin
    if (payload.user_id !== enquiry.customer_id && payload.user_id !== enquiry.artisan_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mark read for this user
    if (payload.user_id === enquiry.customer_id && enquiry.is_read_customer === 0) {
      await query('UPDATE enquiries SET is_read_customer = 1 WHERE enquiry_id = ?', [enquiryId]);
      enquiry.is_read_customer = 1;
    } else if (payload.user_id === enquiry.artisan_id && enquiry.is_read_artisan === 0) {
      await query('UPDATE enquiries SET is_read_artisan = 1 WHERE enquiry_id = ?', [enquiryId]);
      enquiry.is_read_artisan = 1;
    }

    return NextResponse.json({
      success: true,
      data: enquiry
    });

  } catch (error) {
    console.error('Get Enquiry Detail API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving enquiry details' },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
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
    const enquiryId = parseInt(id, 10);

    if (isNaN(enquiryId) || enquiryId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid enquiry ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'closed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Verify enquiry exists and user has permission
    const enquiries = await query(
      'SELECT enquiry_id, customer_id, artisan_id, subject FROM enquiries WHERE enquiry_id = ?',
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry not found' },
        { status: 404 }
      );
    }

    const enquiry = enquiries[0];

    if (payload.user_id !== enquiry.customer_id && payload.user_id !== enquiry.artisan_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update status
    const completionUpdate = status === 'completed' ? ', completed_at = CURRENT_TIMESTAMP, completed_by = ?' : '';
    const updateParams = status === 'completed' ? [status, payload.user_id, enquiryId] : [status, enquiryId];
    await query(`UPDATE enquiries SET status = ?${completionUpdate} WHERE enquiry_id = ?`, updateParams);

    // Send notification to the counterpart
    const otherUserId = payload.user_id === enquiry.customer_id ? enquiry.artisan_id : enquiry.customer_id;
    const targetDashboard = payload.user_id === enquiry.customer_id ? '/dashboard/artisan/enquiries/' + enquiryId : '/dashboard/customer/enquiries/' + enquiryId;
    const statusFormatted = status.replace('_', ' ').toUpperCase();

    let notificationTitle = `Service Status Update: ${statusFormatted}`;
    let notificationMsg = `The trade request "${enquiry.subject}" status was marked as ${status.replace('_', ' ')} by ${payload.full_name}.`;

    if (status === 'completed') {
      notificationTitle = '🎉 Service Completed!';
      notificationMsg = payload.user_id === enquiry.artisan_id
        ? `${payload.full_name} has marked your service request "${enquiry.subject}" as completed. Please leave a rating and review for this artisan!`
        : `${payload.full_name} marked the service "${enquiry.subject}" as completed!`;
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, 'system', ?, ?, ?)`,
      [otherUserId, notificationTitle, notificationMsg, targetDashboard]
    );

    return NextResponse.json({
      success: true,
      message: `Enquiry status updated to ${status}`,
      data: { status }
    });

  } catch (error) {
    console.error('Update Enquiry Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating enquiry status' },
      { status: 500 }
    );
  }
}
