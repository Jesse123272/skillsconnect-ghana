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

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, rows) => {
    if (err) {
      console.error('TABLE_ERR', err.message);
      process.exit(1);
    }
    const tables = rows.map(r => r.name);
    console.log('TABLES', tables.join(','));
    let pending = tables.length;
    if (!pending) {
      db.close();
      return;
    }
    for (const t of tables) {
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
    }
  });
});
