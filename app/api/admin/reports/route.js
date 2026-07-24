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

    // 1. Chart 1: Registrations by Month (Last 12 Months)
    const registrations12m = await query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count, MIN(created_at) as first_date
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY first_date ASC`
    );

    // 2. Chart 2: Enquiries by Month (Last 12 Months)
    const enquiries12m = await query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count, MIN(created_at) as first_date
       FROM enquiries
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY first_date ASC`
    );

    // 3. Chart 3: Doughnut — Artisans by Category
    const artisansByCategory = await query(
      `SELECT c.category_name, COUNT(ap.profile_id) as count
       FROM categories c
       LEFT JOIN artisan_profiles ap ON c.category_id = ap.category_id
       GROUP BY c.category_id, c.category_name
       ORDER BY count DESC`
    );

    // 4. Chart 4: Bar chart — Reviews by Rating (1-star to 5-star distribution)
    const reviewRatings = await query(
      `SELECT FLOOR(rating) as rating, COUNT(*) as count
       FROM reviews
       GROUP BY rating
       ORDER BY rating ASC`
    );

    // 5. Chart 5: Bar chart — Top 10 Most Viewed Artisan Profiles
    const topViewedArtisans = await query(
      `SELECT u.full_name, ap.profile_views
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       ORDER BY ap.profile_views DESC
       LIMIT 10`
    );

    // 6. Chart 6: Horizontal bar — Artisans by Region
    const artisansByRegion = await query(
      `SELECT region, COUNT(*) as count
       FROM users
       WHERE role = 'artisan' AND region IS NOT NULL AND region != ''
       GROUP BY region
       ORDER BY count DESC`
    );

    // 7. Summary Table: Top 5 Highest Rated Artisans (name, category, rating, reviews)
    const topRatedArtisans = await query(
      `SELECT u.full_name, c.category_name, ap.average_rating, ap.total_reviews
       FROM users u
       INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
       INNER JOIN categories c ON ap.category_id = c.category_id
       WHERE ap.is_approved = 1
       ORDER BY ap.average_rating DESC, ap.total_reviews DESC
       LIMIT 5`
    );

    // 8. Summary Table: Top 5 Most Active Customers (name, enquiries sent, reviews written)
    const activeCustomers = await query(
      `SELECT u.full_name,
              (SELECT COUNT(*) FROM enquiries WHERE customer_id = u.user_id) as enquiries_count,
              (SELECT COUNT(*) FROM reviews WHERE customer_id = u.user_id) as reviews_count
       FROM users u
       WHERE u.role = 'customer'
       ORDER BY (enquiries_count + reviews_count) DESC
       LIMIT 5`
    );

    // Dynamic month calculations
    const last12MonthsLabels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      last12MonthsLabels.push(label);
    }

    const regMap = {};
    registrations12m.forEach(item => { regMap[item.month] = item.count; });
    const regData = last12MonthsLabels.map(label => regMap[label] || 0);

    const enqMap = {};
    enquiries12m.forEach(item => { enqMap[item.month] = item.count; });
    const enqData = last12MonthsLabels.map(label => enqMap[label] || 0);

    // Format star distribution
    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-star to 5-star
    reviewRatings.forEach(item => {
      const star = parseInt(item.rating, 10);
      if (star >= 1 && star <= 5) {
        ratingDistribution[star - 1] = item.count;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        registrations_chart: {
          labels: last12MonthsLabels,
          data: regData
        },
        enquiries_chart: {
          labels: last12MonthsLabels,
          data: enqData
        },
        category_distribution: {
          labels: artisansByCategory.map(item => item.category_name),
          data: artisansByCategory.map(item => item.count)
        },
        ratings_distribution: {
          labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
          data: ratingDistribution
        },
        top_viewed: {
          labels: topViewedArtisans.map(item => item.full_name),
          data: topViewedArtisans.map(item => item.profile_views)
        },
        region_distribution: {
          labels: artisansByRegion.map(item => item.region),
          data: artisansByRegion.map(item => item.count)
        },
        top_rated_artisans: topRatedArtisans,
        most_active_customers: activeCustomers
      }
    });

  } catch (error) {
    console.error('Admin Fetch Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to build analytics reports.' }, { status: 500 });
  }
}
