import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      'SELECT category_id, category_name, icon_class, description, is_active, created_at FROM categories ORDER BY created_at DESC LIMIT 200'
    );
    return new Response(JSON.stringify({ success: true, data: rows }), { status: 200 });
  } catch (err) {
    console.error('Admin categories GET error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { category_id, is_active, icon_class, description } = body;
    if (!category_id) {
      return new Response(JSON.stringify({ success: false, error: 'category_id required' }), { status: 400 });
    }

    const updates = [];
    const params = [];
    if (typeof is_active !== 'undefined') {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (typeof icon_class !== 'undefined') {
      updates.push('icon_class = ?');
      params.push(icon_class);
    }
    if (typeof description !== 'undefined') {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Nothing to update' }), { status: 400 });
    }

    params.push(category_id);
    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`;
    await query(sql, params);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Admin categories PUT error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 });
  }
}

