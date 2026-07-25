(async function(){
  try {
    const initSqlJs = require('sql.js');
    const path = require('path');
    const fs = require('fs');

    function locateWasm() {
      const candidates = [
        path.resolve(__dirname, '..', 'sql-wasm.wasm'),
        path.resolve(__dirname, '..', 'lib', 'sql-wasm.wasm'),
        path.resolve(__dirname, '..', 'public', 'sql-wasm.wasm'),
        path.resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        path.resolve(process.cwd(), 'sql-wasm.wasm')
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
      return candidates[0];
    }

    const wasmPath = locateWasm();
    console.log('Using wasm at', wasmPath);
    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const dbPath = path.resolve(__dirname, '..', 'skillsconnect.db');
    if (!fs.existsSync(dbPath)) {
      console.error('DB file not found at', dbPath);
      process.exit(2);
    }
    const buf = fs.readFileSync(dbPath);
    const db = new SQL.Database(buf);
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    if (!res || res.length === 0) {
      console.log('No tables found');
      process.exit(0);
    }
    const tableNames = res[0].values.map(r => r[0]);
    console.log('tables:', tableNames.join(', '));

    // Show row count for key tables
    const keys = ['users','artisan_profiles','enquiries','notifications','reviews'];
    for (const t of keys) {
      try {
        const q = db.exec(`SELECT count(*) as c FROM ${t}`);
        const c = q && q[0] && q[0].values && q[0].values[0] ? q[0].values[0][0] : 0;
        console.log(`${t}: ${c}`);
      } catch (e) {
        console.log(`${t}: (missing)`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('inspect_sqlite error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
