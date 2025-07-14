#!/usr/bin/env node

require('dotenv').config();

const https = require('https');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

const report = {
  channel: 'C094JMFJEDD', // #it-report
  text: '🎯 **Phase 1 MCP Integration - COMPLETE**',
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎯 Phase 1: MCP Server Integration - COMPLETE',
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📋 **Project Summary**\nCompleted Phase 1 of the 27 MCP server integration plan, focusing on infrastructure repair and health monitoring.'
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: '🏗️ **Components Built**\n• Service Health Check System\n• Real-time Dashboard Monitoring\n• Firebase Integration & Security\n• Comprehensive Status Display'
        },
        {
          type: 'mrkdwn',
          text: '⚡ **Technical Features**\n• Auto-refresh every 30 seconds\n• Response time monitoring\n• Error message display\n• Service capability tracking'
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ **Services Verified Working**\n• GitHub API - Repository management\n• Slack Bot - Team communication \n• Airtable - Database operations\n• SendGrid - Email delivery\n• Jobber CRM - Construction management\n• Twilio - SMS/Voice ($19.97 balance)\n• Firebase - Auth & Firestore\n• Google Calendar & Gmail - OAuth active'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⚠️ **Known Issues**\n• QuickBooks OAuth - Requires manual reauthorization\n• Status: Tokens expired, needs developer console access'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📱 **Dashboard Features Added**\n• Service status icons with real-time updates\n• Response time metrics\n• Capability badges for each service\n• Error message reporting\n• Manual refresh capability\n• Health summary alerts'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📝 **Git Details**\n• **Commit**: `bb2152f`\n• **Status**: ✅ Phase 1 Complete\n• **Next**: Ready for Phase 2 integrations'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '🚀 **Phase 2 Preview**\nReady to implement:\n• Notion API for documentation\n• OpenAI integration expansion\n• PostgreSQL production database\n• Redis caching system\n• Matterport 3D scanning API'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📊 *9/10 core services operational • 1 needs OAuth refresh* | Generated: ${new Date().toLocaleString()}`
        }
      ]
    }
  ]
};

const postData = JSON.stringify(report);

const options = {
  hostname: 'slack.com',
  path: '/api/chat.postMessage',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending Phase 1 completion report to #it-report...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log('✅ Phase 1 completion report sent successfully!');
      console.log(`📱 Message posted to #it-report`);
      console.log(`🔗 Channel: https://duetright.slack.com/archives/C0942XRTSKV`);
    } else {
      console.error('❌ Failed to send report:', result.error);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error sending report:', err.message);
});

req.write(postData);
req.end();