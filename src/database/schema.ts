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
    notion_page_id TEXT, -- Notion页面ID（用于双向同步）
    album_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    version TEXT, -- 版本信息
    cover_url TEXT, -- Discogs封面URL
    release_id INTEGER, -- Discogs release ID
    barcode TEXT, -- 条形码
    purchase_date TEXT, -- 购买日期
    price REAL, -- 价格
    personal_rating INTEGER, -- 个人评分 (1-5)
    genre TEXT, -- 流派（从Discogs获取）
    notes TEXT, -- 备注
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TEXT, -- 最后同步时间
    needs_sync INTEGER DEFAULT 1 -- 是否需要同步到Notion (0/1)
  );
`;

// 电影/剧集表
export const CREATE_TABLE_MOVIES = `
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notion_page_id TEXT, -- Notion页面ID
    title TEXT NOT NULL,
    director TEXT,
    year INTEGER,
    type TEXT NOT NULL, -- 'movie' or 'series'
    imdb_id TEXT, -- OMDB的IMDb ID
    poster_url TEXT, -- 海报URL
    genre TEXT, -- 类型
    runtime INTEGER, -- 时长（分钟）
    imdb_rating REAL, -- IMDb评分
    personal_rating INTEGER, -- 个人评分 (1-5)
    watch_date TEXT, -- 观看日期
    current_season INTEGER, -- 当前季数（剧集）
    current_episode INTEGER, -- 当前集数（剧集）
    status TEXT DEFAULT 'watched', -- 'want_to_watch', 'watching', 'watched'
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
    table_name TEXT NOT NULL, -- 'vinyls' or 'movies'
    record_id INTEGER NOT NULL, -- 对应记录的ID
    operation TEXT NOT NULL, -- 'create', 'update', 'delete'
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0 -- 0=未同步, 1=已同步
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

// 类型定义（TypeScript）
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
  director?: string;
  year?: number;
  type: 'movie' | 'series';
  imdb_id?: string;
  poster_url?: string;
  genre?: string;
  runtime?: number;
  imdb_rating?: number;
  personal_rating?: number;
  watch_date?: string;
  current_season?: number;
  current_episode?: number;
  status?: 'want_to_watch' | 'watching' | 'watched';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  needs_sync?: number;
}
