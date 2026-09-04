import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized admin access required.' }, { status: 403 });
    const guarantorId = Number((await params).id);
    if (!Number.isInteger(guarantorId) || guarantorId <= 0) return NextResponse.json({ success: false, error: 'Invalid guarantor ID.' }, { status: 400 });
    const { status } = await req.json();
    if (!['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ success: false, error: 'Status must be pending, approved, or rejected.' }, { status: 400 });
    const result = await query('UPDATE guarantors SET status = ? WHERE guarantor_id = ?', [status, guarantorId]);
    if (!result.affectedRows) return NextResponse.json({ success: false, error: 'Guarantor not found.' }, { status: 404 });
    await query('INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)', [payload.user_id, `GUARANTOR_${status.toUpperCase()}`, 'guarantors', guarantorId, req.headers.get('x-forwarded-for') || '127.0.0.1']);
    return NextResponse.json({ success: true, message: `Guarantor ${status}.` });
  } catch (error) {
    console.error('Admin Guarantor Moderation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to moderate guarantor.' }, { status: 500 });
  }
}
