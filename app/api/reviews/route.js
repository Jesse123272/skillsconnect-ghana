import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { sendEmail, reviewNotificationEmail } from '@/lib/mailer';

// GET: Get reviews for an artisan (public) or overall testimonials if no artisan_id specified
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const artisan_id = searchParams.get('artisan_id');
    const mine = searchParams.get('mine') === 'true';
    const user_id = searchParams.get('user_id');
    const limitVal = searchParams.get('limit');
    const limit = limitVal ? parseInt(limitVal, 10) : null;

    if (mine || user_id === 'me') {
      const payload = await getUserFromRequest(req);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please log in.' },
          { status: 401 }
        );
      }

      let queryStr = '';
      let queryParams = [];

      if (payload.role === 'artisan') {
        queryStr = `
          SELECT r.review_id, r.customer_id, r.artisan_id, r.rating, r.review_text, r.is_approved, r.created_at, r.updated_at,
                 u.full_name as customer_name, u.profile_photo as customer_photo,
                 a.full_name as artisan_name, a.profile_photo as artisan_photo,
                 ap.category_id, c.category_name
          FROM reviews r
          INNER JOIN users u ON r.customer_id = u.user_id
          INNER JOIN users a ON r.artisan_id = a.user_id
          LEFT JOIN artisan_profiles ap ON a.user_id = ap.user_id
          LEFT JOIN categories c ON ap.category_id = c.category_id
          WHERE r.artisan_id = ?
          ORDER BY r.created_at DESC
        `;
        queryParams = [payload.user_id];
      } else {
        queryStr = `
          SELECT r.review_id, r.customer_id, r.artisan_id, r.rating, r.review_text, r.is_approved, r.created_at, r.updated_at,
                 u.full_name as customer_name, u.profile_photo as customer_photo,
                 a.full_name as artisan_name, a.profile_photo as artisan_photo,
                 ap.category_id, c.category_name
          FROM reviews r
          INNER JOIN users u ON r.customer_id = u.user_id
          INNER JOIN users a ON r.artisan_id = a.user_id
          LEFT JOIN artisan_profiles ap ON a.user_id = ap.user_id
          LEFT JOIN categories c ON ap.category_id = c.category_id
          WHERE r.customer_id = ?
          ORDER BY r.created_at DESC
        `;
        queryParams = [payload.user_id];
      }

      if (limit) {
        queryStr += ' LIMIT ?';
        queryParams.push(limit);
      }
      const myReviews = await query(queryStr, queryParams);
      return NextResponse.json({
        success: true,
        data: myReviews
      });
    }

    if (!artisan_id) {
      // Return 3 overall most recent approved reviews for homepage testimonials
      const generalReviews = await query(
        `SELECT r.review_id, r.customer_id, r.artisan_id, r.rating, r.review_text, r.is_approved, r.created_at, r.updated_at,
                u.full_name as customer_name, u.profile_photo as customer_photo,
                a.full_name as artisan_name
         FROM reviews r
         INNER JOIN users u ON r.customer_id = u.user_id
         INNER JOIN users a ON r.artisan_id = a.user_id
         WHERE r.is_approved = 1
         ORDER BY r.created_at DESC
         LIMIT 3`
      );
      return NextResponse.json({
        success: true,
        data: generalReviews
      });
    }

    const parsedArtisanId = parseInt(artisan_id, 10);
    if (isNaN(parsedArtisanId) || parsedArtisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid artisan ID is required' },
        { status: 400 }
      );
    }

    const reviews = await query(
      `SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.is_approved, r.created_at, r.updated_at,
              u.full_name as customer_name, u.profile_photo as customer_photo
       FROM reviews r
       INNER JOIN users u ON r.customer_id = u.user_id
       WHERE r.artisan_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC`,
      [parsedArtisanId]
    );

    return NextResponse.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Fetch Reviews API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving reviews' },
      { status: 500 }
    );
  }
}

