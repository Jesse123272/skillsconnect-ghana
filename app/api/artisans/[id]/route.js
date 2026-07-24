import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const artisanId = parseInt(id, 10);

    // 1. Validate ID is a positive integer
    if (isNaN(artisanId) || artisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid artisan ID requested' },
        { status: 400 }
      );
    }

    // 2. Fetch primary artisan profile data with active user checks
    const artisans = await query(
      `SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified,
        ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at,
        c.category_name, c.icon_class
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       INNER JOIN categories c ON ap.category_id = c.category_id
       WHERE u.user_id = ? AND u.is_active = 1`,
      [artisanId]
    );

    if (!artisans || artisans.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Artisan profile not found' },
        { status: 404 }
      );
    }

    const artisan = artisans[0];

    // 3. Increment profile_views in artisan_profiles and log the view
    await query('UPDATE artisan_profiles SET profile_views = profile_views + 1 WHERE user_id = ?', [artisanId]);
    artisan.profile_views += 1;

    const currentUser = await getUserFromRequest(req);
    try {
      await query(
        'INSERT INTO profile_view_logs (artisan_id, viewer_id, ip_address) VALUES (?, ?, ?)',
        [artisanId, currentUser?.user_id || null, req.headers.get('x-forwarded-for')?.split(',')[0] || null]
      );
    } catch (logError) {
      console.warn('Unable to log profile view:', logError);
    }

    // 4. Fetch approved reviews with customer details
    const reviews = await query(
      `SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.created_at, u.full_name as customer_name, u.profile_photo as customer_photo
       FROM reviews r
       INNER JOIN users u ON r.customer_id = u.user_id
       WHERE r.artisan_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC`,
      [artisanId]
    );

    // 5. Fetch associated portfolio items
    const portfolio = await query(
      `SELECT item_id, image_path, caption, description, created_at 
       FROM portfolio_items 
       WHERE artisan_id = ? 
       ORDER BY created_at DESC`,
      [artisanId]
    );

    // 6. Fetch gallery images
    const gallery = await query(
      `SELECT gallery_id, image_path, caption, uploaded_at 
       FROM gallery 
       WHERE artisan_id = ? 
       ORDER BY uploaded_at DESC`,
      [artisanId]
    );

    // 7. Check if logged-in customer has saved this artisan
    let isSaved = false;
    const payload = await getUserFromRequest(req);
    if (payload && payload.role === 'customer') {
      const savedCheck = await query(
        'SELECT save_id FROM saved_artisans WHERE customer_id = ? AND artisan_id = ?',
        [payload.user_id, artisanId]
      );
      if (savedCheck && savedCheck.length > 0) {
        isSaved = true;
      }
    }

    // Format service areas
    let areaArray = [];
    if (artisan.service_areas) {
      areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Assemble final structured profile object
    const fullProfile = {
      ...artisan,
      service_areas: areaArray,
      reviews: reviews,
      portfolio: portfolio,
      gallery: gallery,
      is_saved: isSaved
    };

    return NextResponse.json({
      success: true,
      data: fullProfile
    });

  } catch (error) {
    console.error('Fetch Artisan Detail API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving the artisan profile' },
      { status: 500 }
    );
  }
}
