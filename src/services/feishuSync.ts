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

  // 同步黑胶唱片到飞书
  async syncVinylToFeishu(vinyl: any): Promise<string | null> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLES.vinyls}/records`;
      
      const fields: any = {
        album_name: vinyl.album_name || '',
        artist: vinyl.artist || '',
        year: vinyl.year ? parseInt(vinyl.year) : null,
        cover_url: vinyl.cover_url || '',
        purchase_price: vinyl.purchase_price ? parseFloat(vinyl.purchase_price) : null,
        version: vinyl.version || '',
        notes: vinyl.notes || ''
      };

      if (vinyl.purchase_date) {
        // 转换日期为时间戳（毫秒）
        const date = new Date(vinyl.purchase_date);
        fields.purchase_date = date.getTime();
      }

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
    } catch (error) {
      console.error('同步黑胶异常:', error);
      return null;
    }
  }

  // 从飞书获取所有黑胶唱片
  async getAllVinylsFromFeishu(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLES.vinyls}/records?page_size=500`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.code === 0) {
        return data.data.items.map((item: any) => ({
          feishu_record_id: item.record_id,
          ...item.fields
        }));
      }
      return [];
    } catch (error) {
      console.error('获取黑胶失败:', error);
      return [];
    }
  }

  // ==================== 影视操作 ====================

  // 同步影视到飞书
  async syncMovieToFeishu(movie: any): Promise<string | null> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLES.movies}/records`;
      
      const fields: any = {
        title: movie.title || '',
        chinese_title: movie.chinese_title || '',
        type: movie.type || 'movie',
        year: movie.year ? parseInt(movie.year) : null,
        poster_url: movie.poster_url || '',
        country: movie.country || '',
        rating: movie.rating ? parseFloat(movie.rating) : null,
        watch_status: movie.watch_status || '想看',
        season: movie.season || '',
        notes: movie.notes || ''
      };

      if (movie.watch_date) {
        const date = new Date(movie.watch_date);
        fields.watch_date = date.getTime();
      }

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
        return data.data.items.map((item: any) => ({
          feishu_record_id: item.record_id,
          ...item.fields
        }));
      }
      return [];
    } catch (error) {
      console.error('获取影视失败:', error);
      return [];
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
