import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req, { params }) {
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
        { success: false, error: 'Only artisans have access to modify portfolios' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio item ID' },
        { status: 400 }
      );
    }

    // Check if the portfolio item exists and belongs to the logged-in artisan
    const items = await query(
      'SELECT item_id, artisan_id FROM portfolio_items WHERE item_id = ?',
      [itemId]
    );

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Portfolio item not found' },
        { status: 404 }
      );
    }

    const item = items[0];

    if (item.artisan_id !== payload.user_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. This portfolio item belongs to another artisan.' },
        { status: 403 }
      );
    }

    // DELETE portfolio item
    await query('DELETE FROM portfolio_items WHERE item_id = ?', [itemId]);

    // Log the deletion action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_PORTFOLIO_ITEM', 'portfolio_items', itemId, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });

  } catch (error) {
    console.error('Delete Portfolio Item API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while deleting the portfolio item' },
      { status: 500 }
    );
  }
}
