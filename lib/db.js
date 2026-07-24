import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function resolveProjectPath(...segments) {
  return path.join(projectRoot, ...segments);
}

let mysqlPool = null;
let useSqliteFallback = false;
let sqlJsDb = null;
let initPromise = null;
const isProduction = process.env.NODE_ENV === 'production';
const shouldUseSqliteFallback = process.env.USE_SQLITE === 'true' || !process.env.DB_HOST || process.env.DB_HOST === '127.0.0.1';

// Only allow SQLite fallback when not running in production.
useSqliteFallback = !isProduction && shouldUseSqliteFallback;

async function getMysqlPool() {
  if (mysqlPool) return mysqlPool;

  if (!process.env.DB_HOST || process.env.DB_HOST === '127.0.0.1') {
    if (isProduction) {
      throw new Error('Production requires a supported SQL database. Please configure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in your environment.');
    }
    return null;
  }

  try {
    const mysql = await import('mysql2/promise');
    mysqlPool = mysql.default.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'skillsconnect_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 1000,
    });
    return mysqlPool;
  } catch (error) {
    if (isProduction) {
      throw error;
    }
    useSqliteFallback = true;
    return null;
  }
}

function hasRequiredTables(db) {
  const requiredTables = [
    'users',
    'categories',
    'artisan_profiles',
    'enquiries',
    'reviews',
    'saved_artisans',
    'gallery',
    'transactions',
    'activity_logs',
    'notifications',
    'portfolio_items',
    'testimonials'
  ];

  const result = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users','categories','artisan_profiles','enquiries','reviews','saved_artisans','gallery','transactions','activity_logs','notifications','portfolio_items','testimonials')");
  const existingTables = result[0]?.values?.map(row => row[0]) || [];
  return requiredTables.every(table => existingTables.includes(table));
}

function splitSqlStatements(sqlContent) {
  return sqlContent
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function getSqlJsDb() {
  if (sqlJsDb) return sqlJsDb;
  if (initPromise) return await initPromise;

  initPromise = (async () => {
    // Dynamically require sql.js using eval to prevent Webpack bundling errors
    const loadSqlJs = eval('require')('sql.js');
    const SQL = await loadSqlJs({
      locateFile: file => resolveProjectPath('node_modules', 'sql.js', 'dist', file)
    });
    const dbFile = resolveProjectPath('skillsconnect.db');

    if (fs.existsSync(dbFile)) {
      try {
        const fileBuffer = fs.readFileSync(dbFile);
        const tempDb = new SQL.Database(fileBuffer);
        // Integrity check to ensure disk image is valid
        tempDb.exec('SELECT count(*) FROM sqlite_master');

        if (hasRequiredTables(tempDb)) {
          sqlJsDb = tempDb;
          return sqlJsDb;
        }

        console.warn('Existing SQLite database is missing required tables. Re-initializing schema.');
      } catch (err) {
        console.error('Failed to load existing db file or database malformed, re-initializing:', err);
      }

      try {
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
        }
      } catch (e) {}
    }

    sqlJsDb = new SQL.Database();
    const sqlPath = resolveProjectPath('database', 'skillsconnect.sql');
    if (fs.existsSync(sqlPath)) {
      const rawSql = fs.readFileSync(sqlPath, 'utf8');
      const sqlContent = rawSql
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*CREATE DATABASE\b.*$/gm, '')
        .replace(/^\s*USE\b.*$/gm, '')
        .replace(/^\s*SET FOREIGN_KEY_CHECKS\b.*$/gm, '')
        .replace(/ENGINE=InnoDB[^;]*/gi, '')
        .replace(/DEFAULT CHARSET=[^;]*/gi, '')
        .replace(/COLLATE=[^;]*/gi, '')
        .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
        .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/INT\s+AUTO_INCREMENT/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/AUTO_INCREMENT/gi, '')
        .replace(/TINYINT\(\d+\)/gi, 'INTEGER')
        .replace(/TINYINT/gi, 'INTEGER')
        .replace(/ENUM\([^)]+\)/gi, 'TEXT')
        .replace(/UNIQUE KEY\s+\w+\s*\(([^)]+)\)/gi, (m, g1) => 'UNIQUE(' + g1 + ')')
        .replace(/UPDATE artisan_profiles ap[\s\S]*?ap\.total_reviews = r\.cnt_rev;/gi, '');

      const statements = splitSqlStatements(sqlContent);
      for (const stmt of statements) {
        try {
          sqlJsDb.run(stmt);
        } catch (e) {
          // ignore non-fatal seed warnings
        }
      }

      const migrationFiles = ['migration_add_location.sql', 'migration_analytics.sql'];
      for (const migrationFile of migrationFiles) {
        const migrationPath = resolveProjectPath('database', migrationFile);
        if (fs.existsSync(migrationPath)) {
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');
          const migrationStatements = splitSqlStatements(migrationSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
          for (const stmt of migrationStatements) {
            try {
              sqlJsDb.run(stmt);
            } catch (e) {
              // ignore migration warnings for existing schema
            }
          }
        }
      }
      
      // Save initial DB export
      try {
        const data = sqlJsDb.export();
        fs.writeFileSync(dbFile, Buffer.from(data));
      } catch (e) {}
    }

    return sqlJsDb;
  })();

  return await initPromise;
}

