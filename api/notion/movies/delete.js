const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const pageId = req.query.id || req.body?.id;

  if (!pageId) {
    return res.status(400).json({ success: false, error: 'Missing page ID' });
  }

  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true
    });

    res.status(200).json({ success: true, message: 'Page archived successfully' });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
