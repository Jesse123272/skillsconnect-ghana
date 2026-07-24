import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail, approvalEmail } from '@/lib/mailer';

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
    const artisanId = parseInt(id, 10);

    if (isNaN(artisanId) || artisanId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid artisan ID.' }, { status: 400 });
    }

    // Fetch primary profile (without is_active or is_approved barriers for admin view)
    const artisans = await query(
      `SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified, u.is_active, u.created_at as user_created_at,
        ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at
       FROM users u
       LEFT JOIN artisan_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN categories c ON ap.category_id = c.category_id
       WHERE u.user_id = ? AND u.role = 'artisan'`,
      [artisanId]
    );

    if (!artisans || artisans.length === 0) {
      return NextResponse.json({ success: false, error: 'Artisan not found.' }, { status: 404 });
    }

    const artisan = artisans[0];

    // Fetch reviews
    const reviews = await query(
      `SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.is_approved, r.created_at, u.full_name as customer_name
       FROM reviews r
       INNER JOIN users u ON r.customer_id = u.user_id
       WHERE r.artisan_id = ?
       ORDER BY r.created_at DESC`,
      [artisanId]
    );

    // Fetch portfolio
    const portfolio = await query(
      `SELECT item_id, image_path, caption, description, created_at 
       FROM portfolio_items 
       WHERE artisan_id = ? 
       ORDER BY created_at DESC`,
      [artisanId]
    );

    // Fetch gallery
    const gallery = await query(
      `SELECT gallery_id, image_path, caption, uploaded_at 
       FROM gallery 
       WHERE artisan_id = ? 
       ORDER BY uploaded_at DESC`,
      [artisanId]
    );

    let areaArray = [];
    if (artisan.service_areas) {
      areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
    }

    const fullProfile = {
      ...artisan,
      service_areas: areaArray,
      reviews,
      portfolio,
      gallery
    };

    return NextResponse.json({
      success: true,
      data: fullProfile
    });

  } catch (error) {
    console.error('Admin Fetch Artisan Detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve artisan detail.' }, { status: 500 });
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
    const artisanId = parseInt(id, 10);

    if (isNaN(artisanId) || artisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid artisan ID.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, is_featured, is_verified, is_approved, is_active } = body;

    // Fetch user and profile to check existence
    const users = await query('SELECT full_name, email FROM users WHERE user_id = ? AND role = "artisan"', [artisanId]);
    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Artisan not found.' }, { status: 404 });
    }
    const artisanName = users[0].full_name;
    const artisanEmail = users[0].email;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (action === 'approve') {
      await query('UPDATE artisan_profiles SET is_approved = 1 WHERE user_id = ?', [artisanId]);
      await query('UPDATE users SET is_active = 1 WHERE user_id = ?', [artisanId]);

      // Add notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link) 
         VALUES (?, 'profile_approved', 'Profile Approved! 🇬🇭🎉', 'Your SkillsConnect Ghana professional artisan profile has been reviewed and approved.', '/dashboard')`,
        [artisanId]
      );

      // Send email
      try {
        const emailHtml = approvalEmail(artisanName);
        await sendEmail({
          to: artisanEmail,
          subject: 'Your SkillsConnect Ghana Professional Profile has been Approved! 🇬🇭🎉',
          html: emailHtml
        });
      } catch (e) {
        console.error('Email send failed:', e);
      }

      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'APPROVE_ARTISAN', 'users', artisanId, ip]
      );

      return NextResponse.json({ success: true, message: 'Artisan approved and activated successfully.' });
    }

    if (action === 'suspend') {
      await query('UPDATE users SET is_active = 0 WHERE user_id = ?', [artisanId]);
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'SUSPEND_ARTISAN', 'users', artisanId, ip]
      );
      return NextResponse.json({ success: true, message: 'Artisan suspended successfully.' });
    }

    if (action === 'activate') {
      await query('UPDATE users SET is_active = 1 WHERE user_id = ?', [artisanId]);
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'ACTIVATE_ARTISAN', 'users', artisanId, ip]
      );
      return NextResponse.json({ success: true, message: 'Artisan activated successfully.' });
    }

    // Direct switches/toggles
    if (is_featured !== undefined) {
      const featVal = is_featured ? 1 : 0;
      await query('UPDATE artisan_profiles SET is_featured = ? WHERE user_id = ?', [featVal, artisanId]);
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, featVal ? 'FEATURE_ARTISAN' : 'UNFEATURE_ARTISAN', 'users', artisanId, ip]
      );
    }

    if (is_verified !== undefined) {
      const verVal = is_verified ? 1 : 0;
      await query('UPDATE users SET is_verified = ? WHERE user_id = ?', [verVal, artisanId]);
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, verVal ? 'VERIFY_ARTISAN' : 'UNVERIFY_ARTISAN', 'users', artisanId, ip]
      );
    }

    if (is_approved !== undefined) {
      const appVal = is_approved ? 1 : 0;
      await query('UPDATE artisan_profiles SET is_approved = ? WHERE user_id = ?', [appVal, artisanId]);
    }

    if (is_active !== undefined) {
      const actVal = is_active ? 1 : 0;
      await query('UPDATE users SET is_active = ? WHERE user_id = ?', [actVal, artisanId]);
    }

    return NextResponse.json({ success: true, message: 'Artisan updated successfully.' });

  } catch (error) {
    console.error('Admin Update Artisan Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update artisan.' }, { status: 500 });
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
    const artisanId = parseInt(id, 10);

    if (isNaN(artisanId) || artisanId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid artisan ID.' }, { status: 400 });
    }

    // Deleting user will cascade to other tables automatically
    await query('DELETE FROM users WHERE user_id = ?', [artisanId]);

    // Log the deletion action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_ARTISAN', 'users', artisanId, ip]
    );

    return NextResponse.json({ success: true, message: 'Artisan deleted successfully.' });

  } catch (error) {
    console.error('Admin Delete Artisan Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete artisan.' }, { status: 500 });
  }
}
