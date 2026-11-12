import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const rows = await query(
      'SELECT user_id, full_name, email, phone, role, region, district, profile_photo, is_verified, is_active, lat, lng, created_at FROM users WHERE user_id = ?',
      [payload.user_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get Profile API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile.' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const safeLocale = typeof body?.preferred_language === 'string' && body.preferred_language.trim()
      ? body.preferred_language.trim()
      : (typeof body?.locale === 'string' && body.locale.trim() ? body.locale.trim() : 'en');

    const preferencesString = JSON.stringify({ ...body, preferred_language: safeLocale, locale: safeLocale });

    await query(
      'UPDATE users SET preferences = ?, preferred_language = ?, locale = ? WHERE user_id = ?',
      [preferencesString, safeLocale, safeLocale, payload.user_id]
    );

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'UPDATE_PREFERENCES', 'users', payload.user_id, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      data: body
    });
  } catch (error) {
    console.error('Update Preferences API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating your preferences' },
      { status: 500 }
    );
  }
}