// POST: Submit a review
export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'customer') {
      return NextResponse.json(
        { success: false, error: 'Only customers can submit reviews' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artisan_id, rating, review_text } = body;

    const parsedArtisanId = parseInt(artisan_id, 10);
    const parsedRating = parseInt(rating, 10);

    // Validation
    if (isNaN(parsedArtisanId) || parsedArtisanId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid artisan ID is required' },
        { status: 400 }
      );
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (!review_text || review_text.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Review comment is required' },
        { status: 400 }
      );
    }

    // 1. Check if customer has sent at least one enquiry to this artisan (to prevent cold spam reviews)
    const enquiryCheck = await query(
      'SELECT enquiry_id FROM enquiries WHERE customer_id = ? AND artisan_id = ? LIMIT 1',
      [payload.user_id, parsedArtisanId]
    );

    if (!enquiryCheck || enquiryCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You can only review artisans with whom you have initiated an enquiry interaction' },
        { status: 400 }
      );
    }

    // 2. Check no existing review (UNIQUE key customer_id + artisan_id)
    const existingCheck = await query(
      'SELECT review_id FROM reviews WHERE customer_id = ? AND artisan_id = ? LIMIT 1',
      [payload.user_id, parsedArtisanId]
    );

    if (existingCheck && existingCheck.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a review for this artisan. Please edit your existing review.' },
        { status: 400 }
      );
    }

    // 3. Insert new review (is_approved default=1 for instant publishing)
    const insertResult = await query(
      `INSERT INTO reviews (customer_id, artisan_id, rating, review_text, is_approved) 
       VALUES (?, ?, ?, ?, 1)`,
      [payload.user_id, parsedArtisanId, parsedRating, review_text.trim()]
    );
    const reviewId = insertResult.insertId;

    // 4. Recalculate average_rating and total_reviews for artisan profile
    const statsResult = await query(
      'SELECT COUNT(*) as total_reviews, AVG(rating) as average_rating FROM reviews WHERE artisan_id = ? AND is_approved = 1',
      [parsedArtisanId]
    );

    const totalReviews = statsResult[0]?.total_reviews || 0;
    const averageRating = parseFloat(statsResult[0]?.average_rating || '0.00');

    await query(
      'UPDATE artisan_profiles SET average_rating = ?, total_reviews = ? WHERE user_id = ?',
      [averageRating, totalReviews, parsedArtisanId]
    );

    // Fetch artisan details
    const artisans = await query('SELECT full_name, email FROM users WHERE user_id = ?', [parsedArtisanId]);
    const artisanName = artisans[0]?.full_name;
    const artisanEmail = artisans[0]?.email;

    // 5. Create notification for artisan
    const starsText = '★'.repeat(parsedRating) + '☆'.repeat(5 - parsedRating);
    const notificationMsg = `${payload.full_name} left you a ${parsedRating}-star review (${starsText}): "${review_text.trim().substring(0, 50)}${review_text.trim().length > 50 ? '...' : ''}"`;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link) 
       VALUES (?, 'review', 'New Profile Review 🌟', ?, '/dashboard')`,
      [parsedArtisanId, notificationMsg]
    );

    // 6. Send email notification to artisan via mailer
    if (artisanEmail) {
      try {
        const emailHtml = reviewNotificationEmail(artisanName, payload.full_name, parsedRating);
        await sendEmail({
          to: artisanEmail,
          subject: `Congratulations! New ${parsedRating}-Star Review on SkillsConnect Ghana 🌟`,
          html: emailHtml
        });
      } catch (emailError) {
        console.error('Review email notification delivery failed:', emailError);
      }
    }

    // 7. Log action to activity_logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'SUBMIT_REVIEW', 'reviews', reviewId, ip]
    );

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        average_rating: averageRating,
        total_reviews: totalReviews
      }
    });

  } catch (error) {
    console.error('Submit Review API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while saving your review' },
      { status: 500 }
    );
  }
}
