import { querySqliteFallback } from './sqlite-fallback.js';

let mysqlPool = null;
let mysqlSchemaReady = false;
let useSqliteFallback = false;
const isProduction = process.env.NODE_ENV === 'production';

async function ensureMissingColumns(pool, tableName, columns) {
  try {
    const safeTableName = String(tableName).replace(/`/g, '');
    const [existingColumns] = await pool.query(`SHOW COLUMNS FROM \`${safeTableName}\``);
    const existingNames = new Set(existingColumns.map((column) => column.Field));

    for (const column of columns) {
      if (!existingNames.has(column.name)) {
        const safeColumnName = String(column.name).replace(/`/g, '');
        await pool.query(`ALTER TABLE \`${safeTableName}\` ADD COLUMN \`${safeColumnName}\` ${column.definition}`);
      }
    }
  } catch (error) {
    console.warn(`Schema column check failed for ${tableName}:`, error?.message || error);
  }
}

async function ensureRequiredTables(pool) {
  try {
    const [tableRows] = await pool.query('SHOW TABLES');
    const tables = new Set(tableRows.map((row) => Object.values(row)[0]));

    if (!tables.has('users')) {
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('customer', 'artisan', 'admin') DEFAULT 'customer',
        region VARCHAR(100),
        district VARCHAR(100),
        profile_photo VARCHAR(255) DEFAULT NULL,
        preferences TEXT DEFAULT NULL,
        is_verified TINYINT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        reset_token VARCHAR(255) DEFAULT NULL,
        verification_token VARCHAR(255) DEFAULT NULL,
        lat DECIMAL(10, 8) DEFAULT NULL,
        lng DECIMAL(11, 8) DEFAULT NULL,
        last_login DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    }

    if (!tables.has('categories')) {
      await pool.query(`CREATE TABLE IF NOT EXISTS categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        icon_class VARCHAR(50) NOT NULL,
        description TEXT,
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    }

    if (!tables.has('artisan_profiles')) {
      await pool.query(`CREATE TABLE IF NOT EXISTS artisan_profiles (
        profile_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        bio TEXT,
        years_experience INT DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        profile_views INT DEFAULT 0,
        is_approved TINYINT DEFAULT 0,
        is_featured TINYINT DEFAULT 0,
        service_areas TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    }

    if (!tables.has('activity_logs')) {
      await pool.query(`CREATE TABLE IF NOT EXISTS activity_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        action VARCHAR(200) NOT NULL,
        entity_type VARCHAR(100) DEFAULT NULL,
        entity_id INT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    }

    await ensureMissingColumns(pool, 'users', [
      { name: 'google_id', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'lat', definition: 'DECIMAL(10, 8) DEFAULT NULL' },
      { name: 'lng', definition: 'DECIMAL(11, 8) DEFAULT NULL' },
      { name: 'verification_token', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'reset_token', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'last_login', definition: 'DATETIME DEFAULT NULL' }
    ]);
  } catch (error) {
    console.warn('Production schema bootstrap failed:', error?.message || error);
  }
}

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
const shouldUseSqliteFallback = process.env.USE_SQLITE === 'true' || process.env.USE_SQLITE === '1' || (!hasMySqlHost && process.env.NODE_ENV !== 'production') || process.env.NODE_ENV === 'development';
useSqliteFallback = shouldUseSqliteFallback;

function activateSqliteFallback(reason) {
  useSqliteFallback = true;
  console.warn(reason || 'Switching to SQLite fallback.');
}

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
      await ensureRequiredTables(mysqlPool);
      mysqlSchemaReady = true;
    }
    return mysqlPool;
  } catch (error) {
    console.warn('MySQL connection failed, switching to SQLite fallback:', error.message);
    activateSqliteFallback('MySQL connection failed during pool creation.');
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
        activateSqliteFallback('No MySQL pool available in production. Using SQLite fallback.');
        return await querySqlite(sql, params);
      }
      activateSqliteFallback('No MySQL pool available. Falling back to SQLite.');
      return await querySqlite(sql, params);
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('MySQL query failed:', error.message);
    activateSqliteFallback('MySQL query failed; falling back to SQLite.');
    return await querySqlite(sql, params);
  }
}

export default mysqlPool;
