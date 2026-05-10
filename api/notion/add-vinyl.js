const { Client } = require('@notionhq/client');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const notion = new Client({
      auth: process.env.NOTION_TOKEN
    });

    const data = JSON.parse(event.body);
    const { databaseId, vinyl } = data;

    // 构建 Notion 页面属性
    const properties = {
      Name: {
        title: [
          {
            text: {
              content: vinyl.title || 'Untitled'
            }
          }
        ]
      }
    };

    // 添加可选字段
    if (vinyl.artist) {
      properties.Artist = {
        rich_text: [
          {
            text: { content: vinyl.artist }
          }
        ]
      };
    }

    if (vinyl.year) {
      properties.Year = {
        number: parseInt(vinyl.year)
      };
    }

    if (vinyl.format) {
      properties.Format = {
        rich_text: [
          {
            text: { content: vinyl.format }
          }
        ]
      };
    }

    if (vinyl.formatText) {
      properties['Format Text'] = {
        rich_text: [
          {
            text: { content: vinyl.formatText }
          }
        ]
      };
    }

    if (vinyl.country) {
      properties.Country = {
        rich_text: [
          {
            text: { content: vinyl.country }
          }
        ]
      };
    }

    if (vinyl.label) {
      properties.Label = {
        rich_text: [
          {
            text: { content: vinyl.label }
          }
        ]
      };
    }

    if (vinyl.genre) {
      properties.Genre = {
        rich_text: [
          {
            text: { content: vinyl.genre }
          }
        ]
      };
    }

    if (vinyl.barcode) {
      properties.Barcode = {
        rich_text: [
          {
            text: { content: vinyl.barcode }
          }
        ]
      };
    }

    if (vinyl.coverImage) {
      properties['Cover Image'] = {
        url: vinyl.coverImage
      };
    }

    if (vinyl.discogsUrl) {
      properties['Discogs URL'] = {
        url: vinyl.discogsUrl
      };
    }

    if (vinyl.purchaseDate) {
      properties['Purchase Date'] = {
        date: {
          start: vinyl.purchaseDate
        }
      };
    }

    if (vinyl.purchasePrice) {
      properties['Purchase Price'] = {
        number: parseFloat(vinyl.purchasePrice)
      };
    }

    if (vinyl.purchaseSource) {
      properties['Purchase Source'] = {
        rich_text: [
          {
            text: { content: vinyl.purchaseSource }
          }
        ]
      };
    }

    if (vinyl.purchaseNote) {
      properties['Purchase Note'] = {
        rich_text: [
          {
            text: { content: vinyl.purchaseNote }
          }
        ]
      };
    }

    // 创建 Notion 页面
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pageId: response.id,
        url: response.url
      })
    };

  } catch (error) {
    console.error('Notion API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to add to Notion'
      })
    };
  }
};
