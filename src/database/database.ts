import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, INIT_QUERIES, Vinyl, Movie } from './schema';

// 初始化数据库
export const initDatabase = async (): Promise<void> => {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // 执行所有初始化查询
    for (const query of INIT_QUERIES) {
      await db.execAsync(query);
    }
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// ============= 黑胶操作 =============

export const insertVinyl = async (vinyl: Vinyl): Promise<number> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const result = await db.runAsync(
    `INSERT INTO vinyls (
      album_name, artist, version, cover_url, release_id, barcode,
      purchase_date, price, personal_rating, genre, notes,
      notion_page_id, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      vinyl.album_name,
      vinyl.artist,
      vinyl.version || null,
      vinyl.cover_url || null,
      vinyl.release_id || null,
      vinyl.barcode || null,
      vinyl.purchase_date || null,
      vinyl.price || null,
      vinyl.personal_rating || null,
      vinyl.genre || null,
      vinyl.notes || null,
      vinyl.notion_page_id || null,
    ]
  );
  
  return result.lastInsertRowId;
};

export const getAllVinyls = async (): Promise<Vinyl[]> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const result = await db.getAllAsync('SELECT * FROM vinyls ORDER BY created_at DESC');
  return result as Vinyl[];
};

export const getVinylById = async (id: number): Promise<Vinyl | null> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const result = await db.getFirstAsync('SELECT * FROM vinyls WHERE id = ?', [id]);
  return result as Vinyl | null;
};

export const updateVinyl = async (id: number, vinyl: Partial<Vinyl>): Promise<void> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const fields = Object.keys(vinyl).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
  const values = Object.values(vinyl).filter((_, idx) => idx !== 0);
  
  await db.runAsync(
    `UPDATE vinyls SET ${fields}, updated_at = CURRENT_TIMESTAMP, needs_sync = 1 WHERE id = ?`,
    [...values, id]
  );
};

export const deleteVinyl = async (id: number): Promise<void> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.runAsync('DELETE FROM vinyls WHERE id = ?', [id]);
};

// ============= 电影操作 =============

export const insertMovie = async (movie: Movie): Promise<number> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const result = await db.runAsync(
    `INSERT INTO movies (
      title, director, year, type, imdb_id, poster_url, genre, runtime,
      imdb_rating, personal_rating, watch_date, current_season,
      current_episode, status, notes, notion_page_id, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      movie.title,
      movie.director || null,
      movie.year || null,
      movie.type,
      movie.imdb_id || null,
      movie.poster_url || null,
      movie.genre || null,
      movie.runtime || null,
      movie.imdb_rating || null,
      movie.personal_rating || null,
      movie.watch_date || null,
      movie.current_season || null,
      movie.current_episode || null,
      movie.status || 'watched',
      movie.notes || null,
      movie.notion_page_id || null,
    ]
  );
  
  return result.lastInsertRowId;
};

export const getAllMovies = async (type?: 'movie' | 'series'): Promise<Movie[]> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  let query = 'SELECT * FROM movies';
  const params: any[] = [];
  
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await db.getAllAsync(query, params);
  return result as Movie[];
};

export const getMovieById = async (id: number): Promise<Movie | null> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const result = await db.getFirstAsync('SELECT * FROM movies WHERE id = ?', [id]);
  return result as Movie | null;
};

export const updateMovie = async (id: number, movie: Partial<Movie>): Promise<void> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const fields = Object.keys(movie).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
  const values = Object.values(movie).filter((_, idx) => idx !== 0);
  
  await db.runAsync(
    `UPDATE movies SET ${fields}, updated_at = CURRENT_TIMESTAMP, needs_sync = 1 WHERE id = ?`,
    [...values, id]
  );
};

export const deleteMovie = async (id: number): Promise<void> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.runAsync('DELETE FROM movies WHERE id = ?', [id]);
};

// ============= 统计查询 =============

export const getVinylStats = async (): Promise<{
  total: number;
  totalSpent: number;
  artistCount: number;
  avgPrice: number;
}> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const result = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(price), 0) as totalSpent,
      COUNT(DISTINCT artist) as artistCount,
      COALESCE(AVG(price), 0) as avgPrice
    FROM vinyls
  `);
  
  return result as any;
};

export const getMovieStats = async (): Promise<{
  total: number;
  movieCount: number;
  seriesCount: number;
}> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const result = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) as movieCount,
      SUM(CASE WHEN type = 'series' THEN 1 ELSE 0 END) as seriesCount
    FROM movies
  `);
  
  return result as any;
};

// ============= 同步相关 =============

export const getUnsyncedRecords = async (table: 'vinyls' | 'movies'): Promise<any[]> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const result = await db.getAllAsync(
    `SELECT * FROM ${table} WHERE needs_sync = 1`
  );
  return result;
};

export const markAsSynced = async (table: 'vinyls' | 'movies', id: number): Promise<void> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.runAsync(
    `UPDATE ${table} SET needs_sync = 0, last_synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
};
