const fs = require('fs');
const path = require('path');
const SQL = require('sql.js');
const dbFile = path.join(process.cwd(), 'skillsconnect.db');
console.log('db exists', fs.existsSync(dbFile), 'size', fs.existsSync(dbFile) ? fs.statSync(dbFile).size : null);
if (fs.existsSync(dbFile)) {
  const fileBuffer = fs.readFileSync(dbFile);
  const db = new SQL.Database(fileBuffer);
  const res = db.exec('SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name');
  console.log(JSON.stringify(res, null, 2));
}
