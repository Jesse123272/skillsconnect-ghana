import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');
    const radius = parseFloat(searchParams.get('radius') || '10');
    const categoryId = searchParams.get('category_id');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const hasLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);
    const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;
    const useCategoryFilter = parsedCategoryId !== null && !Number.isNaN(parsedCategoryId);

    if (hasLocation) {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, error: 'Please provide valid latitude and longitude coordinates.' },
          { status: 400 }
        );
      }

      const sql = `
        SELECT
          u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.lat, u.lng,
          ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at,
          c.category_name, c.icon_class,
          (6371 * acos(cos(radians(?)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians(?)) + sin(radians(?)) * sin(radians(u.lat)))) AS distance_km,
          ((1 - ((6371 * acos(cos(radians(?)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians(?)) + sin(radians(?)) * sin(radians(u.lat)))) / ?)) * 0.40 +
          (ap.average_rating / 5) * 0.35 +
          (CASE WHEN ap.total_reviews = 0 THEN 0 ELSE LEAST(ap.total_reviews / 50, 1) END) * 0.15 +
          (CASE WHEN ap.profile_views = 0 THEN 0 ELSE LEAST(ap.profile_views / 200, 1) END) * 0.10) AS weighted_score
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        WHERE u.is_active = 1 AND ap.is_approved = 1 AND u.lat IS NOT NULL AND u.lng IS NOT NULL
          AND (6371 * acos(cos(radians(?)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians(?)) + sin(radians(?)) * sin(radians(u.lat)))) <= ?
        ${useCategoryFilter ? 'AND ap.category_id = ?' : ''}
        ORDER BY weighted_score DESC, distance_km ASC
        LIMIT ?
      `;

      const params = [
        latitude,
        longitude,
        latitude,
        latitude,
        longitude,
        latitude,
        radius,
        latitude,
        longitude,
        latitude,
        radius,
      ];

      if (useCategoryFilter) {
        params.push(parsedCategoryId);
      }
      params.push(limit);

      const artisans = await query(sql, params);
      return NextResponse.json({ success: true, data: artisans || [] });
    }

    const region = searchParams.get('region') || '';
    const regionClause = region ? 'AND u.region = ?' : '';
    const regionParams = region ? [region] : [];
    const artisans = await query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at, c.category_name, c.icon_class, 9999 AS distance_km, 0 AS weighted_score
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       INNER JOIN categories c ON ap.category_id = c.category_id
       WHERE u.is_active = 1 AND ap.is_approved = 1 ${regionClause}
       ORDER BY ap.average_rating DESC, ap.total_reviews DESC
       LIMIT ?`,
      [...regionParams, limit]
    );

    return NextResponse.json({ success: true, data: artisans || [] });
  } catch (error) {
    console.error('Nearby artisans API error:', error);
    return NextResponse.json({ success: false, error: 'Unable to retrieve nearby artisans.' }, { status: 500 });
  }
}
