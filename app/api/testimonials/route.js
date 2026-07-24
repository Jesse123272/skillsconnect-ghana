import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: Fetch testimonials (public approved list, or user's own testimonials if authenticated)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === 'true';
    const limitVal = searchParams.get('limit');
    const limit = limitVal ? parseInt(limitVal, 10) : null;

    if (mine) {
      const payload = await getUserFromRequest(req);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please log in.' },
          { status: 401 }
        );
      }

      let queryStr = `
        SELECT t.testimonial_id, t.customer_id, t.rating, t.testimonial_text, t.status, t.created_at,
               u.full_name as customer_name, u.profile_photo as customer_photo
        FROM testimonials t
        INNER JOIN users u ON t.customer_id = u.user_id
        WHERE t.customer_id = ?
        ORDER BY t.created_at DESC
      `;
      let queryParams = [payload.user_id];

      if (limit) {
        queryStr += ' LIMIT ?';
        queryParams.push(limit);
      }

      const userTestimonials = await query(queryStr, queryParams);
      return NextResponse.json({
        success: true,
        data: userTestimonials
      });
    }

    // Public list of approved testimonials
    let queryStr = `
      SELECT t.testimonial_id, t.customer_id, t.rating, t.testimonial_text, t.status, t.created_at,
             u.full_name as customer_name, u.profile_photo as customer_photo
      FROM testimonials t
      INNER JOIN users u ON t.customer_id = u.user_id
      WHERE t.status = 'approved'
      ORDER BY t.created_at DESC
    `;
    let queryParams = [];

    if (limit) {
      queryStr += ' LIMIT ?';
      queryParams.push(limit);
    }

    const approvedTestimonials = await query(queryStr, queryParams);
    return NextResponse.json({
      success: true,
      data: approvedTestimonials
    });

  } catch (error) {
    console.error('Fetch Testimonials API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving testimonials' },
      { status: 500 }
    );
  }
}

// POST: Submit a new testimonial
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
        { success: false, error: 'Only customers can submit testimonials.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rating, testimonial_text } = body;

    const parsedRating = parseInt(rating, 10);

    // Validation
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (!testimonial_text || testimonial_text.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Testimonial comments must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (testimonial_text.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Testimonial comments cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Insert new testimonial
    const insertResult = await query(
      `INSERT INTO testimonials (customer_id, rating, testimonial_text, status) 
       VALUES (?, ?, ?, 'approved')`,
      [payload.user_id, parsedRating, testimonial_text.trim()]
    );
    const testimonialId = insertResult.insertId;

    // Log action to activity_logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'SUBMIT_TESTIMONIAL', 'testimonials', testimonialId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Testimonial submitted successfully!',
      data: {
        testimonial_id: testimonialId,
        rating: parsedRating,
        testimonial_text: testimonial_text.trim()
      }
    });

  } catch (error) {
    console.error('Submit Testimonial API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while saving your testimonial' },
      { status: 500 }
    );
  }
}
