import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { sanitizeObject, sanitizeText } from '@/lib/security';

// GET: Retrieve unified chronological conversation history for an enquiry
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

    // 1. Fetch parent enquiry to check permissions and get basic info
    const enquiries = await query(
      `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.reply, e.created_at, e.replied_at,
              c.full_name as customer_name, c.profile_photo as customer_photo,
              a.full_name as artisan_name, a.profile_photo as artisan_photo
       FROM enquiries e
       INNER JOIN users c ON e.customer_id = c.user_id
       INNER JOIN users a ON e.artisan_id = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry thread not found' },
        { status: 404 }
      );
    }

    const enquiry = enquiries[0];

    // Check permissions
    if (payload.user_id !== enquiry.customer_id && payload.user_id !== enquiry.artisan_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied to this conversation thread' },
        { status: 403 }
      );
    }

    // 2. Construct the chronological list of messages starting with parent enquiry details
    const messagesList = [];

    // First message: Customer's initial inquiry message
    messagesList.push({
      message_id: 'init-msg',
      sender_id: enquiry.customer_id,
      sender_name: enquiry.customer_name,
      sender_photo: enquiry.customer_photo,
      sender_role: 'customer',
      message_text: enquiry.message,
      created_at: enquiry.created_at
    });

    // Second message: Artisan's legacy static reply (if present)
    if (enquiry.reply) {
      messagesList.push({
        message_id: 'init-reply',
        sender_id: enquiry.artisan_id,
        sender_name: enquiry.artisan_name,
        sender_photo: enquiry.artisan_photo,
        sender_role: 'artisan',
        message_text: enquiry.reply,
        created_at: enquiry.replied_at || enquiry.created_at
      });
    }

    // 3. Fetch subsequent messages in the interactive discussion
    const dbMessages = await query(
      `SELECT m.message_id, m.enquiry_id, m.sender_id, m.message_text, m.created_at,
              u.full_name as sender_name, u.profile_photo as sender_photo, u.role as sender_role
       FROM enquiry_messages m
       INNER JOIN users u ON m.sender_id = u.user_id
       WHERE m.enquiry_id = ?
       ORDER BY m.created_at ASC`,
      [enquiryId]
    );

    dbMessages.forEach((msg) => {
      messagesList.push({
        message_id: msg.message_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_photo: msg.sender_photo,
        sender_role: msg.sender_role,
        message_text: msg.message_text,
        created_at: msg.created_at
      });
    });

    return NextResponse.json({
      success: true,
      data: messagesList
    });

  } catch (error) {
    console.error('Fetch Enquiry Messages Thread Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected database error occurred while fetching conversation thread' },
      { status: 500 }
    );
  }
}

// POST: Send a new message in the discussion thread
export async function POST(req, { params }) {
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

    const body = sanitizeObject(await req.json());
    const { message_text } = body;
    const safeMessageText = sanitizeText(message_text || '').trim();

    if (!safeMessageText) {
      return NextResponse.json(
        { success: false, error: 'Message text cannot be empty' },
        { status: 400 }
      );
    }

    if (safeMessageText.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Fetch parent enquiry and check permissions
    const enquiries = await query(
      `SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject,
              c.full_name as customer_name, c.email as customer_email,
              a.full_name as artisan_name, a.email as artisan_email
       FROM enquiries e
       INNER JOIN users c ON e.customer_id = c.user_id
       INNER JOIN users a ON e.artisan_id = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry thread not found' },
        { status: 404 }
      );
    }

    const enquiry = enquiries[0];

    if (payload.user_id !== enquiry.customer_id && payload.user_id !== enquiry.artisan_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You are not a participant in this discussion thread' },
        { status: 403 }
      );
    }

    // Insert new message
    const insertResult = await query(
      `INSERT INTO enquiry_messages (enquiry_id, sender_id, message_text) VALUES (?, ?, ?)`,
      [enquiryId, payload.user_id, safeMessageText]
    );
    const messageId = insertResult.insertId;

    // Determine roles and update the parent enquiry metadata (is_read, status etc.)
    const isArtisan = payload.user_id === enquiry.artisan_id;
    const recipientId = isArtisan ? enquiry.customer_id : enquiry.artisan_id;
    const recipientEmail = isArtisan ? enquiry.customer_email : enquiry.artisan_email;
    const recipientName = isArtisan ? enquiry.customer_name : enquiry.artisan_name;

    if (isArtisan) {
      // Artisan sent message
      await query(
        `UPDATE enquiries 
         SET status = 'replied', replied_at = NOW(), is_read_customer = 0, is_read_artisan = 1 
         WHERE enquiry_id = ?`,
        [enquiryId]
      );

      // Create notification for customer
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'enquiry_reply', 'New Message from Artisan 💬', ?, ?)`,
        [
          recipientId,
          `${payload.full_name} has messaged you regarding: "${enquiry.subject}"`,
          `/dashboard/customer/enquiries/${enquiryId}`
        ]
      );
    } else {
      // Customer sent message
      await query(
        `UPDATE enquiries 
         SET status = 'pending', is_read_artisan = 0, is_read_customer = 1 
         WHERE enquiry_id = ?`,
        [enquiryId]
      );

      // Create notification for artisan
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'enquiry', 'New Message from Customer 💬', ?, ?)`,
        [
          recipientId,
          `${payload.full_name} has messaged you regarding: "${enquiry.subject}"`,
          `/dashboard/artisan/enquiries/${enquiryId}`
        ]
      );
    }

    // Send email notification to recipient
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Message - SkillsConnect Ghana</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { font-size: 20px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px; }
          .quote { background-color: #f8fafc; border-left: 4px solid #1A6B3C; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic; color: #475569; }
          .button { display: inline-block; padding: 12px 28px; background-color: #1A6B3C; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 15px; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">New Message received! 💬</div>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>You have received a new message from <strong>${payload.full_name}</strong> regarding the enquiry: "<strong>${enquiry.subject}</strong>".</p>
          
          <div class="quote">
            "${safeMessageText}"
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/${isArtisan ? 'customer' : 'artisan'}/enquiries/${enquiryId}" class="button">View Thread & Reply</a>
          </p>

          <p>Prompt communication helps build mutual trust and secures your service coordinates!</p>

          <div class="footer">
            <p>&copy; 2026 SkillsConnect Ghana. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: recipientEmail,
        subject: `New Message from ${payload.full_name} 💬`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Real-time discussion notification email failed:', emailError);
    }

    // Log action to activity_logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'SEND_MESSAGE', 'enquiry_messages', messageId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Message dispatched successfully',
      data: {
        message_id: messageId,
        sender_id: payload.user_id,
        sender_name: payload.full_name,
        sender_photo: payload.profile_photo,
        sender_role: payload.role,
        message_text: safeMessageText,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Post Discussion Message API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while sending the message' },
      { status: 500 }
    );
  }
}
