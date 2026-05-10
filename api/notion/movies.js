const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || process.env.NOTION_TOKEN;
  const databaseId = req.headers['x-database-id'] || process.env.NOTION_MOVIES_DB_ID;

  if (!token || !databaseId) {
    return res.status(400).json({ success: false, error: 'Missing configuration' });
  }

  const notion = new Client({ auth: token });

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    });

    const movies = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        title: props['名称']?.title?.[0]?.plain_text || '未知名称',
        type: props['类型']?.select?.name || 'Movie',
        director: props['导演']?.title?.[0]?.plain_text || '未知导演',
        year: props['年份']?.number || null,
        genres: props['类型标签']?.multi_select?.map(s => s.name) || [],
        myRating: props['我的评分']?.number || null,
        imdbRating: props['IMDb评分']?.number || null,
        doubanRating: props['豆瓣评分']?.number || null,
        watchedDate: props['观影日期']?.date?.start || null,
        status: props['状态']?.select?.name || '已看',
        poster: page.cover?.external?.url || page.cover?.file?.url || null,
        createdAt: page.created_time
      };
    });

    res.status(200).json({ success: true, data: movies });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
