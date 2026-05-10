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

module.exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const pool = getPool();

    if (event.httpMethod === 'GET') {
      const [rows] = await pool.query('SELECT * FROM vinyls ORDER BY created_at DESC');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { title, artist, release_date, format, cover_image,
              purchase_date, purchase_price, rating, barcode, genre } = body;

      const [result] = await pool.query(
        `INSERT INTO vinyls (title, artist, release_date, format, cover_image,
         purchase_date, purchase_price, rating, barcode, genre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, artist, release_date, format, cover_image,
         purchase_date, purchase_price, rating, barcode, genre]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, id: result.insertId })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('TiDB Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
