import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'profile'; // 'profile' or 'portfolio'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 1. Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Allowed formats: JPG, PNG, GIF, WEBP' },
        { status: 400 }
      );
    }

    // 2. Validate file size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must not exceed the 5MB limit' },
        { status: 400 }
      );
    }

    // 3. Read file stream to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Generate a clean, secure, unique filename
    const originalExt = path.extname(file.name || 'upload.jpg') || '.jpg';
    const cleanExt = originalExt.toLowerCase();
    const uniqueFilename = `${payload.user_id}_${type}_${Date.now()}${cleanExt}`;

    // 5. Ensure the upload directory exists under the project root at public/uploads
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.mkdir(publicUploadsDir, { recursive: true });
    } catch (dirError) {
      console.warn('Directory check or creation warning:', dirError);
    }

    // 6. Write file to local disk
    const destinationPath = path.join(publicUploadsDir, uniqueFilename);
    await fs.writeFile(destinationPath, buffer);

    const relativeUrlPath = `/uploads/${uniqueFilename}`;

    // 7. If uploading user profile photo, update the database record automatically
    if (type === 'profile') {
      await query('UPDATE users SET profile_photo = ? WHERE user_id = ?', [relativeUrlPath, payload.user_id]);

      // Log action to activity_logs
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'UPLOAD_PROFILE_PHOTO', 'users', payload.user_id, ip]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        file_path: relativeUrlPath,
        filename: uniqueFilename
      }
    });

  } catch (error) {
    console.error('File Upload API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during file upload' },
      { status: 500 }
    );
  }
}
