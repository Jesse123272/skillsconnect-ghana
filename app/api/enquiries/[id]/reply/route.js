import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'artisan') {
      return NextResponse.json(
        { success: false, error: 'Only skilled artisans can reply to enquiries' },
        { status: 403 }
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
    const { reply } = body;

    // Validate reply input
    if (!reply || reply.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Reply message cannot be empty' },
        { status: 400 }
      );
    }

    if (reply.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Reply message must not exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Check if enquiry exists and belongs to this artisan
    const enquiries = await query(
      `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.status,
              c.full_name as customer_name, c.email as customer_email,
              a.full_name as artisan_name
       FROM enquiries e
       INNER JOIN users c ON e.customer_id = c.user_id
       INNER JOIN users a ON e.artisan_id = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry details not found' },
        { status: 404 }
      );
    }

    const enquiry = enquiries[0];

    if (enquiry.artisan_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. This service enquiry is assigned to another artisan.' },
        { status: 403 }
      );
    }

    // UPDATE enquiries with reply and status
    await query(
      `UPDATE enquiries 
       SET reply = ?, status = 'replied', replied_at = NOW(), is_read_customer = 0 
       WHERE enquiry_id = ?`,
      [reply.trim(), enquiryId]
    );

    // Create notification for customer
    const notificationTitle = 'Enquiry Replied ✉️';
    const notificationMsg = `${enquiry.artisan_name} has replied to your enquiry: "${enquiry.subject}"`;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'enquiry_reply', ?, ?, ?)`,
      [enquiry.customer_id, notificationTitle, notificationMsg, `/dashboard/enquiries/${enquiryId}`]
    );

    // Send email to customer via mailer.js
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Enquiry Response - SkillsConnect Ghana</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { font-size: 20px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px; }
          .quote { background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic; color: #475569; }
          .button { display: inline-block; padding: 12px 28px; background-color: #f59e0b; color: #1e293b; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 15px; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Enquiry Replied! 🇬🇭</div>
          <p>Hello <strong>${enquiry.customer_name}</strong>,</p>
          <p>The skilled artisan, <strong>${enquiry.artisan_name}</strong>, has responded to your service inquiry for "<strong>${enquiry.subject}</strong>".</p>
          
          <p><strong>Response Message:</strong></p>
          <div class="quote">
            "${reply.trim()}"
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/enquiries/${enquiryId}" class="button">View & Reply in Dashboard</a>
          </p>

          <p>Prompt communication helps speed up project coordination!</p>

          <div class="footer">
            <p>&copy; 2026 SkillsConnect Ghana. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: enquiry.customer_email,
        subject: `Enquiry Replied by ${enquiry.artisan_name} ✉️`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Enquiry reply email notification failed:', emailError);
    }

    // Log the reply action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'REPLY_ENQUIRY', 'enquiries', enquiryId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Reply submitted successfully'
    });

  } catch (error) {
    console.error('Submit Enquiry Reply API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while sending the reply' },
      { status: 500 }
    );
  }
}
