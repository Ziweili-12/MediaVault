const { getPool } = require('../../tidb');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlParts = req.url.split('/');
  const id = urlParts[urlParts.length - 1];

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  try {
    const pool = getPool();

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM movies WHERE id = ?', [id]);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { title, director, release_date, type, poster_url,
              imdb_id, my_rating, watch_date, genre, country, runtime, plot } = req.body;

      await pool.query(
        `UPDATE movies SET title=?, director=?, release_date=?, type=?, poster_url=?,
         imdb_id=?, my_rating=?, watch_date=?, genre=?, country=?, runtime=?, plot=? WHERE id=?`,
        [title, director, release_date, type, poster_url,
         imdb_id, my_rating, watch_date, genre, country, runtime, plot, id]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('TiDB Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
