const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  connectTimeout: 15000,
};

if (!config.host || !config.user || !config.database) {
  console.error('Missing database configuration. Set DB_* variables or Railway MYSQL* variables.');
  process.exit(1);
}

mysql.createConnection(config).then(async conn => {
  const [rows] = await conn.query('SHOW TABLES');
  console.log('Tables:', rows.map(r => Object.values(r)[0]).join(', '));
  const [u] = await conn.query('SELECT COUNT(*) as c FROM users');
  console.log('Users:', u[0].c);
  await conn.end();
}).catch(e => console.error('ERR:', e.message));
