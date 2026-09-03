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
  const { querySqliteFallback } = await import('../lib/sqlite-fallback.mjs');

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

test('creates missing profile_view_logs table and writes rows in SQLite fallback mode', async () => {
  const tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'skillsconnect-sqlite-'));
  const fallbackPath = path.join(tempDir2, 'profile-view-logs.db');
  process.env.SQLITE_DB_PATH = fallbackPath;

  const sqliteFallback = await import('../lib/sqlite-fallback.mjs');
  sqliteFallback.closeSqliteFallback();

  const { querySqliteFallback } = sqliteFallback;

  await querySqliteFallback(
    'INSERT INTO profile_view_logs (artisan_id, viewer_id, ip_address) VALUES (?, ?, ?)',
    [9, 2, '127.0.0.1']
  );

  const rows = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(fallbackPath, (err) => {
      if (err) return reject(err);
      db.all('SELECT artisan_id, viewer_id, ip_address FROM profile_view_logs ORDER BY log_id DESC LIMIT 5', (selectErr, results) => {
        if (selectErr) return reject(selectErr);
        db.close();
        resolve(results);
      });
    });
  });

  assert.ok(rows.some((row) => row.artisan_id === 9 && row.ip_address === '127.0.0.1'), 'profile_view_logs should be created and the row should be inserted');
});

test('seeded SQLite fallback categories include a broad set of trade specialties', async () => {
  const { querySqliteFallback } = await import('../lib/sqlite-fallback.mjs');

  const rows = await querySqliteFallback('SELECT category_name FROM categories WHERE is_active = 1 ORDER BY category_name ASC');
  const names = rows.map((row) => row.category_name.toLowerCase());

  assert.ok(names.includes('plumbing'), 'categories should include plumbing');
  assert.ok(names.includes('pest control'), 'categories should include pest control');
  assert.ok(names.includes('cleaning services'), 'categories should include cleaning services');
});
