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

    // 1. Total users
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0]?.count || 0;

    // 2. Total customers
    const totalCustomersResult = await query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalCustomers = totalCustomersResult[0]?.count || 0;

    // 3. Approved artisans
    const approvedArtisansResult = await query("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 1");
    const approvedArtisans = approvedArtisansResult[0]?.count || 0;

    // 4. Pending artisans
    const pendingArtisansResult = await query("SELECT COUNT(*) as count FROM artisan_profiles WHERE is_approved = 0");
    const pendingArtisans = pendingArtisansResult[0]?.count || 0;

    // 5. Total categories
    const totalCategoriesResult = await query("SELECT COUNT(*) as count FROM categories WHERE is_active = 1");
    const totalCategories = totalCategoriesResult[0]?.count || 0;

    // 6. Total enquiries
    const totalEnquiriesResult = await query("SELECT COUNT(*) as count FROM enquiries");
    const totalEnquiries = totalEnquiriesResult[0]?.count || 0;

    // 7. Total revenue (sum of successful transactions)
    const totalRevenueResult = await query("SELECT SUM(amount) as sum FROM transactions WHERE status = 'success'");
    const totalRevenue = parseFloat(totalRevenueResult[0]?.sum || '0.00');

    // 8. Popular trade categories metrics
    const popularCategories = await query(
      `SELECT c.category_name, COUNT(ap.profile_id) as artisan_count, AVG(ap.average_rating) as avg_rating
       FROM categories c
       LEFT JOIN artisan_profiles ap ON c.category_id = ap.category_id
       GROUP BY c.category_id, c.category_name
       ORDER BY artisan_count DESC
       LIMIT 5`
    );

    // 9. Popular geographical regions metrics
    const popularRegions = await query(
      `SELECT region, COUNT(*) as user_count 
       FROM users 
       WHERE region IS NOT NULL AND region != ''
       GROUP BY region 
       ORDER BY user_count DESC 
       LIMIT 5`
    );

    // 10. Recent system audit/activity logs (limit 10)
    const recentLogs = await query(
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
