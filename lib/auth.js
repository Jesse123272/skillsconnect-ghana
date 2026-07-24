import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'skillsconnect_super_secret_jwt_key_2026_gctu'
);

/**
 * Sign user payload into a JWT token
 */
export async function signToken(payload) {
  const cleanPayload = {
    user_id: payload.user_id,
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name,
  };

  return await new SignJWT(cleanPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret);
}

/**
 * Verify a JWT token and return the payload or null
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    // Silent failure for expired/invalid tokens is standard forauth helpers
    return null;
  }
}

/**
 * Set the auth cookie on a NextResponse object
 */
export function setAuthCookie(response, token) {
  if (!response || !response.cookies) {
    throw new Error('Invalid response object passed to setAuthCookie');
  }

  response.cookies.set('skillsconnect_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
  return response;
}

/**
 * Clear the auth cookie on a NextResponse object
 */
export function clearAuthCookie(response) {
  if (!response || !response.cookies) {
    throw new Error('Invalid response object passed to clearAuthCookie');
  }

  response.cookies.set('skillsconnect_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

/**
 * Extract and verify a token from a NextRequest object
 */
export async function getUserFromRequest(request) {
  if (!request) return null;
  try {
    let token = null;

    // 1. Try to get token from cookies
    if (request.cookies && typeof request.cookies.get === 'function') {
      const cookieObj = request.cookies.get('skillsconnect_auth');
      if (cookieObj) {
        token = cookieObj.value;
      }
    }

    // 2. Try to get token from Authorization Header if not in cookies
    if (!token && request.headers && typeof request.headers.get === 'function') {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}
