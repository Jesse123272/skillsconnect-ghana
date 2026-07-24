import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const categories = await query(
      'SELECT category_id, category_name, icon_class, description FROM categories WHERE is_active = 1 ORDER BY category_name ASC'
    );

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Fetch Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while loading categories' },
      { status: 500 }
    );
  }
}
