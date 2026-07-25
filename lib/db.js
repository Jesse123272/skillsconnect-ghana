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
// Railway exposes MYSQL* variables to services linked to a MySQL plugin.  Keep
// DB_* support as well so the application also works with other providers.
function getMySqlConfig() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  let urlConfig = {};

  if (connectionUrl && /^mysql(?:s)?:\/\//i.test(connectionUrl)) {
    try {
      const url = new URL(connectionUrl);
      urlConfig = {
        host: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, '') || undefined,
      };
    } catch {
      throw new Error('MYSQL_URL/DATABASE_URL is not a valid MySQL connection URL.');
    }
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || urlConfig.host,
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || urlConfig.port || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || urlConfig.user || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || urlConfig.password || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || urlConfig.database || 'skillsconnect_db',
  };
}

const mysqlConfig = getMySqlConfig();
const hasMySqlHost = Boolean(mysqlConfig.host && mysqlConfig.host !== '127.0.0.1' && mysqlConfig.host !== 'localhost');
const shouldUseSqliteFallback = process.env.USE_SQLITE === 'true' || !hasMySqlHost || process.env.NODE_ENV === 'production';

// Allow SQLite fallback whenever MySQL is unavailable or explicitly disabled.
useSqliteFallback = shouldUseSqliteFallback;

async function getMysqlPool() {
  if (mysqlPool) return mysqlPool;

  if (!hasMySqlHost || process.env.NODE_ENV === 'production') {
    useSqliteFallback = true;
    return null;
  }

  try {
    const mysql = await import('mysql2/promise');
    mysqlPool = mysql.default.createPool({
      ...mysqlConfig,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    });
    return mysqlPool;
  } catch (error) {
    console.warn('MySQL connection failed, switching to SQLite fallback:', error.message);
    useSqliteFallback = true;
    return null;
  }
}

// Use this in route handlers that need database-specific SQL syntax.
export const isSqliteFallbackEnabled = shouldUseSqliteFallback && !isProduction;

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
    .replace(/DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
    .replace(/^(\s*)SET\s+FOREIGN_KEY_CHECKS\s*=\s*0\s*;?\s*$/gim, 'PRAGMA foreign_keys = OFF')
    .replace(/^(\s*)SET\s+FOREIGN_KEY_CHECKS\s*=\s*1\s*;?\s*$/gim, 'PRAGMA foreign_keys = ON')
    .replace(/INSERT\s+INTO\s+system_settings\s*\(\s*setting_key\s*,\s*setting_value\s*\)\s*VALUES\s*\(\s*\?,\s*\?\s*\)\s*ON\s+DUPLICATE\s+KEY\s+UPDATE\s+setting_value\s*=\s*\?/gi,
      'INSERT OR REPLACE INTO system_settings (setting_key, setting_value) VALUES (?, ?)')
    .replace(/ALTER\s+TABLE\s+\w+\s+AUTO_INCREMENT\s*=\s*\d+/gi, "SELECT 1")
    .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
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
  if (process.env.NODE_ENV === 'production' || useSqliteFallback) {
    return await querySqlite(sql, params);
  }

  try {
    const pool = await getMysqlPool();
    if (!pool) {
      useSqliteFallback = true;
      return await querySqlite(sql, params);
    }
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('MySQL query failed, switching to SQLite fallback:', error.message);
    useSqliteFallback = true;
    return await querySqlite(sql, params);
  }
}

export default mysqlPool;
