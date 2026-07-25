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

    const safeCount = async (sql, fallback = 0) => {
      try {
        const result = await query(sql);
        return Number(result?.[0]?.count ?? result?.[0]?.sum ?? fallback) || fallback;
      } catch (error) {
        console.warn('Dashboard metric query failed:', error?.message || error);
        return fallback;
      }
    };

    const safeRows = async (sql, fallback = []) => {
      try {
        const result = await query(sql);
        return Array.isArray(result) ? result : fallback;
      } catch (error) {
        console.warn('Dashboard rows query failed:', error?.message || error);
        return fallback;
      }
    };

    // 1. Total users
    const totalUsers = await safeCount('SELECT COUNT(*) as count FROM users');

    // 2. Total customers
    const totalCustomers = await safeCount("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");

    // 3. Approved artisans
    const approvedArtisans = await safeCount("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 1");

    // 4. Pending artisans
    const pendingArtisans = await safeCount("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 0");

    // 5. Total categories
    const totalCategories = await safeCount("SELECT COUNT(*) as count FROM categories WHERE is_active = 1");

    // 6. Total enquiries
    const totalEnquiries = await safeCount("SELECT COUNT(*) as count FROM enquiries");

    // 7. Total revenue (sum of successful transactions)
    const totalRevenue = await safeCount("SELECT SUM(amount) as sum FROM transactions WHERE status = 'success'", 0);

    // 8. Popular trade categories metrics
    const popularCategories = await safeRows(
      `SELECT c.category_name, COUNT(ap.profile_id) as artisan_count, AVG(ap.average_rating) as avg_rating
       FROM categories c
       LEFT JOIN artisan_profiles ap ON c.category_id = ap.category_id
       GROUP BY c.category_id, c.category_name
       ORDER BY artisan_count DESC
       LIMIT 5`
    );

    // 9. Popular geographical regions metrics
    const popularRegions = await safeRows(
      `SELECT region, COUNT(*) as user_count 
       FROM users 
       WHERE region IS NOT NULL AND region != ''
       GROUP BY region 
       ORDER BY user_count DESC 
       LIMIT 5`
    );

    // 10. Recent system audit/activity logs (limit 10)
    const recentLogs = await safeRows(
      `SELECT al.log_id, al.action, al.entity_type, al.entity_id, al.ip_address, al.created_at, u.full_name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.user_id
       ORDER BY al.created_at DESC
       LIMIT 10`
    );

    const statsData = {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        approved_artisans: approvedArtisans,
        pending_artisans: pendingArtisans
      },
      categoriesCount: totalCategories,
      enquiriesCount: totalEnquiries,
      revenueGHS: totalRevenue,
      popularCategories,
      popularRegions,
      recentActivity: recentLogs
    };

    return NextResponse.json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('Fetch Dashboard Stats API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while building metrics' },
      { status: 500 }
    );
  }
}
