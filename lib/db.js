import { querySqliteFallback } from './sqlite-fallback.js';

let mysqlPool = null;
let mysqlSchemaReady = false;
let useSqliteFallback = false;
const isProduction = process.env.NODE_ENV === 'production';

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
const shouldUseSqliteFallback = process.env.USE_SQLITE === 'true' || (!hasMySqlHost && process.env.NODE_ENV !== 'production') || process.env.NODE_ENV === 'development';
useSqliteFallback = shouldUseSqliteFallback;

async function getMysqlPool() {
  if (mysqlPool) return mysqlPool;

  if (!hasMySqlHost) {
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

    // Keep older deployed databases compatible with the location-aware artisan queries.
    // Each ALTER is idempotent at the application level because existing columns are ignored.
    if (!mysqlSchemaReady) {
      for (const statement of [
        'ALTER TABLE users ADD COLUMN lat DECIMAL(10, 8) NULL',
        'ALTER TABLE users ADD COLUMN lng DECIMAL(11, 8) NULL'
      ]) {
        try {
          await mysqlPool.query(statement);
        } catch (error) {
          if (!/duplicate column|already exists/i.test(error?.message || '')) {
            console.warn('Optional MySQL schema migration skipped:', error?.message || error);
          }
        }
      }
      mysqlSchemaReady = true;
    }
    return mysqlPool;
  } catch (error) {
    console.warn('MySQL connection failed, switching to SQLite fallback:', error.message);
    useSqliteFallback = true;
    return null;
  }
}

export const isSqliteFallbackEnabled = shouldUseSqliteFallback && !isProduction;

async function querySqlite(sql, params = []) {
  return querySqliteFallback(sql, params);
}

export async function query(sql, params = []) {
  // Prefer MySQL in production; only use sqlite fallback when explicitly enabled
  if (useSqliteFallback) {
    return await querySqlite(sql, params);
  }

  try {
    const pool = await getMysqlPool();
    if (!pool) {
      // If no pool could be created and we're in production, throw to fail loudly
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No MySQL pool available in production. Configure DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD.');
      }
      useSqliteFallback = true;
      return await querySqlite(sql, params);
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('MySQL query failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      // Fail loudly in production to avoid inconsistent multi-instance sqlite behavior
      throw error;
    }
    useSqliteFallback = true;
    return await querySqlite(sql, params);
  }
}

export default mysqlPool;
