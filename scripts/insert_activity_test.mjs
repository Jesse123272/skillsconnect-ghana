import { query } from '../lib/db.js';

(async ()=>{
  try {
    await query('INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)', [1,'TEST_ACTION','users',7,'127.0.0.1']);
    console.log('inserted');
    const r = await query('SELECT count(*) as c FROM activity_logs');
    console.log('count:', r[0]);
  } catch (e) {
    console.error('insert activity error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
