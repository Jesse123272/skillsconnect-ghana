const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const dbPath = `${process.cwd()}/skillsconnect.db`;
if (!fs.existsSync(dbPath)) {
  console.error('NO_DB');
  process.exit(1);
}
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('DB_ERR', err.message);
    process.exit(1);
  }
});

const tablesToClear = [
  'artisan_profiles',
  'enquiries',
  'enquiry_messages',
  'reviews',
  'saved_artisans',
  'gallery',
  'transactions',
  'notifications',
  'activity_logs',
  'portfolio_items',
  'testimonials'
];

const deleteStatements = [
  "DELETE FROM users WHERE user_id > 1",
  ...tablesToClear.map(table => `DELETE FROM ${table}`)
];

const sequenceTables = ['users', 'artisan_profiles', 'enquiries', 'reviews', 'saved_artisans', 'gallery', 'transactions', 'notifications', 'activity_logs', 'portfolio_items', 'testimonials'];

console.log('Clearing dummy data from SQLite database:', dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');
  deleteStatements.forEach(sql => {
    db.run(sql, err => {
      if (err) {
        console.error('DELETE_ERR', sql, err.message);
      }
    });
  });
  sequenceTables.forEach(table => {
    db.run('DELETE FROM sqlite_sequence WHERE name = ?', [table], err => {
      if (err) {
        console.error('SEQ_ERR', table, err.message);
      }
    });
  });
  db.run('PRAGMA foreign_keys = ON');
  db.run('VACUUM', err => {
    if (err) {
      console.error('VACUUM_ERR', err.message);
    }
  });
  db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, rows) => {
      if (err) {
        console.error('TABLE_ERR', err.message);
        db.close();
        return;
      }
      const tables = rows.map(r => r.name);
      console.log('Remaining table row counts after cleanup:');
      let pending = tables.length;
      tables.forEach(t => {
        db.get(`SELECT COUNT(*) AS cnt FROM ${t}`, (err2, row) => {
          if (err2) {
            console.log('ERR_COUNT', t, err2.message);
          } else {
            console.log(t, row.cnt);
          }
          if (--pending === 0) {
            db.close();
          }
        });
      });
    });
  });
});
