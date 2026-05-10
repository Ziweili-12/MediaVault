const { Client } = require('@notionhq/client');

exports.handler = async function(event, context) {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN
  });

  try {
    const databaseId = event.queryStringParameters?.databaseId || process.env.NOTION_MUSIC_DB_ID;
    
    // 查询数据库中的所有页面
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending'
        }
      ],
      page_size: 100
    });

    // 转换 Notion 页面为前端数据格式
    const vinyls = response.results.map(page => {
      const props = page.properties;
      
      return {
        id: page.id,
        title: props.Name?.title?.[0]?.plain_text || '',
        artist: props.Artist?.rich_text?.[0]?.plain_text || '',
        year: props.Year?.number || '',
        format: props.Format?.rich_text?.[0]?.plain_text || '',
        formatText: props['Format Text']?.rich_text?.[0]?.plain_text || '',
        country: props.Country?.rich_text?.[0]?.plain_text || '',
        label: props.Label?.rich_text?.[0]?.plain_text || '',
        genre: props.Genre?.rich_text?.[0]?.plain_text || '',
        barcode: props.Barcode?.rich_text?.[0]?.plain_text || '',
        coverImage: props['Cover Image']?.url || '',
        discogsUrl: props['Discogs URL']?.url || '',
        purchaseDate: props['Purchase Date']?.date?.start || '',
        purchasePrice: props['Purchase Price']?.number || '',
        purchaseSource: props['Purchase Source']?.rich_text?.[0]?.plain_text || '',
        purchaseNote: props['Purchase Note']?.rich_text?.[0]?.plain_text || '',
        addedAt: page.created_time
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        vinyls: vinyls,
        hasMore: response.has_more,
        nextCursor: response.next_cursor
      })
    };

  } catch (error) {
    console.error('Notion API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to fetch from Notion',
        success: false
      })
    };
  }
};
