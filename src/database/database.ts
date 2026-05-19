import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, INIT_QUERIES, MIGRATION_QUERIES, Vinyl, Movie } from './schema';

// 初始化数据库
export const initDatabase = async (): Promise<void> => {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // 执行所有初始化查询
    for (const query of INIT_QUERIES) {
      await db.execAsync(query);
    }
    
    // 执行迁移（新增列，已存在则跳过）
    for (const query of MIGRATION_QUERIES) {
      try {
        await db.execAsync(query);
      } catch (e) {
        // 列已存在，忽略错误
      }
    }

    // 数据迁移：修复 YYYYMMDD → YYYY-MM-DD 格式
    try {
      await db.execAsync(`
        UPDATE vinyls SET purchase_date = substr(purchase_date,1,4)||'-'||substr(purchase_date,5,2)||'-'||substr(purchase_date,7,2)
        WHERE length(purchase_date)=8 AND purchase_date NOT LIKE '%-%'
      `);
      await db.execAsync(`
        UPDATE movies SET watch_date = substr(watch_date,1,4)||'-'||substr(watch_date,5,2)||'-'||substr(watch_date,7,2)
        WHERE length(watch_date)=8 AND watch_date NOT LIKE '%-%'
      `);
      await db.execAsync(`
        UPDATE movies SET release_date = substr(release_date,1,4)||'-'||substr(release_date,5,2)||'-'||substr(release_date,7,2)
        WHERE length(release_date)=8 AND release_date NOT LIKE '%-%'
      `);
      await db.execAsync(`
        UPDATE vinyls SET release_date = substr(release_date,1,4)||'-'||substr(release_date,5,2)||'-'||substr(release_date,7,2)
        WHERE length(release_date)=8 AND release_date NOT LIKE '%-%'
      `);
    } catch (e) {
      // 忽略迁移错误
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
      purchase_date, price, personal_rating, genre, year, release_date,
      country, label, style, notes,
      notion_page_id, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
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
      vinyl.year || null,
      vinyl.release_date || null,
      vinyl.country || null,
      vinyl.label || null,
      vinyl.style || null,
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
  
  const entries = Object.entries(vinyl).filter(([key]) => key !== 'id');
  const fields = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  
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
      title, original_title, director, year, release_date, type, tmdb_id, imdb_id,
      poster_url, genre, country, runtime,
      imdb_rating, personal_rating, watch_date, current_season,
      current_episode, status, notes, notion_page_id, watched_seasons, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      movie.title,
      movie.original_title || null,
      movie.director || null,
      movie.year || null,
      movie.release_date || null,
      movie.type,
      movie.tmdb_id || null,
      movie.imdb_id || null,
      movie.poster_url || null,
      movie.genre || null,
      movie.country || null,
      movie.runtime || null,
      movie.imdb_rating || null,
      movie.personal_rating || null,
      movie.watch_date || null,
      movie.current_season || null,
      movie.current_episode || null,
      movie.status || 'watched',
      movie.notes || null,
      movie.notion_page_id || null,
      movie.watched_seasons || null,
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
  
  const entries = Object.entries(movie).filter(([key]) => key !== 'id');
  const fields = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  
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

// ============= 带时间筛选的统计查询 =============

export const getVinylStatsFiltered = async (year?: number): Promise<{
  total: number;
  totalSpent: number;
  artistCount: number;
}> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // 兼容 YYYYMMDD 和 YYYY-MM-DD
  const dateExpr = `CASE WHEN purchase_date IS NULL THEN created_at WHEN length(purchase_date)=8 AND purchase_date NOT LIKE '%-%' THEN substr(purchase_date,1,4)||'-'||substr(purchase_date,5,2)||'-'||substr(purchase_date,7,2) ELSE purchase_date END`;
  const yearFilter = year ? `WHERE strftime('%Y', ${dateExpr}) = ?` : '';
  const params = year ? [String(year)] : [];
  const result = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(price), 0) as totalSpent,
      COUNT(DISTINCT artist) as artistCount
    FROM vinyls
    ${yearFilter}
  `, params);
  return result as any;
};

export const getMovieStatsFiltered = async (year?: number): Promise<{
  total: number;
  movieCount: number;
  seriesCount: number;
}> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const dateExpr = `CASE WHEN watch_date IS NULL THEN created_at WHEN length(watch_date)=8 AND watch_date NOT LIKE '%-%' THEN substr(watch_date,1,4)||'-'||substr(watch_date,5,2)||'-'||substr(watch_date,7,2) ELSE watch_date END`;
  const yearFilter = year ? `WHERE strftime('%Y', ${dateExpr}) = ?` : '';
  const params = year ? [String(year)] : [];
  const result = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) as movieCount,
      SUM(CASE WHEN type = 'series' THEN 1 ELSE 0 END) as seriesCount
    FROM movies
    ${yearFilter}
  `, params);
  return result as any;
};

export const getVinylMonthlyData = async (year?: number): Promise<{ month: number; count: number }[]> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const dateExpr = `CASE WHEN purchase_date IS NULL THEN created_at WHEN length(purchase_date)=8 AND purchase_date NOT LIKE '%-%' THEN substr(purchase_date,1,4)||'-'||substr(purchase_date,5,2)||'-'||substr(purchase_date,7,2) ELSE purchase_date END`;
  const yearFilter = year ? `WHERE ${dateExpr} IS NOT NULL AND strftime('%Y', ${dateExpr}) = ?` : `WHERE ${dateExpr} IS NOT NULL`;
  const params = year ? [String(year)] : [];
  const result = await db.getAllAsync(`
    SELECT 
      CAST(strftime('%m', ${dateExpr}) AS INTEGER) as month,
      COUNT(*) as count
    FROM vinyls
    ${yearFilter}
    GROUP BY strftime('%m', ${dateExpr})
    ORDER BY month
  `, params);
  return result as any;
};

export const getMovieMonthlyData = async (year?: number): Promise<{ month: number; count: number }[]> => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const dateExpr = `CASE WHEN watch_date IS NULL THEN created_at WHEN length(watch_date)=8 AND watch_date NOT LIKE '%-%' THEN substr(watch_date,1,4)||'-'||substr(watch_date,5,2)||'-'||substr(watch_date,7,2) ELSE watch_date END`;
  const yearFilter = year ? `WHERE ${dateExpr} IS NOT NULL AND strftime('%Y', ${dateExpr}) = ?` : `WHERE ${dateExpr} IS NOT NULL`;
  const params = year ? [String(year)] : [];
  const result = await db.getAllAsync(`
    SELECT 
      CAST(strftime('%m', ${dateExpr}) AS INTEGER) as month,
      COUNT(*) as count
    FROM movies
    ${yearFilter}
    GROUP BY strftime('%m', ${dateExpr})
    ORDER BY month
  `, params);
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
