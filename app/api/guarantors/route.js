import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const MAX_LENGTHS = { name: 150, relationship: 100, phone: 30, email: 150, notes: 2000 };

function clean(value, maxLength) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function validateInput(body) {
  const name = clean(body.name, MAX_LENGTHS.name);
  const relationship = clean(body.relationship, MAX_LENGTHS.relationship);
  const phone = clean(body.phone, MAX_LENGTHS.phone);
  const email = clean(body.email, MAX_LENGTHS.email);
  const notes = clean(body.notes, MAX_LENGTHS.notes);
  if (!name || !relationship) return { error: 'Name and relationship are required.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please provide a valid guarantor email.' };
  if (!phone && !email) return { error: 'Provide at least a phone number or email address.' };
  return { data: { name, relationship, phone, email, notes } };
}

export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    if (payload.role !== 'artisan') return NextResponse.json({ success: false, error: 'Only artisans can manage guarantors.' }, { status: 403 });
    const guarantors = await query(
      `SELECT guarantor_id, name, relationship, phone, email, notes, status, created_at, updated_at
       FROM guarantors WHERE artisan_id = ? ORDER BY created_at DESC`,
      [payload.user_id]
    );
    return NextResponse.json({ success: true, data: guarantors });
  } catch (error) {
    console.error('Fetch Guarantors API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load guarantors.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    if (payload.role !== 'artisan') return NextResponse.json({ success: false, error: 'Only artisans can submit guarantors.' }, { status: 403 });
    const validation = validateInput(await req.json());
    if (validation.error) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    const { name, relationship, phone, email, notes } = validation.data;
    const result = await query(
      `INSERT INTO guarantors (artisan_id, name, relationship, phone, email, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [payload.user_id, name, relationship, phone, email, notes]
    );
    return NextResponse.json({ success: true, data: { guarantor_id: result.insertId }, message: 'Guarantor submitted for review.' }, { status: 201 });
  } catch (error) {
    console.error('Create Guarantor API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit guarantor.' }, { status: 500 });
  }
}
