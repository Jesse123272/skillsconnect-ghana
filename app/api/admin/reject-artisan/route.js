import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function POST(req) {
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
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artisan_id, reason } = body;
    const parsedId = parseInt(artisan_id, 10);

    // Validate inputs
    if (isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid artisan ID is required for rejection' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid reason for application rejection' },
        { status: 400 }
      );
    }

    // Retrieve artisan details before deletion
    const artisans = await query(
      `SELECT u.full_name, u.email 
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       WHERE u.user_id = ? AND u.role = 'artisan'`,
      [parsedId]
    );

    if (!artisans || artisans.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Artisan application profile not found' },
        { status: 404 }
      );
    }

    const artisan = artisans[0];

    // Delete user from DB. Cascading constraints in the MySQL schema will automatically
    // clean up associated profiles, reviews, gallery items, enquries, and portfolio items.
    await query('DELETE FROM users WHERE user_id = ?', [parsedId]);

    // Send rejection notice email to artisan
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Artisan Application Status - SkillsConnect Ghana</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafafa; color: #2d3748; padding: 20px; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 35px; border-radius: 10px; border: 1px solid #edf2f7; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
          .header { font-size: 22px; font-weight: bold; color: #e53e3e; border-bottom: 2px solid #e53e3e; padding-bottom: 15px; margin-bottom: 25px; }
          .reason-box { background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; margin: 20px 0; border-radius: 6px; color: #c53030; }
          .footer { margin-top: 35px; font-size: 11px; color: #718096; border-top: 1px solid #edf2f7; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">SkillsConnect Ghana Application Status Update</div>
          <p>Hello <strong>${artisan.full_name}</strong>,</p>
          <p>Thank you for applying to list your professional trade services on SkillsConnect Ghana.</p>
          <p>Our verification team has completed a review of your profile. Regrettably, your professional listing application has been declined at this time due to the following reason:</p>
          
          <div class="reason-box">
            <strong>Rejection Reason:</strong><br>
            ${reason.trim()}
          </div>

          <p>We welcome you to submit a fresh application on our platform once these details have been corrected or verified.</p>
          
          <div class="footer">
            <p>&copy; 2026 SkillsConnect Ghana. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: artisan.email,
        subject: 'Update regarding your SkillsConnect Ghana artisan application 🇬🇭',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Rejection notice email failed to send:', emailError);
    }

    // Log the rejection action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'REJECT_ARTISAN', 'users', parsedId, ip]
    );

    return NextResponse.json({
      success: true,
      message: `Artisan application for ${artisan.full_name} has been declined and removed successfully`
    });

  } catch (error) {
    console.error('Reject Artisan API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while rejecting the artisan application' },
      { status: 500 }
    );
  }
}
