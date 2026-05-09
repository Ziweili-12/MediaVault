const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_MOVIES_DB_ID;

  const { title, type, director, year, genres, myRating, imdbRating, doubanRating, watchedDate } = req.body;

  try {
    const properties = {
      '名称': { title: [{ text: { content: title } }] },
      '类型': { select: { name: type || 'Movie' } },
      '导演': { title: [{ text: { content: director } }] },
      '年份': { number: year },
      '类型标签': { multi_select: (genres || []).map(g => ({ name: g })) },
      '我的评分': { number: myRating },
      '状态': { select: { name: '已看' } }
    };

    if (watchedDate) {
      properties['观影日期'] = { date: { start: watchedDate } };
    }

    if (imdbRating) {
      properties['IMDb评分'] = { number: imdbRating };
    }

    if (doubanRating) {
      properties['豆瓣评分'] = { number: doubanRating };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
