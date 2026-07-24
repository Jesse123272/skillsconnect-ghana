import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: Retrieve own portfolio items for the logged-in artisan
export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'artisan') {
      return NextResponse.json(
        { success: false, error: 'Only artisans have showcase portfolios' },
        { status: 403 }
      );
    }

    const items = await query(
      `SELECT item_id, image_path, caption, description, created_at 
       FROM portfolio_items 
       WHERE artisan_id = ? 
       ORDER BY created_at DESC`,
      [payload.user_id]
    );

    return NextResponse.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Fetch Portfolio API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while loading your portfolio' },
      { status: 500 }
    );
  }
}

// POST: Add a new showcase item to the portfolio
export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (payload.role !== 'artisan') {
      return NextResponse.json(
        { success: false, error: 'Only artisans can contribute to showcasing portfolios' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { image_path, caption, description } = body;

    // Validate inputs
    if (!image_path || image_path.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Showcase work image file is required' },
        { status: 400 }
      );
    }

    // Insert into portfolio_items
    const result = await query(
      `INSERT INTO portfolio_items (artisan_id, image_path, caption, description) 
       VALUES (?, ?, ?, ?)`,
      [
        payload.user_id,
        image_path.trim(),
        caption ? caption.trim() : null,
        description ? description.trim() : null
      ]
    );

    const itemId = result.insertId;

    // Log important actions to activity_logs
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'ADD_PORTFOLIO_ITEM', 'portfolio_items', itemId, ip]
    );

    return NextResponse.json({
      success: true,
      data: {
        item_id: itemId
      }
    });

  } catch (error) {
    console.error('Add Portfolio Item API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while adding portfolio items' },
      { status: 500 }
    );
  }
}
