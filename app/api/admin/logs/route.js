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
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const actionFilter = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const conditions = [];
    const params = [];

    // Search by user name or IP or entity type
    if (search.trim() !== '') {
      conditions.push('(u.full_name LIKE ? OR al.ip_address LIKE ? OR al.entity_type LIKE ?)');
      const lk = `%${search.trim()}%`;
      params.push(lk, lk, lk);
    }

    // Filter by action
    if (actionFilter !== '') {
      conditions.push('al.action = ?');
      params.push(actionFilter);
    }

    // Date range
    if (startDate !== '') {
      conditions.push('al.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate !== '') {
      conditions.push('al.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count records
    const countSql = `
      SELECT COUNT(*) as total 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Fetch logs
    const selectSql = `
      SELECT al.log_id, al.action, al.entity_type, al.entity_id, al.ip_address, al.created_at,
             u.full_name as user_name, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Admin Fetch Activity Logs Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity logs.' }, { status: 500 });
  }
}
