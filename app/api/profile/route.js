import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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
    
    // Accept preferences from request body (can be nested or flat, let's store as stringified JSON)
    const preferencesString = JSON.stringify(body);

    await query(
      'UPDATE users SET preferences = ? WHERE user_id = ?',
      [preferencesString, payload.user_id]
    );

    // Log action to activity_logs table
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
