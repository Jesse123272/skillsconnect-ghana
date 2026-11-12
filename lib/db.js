/**
 * SkillsConnect Ghana — Database Layer
 * Primary:  Supabase / PostgreSQL via `pg`
 * Fallback: SQLite (when USE_SQLITE=true)
 */

import { querySqliteFallback } from './sqlite-fallback.mjs';

export const isSqliteFallbackEnabled =
  process.env.USE_SQLITE === 'true' || process.env.USE_SQLITE === '1';

function useSQLite() {
  return (
    process.env.USE_SQLITE === 'true' ||
    process.env.USE_SQLITE === '1' ||
    (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production')
  );
}

// ─── MySQL → PostgreSQL placeholder conversion ─────────────────────────────
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ─── Normalise pg result to mysql2-compatible shape ─────────────────────────
function normalisePgResult(result, sql) {
  const t = sql.trimStart().toUpperCase();
  // SELECT and WITH → return rows directly
  if (t.startsWith('SELECT') || t.startsWith('WITH')) return result.rows;
  // INSERT/UPDATE/DELETE with RETURNING → extract insertId from first returned row
  if (result.rows?.length > 0) {
    const row = result.rows[0];
    const insertId =
      row.user_id    ||
      row.profile_id ||
      row.enquiry_id ||
      row.review_id  ||
      row.message_id ||
      row.transaction_id ||
      row.notification_id ||
      row.guarantee_id ||
      row.item_id    ||
      row.id         ||
      Object.values(row)[0] ||
      0;
    return { insertId: Number(insertId), affectedRows: result.rowCount, rows: result.rows };
  }
  return { insertId: 0, affectedRows: result.rowCount || 0 };
}

// ─── PostgreSQL SQL shims (MySQL → PostgreSQL syntax) ──────────────────────
function shimForPostgres(sql) {
  let result = sql
    .replace(/\bDATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'%Y-%m'\s*\)/gi,   "TO_CHAR($1, 'YYYY-MM')")
    .replace(/\bDATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'%Y-%m-01'\s*\)/gi, "DATE_TRUNC('month', $1)")
    .replace(/\bCURDATE\s*\(\s*\)/gi,       "CURRENT_DATE")
    .replace(/\bDATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\d+)\s+MONTH\s*\)/gi, "($1 - INTERVAL '$2 months')")
    .replace(/\bDATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,   "($1 - INTERVAL '$2 days')")
    .replace(/\bDATE_SUB\s*\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\d+)\s+HOUR\s*\)/gi,  "($1 - INTERVAL '$2 hours')")
    .replace(/\bIFNULL\s*\(/gi,             'COALESCE(')
    .replace(/\bGROUP_CONCAT\s*\(\s*([^\s)]+)\s*\)/gi, "STRING_AGG($1::TEXT, ',')")
    .replace(/\bGROUP_CONCAT\s*\(\s*([^\s)]+)\s+SEPARATOR\s+'([^']+)'\s*\)/gi, "STRING_AGG($1::TEXT, '$2')")
    .replace(/\bFLOOR\s*\(\s*rating\s*\)/gi, 'rating')
    .replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, 'INSERT INTO')
    .replace(/\s+ON\s+DUPLICATE\s+KEY\s+UPDATE[\s\S]*?(?=;|$)/gi, ' ON CONFLICT DO NOTHING')
    .replace(/SET\s+FOREIGN_KEY_CHECKS\s*=\s*[01]\s*;?/gi, '-- fk')
    .replace(/`([^`]+)`/g, '"$1"')
    .replace(/\s+ENGINE\s*=\s*InnoDB[^;]*/gi, '')
    .replace(/\s+DEFAULT\s+CHARSET\s*=\s*\w+[^;]*/gi, '')
    .replace(/\s+COLLATE\s*=\s*\w+[^;]*/gi, '')
    .replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '')
    .replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bINT\s+AUTO_INCREMENT\b/gi, 'SERIAL')
    .replace(/\bAUTO_INCREMENT\b/gi, '')
    .replace(/\bTINYINT(?:\(\d+\))?\b/gi, 'SMALLINT')
    .replace(/\bENUM\s*\(([^)]+)\)/gi, (_, opts) => {
      const vals = opts.split(',').map(v => v.trim());
      return `TEXT CHECK (value IN (${vals.join(', ')}))`;
    });

  // Auto-append RETURNING * to INSERT statements that don't already have RETURNING
  // This gives us back the new row ID without changing every route file.
  if (
    /^\s*INSERT\s+INTO\b/i.test(result) &&
    !/\bRETURNING\b/i.test(result) &&
    !/\bON\s+CONFLICT\b/i.test(result)
  ) {
    result = result.trimEnd().replace(/;?\s*$/, '') + ' RETURNING *';
  }

  return result;
}

// ─── Main query function ────────────────────────────────────────────────────
// Creates a fresh Pool per call in dev (matches test-db route pattern that works).
// In production pools are reused via the module-level cache below.
let _prodPool = null;

export async function query(sql, params = []) {
  if (useSQLite()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production database unavailable. Configure DATABASE_URL.');
    }
    return querySqliteFallback(sql, params);
  }

  // Build a fresh pool every call in dev, reuse in production
  let pool;
  if (process.env.NODE_ENV !== 'production') {
    // Fresh pool each call — avoids all Next.js dev module caching issues
    const { Pool } = await import('pg');
    pool = new Pool({
      host:     'aws-0-eu-west-1.pooler.supabase.com',
      port:     5432,
      user:     'postgres.dcuhdmtdlipscujebpxn',
      password: decodeURIComponent(new URL(process.env.DATABASE_URL).password),
      database: 'postgres',
      ssl:      { rejectUnauthorized: false },
      max:      1,
      connectionTimeoutMillis: 15000,
    });
  } else {
    // Production (Vercel): use Supabase transaction pooler (port 6543)
    // The pooler has IPv4 support and works from all Vercel regions.
    // The username format postgres.PROJECT_REF is required by the pooler.
    if (!_prodPool) {
      const { Pool } = await import('pg');
      const url = new URL(process.env.DATABASE_URL);
      const projectRef = url.hostname.replace('db.', '').replace('.supabase.co', '');
      _prodPool = new Pool({
        host:     `aws-0-eu-west-1.pooler.supabase.com`,
        port:     6543,  // transaction pooler — works from Vercel serverless
        user:     `postgres.${projectRef}`,
        password: decodeURIComponent(url.password),
        database: 'postgres',
        ssl:      { rejectUnauthorized: false },
        max:      10,
        idleTimeoutMillis:       30000,
        connectionTimeoutMillis: 15000,
      });
      _prodPool.on('error', () => { _prodPool = null; });
    }
    pool = _prodPool;
  }

  const shimmed = shimForPostgres(sql);
  const pgSql   = convertPlaceholders(shimmed);

  try {
    const result = await pool.query(pgSql, params);
    if (process.env.NODE_ENV !== 'production') {
      await pool.end().catch(() => {});
    }
    return normalisePgResult(result, shimmed);
  } catch (err) {
    console.error('[db] Query error:', err.message, '\nSQL:', sql.substring(0, 160));
    if (process.env.NODE_ENV !== 'production') {
      await pool.end().catch(() => {});
    } else {
      _prodPool = null;
    }
    throw err;
  }
}

export default { query };
