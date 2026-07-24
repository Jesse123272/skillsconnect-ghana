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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || 'All'; // All, Approved, Pending, Hidden
    const search = searchParams.get('search') || '';

    const conditions = [];
    const params = [];

    // Search filter (reviewer or artisan name)
    if (search.trim() !== '') {
      conditions.push('(c.full_name LIKE ? OR a.full_name LIKE ?)');
      const lk = `%${search.trim()}%`;
      params.push(lk, lk);
    }

    // Status filter
    if (status === 'Approved') {
      conditions.push('r.is_approved = 1');
    } else if (status === 'Pending' || status === 'Hidden') {
      conditions.push('r.is_approved = 0');
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count all reviews in system
    const countSql = `
      SELECT COUNT(*) as total 
      FROM reviews r
      INNER JOIN users c ON r.customer_id = c.user_id
      INNER JOIN users a ON r.artisan_id = a.user_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Fetch review data with associated customer and artisan names
    const selectSql = `
      SELECT r.review_id, r.customer_id, r.artisan_id, r.rating, r.review_text, r.is_approved, r.created_at, r.updated_at,
             c.full_name as customer_name, c.profile_photo as customer_photo,
             a.full_name as artisan_name, a.profile_photo as artisan_photo
      FROM reviews r
      INNER JOIN users c ON r.customer_id = c.user_id
      INNER JOIN users a ON r.artisan_id = a.user_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const reviews = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Admin List Reviews API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving reviews' },
      { status: 500 }
    );
  }
}
