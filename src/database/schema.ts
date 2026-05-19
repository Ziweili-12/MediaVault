/**
 * SQLite Database Schema for MediaVault
 * 
 * Tables:
 * 1. vinyls - 黑胶记录
 * 2. movies - 电影/剧集记录
 * 3. sync_status - 同步状态追踪
 */

export const DATABASE_NAME = 'mediavault.db';

export const SCHEMA_VERSION = 1;

// 黑胶表
export const CREATE_TABLE_VINYLS = `
  CREATE TABLE IF NOT EXISTS vinyls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notion_page_id TEXT,
    album_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    version TEXT,
    cover_url TEXT,
    release_id INTEGER,
    barcode TEXT,
    purchase_date TEXT,
    price REAL,
    personal_rating INTEGER,
    genre TEXT,
    year INTEGER,
    release_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TEXT,
    needs_sync INTEGER DEFAULT 1
  );
`;

// 电影/剧集表
export const CREATE_TABLE_MOVIES = `
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notion_page_id TEXT,
    title TEXT NOT NULL,
    original_title TEXT,
    director TEXT,
    year INTEGER,
    release_date TEXT,
    type TEXT NOT NULL,
    tmdb_id INTEGER,
    imdb_id TEXT,
    poster_url TEXT,
    genre TEXT,
    country TEXT,
    runtime INTEGER,
    imdb_rating REAL,
    personal_rating INTEGER,
    watch_date TEXT,
    current_season INTEGER,
    current_episode INTEGER,
    watched_seasons TEXT,
    season_number INTEGER,
    season_poster TEXT,
    season_air_date TEXT,
    parent_tv_id INTEGER,
    status TEXT DEFAULT 'watched',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TEXT,
    needs_sync INTEGER DEFAULT 1
  );
`;

// 同步状态表
export const CREATE_TABLE_SYNC_STATUS = `
  CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    operation TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  );
`;

// 创建索引
export const CREATE_INDEX_VINYLS_NOTION = `
  CREATE INDEX IF NOT EXISTS idx_vinyls_notion ON vinyls(notion_page_id);
`;

export const CREATE_INDEX_MOVIES_NOTION = `
  CREATE INDEX IF NOT EXISTS idx_movies_notion ON movies(notion_page_id);
`;

export const CREATE_INDEX_SYNC_STATUS = `
  CREATE INDEX IF NOT EXISTS idx_sync_table_record ON sync_status(table_name, record_id);
`;

// 初始化数据库
export const INIT_QUERIES = [
  CREATE_TABLE_VINYLS,
  CREATE_TABLE_MOVIES,
  CREATE_TABLE_SYNC_STATUS,
  CREATE_INDEX_VINYLS_NOTION,
  CREATE_INDEX_MOVIES_NOTION,
  CREATE_INDEX_SYNC_STATUS,
];

// 数据库迁移
export const MIGRATION_QUERIES = [
  `ALTER TABLE movies ADD COLUMN original_title TEXT`,
  `ALTER TABLE movies ADD COLUMN tmdb_id INTEGER`,
  `ALTER TABLE movies ADD COLUMN country TEXT`,
  `ALTER TABLE movies ADD COLUMN release_date TEXT`,
  `ALTER TABLE movies ADD COLUMN watched_seasons TEXT`,
  `ALTER TABLE movies ADD COLUMN season_number INTEGER`,
  `ALTER TABLE movies ADD COLUMN season_poster TEXT`,
  `ALTER TABLE movies ADD COLUMN season_air_date TEXT`,
  `ALTER TABLE movies ADD COLUMN parent_tv_id INTEGER`,
  `ALTER TABLE vinyls ADD COLUMN year INTEGER`,
  `ALTER TABLE vinyls ADD COLUMN release_date TEXT`,
  `ALTER TABLE vinyls ADD COLUMN country TEXT`,
  `ALTER TABLE vinyls ADD COLUMN label TEXT`,
  `ALTER TABLE vinyls ADD COLUMN style TEXT`,
];

// 类型定义
export interface Vinyl {
  id?: number;
  notion_page_id?: string;
  album_name: string;
  artist: string;
  version?: string;
  cover_url?: string;
  release_id?: number;
  barcode?: string;
  purchase_date?: string;
  price?: number;
  personal_rating?: number;
  genre?: string;
  year?: number;
  release_date?: string;
  country?: string;
  label?: string;
  style?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  needs_sync?: number;
}

export interface Movie {
  id?: number;
  notion_page_id?: string;
  title: string;
  original_title?: string;
  director?: string;
  year?: number;
  release_date?: string;
  type: 'movie' | 'series';
  tmdb_id?: number;
  imdb_id?: string;
  poster_url?: string;
  genre?: string;
  country?: string;
  runtime?: number;
  imdb_rating?: number;
  personal_rating?: number;
  watch_date?: string;
  current_season?: number;
  current_episode?: number;
  watched_seasons?: string;
  season_number?: number;
  season_poster?: string;
  season_air_date?: string;
  parent_tv_id?: number;
  status?: 'want_to_watch' | 'watching' | 'watched';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  needs_sync?: number;
}
