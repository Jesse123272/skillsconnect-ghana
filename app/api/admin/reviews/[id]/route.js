import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid Review ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body; // 'approve', 'hide'

    if (action === 'approve') {
      await query('UPDATE reviews SET is_approved = 1 WHERE review_id = ?', [reviewId]);
    } else if (action === 'hide') {
      await query('UPDATE reviews SET is_approved = 0 WHERE review_id = ?', [reviewId]);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }

    // Recalculate average rating and total reviews for this artisan
    const reviewData = await query('SELECT artisan_id FROM reviews WHERE review_id = ?', [reviewId]);
    if (reviewData && reviewData.length > 0) {
      const artisanId = reviewData[0].artisan_id;
      const stats = await query(
        `SELECT COUNT(*) as count, AVG(rating) as avg_rating 
         FROM reviews 
         WHERE artisan_id = ? AND is_approved = 1`,
        [artisanId]
      );
      const totalCount = stats[0]?.count || 0;
      const avgRating = stats[0]?.avg_rating || 0.0;

      await query(
        'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
        [avgRating, totalCount, artisanId]
      );
    }

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, action === 'approve' ? 'APPROVE_REVIEW' : 'HIDE_REVIEW', 'reviews', reviewId, ip]
    );

    return NextResponse.json({ success: true, message: `Review ${action === 'approve' ? 'approved' : 'hidden'} successfully.` });

  } catch (error) {
    console.error('Admin Moderation Review Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update review.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid Review ID.' }, { status: 400 });
    }

    // Get artisan_id before deleting
    const reviewData = await query('SELECT artisan_id FROM reviews WHERE review_id = ?', [reviewId]);
    const artisanId = reviewData[0]?.artisan_id;

    await query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    if (artisanId) {
      const stats = await query(
        `SELECT COUNT(*) as count, AVG(rating) as avg_rating 
         FROM reviews 
         WHERE artisan_id = ? AND is_approved = 1`,
         [artisanId]
      );
      const totalCount = stats[0]?.count || 0;
      const avgRating = stats[0]?.avg_rating || 0.0;

      await query(
        'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
        [avgRating, totalCount, artisanId]
      );
    }

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_REVIEW', 'reviews', reviewId, ip]
    );

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' });

  } catch (error) {
    console.error('Admin Delete Review Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete review.' }, { status: 500 });
  }
}
