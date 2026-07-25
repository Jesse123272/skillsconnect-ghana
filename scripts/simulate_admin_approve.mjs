import { query } from '../lib/db.js';

(async ()=>{
  try {
    const artisanId = 7; // existing seeded artisan
    console.log('Approving artisan', artisanId);

    await query('UPDATE artisan_profiles SET is_approved = 1 WHERE user_id = ?', [artisanId]);
    await query('UPDATE users SET is_active = 1 WHERE user_id = ?', [artisanId]);

    await query(`INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, 'profile_approved', 'Profile Approved! 🇬🇭🎉', 'Your SkillsConnect Ghana professional artisan profile has been reviewed and approved.', '/dashboard')`, [artisanId]);

    console.log('Inserted notification. Inserting activity log...');
    await query('INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)', [1, 'APPROVE_ARTISAN', 'users', artisanId, '127.0.0.1']);

    const notif = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY notification_id DESC LIMIT 1', [artisanId]);
    console.log('Latest notification:', notif);

    const act = await query('SELECT * FROM activity_logs WHERE entity_id = ? ORDER BY activity_id DESC LIMIT 1', [artisanId]);
    console.log('Latest activity log:', act);

    console.log('Approve simulation complete');
  } catch (err) {
    console.error('simulate error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
