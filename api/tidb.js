const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.TIDB_HOST,
      port: parseInt(process.env.TIDB_PORT || '4000'),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'mediavault',
      ssl: {
        minVersion: 'TLSv1.2'
      }
    });
  }
  return pool;
}

module.exports = { getPool };
