import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const latitude = parseFloat(body.latitude);
    const longitude = parseFloat(body.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ success: false, error: 'Please provide valid coordinates.' }, { status: 400 });
    }

    await query('UPDATE users SET lat = ?, lng = ? WHERE user_id = ?', [latitude, longitude, payload.user_id]);

    return NextResponse.json({ success: true, message: 'Location updated successfully.' });
  } catch (error) {
    console.error('Update location API error:', error);
    return NextResponse.json({ success: false, error: 'Unable to save location.' }, { status: 500 });
  }
}
