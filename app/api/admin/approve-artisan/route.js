import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail, approvalEmail } from '@/lib/mailer';

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
        { success: false, error: 'Access denied. Admin rights required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artisan_id } = body;
    const parsedId = parseInt(artisan_id, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid artisan ID is required for approval' },
        { status: 400 }
      );
    }

    // Check if artisan profile exists
    const artisans = await query(
      `SELECT u.full_name, u.email, ap.profile_id, ap.is_approved 
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       WHERE u.user_id = ? AND u.role = 'artisan'`,
      [parsedId]
    );

    if (!artisans || artisans.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Artisan profile not found' },
        { status: 404 }
      );
    }

    const artisan = artisans[0];

    if (artisan.is_approved === 1) {
      return NextResponse.json(
        { success: false, error: 'This artisan profile has already been approved' },
        { status: 400 }
      );
    }

    // 1. UPDATE artisan_profiles to set is_approved = 1
    await query('UPDATE artisan_profiles SET is_approved = 1 WHERE user_id = ?', [parsedId]);

    // 2. Create local notification for the approved artisan
    const notificationTitle = 'Profile Approved! 🇬🇭🎉';
    const notificationMessage = 'Your SkillsConnect Ghana professional artisan profile has been reviewed and approved by the administrator. You are now active and completely visible to customers searching for your skills!';
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'profile_approved', ?, ?, '/dashboard')`,
      [parsedId, notificationTitle, notificationMessage]
    );

    // 3. Send approval confirmation email via mailer template
    try {
      const emailHtml = approvalEmail(artisan.full_name);
      await sendEmail({
        to: artisan.email,
        subject: 'Your SkillsConnect Ghana Professional Profile has been Approved! 🇬🇭🎉',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Artisan approval notification email failed:', emailError);
    }

    // 4. Log the administrative approval action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'APPROVE_ARTISAN', 'users', parsedId, ip]
    );

    return NextResponse.json({
      success: true,
      message: `Artisan ${artisan.full_name} successfully approved and activated`
    });

  } catch (error) {
    console.error('Approve Artisan API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while processing approval' },
      { status: 500 }
    );
  }
}
