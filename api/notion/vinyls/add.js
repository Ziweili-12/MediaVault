const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = req.headers['authorization']?.replace('Bearer ', '') || process.env.NOTION_TOKEN;
  const databaseId = req.headers['x-database-id'] || process.env.NOTION_MUSIC_DB_ID;

  if (!token || !databaseId) {
    return res.status(400).json({ success: false, error: 'Missing configuration' });
  }

  const notion = new Client({ auth: token });

  const { title, artist, year, genre, purchaseDate, purchasePrice, barcode, version } = req.body;

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        '专辑名称': { title: [{ text: { content: title } }] },
        '艺人': { title: [{ text: { content: artist } }] },
        '发行年份': { number: year },
        '风格': { multi_select: genre?.map(g => ({ name: g })) || [] },
        '购买日期': { date: { start: purchaseDate } },
        '购买价格': { number: purchasePrice },
        'Barcode': { rich_text: [{ text: { content: barcode || '' } }] },
        '版本信息': { rich_text: [{ text: { content: version || '' } }] },
        '状态': { select: { name: '已购' } }
      }
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
