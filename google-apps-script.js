/**
 * Google Apps Script for Q&People Contact Form
 * This script receives form submissions and saves them to Notion database
 *
 * Setup Instructions:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Copy this code into the script editor
 * 4. Set up Script Properties (File > Project properties > Script properties):
 *    - NOTION_API_KEY: Your Notion integration token
 *    - NOTION_DATABASE_ID: Your Notion database ID (from the URL)
 * 5. Deploy as Web App (Deploy > New deployment)
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and update SCRIPT_URL in index.html
 */

// Notion API Configuration
const NOTION_API_KEY = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
const NOTION_DATABASE_ID = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID');
const NOTION_API_VERSION = '2022-06-28';

/**
 * Handle POST requests from the contact form
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Log the submission
    Logger.log('Received form submission: ' + JSON.stringify(data));

    // Send to Notion
    const notionResponse = createNotionPage(data);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Contact form submitted successfully',
      notionPageId: notionResponse.id
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error processing form submission: ' + error.toString());

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create a new page in Notion database
 */
function createNotionPage(formData) {
  const url = 'https://api.notion.com/v1/pages';

  const payload = {
    parent: {
      database_id: NOTION_DATABASE_ID
    },
    properties: {
      // Adjust these property names to match your Notion database schema
      "성함": {
        title: [
          {
            text: {
              content: formData.name
            }
          }
        ]
      },
      "이메일": {
        email: formData.email
      },
      "회사명": {
        rich_text: [
          {
            text: {
              content: formData.company
            }
          }
        ]
      },
      "전화번호": {
        phone_number: formData.phone
      },
      "직함": {
        rich_text: [
          {
            text: {
              content: formData.position
            }
          }
        ]
      },
      "문의내용": {
        rich_text: [
          {
            text: {
              content: formData.message
            }
          }
        ]
      },
      "접수일시": {
        date: {
          start: formData.timestamp
        }
      },
      "상태": {
        select: {
          name: "신규"
        }
      }
    }
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + NOTION_API_KEY,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_API_VERSION
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log('Notion API Response Code: ' + responseCode);
  Logger.log('Notion API Response Body: ' + responseBody);

  if (responseCode !== 200) {
    throw new Error('Notion API Error: ' + responseBody);
  }

  return JSON.parse(responseBody);
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Q&People Contact Form API is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify Notion connection
 */
function testNotionConnection() {
  const testData = {
    name: '테스트',
    email: 'test@example.com',
    company: '테스트 회사',
    phone: '010-0000-0000',
    position: '테스트 직함',
    message: '테스트 문의 내용입니다.',
    timestamp: new Date().toISOString()
  };

  try {
    const result = createNotionPage(testData);
    Logger.log('Test successful! Notion page created: ' + result.id);
    Logger.log('Page URL: ' + result.url);
  } catch (error) {
    Logger.log('Test failed: ' + error.toString());
  }
}
