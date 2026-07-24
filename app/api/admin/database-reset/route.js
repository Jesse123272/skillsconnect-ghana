import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req) {
  try {
    // 1. Authenticate user as Admin
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const { action } = await req.json();

    if (action === 'clear') {
      // 1. Temporarily disable foreign key checks to prevent cascade blocks
      await query('SET FOREIGN_KEY_CHECKS = 0');

      // 2. Clear all tables except Categories and Admin user (user_id = 1)
      await query('DELETE FROM users WHERE user_id > 1');
      await query('DELETE FROM artisan_profiles');
      await query('DELETE FROM enquiries');
      await query('DELETE FROM reviews');
      await query('DELETE FROM saved_artisans');
      await query('DELETE FROM gallery');
      await query('DELETE FROM transactions');
      await query('DELETE FROM notifications');
      await query('DELETE FROM activity_logs');
      await query('DELETE FROM portfolio_items');

      // 3. Reset auto-increment counters back to 1 (or 2 for users) for a truly pristine database state
      await query('ALTER TABLE users AUTO_INCREMENT = 2');
      await query('ALTER TABLE artisan_profiles AUTO_INCREMENT = 1');
      await query('ALTER TABLE enquiries AUTO_INCREMENT = 1');
      await query('ALTER TABLE reviews AUTO_INCREMENT = 1');
      await query('ALTER TABLE saved_artisans AUTO_INCREMENT = 1');
      await query('ALTER TABLE gallery AUTO_INCREMENT = 1');
      await query('ALTER TABLE transactions AUTO_INCREMENT = 1');
      await query('ALTER TABLE notifications AUTO_INCREMENT = 1');
      await query('ALTER TABLE activity_logs AUTO_INCREMENT = 1');
      await query('ALTER TABLE portfolio_items AUTO_INCREMENT = 1');

      // 4. Re-enable foreign key checks
      await query('SET FOREIGN_KEY_CHECKS = 1');

      // Log the database wipe action
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'DATABASE_WIPE', 'database', 0, ip]
      );

      return NextResponse.json({
        success: true,
        message: 'System database cleared successfully! All seeded customers, artisans, reviews, messages, and transactions have been safely wiped. The system is now 100% fresh for new user registrations.'
      });
    }

    if (action === 'seed') {
      // Re-run the setup_db script to restore the standard seed data
      // This is extremely safe as it re-creates the tables if not present and imports standard data
      const { stdout, stderr } = await execAsync('bash ./setup_db.sh');
      console.log('Database re-seeded successfully:', stdout);
      if (stderr) {
        console.warn('Database seed warning/stderr:', stderr);
      }

      // Log the database re-seed action
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [payload.user_id, 'DATABASE_SEED', 'database', 0, ip]
      );

      return NextResponse.json({
        success: true,
        message: 'Database successfully re-seeded with realistic Ghanaian artisan profiles, sample reviews, booking enquiries, and transactions!'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid database action requested.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Database reset API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while executing the database operation.' },
      { status: 500 }
    );
  }
}
