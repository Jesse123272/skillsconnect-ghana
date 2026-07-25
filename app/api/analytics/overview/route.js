import { NextResponse } from 'next/server';
import { isSqliteFallbackEnabled, query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const useSqliteFallback = isSqliteFallbackEnabled;

    const fetchCount = async (sql) => {
      try {
        const rows = await query(sql);
        return Number(rows?.[0]?.total || 0);
      } catch (error) {
        console.warn('Analytics count query failed, returning zero:', error.message);
        return 0;
      }
    };

    const users = await fetchCount('SELECT COUNT(*) AS total FROM users');
    const artisans = await fetchCount('SELECT COUNT(*) AS total FROM artisan_profiles WHERE is_approved = 1');
    const enquiries = await fetchCount('SELECT COUNT(*) AS total FROM enquiries');
    const reviews = await fetchCount('SELECT COUNT(*) AS total FROM reviews');
    const featured = await fetchCount('SELECT COUNT(*) AS total FROM artisan_profiles WHERE is_featured = 1');
    const recent = await fetchCount(
      useSqliteFallback
        ? "SELECT COUNT(*) AS total FROM profile_view_logs WHERE viewed_at >= datetime('now', '-30 day')"
        : 'SELECT COUNT(*) AS total FROM profile_view_logs WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const monthly = await query(
      useSqliteFallback
        ? `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS value
           FROM users
           WHERE created_at >= datetime('now', '-6 month')
           GROUP BY strftime('%Y-%m', created_at)
           ORDER BY month ASC`
        : `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS value
           FROM users
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
           GROUP BY DATE_FORMAT(created_at, '%Y-%m')
           ORDER BY month ASC`
    );

    return NextResponse.json({
      success: true,
      data: {
        users,
        artisans,
        enquiries,
        reviews,
        featured,
        recentViews: recent,
        monthlySignups: monthly || []
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load analytics.' }, { status: 500 });
  }
}
