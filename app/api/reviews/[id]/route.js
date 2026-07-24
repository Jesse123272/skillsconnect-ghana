import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// PUT: Edit review (customer who wrote it only)
export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { rating, review_text } = body;
    const parsedRating = parseInt(rating, 10);

    // Validate inputs
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (!review_text || review_text.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Review comments cannot be empty' },
        { status: 400 }
      );
    }

    // Fetch the review to verify ownership
    const reviews = await query(
      'SELECT review_id, customer_id, artisan_id FROM reviews WHERE review_id = ?',
      [reviewId]
    );

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = reviews[0];

    if (review.customer_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to modify this review.' },
        { status: 403 }
      );
    }

    // UPDATE the review
    await query(
      'UPDATE reviews SET rating = ?, review_text = ? WHERE review_id = ?',
      [parsedRating, review_text.trim(), reviewId]
    );

    // Recalculate average_rating and total_reviews for artisan profile
    const statsResult = await query(
      'SELECT COUNT(*) as total_reviews, AVG(rating) as average_rating FROM reviews WHERE artisan_id = ? AND is_approved = 1',
      [review.artisan_id]
    );

    const totalReviews = statsResult[0]?.total_reviews || 0;
    const averageRating = parseFloat(statsResult[0]?.average_rating || '0.00');

    await query(
      'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
      [averageRating, totalReviews, review.artisan_id]
    );

    // Log update action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'EDIT_REVIEW', 'reviews', reviewId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: {
        average_rating: averageRating,
        total_reviews: totalReviews
      }
    });

  } catch (error) {
    console.error('Update Review API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating the review' },
      { status: 500 }
    );
  }
}

// DELETE: Delete review (customer who wrote it or admin)
export async function DELETE(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // Fetch review to verify owner or admin
    const reviews = await query(
      'SELECT review_id, customer_id, artisan_id FROM reviews WHERE review_id = ?',
      [reviewId]
    );

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const review = reviews[0];

    if (review.customer_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Access denied.' },
        { status: 403 }
      );
    }

    // Delete review from DB
    await query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    // Recalculate average_rating and total_reviews for artisan profile
    const statsResult = await query(
      'SELECT COUNT(*) as total_reviews, AVG(rating) as average_rating FROM reviews WHERE artisan_id = ? AND is_approved = 1',
      [review.artisan_id]
    );

    const totalReviews = statsResult[0]?.total_reviews || 0;
    const averageRating = parseFloat(statsResult[0]?.average_rating || '0.00');

    await query(
      'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
      [averageRating, totalReviews, review.artisan_id]
    );

    // Log deletion action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_REVIEW', 'reviews', reviewId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        average_rating: averageRating,
        total_reviews: totalReviews
      }
    });

  } catch (error) {
    console.error('Delete Review API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while deleting the review' },
      { status: 500 }
    );
  }
}
