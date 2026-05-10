const { getPool } = require('../tidb');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const [rows] = await pool.query(
        'SELECT * FROM vinyls ORDER BY created_at DESC'
      );
      return res.status(200).json({ success: true, data: rows });
    }

    if (req.method === 'POST') {
      const { title, artist, release_date, format, cover_image, 
              purchase_date, purchase_price, rating, barcode, genre } = req.body;

      const [result] = await pool.query(
        `INSERT INTO vinyls (title, artist, release_date, format, cover_image, 
         purchase_date, purchase_price, rating, barcode, genre) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, artist, release_date, format, cover_image,
         purchase_date, purchase_price, rating, barcode, genre]
      );

      return res.status(200).json({ success: true, id: result.insertId });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('TiDB Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
