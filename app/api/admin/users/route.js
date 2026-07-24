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
    const search = searchParams.get('search') || '';

    const conditions = [];
    const params = [];

    // Optional admin search keyword filter
    if (search.trim() !== '') {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR region LIKE ? OR district LIKE ?)');
      const likeParam = `%${search.trim()}%`;
      params.push(likeParam, likeParam, likeParam, likeParam, likeParam);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count matches
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Fetch paginated user records
    const users = await query(
      `SELECT user_id, full_name, email, phone, role, region, district, is_verified, is_active, last_login, created_at 
       FROM users 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Admin List Users API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving users' },
      { status: 500 }
    );
  }
}
