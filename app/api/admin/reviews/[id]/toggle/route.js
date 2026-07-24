import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req, { params }) {
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
        { success: false, error: 'Access denied. Admin authorization required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID parameter' },
        { status: 400 }
      );
    }

    // Retrieve the target review
    const reviews = await query(
      'SELECT review_id, artisan_id, is_approved FROM reviews WHERE review_id = ?',
      [reviewId]
    );

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = reviews[0];
    const toggledStatus = review.is_approved === 1 ? 0 : 1;

    // Toggle the review approval status in reviews table
    await query('UPDATE reviews SET is_approved = ? WHERE review_id = ?', [toggledStatus, reviewId]);

    // Recalculate average_rating and total_reviews from is_approved = 1 reviews only
    const statsResult = await query(
      'SELECT COUNT(*) as total_reviews, AVG(rating) as average_rating FROM reviews WHERE artisan_id = ? AND is_approved = 1',
      [review.artisan_id]
    );

    const totalReviews = statsResult[0]?.total_reviews || 0;
    const averageRating = parseFloat(statsResult[0]?.average_rating || '0.00');

    // Update the artisan profile stats
    await query(
      'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
      [averageRating, totalReviews, review.artisan_id]
    );

    // Log the toggle action
    const actionName = toggledStatus === 1 ? 'APPROVE_REVIEW' : 'UNAPPROVE_REVIEW';
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, actionName, 'reviews', reviewId, ip]
    );

    return NextResponse.json({
      success: true,
      message: `Review approval status has been toggled to ${toggledStatus === 1 ? 'approved' : 'unapproved'}`,
      data: {
        is_approved: toggledStatus,
        average_rating: averageRating,
        total_reviews: totalReviews
      }
    });

  } catch (error) {
    console.error('Toggle Review Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating review status' },
      { status: 500 }
    );
  }
}
