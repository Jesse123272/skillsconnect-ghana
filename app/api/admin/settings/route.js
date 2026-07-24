import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Helper to ensure system_settings table exists
async function ensureSettingsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed defaults if empty
    const countResult = await query('SELECT COUNT(*) as count FROM system_settings');
    const count = countResult[0]?.count || 0;
    if (count === 0) {
      const defaults = [
        ['platform_name', 'SkillsConnect Ghana'],
        ['contact_email', 'support@skillsconnect.gov.gh'],
        ['contact_phone', '+233 24 123 4567'],
        ['about_text', 'Connecting Ghanaian citizens with top-vetted professional and local trade services. Built with security, speed, and high reliability in mind.']
      ];
      for (const [key, val] of defaults) {
        await query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', [key, val]);
      }
    }
  } catch (err) {
    console.error('ensureSettingsTable error:', err);
  }
}

export async function GET(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    await ensureSettingsTable();

    const results = await query('SELECT setting_key, setting_value FROM system_settings');
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return NextResponse.json({
      success: true,
      data: {
        platform_name: settings.platform_name || 'SkillsConnect Ghana',
        contact_email: settings.contact_email || 'support@skillsconnect.gov.gh',
        contact_phone: settings.contact_phone || '+233 24 123 4567',
        about_text: settings.about_text || 'Connecting Ghanaian citizens with top-vetted professional and local trade services.'
      }
    });

  } catch (error) {
    console.error('Fetch Settings API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load system settings.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    await ensureSettingsTable();

    const body = await req.json();
    const { platform_name, contact_email, contact_phone, about_text } = body;

    const updates = { platform_name, contact_email, contact_phone, about_text };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, value, value]
        );
      }
    }

    // Log the action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'UPDATE_SYSTEM_SETTINGS', 'system_settings', 0, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'System settings successfully updated!'
    });

  } catch (error) {
    console.error('Update Settings API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update system settings.' }, { status: 500 });
  }
}
