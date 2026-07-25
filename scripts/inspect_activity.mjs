import { query } from '../lib/db.js';

(async ()=>{
  try {
    const info = await query("PRAGMA table_info('activity_logs')");
    console.log('schema:', info);
    const rows = await query('SELECT count(*) as c FROM activity_logs');
    console.log('count:', rows[0]);
  } catch (e) {
    console.error('inspect activity error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
