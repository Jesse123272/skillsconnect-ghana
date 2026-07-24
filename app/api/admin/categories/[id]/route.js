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
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid Category ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { category_name, icon_class, description, is_active } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (is_active !== undefined) {
      const activeVal = is_active ? 1 : 0;
      await query('UPDATE categories SET is_active = ? WHERE category_id = ?', [activeVal, categoryId]);
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, activeVal ? 'ACTIVATE_CATEGORY' : 'DEACTIVATE_CATEGORY', 'categories', categoryId, ip]
      );
      return NextResponse.json({ success: true, message: 'Category status updated successfully.' });
    }

    if (!category_name || category_name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    await query(
      'UPDATE categories SET category_name = ?, icon_class = ?, description = ? WHERE category_id = ?',
      [category_name.trim(), icon_class || 'fa-solid fa-star', description || '', categoryId]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'UPDATE_CATEGORY', 'categories', categoryId, ip]
    );

    return NextResponse.json({ success: true, message: 'Category updated successfully.' });

  } catch (error) {
    console.error('Admin Update Category Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category.' }, { status: 500 });
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
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid Category ID.' }, { status: 400 });
    }

    // Integrity check: block delete if category has artisans
    const checkArtisans = await query('SELECT COUNT(*) as count FROM artisan_profiles WHERE category_id = ?', [categoryId]);
    const artisanCount = checkArtisans[0]?.count || 0;

    if (artisanCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category. There are ${artisanCount} registered artisan(s) currently assigned to this category.` },
        { status: 400 }
      );
    }

    await query('DELETE FROM categories WHERE category_id = ?', [categoryId]);

    // Log action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DELETE_CATEGORY', 'categories', categoryId, ip]
    );

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });

  } catch (error) {
    console.error('Admin Delete Category Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category.' }, { status: 500 });
  }
}
