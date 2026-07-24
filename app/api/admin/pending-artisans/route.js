import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
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

    // Select pending artisan profiles along with core user account and trade category details
    const pendingArtisans = await query(
      `SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.created_at as registered_at,
        ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.service_areas, ap.created_at as profile_created_at,
        c.category_name, c.icon_class
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       INNER JOIN categories c ON ap.category_id = c.category_id
       WHERE ap.is_approved = 0 AND u.is_active = 1
       ORDER BY ap.created_at ASC`
    );

    const formattedArtisans = pendingArtisans.map(artisan => {
      let areaArray = [];
      if (artisan.service_areas) {
        areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...artisan,
        service_areas: areaArray
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedArtisans
    });

  } catch (error) {
    console.error('Fetch Pending Artisans API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
