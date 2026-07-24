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
    const enquiryId = parseInt(id, 10);

    if (isNaN(enquiryId) || enquiryId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid enquiry ID.' }, { status: 400 });
    }

    const enquiries = await query(
      `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.status, e.created_at, e.replied_at,
              c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone,
              a.full_name as artisan_name, a.email as artisan_email, a.phone as artisan_phone
       FROM enquiries e
       INNER JOIN users c ON e.customer_id = c.user_id
       INNER JOIN users a ON e.artisan_id = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: enquiries[0]
    });

  } catch (error) {
    console.error('Admin Fetch Enquiry Detail Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch enquiry.' }, { status: 500 });
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
    const enquiryId = parseInt(id, 10);

    if (isNaN(enquiryId) || enquiryId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid enquiry ID.' }, { status: 400 });
    }

    await query('DELETE FROM enquiries WHERE enquiry_id = ?', [enquiryId]);

    // Log action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_ENQUIRY', 'enquiries', enquiryId, ip]
    );

    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully.' });

  } catch (error) {
    console.error('Admin Delete Enquiry Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete enquiry.' }, { status: 500 });
  }
}
