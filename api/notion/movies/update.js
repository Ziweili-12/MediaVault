const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const { id, ...fields } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing page ID' });
  }

  try {
    const properties = {};

    if (fields.title !== undefined) {
      properties['名称'] = { title: [{ text: { content: fields.title } }] };
    }
    if (fields.director !== undefined) {
      properties['导演'] = { title: [{ text: { content: fields.director } }] };
    }
    if (fields.type !== undefined) {
      properties['类型'] = { select: { name: fields.type } };
    }
    if (fields.year !== undefined) {
      properties['年份'] = { number: fields.year };
    }
    if (fields.watchedDate !== undefined) {
      properties['观影日期'] = { date: { start: fields.watchedDate || null } };
    }
    if (fields.myRating !== undefined) {
      properties['我的评分'] = { number: fields.myRating };
    }
    if (fields.imdbRating !== undefined) {
      properties['IMDb评分'] = { number: fields.imdbRating };
    }
    if (fields.doubanRating !== undefined) {
      properties['豆瓣评分'] = { number: fields.doubanRating };
    }
    if (fields.genres !== undefined) {
      properties['类型标签'] = { multi_select: (fields.genres || []).map(g => ({ name: g })) };
    }

    const response = await notion.pages.update({
      page_id: id,
      properties
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
