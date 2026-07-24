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
    const status = searchParams.get('status') || 'All'; // All, pending, replied
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const conditions = [];
    const params = [];

    // Search filter
    if (search.trim() !== '') {
      conditions.push('(c.full_name LIKE ? OR a.full_name LIKE ? OR e.subject LIKE ?)');
      const lk = `%${search.trim()}%`;
      params.push(lk, lk, lk);
    }

    // Status filter
    if (status !== 'All') {
      conditions.push('e.status = ?');
      params.push(status.toLowerCase());
    }

    // Date range filters
    if (startDate !== '') {
      conditions.push('e.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate !== '') {
      conditions.push('e.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Enquiries Stats
    const totalResult = await query('SELECT COUNT(*) as count FROM enquiries');
    const totalCount = totalResult[0]?.count || 0;

    const pendingResult = await query('SELECT COUNT(*) as count FROM enquiries WHERE status = "pending"');
    const pendingCount = pendingResult[0]?.count || 0;

    const repliedResult = await query('SELECT COUNT(*) as count FROM enquiries WHERE status = "replied"');
    const repliedCount = repliedResult[0]?.count || 0;

    const thisMonthResult = await query('SELECT COUNT(*) as count FROM enquiries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const thisMonthCount = thisMonthResult[0]?.count || 0;

    // Fetch total records for pagination
    const countSql = `
      SELECT COUNT(*) as total 
      FROM enquiries e
      INNER JOIN users c ON e.customer_id = c.user_id
      INNER JOIN users a ON e.artisan_id = a.user_id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const totalFiltered = countResult[0]?.total || 0;

    // Fetch records
    const selectSql = `
      SELECT e.enquiry_id, e.customer_id, e.artisan_id, e.subject, e.message, e.status, e.created_at,
             c.full_name as customer_name, a.full_name as artisan_name
      FROM enquiries e
      INNER JOIN users c ON e.customer_id = c.user_id
      INNER JOIN users a ON e.artisan_id = a.user_id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const enquiries = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        enquiries,
        total: totalFiltered,
        page,
        totalPages: Math.ceil(totalFiltered / limit),
        perPage: limit,
        stats: {
          total: totalCount,
          pending: pendingCount,
          replied: repliedCount,
          thisMonth: thisMonthCount
        }
      }
    });

  } catch (error) {
    console.error('Admin Fetch Enquiries Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch enquiries.' }, { status: 500 });
  }
}
