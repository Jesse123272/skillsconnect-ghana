import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: List transactions (authenticated user sees own, admin sees all)
export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'success', 'failed'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    // Filter by role: non-admins can only view their own transactions or transactions made to them
    if (payload.role === 'artisan') {
      conditions.push('(t.user_id = ? OR t.metadata LIKE ?)');
      params.push(payload.user_id, `%"artisan_id":${payload.user_id}%`);
    } else if (payload.role !== 'admin') {
      conditions.push('t.user_id = ?');
      params.push(payload.user_id);
    }

    // Filter by status if specified
    if (status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count records
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Select transaction logs with user associations
    const transactions = await query(
      `SELECT t.transaction_id, t.user_id, t.reference, t.amount, t.currency, t.channel, t.status, t.created_at, t.verified_at,
              u.full_name as user_name, u.email as user_email
       FROM transactions t
       INNER JOIN users u ON t.user_id = u.user_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('List Payments History API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving transaction logs' },
      { status: 500 }
    );
  }
}
