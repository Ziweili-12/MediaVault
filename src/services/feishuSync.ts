// 飞书多维表格同步服务
const FEISHU_CONFIG = {
  APP_ID: 'cli_aa8c5e602d781cca',
  APP_SECRET: 'ylNMYcj08SLLjO2IyqB7RcdAstyvWvch',
  APP_TOKEN: 'P46XbhU5iaBAtCsafB1cWPmlnJc',
  TABLES: {
    vinyls: 'tbl7VboqwjYe9pvc',
    movies: 'tblXvo9OtuGxBtcA'
  }
};

const BASE_URL = 'https://open.feishu.cn/open-apis';

class FeishuSyncService {
  private tenantToken: string | null = null;
  private tokenExpireTime: number = 0;

  // 获取 tenant_access_token
  async getToken(): Promise<string> {
    if (this.tenantToken && Date.now() < this.tokenExpireTime) {
      return this.tenantToken;
    }

    const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.APP_ID,
        app_secret: FEISHU_CONFIG.APP_SECRET
      })
    });

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`获取 token 失败: ${data.msg}`);
    }

    this.tenantToken = data.tenant_access_token;
    this.tokenExpireTime = Date.now() + (data.expire - 60) * 1000; // 提前60秒刷新
    return this.tenantToken;
  }

  // 获取请求头
  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ==================== 黑胶唱片操作 ====================

  // 从飞书获取所有黑胶唱片
  async getAllVinylsFromFeishu(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLES.vinyls}/records?page_size=500`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.code === 0) {
        return data.data.items.map((item: any) => {
          const f = item.fields;
          return {
            feishu_record_id: item.record_id,
            album_name: f['专辑名'] || '',
            artist: f['艺术家'] || '',
            release_date: f['发行日期'] || '',
            cover_url: f['封面']?.link || f['封面'] || '',
            purchase_price: f['购入价'] || null,
            purchase_date: f['购入日期'] ? new Date(f['购入日期']).toISOString().split('T')[0] : '',
            price: f['价格'] || null,
            version: f['版本'] || '',
            notes: f['备注'] || ''
          };
        });
      }
      return [];
    } catch (error) {
      console.error('获取黑胶失败:', error);
      return [];
    }
  }

  // 清理飞书黑胶重复记录（按专辑名+艺术家）
  async deduplicateVinylsInFeishu(): Promise<{ deleted: number; kept: number }> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES.vinyls;
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records?page_size=500`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.code !== 0 || !data.data.items) {
        return { deleted: 0, kept: 0 };
      }

      const items = data.data.items;
      const seen = new Map<string, any>();
      const toDelete: string[] = [];

      for (const item of items) {
        const f = item.fields;
        const key = `${f['专辑名'] || ''}|${f['艺术家'] || ''}`;
        if (!key) continue;
        
        if (seen.has(key)) {
          toDelete.push(item.record_id);
        } else {
          seen.set(key, item);
        }
      }

      let deleted = 0;
      for (const recordId of toDelete) {
        const success = await this.deleteRecord('vinyls', recordId);
        if (success) deleted++;
      }

      return { deleted, kept: seen.size };
    } catch (error) {
      console.error('清理黑胶重复失败:', error);
      return { deleted: 0, kept: 0 };
    }
  }

  // 同步黑胶到飞书（去重：按专辑名+艺术家判断是否已存在）
  async syncVinylToFeishu(vinyl: any): Promise<string | null> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES.vinyls;
      
      // 先查询是否已存在相同记录（专辑名 + 艺术家）
      const queryUrl = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records?page_size=500`;
      const queryRes = await fetch(queryUrl, { headers });
      const queryData = await queryRes.json();
      
      let existingRecordId: string | null = null;
      if (queryData.code === 0 && queryData.data.items) {
        const match = queryData.data.items.find((item: any) => {
          const f = item.fields;
          return (f['专辑名'] || '') === (vinyl.album_name || '') && 
                 (f['艺术家'] || '') === (vinyl.artist || '');
        });
        if (match) {
          existingRecordId = match.record_id;
        }
      }
      
      const fields: any = {
        '专辑名': vinyl.album_name || '',
        '艺术家': vinyl.artist || '',
        '发行日期': vinyl.release_date || '',
        '封面': vinyl.cover_url ? { link: vinyl.cover_url, text: vinyl.cover_url } : null,
        '购入价': vinyl.purchase_price ? parseFloat(vinyl.purchase_price) : null,
        '价格': vinyl.price ? parseFloat(vinyl.price) : null,
        '版本': vinyl.version || '',
        '备注': vinyl.notes || ''
      };

      if (vinyl.purchase_date) {
        const date = new Date(vinyl.purchase_date);
        fields['购入日期'] = date.getTime();
      }

      if (existingRecordId) {
        // 更新已有记录
        const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records/${existingRecordId}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ fields })
        });
        const data = await response.json();
        return data.code === 0 ? existingRecordId : null;
      } else {
        // 创建新记录
        const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records`;
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ fields })
        });
        const data = await response.json();
        if (data.code === 0) {
          return data.data.record.record_id;
        }
        console.error('同步黑胶失败:', data.msg);
        return null;
      }
    } catch (error) {
      console.error('同步黑胶异常:', error);
      return null;
    }
  }

  // ==================== 影视操作 ====================

  // 同步影视到飞书（去重：按标题+原名判断是否已存在）
  async syncMovieToFeishu(movie: any): Promise<string | null> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES.movies;
      
      // 先查询是否已存在相同记录（标题 + 原名）
      const queryUrl = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records?page_size=500`;
      const queryRes = await fetch(queryUrl, { headers });
      const queryData = await queryRes.json();
      
      let existingRecordId: string | null = null;
      if (queryData.code === 0 && queryData.data.items) {
        const match = queryData.data.items.find((item: any) => {
          const f = item.fields;
          return (f['标题'] || '') === (movie.title || '') && 
                 (f['原名'] || '') === (movie.original_title || '');
        });
        if (match) {
          existingRecordId = match.record_id;
        }
      }
      
      const fields: any = {
        '标题': movie.title || '',
        '原名': movie.original_title || '',
        '中文名': movie.chinese_title || '',
        '类型': movie.type || 'movie',
        '上映日期': movie.release_date || '',
        '海报': movie.poster_url ? { link: movie.poster_url, text: movie.poster_url } : null,
        '国家': movie.country || '',
        '评分': movie.personal_rating ? parseFloat(movie.personal_rating) : (movie.imdb_rating ? parseFloat(movie.imdb_rating) : null),
        '观看状态': movie.watch_status || '想看',
        '观看日期': movie.watch_date || '',
        '当前季': movie.current_season || '',
        '备注': movie.notes || ''
      };

      if (movie.watch_date) {
        const date = new Date(movie.watch_date);
        fields['观看日期'] = date.getTime();
      }

      if (existingRecordId) {
        // 更新已有记录
        const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records/${existingRecordId}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ fields })
        });
        const data = await response.json();
        return data.code === 0 ? existingRecordId : null;
      } else {
        // 创建新记录
        const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records`;
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ fields })
        });
        const data = await response.json();
        if (data.code === 0) {
          return data.data.record.record_id;
        }
        console.error('同步影视失败:', data.msg);
        return null;
      }
    } catch (error) {
      console.error('同步影视异常:', error);
      return null;
    }
  }

  // 从飞书获取所有影视
  async getAllMoviesFromFeishu(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLES.movies}/records?page_size=500`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.code === 0) {
        return data.data.items.map((item: any) => {
          const f = item.fields;
          return {
            feishu_record_id: item.record_id,
            title: f['标题'] || '',
            original_title: f['原名'] || '',
            chinese_title: f['中文名'] || '',
            type: f['类型'] || 'movie',
            release_date: f['上映日期'] || '',
            poster_url: f['海报']?.link || f['海报'] || '',
            country: f['国家'] || '',
            rating: f['评分'] || null,
            watch_status: f['观看状态'] || '想看',
            watch_date: f['观看日期'] ? new Date(f['观看日期']).toISOString().split('T')[0] : '',
            current_season: f['当前季'] || '',
            notes: f['备注'] || ''
          };
        });
      }
      return [];
    } catch (error) {
      console.error('获取影视失败:', error);
      return [];
    }
  }

  // 清理飞书影视重复记录（按标题+原名）
  async deduplicateMoviesInFeishu(): Promise<{ deleted: number; kept: number }> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES.movies;
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records?page_size=500`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.code !== 0 || !data.data.items) {
        return { deleted: 0, kept: 0 };
      }

      const items = data.data.items;
      const seen = new Map<string, any>();
      const toDelete: string[] = [];

      for (const item of items) {
        const f = item.fields;
        const key = `${f['标题'] || ''}|${f['原名'] || ''}`;
        if (!key) continue;
        
        if (seen.has(key)) {
          toDelete.push(item.record_id);
        } else {
          seen.set(key, item);
        }
      }

      let deleted = 0;
      for (const recordId of toDelete) {
        const success = await this.deleteRecord('movies', recordId);
        if (success) deleted++;
      }

      return { deleted, kept: seen.size };
    } catch (error) {
      console.error('清理影视重复失败:', error);
      return { deleted: 0, kept: 0 };
    }
  }

  // ==================== 通用操作 ====================

  // 删除记录
  async deleteRecord(tableType: 'vinyls' | 'movies', recordId: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES[tableType];
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records/${recordId}`;
      
      const response = await fetch(url, { method: 'DELETE', headers });
      const data = await response.json();
      return data.code === 0;
    } catch (error) {
      console.error('删除记录失败:', error);
      return false;
    }
  }

  // 更新记录
  async updateRecord(tableType: 'vinyls' | 'movies', recordId: string, fields: any): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const tableId = FEISHU_CONFIG.TABLES[tableType];
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${tableId}/records/${recordId}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fields })
      });
      const data = await response.json();
      return data.code === 0;
    } catch (error) {
      console.error('更新记录失败:', error);
      return false;
    }
  }
}

export default new FeishuSyncService();
export { FEISHU_CONFIG };
