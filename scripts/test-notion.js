#!/usr/bin/env node

const { Client } = require('@notionhq/client');

// Load environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) {
  console.error('❌ NOTION_TOKEN environment variable is not set');
  console.error('Please add NOTION_TOKEN=secret_your_token_here to your .env file');
  process.exit(1);
}

console.log('🔍 Testing Notion Integration...');
console.log('=====================================');

// Initialize Notion client
const notion = new Client({
  auth: NOTION_TOKEN,
});

async function testNotionConnection() {
  try {
    // Test 1: Basic authentication
    console.log('1️⃣ Testing authentication...');
    const response = await notion.users.me({});
    console.log(`✅ Authentication successful!`);
    console.log(`   User: ${response.name || 'Unknown'}`);
    console.log(`   Email: ${response.person?.email || 'N/A'}`);
    console.log(`   Type: ${response.type}`);
    console.log('');

    // Test 2: List databases
    console.log('2️⃣ Listing accessible databases...');
    const databases = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      }
    });
    
    if (databases.results.length > 0) {
      console.log(`✅ Found ${databases.results.length} database(s):`);
      databases.results.forEach((db, index) => {
        console.log(`   ${index + 1}. ${db.title[0]?.plain_text || 'Untitled'} (${db.id})`);
      });
    } else {
      console.log('⚠️  No databases found. Make sure to share a database with your integration.');
    }
    console.log('');

    // Test 3: Test specific database (if provided)
    if (NOTION_DATABASE_ID) {
      console.log('3️⃣ Testing specific database access...');
      try {
        const database = await notion.databases.retrieve({
          database_id: NOTION_DATABASE_ID,
        });
        console.log(`✅ Database access successful!`);
        console.log(`   Title: ${database.title[0]?.plain_text || 'Untitled'}`);
        console.log(`   Properties: ${Object.keys(database.properties).length}`);
        console.log(`   Properties: ${Object.keys(database.properties).join(', ')}`);
        
        // Test 4: Query database
        console.log('');
        console.log('4️⃣ Querying database pages...');
        const pages = await notion.databases.query({
          database_id: NOTION_DATABASE_ID,
          page_size: 5
        });
        console.log(`✅ Query successful! Found ${pages.results.length} page(s)`);
        
        if (pages.results.length > 0) {
          pages.results.forEach((page, index) => {
            const title = page.properties.Title?.title?.[0]?.plain_text || 
                         page.properties.Name?.title?.[0]?.plain_text ||
                         'Untitled';
            console.log(`   ${index + 1}. ${title}`);
          });
        }

      } catch (dbError) {
        console.error(`❌ Database access failed: ${dbError.message}`);
        console.error('   Make sure the database is shared with your integration');
      }
    } else {
      console.log('3️⃣ No NOTION_DATABASE_ID provided - skipping database tests');
      console.log('   Add NOTION_DATABASE_ID=your_database_id to test database operations');
    }
    console.log('');

    // Test 5: Create a test page (only if database ID is provided)
    if (NOTION_DATABASE_ID) {
      console.log('5️⃣ Creating test page...');
      try {
        const testPage = await notion.pages.create({
          parent: {
            database_id: NOTION_DATABASE_ID,
          },
          properties: {
            Title: {
              title: [
                {
                  text: {
                    content: `DuetRight Test Page - ${new Date().toISOString()}`,
                  },
                },
              ],
            },
            // Add more properties based on your database schema
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'This is a test page created by the DuetRight Dashboard integration. ✅',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'heading_2',
              heading_2: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Integration Test Results',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Authentication: Working ✅',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Database Access: Working ✅',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Page Creation: Working ✅',
                    },
                  },
                ],
              },
            },
          ],
        });
        
        console.log(`✅ Test page created successfully!`);
        console.log(`   Page ID: ${testPage.id}`);
        console.log(`   URL: ${testPage.url}`);
        
      } catch (createError) {
        console.error(`❌ Failed to create test page: ${createError.message}`);
        console.error('   Check that your database properties match the test page structure');
      }
    }

    console.log('');
    console.log('🎉 Notion integration test completed!');
    
    if (!NOTION_DATABASE_ID) {
      console.log('');
      console.log('💡 To enable full testing:');
      console.log('   1. Create a database in Notion');
      console.log('   2. Share it with your DuetRight Dashboard integration');
      console.log('   3. Add NOTION_DATABASE_ID=your_database_id to your .env file');
      console.log('   4. Run this test again');
    }

  } catch (error) {
    console.error(`❌ Notion integration test failed: ${error.message}`);
    console.error('');
    console.error('Common solutions:');
    console.error('• Check that NOTION_TOKEN is correct');
    console.error('• Verify your integration has necessary permissions');
    console.error('• Ensure databases are shared with your integration');
    console.error('• Check that token hasn\'t expired');
    process.exit(1);
  }
}

// Run the test
testNotionConnection();