import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const fields = ['name', 'relationship', 'phone', 'email', 'notes'];
const limits = { name: 150, relationship: 100, phone: 30, email: 150, notes: 2000 };

function value(body, field) {
  if (!(field in body)) return undefined;
  const text = body[field] === null ? null : String(body[field]).trim();
  return text ? text.slice(0, limits[field]) : null;
}

export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    if (payload.role !== 'artisan') return NextResponse.json({ success: false, error: 'Only artisans can manage guarantors.' }, { status: 403 });
    const guarantorId = Number((await params).id);
    if (!Number.isInteger(guarantorId) || guarantorId <= 0) return NextResponse.json({ success: false, error: 'Invalid guarantor ID.' }, { status: 400 });
    const existing = await query('SELECT guarantor_id FROM guarantors WHERE guarantor_id = ? AND artisan_id = ?', [guarantorId, payload.user_id]);
    if (!existing.length) return NextResponse.json({ success: false, error: 'Guarantor not found.' }, { status: 404 });
    const body = await req.json();
    const updates = fields.filter((field) => field in body).map((field) => ({ field, value: value(body, field) }));
    if (!updates.length) return NextResponse.json({ success: false, error: 'No editable guarantor fields supplied.' }, { status: 400 });
    const merged = await query('SELECT name, relationship, phone, email FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
    const next = { ...merged[0] };
    updates.forEach(({ field, value: fieldValue }) => { next[field] = fieldValue; });
    if (!next.name || !next.relationship || (!next.phone && !next.email)) return NextResponse.json({ success: false, error: 'Name, relationship, and a phone or email are required.' }, { status: 400 });
    if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) return NextResponse.json({ success: false, error: 'Please provide a valid guarantor email.' }, { status: 400 });
    await query(`UPDATE guarantors SET ${updates.map(({ field }) => `${field} = ?`).join(', ')}, status = 'pending' WHERE guarantor_id = ? AND artisan_id = ?`, [...updates.map(({ value: fieldValue }) => fieldValue), guarantorId, payload.user_id]);
    return NextResponse.json({ success: true, message: 'Guarantor updated and resubmitted for review.' });
  } catch (error) {
    console.error('Update Guarantor API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update guarantor.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    if (payload.role !== 'artisan') return NextResponse.json({ success: false, error: 'Only artisans can manage guarantors.' }, { status: 403 });
    const guarantorId = Number((await params).id);
    if (!Number.isInteger(guarantorId) || guarantorId <= 0) return NextResponse.json({ success: false, error: 'Invalid guarantor ID.' }, { status: 400 });
    const result = await query('DELETE FROM guarantors WHERE guarantor_id = ? AND artisan_id = ?', [guarantorId, payload.user_id]);
    if (!result.affectedRows) return NextResponse.json({ success: false, error: 'Guarantor not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Guarantor removed.' });
  } catch (error) {
    console.error('Delete Guarantor API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove guarantor.' }, { status: 500 });
  }
}
