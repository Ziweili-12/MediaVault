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
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
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
      console.log('GET request received');
      const [rows] = await pool.query('SELECT * FROM vinyls ORDER BY created_at DESC');
      console.log(`Found ${rows.length} records`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    if (event.httpMethod === 'POST') {
      console.log('POST request received');
      
      if (!event.body) {
        console.log('Error: No body in request');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Missing request body' })
        };
      }

      let body;
      try {
        body = JSON.parse(event.body);
      } catch (parseError) {
        console.log('Error parsing JSON:', parseError.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid JSON format' })
        };
      }

      console.log('Received data:', JSON.stringify(body));

      const { title, artist, release_date, format, cover_image,
              purchase_date, purchase_price, rating, barcode, genre } = body;

      if (!title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Title is required' })
        };
      }

      try {
        const [result] = await pool.query(
          `INSERT INTO vinyls (title, artist, release_date, format, cover_image,
           purchase_date, purchase_price, rating, barcode, genre)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, artist, release_date, format, cover_image,
           purchase_date, purchase_price, rating, barcode, genre]
        );

        console.log('Insert result:', result);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, id: result.insertId })
        };
      } catch (dbError) {
        console.log('Database error:', dbError.message);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: 'Database error: ' + dbError.message })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error: ' + error.message })
    };
  }
};
