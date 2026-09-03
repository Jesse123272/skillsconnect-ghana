import { querySqliteFallback } from '../lib/sqlite-fallback.mjs';

(async ()=>{
  try {
    console.log('Triggering sqlite fallback initialization via querySqliteFallback...');
    const tables = ['users','artisan_profiles','enquiries','enquiry_messages','reviews','notifications'];
    for (const t of tables) {
      try {
        const rows = await querySqliteFallback(`SELECT count(*) as c FROM ${t}`);
        if (Array.isArray(rows)) {
          console.log(`${t}:`, rows[0]?.c ?? JSON.stringify(rows));
        } else {
          console.log(`${t}:`, JSON.stringify(rows));
        }
      } catch (e) {
        console.error(`${t} check failed:`, e.message || e);
      }
    }
  } catch (err) {
    console.error('run error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
