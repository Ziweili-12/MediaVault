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
      properties['专辑名称'] = { title: [{ text: { content: fields.title } }] };
    }
    if (fields.artist !== undefined) {
      properties['艺人'] = { title: [{ text: { content: fields.artist } }] };
    }
    if (fields.year !== undefined) {
      properties['发行年份'] = { number: fields.year };
    }
    if (fields.purchasePrice !== undefined) {
      properties['购买价格'] = { number: fields.purchasePrice };
    }
    if (fields.barcode !== undefined) {
      properties['Barcode'] = { rich_text: [{ text: { content: fields.barcode } }] };
    }
    if (fields.version !== undefined) {
      properties['版本信息'] = { rich_text: [{ text: { content: fields.version } }] };
    }
    if (fields.purchaseDate !== undefined) {
      properties['购买日期'] = { date: { start: fields.purchaseDate || null } };
    }
    if (fields.genre !== undefined) {
      properties['风格'] = { multi_select: (fields.genre || []).map(g => ({ name: g })) };
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
