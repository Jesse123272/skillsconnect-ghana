import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await query(
      `SELECT c.category_id, c.category_name, c.icon_class, c.description, c.is_active, c.created_at,
              COUNT(ap.profile_id) as artisan_count
       FROM categories c
       LEFT JOIN artisan_profiles ap ON c.category_id = ap.category_id
       GROUP BY c.category_id
       ORDER BY c.category_name ASC`
    );

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Fetch Admin Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while loading categories' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category_name, icon_class, description } = body;

    if (!category_name || category_name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const icon = icon_class || 'fa-solid fa-star';
    const desc = description || '';

    // Insert new category
    await query(
      'INSERT INTO categories (category_name, icon_class, description, is_active) VALUES (?, ?, ?, 1)',
      [category_name.trim(), icon.trim(), desc.trim()]
    );

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'CREATE_CATEGORY', 'categories', 0, ip]
    );

    return NextResponse.json({
      success: true,
      message: `Category "${category_name}" has been created successfully!`
    });

  } catch (error) {
    console.error('Admin Create Category Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category.' }, { status: 500 });
  }
}

