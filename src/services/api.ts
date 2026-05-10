import axios from 'axios';
import Constants from 'expo-constants';

// 从环境变量获取API Tokens
const DISCOGS_TOKEN = Constants.expoConfig?.extra?.DISCOGS_TOKEN || process.env.DISCOGS_TOKEN;
const NOTION_API_KEY = Constants.expoConfig?.extra?.NOTION_API_KEY || process.env.NOTION_API_KEY;
const NOTION_VINYLS_DB_ID = Constants.expoConfig?.extra?.NOTION_VINYLS_DB_ID || process.env.NOTION_VINYLS_DB_ID;
const NOTION_MOVIES_DB_ID = Constants.expoConfig?.extra?.NOTION_MOVIES_DB_ID || process.env.NOTION_MOVIES_DB_ID;

// ============= Discogs API =============

interface DiscogsSearchResult {
  id: number;
  title: string;
  artists: { name: string; }[];
  year: number;
  genres: string[];
  styles: string[];
  cover_image: string;
  thumb: string;
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists: { name: string; }[];
  year: number;
  genres: string[];
  styles: string[];
  images: { type: string; uri: string; }[];
  formats: { name: string; descriptions: string[]; }[];
}

export const searchDiscogsByBarcode = async (barcode: string): Promise<DiscogsRelease | null> => {
  try {
    // 先搜索
    const searchResponse = await axios.get('https://api.discogs.com/database/search', {
      params: {
        brcode: barcode,
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

// ============= OMDB API =============

interface OMDBMovie {
  Title: string;
  Director: string;
  Year: string;
  Type: string;
  Genre: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
  Runtime: string;
}

export const searchOMDBByTitle = async (title: string): Promise<OMDBMovie[]> => {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        s: title,
        apikey: Constants.expoConfig?.extra?.OMDB_API_KEY || process.env.OMDB_API_KEY,
      },
    });

    if (response.data.Response === 'True') {
      return response.data.Search || [];
    }

    return [];
  } catch (error) {
    console.error('❌ OMDB search failed:', error);
    return [];
  }
};

export const getOMDBMovieDetails = async (imdbID: string): Promise<OMDBMovie | null> => {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        i: imdbID,
        apikey: Constants.expoConfig?.extra?.OMDB_API_KEY || process.env.OMDB_API_KEY,
      },
    });

    if (response.data.Response === 'True') {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('❌ OMDB details fetch failed:', error);
    return null;
  }
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
