import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const useSqlite = process.env.USE_SQLITE;
  const nodeEnv = process.env.NODE_ENV;

  let parsed = {};
  try {
    const u = new URL(dbUrl);
    parsed = { host: u.hostname, port: u.port, user: u.username, db: u.pathname };
  } catch (e) { parsed = { error: e.message }; }

  let pgResult = 'not tested';
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    const client = await pool.connect();
    const { rows } = await client.query('SELECT COUNT(*) as cnt FROM categories');
    pgResult = 'OK — categories: ' + rows[0].cnt;
    client.release();
    await pool.end();
  } catch (e) {
    pgResult = 'FAILED: ' + e.message + ' (code: ' + e.code + ')';
  }

  return NextResponse.json({
    nodeEnv, useSqlite,
    dbUrlSet: !!dbUrl,
    parsed,
    pgResult,
  });
}
