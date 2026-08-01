import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillsconnect-sqlite-'));
const dbPath = path.join(tempDir, 'persist-test.db');
process.env.SQLITE_DB_PATH = dbPath;

test('writes SQLite fallback inserts to disk so later reads see the new rows', async () => {
  const { querySqliteFallback } = await import('../lib/sqlite-fallback.js');

  await querySqliteFallback(`CREATE TABLE IF NOT EXISTS test_persist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL
  )`);

  await querySqliteFallback('INSERT INTO test_persist (value) VALUES (?)', ['persisted-row']);

  const rows = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      db.all('SELECT id, value FROM test_persist ORDER BY id DESC LIMIT 5', (selectErr, results) => {
        if (selectErr) return reject(selectErr);
        db.close();
        resolve(results);
      });
    });
  });

  assert.ok(rows.some((row) => row.value === 'persisted-row'), 'inserted value should be visible in the SQLite file on disk');
});
