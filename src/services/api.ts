import axios from 'axios';

// 从环境变量获取API Tokens (Expo SDK 52+ 使用 EXPO_PUBLIC_ 前缀)
const DISCOGS_TOKEN = process.env.EXPO_PUBLIC_DISCOGS_TOKEN || '';
const NOTION_API_KEY = process.env.EXPO_PUBLIC_NOTION_API_KEY || '';
const NOTION_VINYLS_DB_ID = process.env.EXPO_PUBLIC_NOTION_VINYLS_DB_ID || '';
const NOTION_MOVIES_DB_ID = process.env.EXPO_PUBLIC_NOTION_MOVIES_DB_ID || '';

// ============= Discogs API =============

interface DiscogsSearchResult {
  id: number;
  title: string;
  year?: number;
  format?: string[];
  genre?: string[];
  style?: string[];
  country?: string;
  cover_image?: string;
  thumb?: string;
  barcode?: string[];
  formats?: {
    name: string;
    qty: string;
    descriptions?: string[];
    text?: string;
  }[];
  released?: string; // 完整发行日期
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists: { name: string }[];
  year: number;
  released?: string; // 完整发行日期 YYYY-MM-DD
  genres: string[];
  styles: string[];
  images: { type: string; uri: string }[];
  formats: { name: string; descriptions: string[]; text?: string }[];
  labels: { name: string; catno: string }[];
  country?: string;
  identifiers?: { type: string; value: string }[];
  tracklist?: { position: string; title: string; duration: string }[];
}

export const searchDiscogsByBarcode = async (barcode: string): Promise<DiscogsRelease | null> => {
  try {
    const searchResponse = await axios.get('https://api.discogs.com/database/search', {
      params: {
        barcode: barcode,
        type: 'release',
        token: DISCOGS_TOKEN,
      },
    });

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      const firstResult = searchResponse.data.results[0];
      return await getDiscogsRelease(firstResult.id);
    }

    return null;
  } catch (error) {
    console.error('❌ Discogs barcode search failed:', error);
    return null;
  }
};

