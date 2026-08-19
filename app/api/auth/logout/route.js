import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    clearAuthCookie(response, {
      secure: req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://'),
    });
    return response;
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during logout' },
      { status: 500 }
    );
  }
}
