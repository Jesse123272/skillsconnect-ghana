import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Project root computed relative to this module. Keep this deterministic
// so the fallback DB and SQL file are located consistently in all environments.
const projectRoot = path.resolve(__dirname, '..');

function resolveProjectPath(...segments) {
  return path.join(projectRoot, ...segments);
}

function getSqliteDbPath() {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }

  const candidates = [
    resolveProjectPath('skillsconnect.db'),
    path.join(os.tmpdir(), 'skillsconnect.db')
  ];

  // Try several sensible locations for a writable DB file and fall back to
  // the OS temp directory when no project-writable path is found.
  for (const candidate of candidates) {
    try {
      const dir = path.dirname(candidate);
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK | fs.constants.R_OK);
      return candidate;
    } catch (error) {
      console.warn('SQLite fallback path not writable, trying next option:', candidate, error?.message || error);
    }
  }

  return path.join(os.tmpdir(), 'skillsconnect.db');
}

let sqliteDb = null;
let sqliteInitPromise = null;
let sqlJsModule = null;

function getSqlWasmPath() {
  const candidates = [
    resolveProjectPath('sql-wasm.wasm'),
    path.join(projectRoot, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(process.cwd(), 'sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  ];

  // Prefer a project-provided `sql-wasm.wasm` if present. This keeps builds
  // hermetic when using a pinned `sql.js` version with local assets.
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

async function loadSqliteModule() {
  if (sqlJsModule) return sqlJsModule;
  sqlJsModule = await initSqlJs({
    locateFile: () => getSqlWasmPath()
  });
  return sqlJsModule;
}

function splitSqlStatements(sqlContent) {
  return sqlContent
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
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
    .replace(/^\s*SET\s+FOREIGN_KEY_CHECKS\s*=\s*0\s*;?\s*$/gim, 'PRAGMA foreign_keys = OFF')
    .replace(/^\s*SET\s+FOREIGN_KEY_CHECKS\s*=\s*1\s*;?\s*$/gim, 'PRAGMA foreign_keys = ON')
    .replace(/ALTER\s+TABLE\s+\w+\s+AUTO_INCREMENT\s*=\s*\d+/gi, 'SELECT 1')
    .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/\bENUM\([^)]*\)/gi, 'TEXT')
    .replace(/\bLEAST\s*\(/gi, 'MIN(')
    .replace(/\bGREATEST\s*\(/gi, 'MAX(');
}

  // `translateSql` performs lightweight syntax translation from MySQL-style SQL
  // in the project's `database/skillsconnect.sql` into SQL compatible with the
  // in-memory `sql.js` (SQLite) engine. Keep translations conservative to avoid
  // changing semantic intent; any failing statements are logged and skipped so
  // the fallback stays resilient.

function getDefaultSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      region TEXT,
      district TEXT,
      profile_photo TEXT,
      preferences TEXT,
      is_verified INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      reset_token TEXT,
      verification_token TEXT,
      last_login TEXT,
      lat REAL DEFAULT NULL,
      lng REAL DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT UNIQUE NOT NULL,
      icon_class TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS artisan_profiles (
      profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      bio TEXT,
      years_experience INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0.00,
      total_reviews INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      service_areas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS profile_view_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      artisan_id INTEGER NOT NULL,
      viewer_id INTEGER DEFAULT NULL,
      viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS platform_metrics (
      metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL DEFAULT 0.00,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `INSERT OR IGNORE INTO categories (category_id, category_name, icon_class, description, is_active) VALUES
      (1, 'Plumbing', 'fa-wrench', 'Professional installation, repair, and maintenance of pipes, valves, and drainage systems.', 1),
      (2, 'Electrical Work', 'fa-bolt', 'Expert wiring, installation, and repair for residential and commercial electrical systems.', 1),
      (3, 'Carpentry', 'fa-hammer', 'Custom woodwork, furniture making, doors, and built-in cabinetry.', 1),
      (4, 'Masonry', 'fa-building', 'Bricklaying, concrete work, plastering, tiling, and structural stone work.', 1),
      (5, 'Tailoring', 'fa-scissors', 'Custom sewing, alterations, and ready-to-wear garment making.', 1),
      (6, 'Hairdressing', 'fa-cut', 'Braiding, styling, washing, and hair treatment services.', 1),
      (7, 'Painting', 'fa-paint-roller', 'Interior and exterior painting, wall finishing, and surface preparation.', 1),
      (8, 'Welding', 'fa-fire', 'Metal fabrication, gate construction, burglar-proofing, and repairs.', 1),
      (9, 'Mechanics', 'fa-car', 'Automotive servicing, engine repair, and vehicle diagnostics.', 1),
      (10, 'Fashion Design', 'fa-shirt', 'Creative apparel design and bespoke clothing production.', 1),
      (11, 'Cleaning Services', 'fa-broom', 'Professional house cleaning, office cleaning, fumigation, and sanitation services.', 1),
      (12, 'Pest Control', 'fa-bug', 'Termite treatment, rodent control, fumigation, and general pest management.', 1),
      (13, 'Gardening & Landscaping', 'fa-seedling', 'Lawn care, planting, garden maintenance, and outdoor beautification.', 1),
      (14, 'Appliance Repair', 'fa-tv', 'Repair and servicing of refrigerators, washing machines, microwaves, and other household appliances.', 1),
      (15, 'ICT & Device Repair', 'fa-laptop', 'Computer repairs, phone repairs, printer setup, and troubleshooting services.', 1),
      (16, 'Event Decoration', 'fa-ribbon', 'Decoration, venue styling, balloon work, and event setup services.', 1),
      (17, 'Catering', 'fa-utensils', 'Food preparation, event catering, and home kitchen support services.', 1),
      (18, 'Beauty Services', 'fa-spa', 'Makeup, nails, skincare, and beauty treatment services.', 1),
      (19, 'Photography', 'fa-camera', 'Event photography, portrait shoots, and professional camera services.', 1),
      (20, 'Security Services', 'fa-shield-halved', 'Private security, guarding, gatekeeping, and protective services.', 1)`
  ];
}

async function initializeSqliteDatabase() {
  if (sqliteDb) return sqliteDb;
  if (sqliteInitPromise) return sqliteInitPromise;

  sqliteInitPromise = (async () => {
    // Load the sql.js runtime (WebAssembly) and open or create the DB file.
    const SQL = await loadSqliteModule();
    const dbPath = getSqliteDbPath();
    const sqlPath = resolveProjectPath('database', 'skillsconnect.sql');
    const existingDbBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
    const db = existingDbBuffer ? new SQL.Database(existingDbBuffer) : new SQL.Database();

    const statements = getDefaultSchemaStatements();
    // If a full SQL dump exists, run a conservative parsing pass to extract
    // CREATE/INSERT statements while removing MySQL-specific constructs.
    let extraStatements = [];
    if (fs.existsSync(sqlPath)) {
      try {
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

        extraStatements = splitSqlStatements(sqlContent);
        statements.push(...extraStatements);
      } catch (error) {
        console.warn('Failed to parse SQL schema file; using built-in fallback schema instead.', error?.message || error);
      }
    }

    // Run each translated statement; failures are logged but do not abort
    // initialization so the application can continue running with a
    // best-effort fallback schema.
    for (const statement of statements) {
      try {
        const t = translateSql(statement);
        if (!t || t.trim().length === 0) continue;
        db.run(t);
      } catch (error) {
        console.warn('SQLite schema statement failed:', error?.message || error, statement.substring(0, 200));
      }
    }

    // Ensure critical tables exist. Some statements may fail silently during parsing,
    // so explicitly create essential tables if absent and log their status. This
    // section keeps the fallback usable even when parts of the SQL dump are
    // incompatible with sql.js translations.
    try {
      const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const existingNames = (existing && existing[0] && existing[0].values) ? existing[0].values.map(r => r[0]) : [];
      const required = ['enquiries', 'notifications', 'reviews', 'enquiry_messages', 'saved_artisans', 'portfolio_items', 'gallery', 'transactions', 'testimonials'];
      const toCreate = required.filter(r => !existingNames.includes(r));
      if (toCreate.length > 0) {
        console.warn('SQLite fallback missing tables, will create:', toCreate.join(', '));
      }

      // Create minimal compatible table definitions for missing tables
      const ensureStatements = [];
      if (!existingNames.includes('enquiries')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS enquiries (
          enquiry_id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          artisan_id INTEGER NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          reply TEXT DEFAULT NULL,
          status TEXT DEFAULT 'pending',
          is_read_artisan INTEGER DEFAULT 0,
          is_read_customer INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          replied_at TEXT DEFAULT NULL
        )`);
      }

      if (!existingNames.includes('enquiry_messages')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS enquiry_messages (
          message_id INTEGER PRIMARY KEY AUTOINCREMENT,
          enquiry_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          message_text TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('reviews')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS reviews (
          review_id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          artisan_id INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          review_text TEXT,
          is_approved INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('notifications')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS notifications (
          notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          link TEXT DEFAULT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('saved_artisans')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS saved_artisans (
          save_id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          artisan_id INTEGER NOT NULL,
          saved_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('portfolio_items')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS portfolio_items (
          item_id INTEGER PRIMARY KEY AUTOINCREMENT,
          artisan_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          caption TEXT DEFAULT NULL,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('gallery')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS gallery (
          gallery_id INTEGER PRIMARY KEY AUTOINCREMENT,
          artisan_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          caption TEXT DEFAULT NULL,
          uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('transactions')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS transactions (
          transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reference TEXT UNIQUE NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'GHS',
          channel TEXT DEFAULT NULL,
          status TEXT DEFAULT 'pending',
          metadata TEXT DEFAULT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          verified_at TEXT DEFAULT NULL
        )`);
      }

      if (!existingNames.includes('profile_view_logs')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS profile_view_logs (
          log_id INTEGER PRIMARY KEY AUTOINCREMENT,
          artisan_id INTEGER NOT NULL,
          viewer_id INTEGER DEFAULT NULL,
          viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT DEFAULT NULL
        )`);
      }

      if (!existingNames.includes('platform_metrics')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS platform_metrics (
          metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          metric_value REAL DEFAULT 0.00,
          recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      if (!existingNames.includes('testimonials')) {
        ensureStatements.push(`CREATE TABLE IF NOT EXISTS testimonials (
          testimonial_id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          testimonial_text TEXT NOT NULL,
          status TEXT DEFAULT 'approved',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
      }

      for (const s of ensureStatements) {
        try {
          db.run(s);
        } catch (err) {
          console.warn('Failed to ensure table statement:', err?.message || err, s.substring(0, 200));
        }
      }
      // If some tables exist but are empty, try to run INSERT statements from the SQL file
      try {
        const check = (tbl) => {
          try {
            const q = db.exec(`SELECT count(*) as c FROM ${tbl}`);
            return q && q[0] && q[0].values && q[0].values[0] ? q[0].values[0][0] : 0;
          } catch (e) {
            return null;
          }
        };

        const tablesToCheck = ['enquiries', 'reviews', 'notifications', 'enquiry_messages'];
        const needSeed = tablesToCheck.some(t => {
          const c = check(t);
          return c === 0;
        });

        if (needSeed && extraStatements && extraStatements.length > 0) {
          console.log('Seeding missing data into sqlite fallback from SQL file (INSERT statements).');
          const insertStatements = extraStatements.filter(s => /^\s*INSERT\s+INTO/i.test(s));
          for (const ins of insertStatements) {
            try {
              const transformed = translateSql(ins).replace(/^\s*INSERT\s+INTO/i, 'INSERT OR IGNORE INTO');
              db.run(transformed);
            } catch (err) {
              console.warn('Failed to run seed INSERT statement:', err?.message || err, ins.substring(0, 200));
            }
          }
        }
      } catch (err) {
        console.warn('Error while attempting to seed missing data:', err?.message || err);
      }
    } catch (err) {
      console.warn('Error while verifying/creating critical sqlite tables:', err?.message || err);
    }

    // Lightweight migrations: add missing columns that code expects (lat,lng,log_id)
    try {
      try {
        const usersCols = db.exec("PRAGMA table_info('users')");
        const userColNames = (usersCols && usersCols[0] && usersCols[0].values) ? usersCols[0].values.map(r => r[1]) : [];
        if (!userColNames.includes('lat')) {
          console.log('SQLite migration: adding users.lat column');
          db.run("ALTER TABLE users ADD COLUMN lat REAL DEFAULT NULL");
        }
        if (!userColNames.includes('lng')) {
          console.log('SQLite migration: adding users.lng column');
          db.run("ALTER TABLE users ADD COLUMN lng REAL DEFAULT NULL");
        }
      } catch (e) {
        console.warn('SQLite migration (users) check failed:', e?.message || e);
      }

      try {
        const alCols = db.exec("PRAGMA table_info('activity_logs')");
        const alColNames = (alCols && alCols[0] && alCols[0].values) ? alCols[0].values.map(r => r[1]) : [];
        if (!alColNames.includes('log_id')) {
          console.log('SQLite migration: adding activity_logs.log_id column');
          db.run("ALTER TABLE activity_logs ADD COLUMN log_id INTEGER");
          try {
            db.run("UPDATE activity_logs SET log_id = activity_id WHERE activity_id IS NOT NULL");
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.warn('SQLite migration (activity_logs) check failed:', e?.message || e);
      }
    } catch (err) {
      console.warn('SQLite lightweight migrations failed:', err?.message || err);
    }

    if (dbPath) {
      try {
        const binary = db.export();
        fs.writeFileSync(dbPath, Buffer.from(binary));
      } catch (error) {
        console.warn('Unable to persist SQLite fallback database to disk:', error?.message || error);
      }
    }

    sqliteDb = db;
    return sqliteDb;
  })();

  return sqliteInitPromise;
}

export async function querySqliteFallback(sql, params = []) {
  const db = await initializeSqliteDatabase();
  const translated = translateSql(sql);
  const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(translated);

  if (isSelect) {
    const statement = db.prepare(translated);
    if (params && params.length > 0) {
      statement.bind(params);
    }

    const rows = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    statement.free();
    return rows;
  }

  const statement = db.prepare(translated);
  if (params && params.length > 0) {
    statement.bind(params);
  }
  statement.step();
  statement.free();

  if (sqliteDb) {
    try {
      const dbPath = getSqliteDbPath();
      const binary = sqliteDb.export();
      fs.writeFileSync(dbPath, Buffer.from(binary));
    } catch (error) {
      console.warn('Failed to persist SQLite fallback database after mutation:', error?.message || error);
    }
  }

  const lastInsertRowIdResult = db.exec('SELECT last_insert_rowid() AS insert_id');
  const insertId = lastInsertRowIdResult?.[0]?.values?.[0]?.[0] ?? 0;
  return { insertId, affectedRows: insertId > 0 ? 1 : 0 };
}

export function closeSqliteFallback() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    sqliteInitPromise = null;
  }
}
