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

    let user = null;

    try {
      const users = await query(
        `SELECT user_id, full_name, email, phone, role, region, district, profile_photo, lat, lng, preferences, is_verified, is_active, last_login, created_at 
         FROM users WHERE user_id = ? AND email = ?`,
        [payload.user_id, payload.email]
      );

      if (!users || users.length === 0) {
        user = {
          user_id: payload.user_id,
          full_name: payload.full_name || payload.email || 'User',
          email: payload.email,
          role: payload.role || 'customer',
          is_verified: 1,
          is_active: 1,
        };
      } else {
        user = users[0];
      }
    } catch (error) {
      console.warn('Auth me user lookup failed, falling back to token payload:', error?.message || error);
      user = {
        user_id: payload.user_id,
        full_name: payload.full_name || payload.email || 'User',
        email: payload.email,
        role: payload.role || 'customer',
        is_verified: 1,
        is_active: 1,
      };
    }

    if (user.is_active !== 1) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    if (user.role === 'artisan') {
      try {
        const profiles = await query(
          `SELECT ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.starting_price, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, c.category_name, c.icon_class
           FROM artisan_profiles ap
           LEFT JOIN categories c ON ap.category_id = c.category_id
           WHERE ap.user_id = ?`,
          [user.user_id]
        );

        user.artisan_profile = profiles && profiles.length > 0 ? profiles[0] : null;
      } catch (error) {
        console.warn('Auth me artisan profile lookup failed:', error?.message || error);
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
