import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail, enquiryNotificationEmail } from '@/lib/mailer';

// GET: List enquiries for logged-in user
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
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'replied'
    const artisanId = parseInt(searchParams.get('artisan_id') || '0', 10);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100);
    const offset = Math.max((page - 1) * limit, 0);

    let enquiries = [];
    let total = 0;

    if (payload.role === 'customer') {
      // 1. Build conditional filters for Customer
      const conditions = ['e.customer_id = ?'];
      const params = [payload.user_id];

      if (artisanId > 0) {
        conditions.push('e.artisan_id = ?');
        params.push(artisanId);
      }

      if (status === 'unread') {
        conditions.push('e.is_read_customer = 0');
      } else if (status !== 'all') {
        conditions.push('e.status = ?');
        params.push(status);
      }

      const whereClause = 'WHERE ' + conditions.join(' AND ');

      // Total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM enquiries e ${whereClause}`,
        params
      );
      total = countResult[0]?.total || 0;

      // Select data
      enquiries = await query(
        `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.status, e.is_read_customer, e.is_read_artisan, e.created_at, e.replied_at,
                u.full_name as artisan_name, u.profile_photo as artisan_photo, c.category_name
         FROM enquiries e
         INNER JOIN users u ON e.artisan_id = u.user_id
         INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
         LEFT JOIN categories c ON ap.category_id = c.category_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

    } else if (payload.role === 'artisan') {
      // 2. Build conditional filters for Artisan
      const conditions = ['e.artisan_id = ?'];
      const params = [payload.user_id];

      if (artisanId > 0) {
        conditions.push('e.customer_id = ?');
        params.push(artisanId);
      }

      if (status === 'unread') {
        conditions.push('e.is_read_artisan = 0');
      } else if (status !== 'all') {
        conditions.push('e.status = ?');
        params.push(status);
      }

      const whereClause = 'WHERE ' + conditions.join(' AND ');

      // Total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM enquiries e ${whereClause}`,
        params
      );
      total = countResult[0]?.total || 0;

      // Select data
      enquiries = await query(
        `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.status, e.is_read_customer, e.is_read_artisan, e.created_at, e.replied_at,
                u.full_name as customer_name, u.profile_photo as customer_photo
         FROM enquiries e
         INNER JOIN users u ON e.customer_id = u.user_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );
    } else if (payload.role === 'admin') {
      // Admins see all
      const countResult = await query('SELECT COUNT(*) as total FROM enquiries');
      total = countResult[0]?.total || 0;

      enquiries = await query(
        `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.status, e.is_read_customer, e.is_read_artisan, e.created_at, e.replied_at,
                c.full_name as customer_name, a.full_name as artisan_name
         FROM enquiries e
         INNER JOIN users c ON e.customer_id = c.user_id
         INNER JOIN users a ON e.artisan_id = a.user_id
         ORDER BY e.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        []
      );
    } else {
      return NextResponse.json({ success: false, error: 'Unauthorized role' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        enquiries,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('List Enquiries API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving enquiries' },
      { status: 500 }
    );
  }
}

// POST: Send new enquiry
export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'customer') {
      return NextResponse.json(
        { success: false, error: 'Only customers can send trade service enquiries' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artisan_id, subject, message } = body;

    const parsedArtisanId = parseInt(artisan_id, 10);
    if (isNaN(parsedArtisanId) || parsedArtisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid artisan ID is required' },
        { status: 400 }
      );
    }

    if (!subject || subject.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 20 || message.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message must be between 20 and 1000 characters long' },
        { status: 400 }
      );
    }

    // Check if artisan exists and is approved
    const artisans = await query(
      `SELECT u.full_name, u.email, ap.is_approved 
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       WHERE u.user_id = ? AND u.role = 'artisan' AND u.is_active = 1`,
      [parsedArtisanId]
    );

    if (!artisans || artisans.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Artisan profile not found or currently suspended' },
        { status: 404 }
      );
    }

    const artisan = artisans[0];
    if (artisan.is_approved !== 1) {
      return NextResponse.json(
        { success: false, error: 'This artisan is pending approval and cannot receive enquiries yet' },
        { status: 400 }
      );
    }

    // Insert into enquiries
    const insertResult = await query(
      `INSERT INTO enquiries (customer_id, artisan_id, subject, message, status, is_read_customer, is_read_artisan) 
       VALUES (?, ?, ?, ?, 'pending', 1, 0)`,
      [payload.user_id, parsedArtisanId, subject.trim(), message.trim()]
    );
    const enquiryId = insertResult.insertId;

    // Create notification for artisan
    const notificationMsg = `New enquiry from ${payload.full_name}: "${subject.trim().substring(0, 50)}${subject.trim().length > 50 ? '...' : ''}"`;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'enquiry', 'New Service Enquiry ✉️', ?, ?)`,
      [parsedArtisanId, notificationMsg, `/dashboard/enquiries/${enquiryId}`]
    );

    // Send email to artisan via mailer.js
    try {
      const emailHtml = enquiryNotificationEmail(artisan.full_name, payload.full_name, message.trim());
      await sendEmail({
        to: artisan.email,
        subject: `New Service Enquiry from ${payload.full_name} 🇬🇭`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Enquiry notification email failed:', emailError);
    }

    // Log action in activity_logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'SEND_ENQUIRY', 'enquiries', enquiryId, ip]
    );

    return NextResponse.json({
      success: true,
      data: {
        enquiry_id: enquiryId
      }
    });

  } catch (error) {
    console.error('Create Enquiry API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while sending the enquiry' },
      { status: 500 }
    );
  }
}
