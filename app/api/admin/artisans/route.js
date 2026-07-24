import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'All'; // All, Pending, Approved, Suspended
    const category_id = searchParams.get('category_id') || '';
    const region = searchParams.get('region') || '';

    const conditions = ["u.role = 'artisan'"];
    const params = [];

    // Search filter
    if (search.trim() !== '') {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.district LIKE ?)');
      const lk = `%${search.trim()}%`;
      params.push(lk, lk, lk, lk);
    }

    // Status filter
    if (status === 'Pending') {
      conditions.push('ap.is_approved = 0 AND u.is_active = 1');
    } else if (status === 'Approved') {
      conditions.push('ap.is_approved = 1 AND u.is_active = 1');
    } else if (status === 'Suspended') {
      conditions.push('u.is_active = 0');
    }

    // Category filter
    if (category_id !== '') {
      const parsedCat = parseInt(category_id, 10);
      if (!isNaN(parsedCat)) {
        conditions.push('ap.category_id = ?');
        params.push(parsedCat);
      }
    }

    // Region filter
    if (region !== '') {
      conditions.push('u.region = ?');
      params.push(region);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count all matches
    const countSql = `
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN artisan_profiles ap ON u.user_id = ap.user_id
      LEFT JOIN categories c ON ap.category_id = c.category_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Fetch records
    const selectSql = `
      SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.is_active, u.is_verified, u.created_at,
        ap.profile_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.is_approved, ap.is_featured,
        c.category_name, c.category_id
      FROM users u
      LEFT JOIN artisan_profiles ap ON u.user_id = ap.user_id
      LEFT JOIN categories c ON ap.category_id = c.category_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const artisans = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        artisans,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Admin Fetch Artisans Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching artisans.' },
      { status: 500 }
    );
  }
}