// Warm up DB in background on startup
if (useSqliteFallback) {
  getSqlJsDb().catch(e => console.error('Database warmup error:', e));
}

function translateSql(sql) {
  if (!sql) return '';
  return sql
    .replace(/DATE_FORMAT\s*\(\s*([^,]+?)\s*,\s*'([^']+)'\s*\)/gi, "strftime('$2', $1)")
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/DATE_SUB\(datetime\('now'\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "datetime('now', '-$1 day')")
    .replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s*(\d+)\s*DAY\)/gi, "datetime('now', '-$1 day')")
    .replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s*(\d+)\s*MONTH\)/gi, "datetime('now', '-$1 month')")
    .replace(/DATE_SUB\(datetime\('now'\),\s*INTERVAL\s*(\d+)\s*MONTH\)/gi, "datetime('now', '-$1 month')")
    .replace(/ALTER\s+TABLE\s+\w+\s+AUTO_INCREMENT\s*=\s*\d+/gi, "SELECT 1")
    .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT")
    .replace(/ON DUPLICATE KEY UPDATE\s+setting_value\s*=\s*\?/gi, "ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value");
}

let isPersisting = false;
async function persistDbAsync() {
  if (isPersisting || !sqlJsDb) return;
  isPersisting = true;
  try {
    const data = sqlJsDb.export();
    const dbFile = resolveProjectPath('skillsconnect.db');
    await fs.promises.writeFile(dbFile, Buffer.from(data));
  } catch (e) {
    // Non-fatal background write
  } finally {
    isPersisting = false;
  }
}

async function querySqlite(sql, params = []) {
  try {
    const db = await getSqlJsDb();
    const translated = translateSql(sql);
    const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(translated);

    if (isSelect) {
      const stmt = db.prepare(translated);
      stmt.bind(params || []);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } else {
      db.run(translated, params || []);
      const lastIdRes = db.exec('SELECT last_insert_rowid()');
      const changesRes = db.exec('SELECT changes()');
      const insertId = lastIdRes[0]?.values[0]?.[0] || 0;
      const affectedRows = changesRes[0]?.values[0]?.[0] || 0;

      // Non-blocking async background save
      persistDbAsync();

      return { insertId, affectedRows };
    }
  } catch (error) {
    if (error && error.message && error.message.includes('malformed')) {
      console.error('Database disk image is malformed during query. Resetting database and retrying...');
      sqlJsDb = null;
      initPromise = null;
      const dbFile = resolveProjectPath('skillsconnect.db');
      try {
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
        }
      } catch (e) {}

      const freshDb = await getSqlJsDb();
      const translated = translateSql(sql);
      const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(translated);

      if (isSelect) {
        const stmt = freshDb.prepare(translated);
        stmt.bind(params || []);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      } else {
        freshDb.run(translated, params || []);
        const lastIdRes = freshDb.exec('SELECT last_insert_rowid()');
        const changesRes = freshDb.exec('SELECT changes()');
        const insertId = lastIdRes[0]?.values[0]?.[0] || 0;
        const affectedRows = changesRes[0]?.values[0]?.[0] || 0;

        persistDbAsync();

        return { insertId, affectedRows };
      }
    }
    throw error;
  }
}

export async function query(sql, params = []) {
  if (!useSqliteFallback) {
    try {
      const pool = await getMysqlPool();
      if (!pool) return await querySqlite(sql, params);
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      if (isProduction) {
        if (error.code === 'ER_WRONG_ARGUMENTS') {
          console.error('MySQL parameter binding error:', {
            sql,
            paramsLength: params?.length ?? 0,
            params
          });
        }
        throw error;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('connect')) {
        console.warn('MySQL unavailable, switching to SQLite fallback.');
        useSqliteFallback = true;
      } else {
        return await querySqlite(sql, params);
      }
    }
  }

  return await querySqlite(sql, params);
}

export default mysqlPool;