export const searchDiscogsByQuery = async (query: string): Promise<DiscogsSearchResult[]> => {
  try {
    const response = await axios.get('https://api.discogs.com/database/search', {
      params: {
        q: query,
        type: 'release',
        token: DISCOGS_TOKEN,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('❌ Discogs query search failed:', error);
    return [];
  }
};

export const getDiscogsRelease = async (releaseId: number): Promise<DiscogsRelease | null> => {
  try {
    const response = await axios.get(`https://api.discogs.com/releases/${releaseId}`, {
      params: {
        token: DISCOGS_TOKEN,
      },
    });

    return response.data;
  } catch (error) {
    console.error('❌ Discogs release fetch failed:', error);
    return null;
  }
};

// ============= TMDB API =============

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface TMDBSearchItem {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  origin_country?: string[];
}

interface TMDBMovieDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  origin_country?: string[];
  status: string;
  tagline: string;
  imdb_id?: string;
  created_by?: { id: number; name: string; original_name: string }[];
  seasons?: {
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string;
    poster_path?: string;
    overview?: string;
    vote_average?: number;
  }[];
  credits?: {
    cast: { name: string; original_name: string; character: string; profile_path?: string }[];
    crew: { name: string; original_name: string; job: string; department: string }[];
  };
}

// 剧集季详情
interface TMDBSeasonDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string;
  episodes: {
    episode_number: number;
    name: string;
    overview: string;
    air_date: string;
    runtime: number;
    vote_average: number;
    still_path: string | null;
    crew?: { name: string; original_name: string; job: string }[];
    guest_stars?: { name: string; original_name: string; character: string }[];
  }[];
  credits?: {
    cast: { name: string; original_name: string; character: string; profile_path?: string }[];
    crew: { name: string; original_name: string; job: string }[];
  };
}

const tmdbParams = {
  api_key: TMDB_API_KEY,
};

// 搜索影视（电影 + 剧集）
export const searchTMDB = async (query: string): Promise<TMDBSearchItem[]> => {
  try {
    const response = await axios.get(`${TMDB_BASE}/search/multi`, {
      params: {
        ...tmdbParams,
        query: query,
        language: 'zh-CN',
        include_adult: 'false',
        page: 1,
      },
    });
    return (response.data.results || []).filter(
      (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
    );
  } catch (error) {
    console.error('❌ TMDB search failed:', error);
    return [];
  }
};

// 获取影视详情 + 演职人员（合并调用）
export const getTMDBMovieDetails = async (
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<TMDBMovieDetails | null> => {
  try {
    const endpoint = type === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;
    const response = await axios.get(`${TMDB_BASE}/${endpoint}`, {
      params: {
        ...tmdbParams,
        language: 'zh-CN',
        append_to_response: 'credits',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ TMDB details fetch failed:', error);
    return null;
  }
};

// 获取海报 URL
export const getTMDBPosterUrl = (posterPath: string | null, size: string = 'w500'): string | undefined => {
  if (!posterPath) return undefined;
  return `${TMDB_IMG}/${size}${posterPath}`;
};

// 获取剧集的季列表
export const getTMDBSeasons = async (
  tvId: number
): Promise<
  {
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string;
    poster_path?: string;
    vote_average?: number;
  }[]
> => {
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tvId}`, {
      params: { ...tmdbParams, language: 'zh-CN' },
    });
    const seasons = response.data.seasons || [];
    return seasons.map((s: any) => ({
      season_number: s.season_number,
      name: s.name || `第${s.season_number}季`,
      episode_count: s.episode_count || 0,
      air_date: s.air_date || undefined,
      poster_path: s.poster_path || undefined,
      vote_average: s.vote_average || undefined,
    }));
  } catch (error) {
    console.error('❌ TMDB seasons fetch failed:', error);
    return [];
  }
};

// 获取单季详情（含该季演职人员）
export const getTMDBSeasonDetail = async (
  tvId: number,
  seasonNumber: number
): Promise<TMDBSeasonDetails | null> => {
  try {
    const response = await axios.get(`${TMDB_BASE}/tv/${tvId}/season/${seasonNumber}`, {
      params: {
        ...tmdbParams,
        language: 'zh-CN',
        append_to_response: 'credits',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ TMDB season detail fetch failed:', error);
    return null;
  }
};

// 从详情数据中提取导演/创作者列表
export const extractDirectors = (
  details: TMDBMovieDetails,
  type: 'movie' | 'tv'
): string[] => {
  const directors: string[] = [];

  // 从 credits.crew 提取 Director
  if (details.credits?.crew) {
    const d = details.credits.crew
      .filter((c: any) => c.job === 'Director')
      .map((c: any) => c.original_name || c.name);
    directors.push(...d);
  }

  // TV: 从 created_by 提取创作者
  if (type === 'tv' && details.created_by?.length) {
    const c = details.created_by.map((c: any) => c.original_name || c.name);
    directors.push(...c);
  }

  return [...new Set(directors)];
};

// 从季详情中提取该季的导演/主创
export const extractSeasonDirectors = (season: TMDBSeasonDetails): string[] => {
  const directors: string[] = [];

  // 从季的 credits.crew 提取
  if (season.credits?.crew) {
    const d = season.credits.crew
      .filter((c: any) => c.job === 'Director')
      .map((c: any) => c.original_name || c.name);
    directors.push(...d);
  }

  // 从各集的 crew 提取
  for (const ep of season.episodes) {
    if (ep.crew) {
      const d = ep.crew
        .filter((c: any) => c.job === 'Director')
        .map((c: any) => c.original_name || c.name);
      directors.push(...d);
    }
  }

  return [...new Set(directors)];
};

// 获取演职人员（兼容旧调用）
export const getTMDBCredits = async (
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<string[]> => {
  try {
    const details = await getTMDBMovieDetails(tmdbId, type);
    if (!details) return [];
    return extractDirectors(details, type);
  } catch (error) {
    console.error('❌ TMDB credits fetch failed:', error);
    return [];
  }
};

// 获取电影/剧集的海报列表
export const getTMDBImages = async (
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<string[]> => {
  try {
    const endpoint = type === 'movie' ? `movie/${tmdbId}/images` : `tv/${tmdbId}/images`;
    const response = await axios.get(`${TMDB_BASE}/${endpoint}`, {
      params: { ...tmdbParams, include_image_language: 'zh,en,null' },
    });
    const posters = response.data.posters || [];
    const sorted = posters.sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0));
    const seen = new Set<string>();
    return sorted
      .map((p: any) => p.file_path)
      .filter((fp: string) => {
        if (seen.has(fp)) return false;
        seen.add(fp);
        return true;
      });
  } catch (error) {
    console.error('❌ TMDB images fetch failed:', error);
    return [];
  }
};

// TMDB 搜索结果转为本地 Movie 格式
export const formatTMDBForMovie = (item: TMDBSearchItem | TMDBMovieDetails, type: 'movie' | 'tv') => {
  const isMovie = type === 'movie';
  const cnTitle = isMovie ? (item as any).title : (item as any).name;
  const originalTitle = isMovie ? (item as any).original_title : (item as any).original_name;
  const dateStr = isMovie ? (item as any).release_date : (item as any).first_air_date;
  const year = dateStr ? parseInt(dateStr.substring(0, 4)) : undefined;
  const posterUrl = getTMDBPosterUrl(item.poster_path);

  let country: string | undefined;
  if ((item as TMDBMovieDetails).production_countries?.length) {
    country = (item as TMDBMovieDetails).production_countries!.map((c: any) => c.name).join('/');
  } else if ((item as TMDBMovieDetails).origin_country?.length) {
    country = (item as TMDBMovieDetails).origin_country!.join('/');
  }

  let genre: string | undefined;
  if ((item as TMDBMovieDetails).genres?.length) {
    genre = (item as TMDBMovieDetails).genres.map((g: any) => g.name).join('/');
  }

  let runtime: number | undefined;
  if (isMovie && (item as TMDBMovieDetails).runtime) {
    runtime = (item as TMDBMovieDetails).runtime;
  } else if (!isMovie && (item as TMDBMovieDetails).episode_run_time?.length) {
    runtime = (item as TMDBMovieDetails).episode_run_time![0];
  }

  return {
    tmdb_id: item.id,
    title: cnTitle || originalTitle || '',
    original_title: originalTitle || '',
    year,
    release_date: dateStr || undefined,
    type: isMovie ? 'movie' as const : 'series' as const,
    poster_url: posterUrl,
    genre,
    runtime,
    imdb_rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
    imdb_id: (item as TMDBMovieDetails).imdb_id,
    country,
    current_season: !isMovie ? (item as TMDBMovieDetails).number_of_seasons : undefined,
    current_episode: !isMovie ? (item as TMDBMovieDetails).number_of_episodes : undefined,
  };
};

// ============= Notion API =============

interface NotionPage {
  id: string;
  properties: any;
}

export const createNotionPage = async (
  databaseId: string,
  properties: any,
  coverUrl?: string
): Promise<string | null> => {
  try {
    const payload: any = {
      parent: { database_id: databaseId },
      properties: properties,
    };

    if (coverUrl) {
      payload.cover = {
        type: 'external',
        external: { url: coverUrl },
      };
    }

    const response = await axios.post('https://api.notion.com/v1/pages', payload, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    return response.data.id;
  } catch (error: any) {
    console.error('❌ Notion page creation failed:', error.response?.data || error);
    return null;
  }
};

export const updateNotionPage = async (
  pageId: string,
  properties: any
): Promise<boolean> => {
  try {
    await axios.patch(
      `https://api.notion.com/v1/pages/${pageId}`,
      { properties },
      {
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      }
    );

    return true;
  } catch (error: any) {
    console.error('❌ Notion page update failed:', error.response?.data || error);
    return false;
  }
};

export const queryNotionDatabase = async (
  databaseId: string,
  filter?: any
): Promise<any[]> => {
  try {
    const payload: any = {
      filter: filter,
    };

    const response = await axios.post(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.results || [];
  } catch (error: any) {
    console.error('❌ Notion query failed:', error.response?.data || error);
    return [];
  }
};

// ============= 格式化工具 =============

export const formatVinylForNotion = (vinyl: any) => {
  return {
    'Album': {
      title: [{ text: { content: vinyl.album_name } }],
    },
    'Artist': {
      rich_text: [{ text: { content: vinyl.artist } }],
    },
    'Date': {
      date: vinyl.purchase_date ? { start: vinyl.purchase_date } : null,
    },
    'Version': {
      rich_text: vinyl.version ? [{ text: { content: vinyl.version } }] : [],
    },
    'Price': {
      number: vinyl.price || null,
    },
    'Cover': {
      files: vinyl.cover_url ? [{ type: 'external', name: 'cover', external: { url: vinyl.cover_url } }] : [],
    },
  };
};

export const formatMovieForNotion = (movie: any) => {
  return {
    'Title': {
      title: [{ text: { content: movie.title } }],
    },
    'Director/Creator': {
      rich_text: movie.director ? [{ text: { content: movie.director } }] : [],
    },
    'Year': {
      date: movie.year ? { start: `${movie.year}-01-01` } : null,
    },
    'Type': {
      select: { name: movie.type === 'movie' ? 'Movie' : 'TV Show' },
    },
    'IMDb ID': {
      rich_text: movie.imdb_id ? [{ text: { content: movie.imdb_id } }] : [],
    },
    'Poster': {
      files: movie.poster_url ? [{ type: 'external', name: 'poster', external: { url: movie.poster_url } }] : [],
    },
    'Rating': {
      number: movie.imdb_rating || null,
    },
    'Personal Rating': {
      number: movie.personal_rating || null,
    },
    'Watched Date': {
      date: movie.watch_date ? { start: movie.watch_date } : null,
    },
  };
};
