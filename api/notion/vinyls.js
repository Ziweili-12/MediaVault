const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_MUSIC_DB_ID;

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    });

    const vinyls = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        title: props['专辑名称']?.title?.[0]?.plain_text || '未知专辑',
        artist: props['艺人']?.title?.[0]?.plain_text || '未知艺人',
        year: props['发行年份']?.number || null,
        genre: props['风格']?.multi_select?.map(s => s.name) || [],
        purchaseDate: props['购买日期']?.date?.start || null,
        purchasePrice: props['购买价格']?.number || null,
        barcode: props['Barcode']?.rich_text?.[0]?.plain_text || null,
        version: props['版本信息']?.rich_text?.[0]?.plain_text || null,
        status: props['状态']?.select?.name || '已购',
        cover: page.cover?.external?.url || page.cover?.file?.url || null,
        createdAt: page.created_time
      };
    });

    res.status(200).json({ success: true, data: vinyls });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
