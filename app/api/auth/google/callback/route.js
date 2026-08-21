import { handleGoogleCallback } from '@/app/api/auth/google/route';

export async function GET(req) {
  return handleGoogleCallback(req);
}
