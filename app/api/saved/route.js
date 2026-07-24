import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: Retrieve list of saved artisans for the logged-in customer
export async function GET(req) {
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
        { success: false, error: 'Only customers can maintain a bookmarked artisan list' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Count total saved artisans
    const countResult = await query(
      'SELECT COUNT(*) as total FROM saved_artisans WHERE customer_id = ?',
      [payload.user_id]
    );
    const total = countResult[0]?.total || 0;

    // Query saved artisans details
    const saved = await query(
      `SELECT sa.save_id, sa.saved_at,
              u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified,
              ap.profile_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.service_areas,
              c.category_name, c.icon_class
       FROM saved_artisans sa
       INNER JOIN users u ON sa.artisan_id = u.user_id
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       INNER JOIN categories c ON ap.category_id = c.category_id
       WHERE sa.customer_id = ? AND u.is_active = 1
       ORDER BY sa.saved_at DESC
       LIMIT ? OFFSET ?`,
      [payload.user_id, limit, offset]
    );

    const formattedSaved = saved.map(item => {
      let areaArray = [];
      if (item.service_areas) {
        areaArray = item.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...item,
        service_areas: areaArray
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        saved_artisans: formattedSaved,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Fetch Saved Artisans API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while fetching your saved list' },
      { status: 500 }
    );
  }
}

// POST: Save or unsave (toggle) an artisan profile
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
        { success: false, error: 'Only customers can save or bookmark artisans' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artisan_id } = body;
    const parsedArtisanId = parseInt(artisan_id, 10);

    if (isNaN(parsedArtisanId) || parsedArtisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid artisan ID is required' },
        { status: 400 }
      );
    }

    // 1. Check if the target user is actually an artisan and active
    const artisanCheck = await query(
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'artisan' AND is_active = 1",
      [parsedArtisanId]
    );

    if (!artisanCheck || artisanCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The specified artisan is inactive or does not exist' },
        { status: 404 }
      );
    }

    // 2. Check if already saved in DB
    const existingCheck = await query(
      'SELECT save_id FROM saved_artisans WHERE customer_id = ? AND artisan_id = ?',
      [payload.user_id, parsedArtisanId]
    );

    let isSaved = false;

    if (existingCheck && existingCheck.length > 0) {
      // Already saved -> DELETE to unsave
      await query(
        'DELETE FROM saved_artisans WHERE customer_id = ? AND artisan_id = ?',
        [payload.user_id, parsedArtisanId]
      );
      isSaved = false;
    } else {
      // Not saved -> INSERT to save
      await query(
        'INSERT INTO saved_artisans (customer_id, artisan_id) VALUES (?, ?)',
        [payload.user_id, parsedArtisanId]
      );
      isSaved = true;
    }

    // 3. Log toggle action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, isSaved ? 'SAVE_ARTISAN' : 'UNSAVE_ARTISAN', 'users', parsedArtisanId, ip]
    );

    return NextResponse.json({
      success: true,
      data: {
        saved: isSaved
      }
    });

  } catch (error) {
    console.error('Toggle Save Artisan API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
