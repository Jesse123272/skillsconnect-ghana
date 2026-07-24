import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// PUT: Edit testimonial (customer who wrote it only)
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
    const testimonialId = parseInt(id, 10);

    if (isNaN(testimonialId) || testimonialId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid testimonial ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { rating, testimonial_text } = body;
    const parsedRating = parseInt(rating, 10);

    // Validate inputs
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

    // Fetch testimonial to verify ownership
    const testimonials = await query(
      'SELECT testimonial_id, customer_id FROM testimonials WHERE testimonial_id = ?',
      [testimonialId]
    );

    if (!testimonials || testimonials.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    const testimonial = testimonials[0];

    if (testimonial.customer_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to modify this testimonial.' },
        { status: 403 }
      );
    }

    // UPDATE testimonial
    await query(
      'UPDATE testimonials SET rating = ?, testimonial_text = ? WHERE testimonial_id = ?',
      [parsedRating, testimonial_text.trim(), testimonialId]
    );

    // Log update action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'EDIT_TESTIMONIAL', 'testimonials', testimonialId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Testimonial updated successfully'
    });

  } catch (error) {
    console.error('Update Testimonial API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating the testimonial' },
      { status: 500 }
    );
  }
}

// DELETE: Delete testimonial (customer who wrote it or admin)
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
    const testimonialId = parseInt(id, 10);

    if (isNaN(testimonialId) || testimonialId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid testimonial ID' },
        { status: 400 }
      );
    }

    // Fetch testimonial to verify owner or admin
    const testimonials = await query(
      'SELECT testimonial_id, customer_id FROM testimonials WHERE testimonial_id = ?',
      [testimonialId]
    );

    if (!testimonials || testimonials.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    const testimonial = testimonials[0];

    if (testimonial.customer_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Access denied.' },
        { status: 403 }
      );
    }

    // Delete testimonial from DB
    await query('DELETE FROM testimonials WHERE testimonial_id = ?', [testimonialId]);

    // Log deletion action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_TESTIMONIAL', 'testimonials', testimonialId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });

  } catch (error) {
    console.error('Delete Testimonial API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while deleting the testimonial' },
      { status: 500 }
    );
  }
}
