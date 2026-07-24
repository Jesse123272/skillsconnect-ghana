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

    const users = await query(
      `SELECT user_id, full_name, email, phone, role, region, district, profile_photo, preferences, is_verified, is_active, last_login, created_at 
       FROM users WHERE user_id = ?`,
      [payload.user_id]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.is_active !== 1) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // If artisan, join with artisan_profiles and categories
    if (user.role === 'artisan') {
      const profiles = await query(
        `SELECT ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, c.category_name, c.icon_class
         FROM artisan_profiles ap
         LEFT JOIN categories c ON ap.category_id = c.category_id
         WHERE ap.user_id = ?`,
        [user.user_id]
      );
      
      if (profiles && profiles.length > 0) {
        user.artisan_profile = profiles[0];
      } else {
        user.artisan_profile = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Current User API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
