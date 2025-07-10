#!/usr/bin/env node

/**
 * Find Private Channels You're a Member Of
 * This will help identify private channels to manually add Sky AI to
 */

const https = require('https');

// You'll need to use YOUR user token for this, not the bot token
// Get it from: https://api.slack.com/legacy/custom-integrations/legacy-tokens
// Or use the workspace admin token

console.log('🔍 Finding Private Channels');
console.log('='.repeat(50));
console.log('\nNOTE: This script needs a USER token (not bot token) to see all private channels.');
console.log('Since we only have the bot token, here\'s what you can do:\n');

console.log('📋 Manual Steps to Add Sky AI to Private Channels:\n');

console.log('1. In Slack, go to each private channel you want to add Sky AI to');
console.log('2. Type: /invite @sky-ai');
console.log('3. Or click the channel name → "Integrations" → "Add apps" → Select "Sky AI"');
console.log('\n');

console.log('🔒 Common Private Channel Patterns to Check:');
console.log('   - Channels starting with "priv-"');
console.log('   - Channels with 🔒 icon');
console.log('   - Team-specific channels');
console.log('   - Client project channels marked as private');
console.log('   - Management/leadership channels');
console.log('\n');

console.log('💡 Quick Way to Find All Private Channels:');
console.log('1. In Slack sidebar, click "More" → "All channels"');
console.log('2. Look for channels with the 🔒 lock icon');
console.log('3. These are private channels');
console.log('\n');

console.log('📝 After Adding Sky AI to a Private Channel:');
console.log('1. The bot will be able to see ALL private channels');
console.log('2. You can then re-run the add-sky-ai-private-channels.js script');
console.log('3. It will automatically add Sky AI to all remaining private channels');
console.log('\n');

console.log('⚡ Quick Test:');
console.log('1. Create a test private channel');
console.log('2. Add Sky AI: /invite @sky-ai');
console.log('3. Re-run the private channels script');
console.log('4. It should then find and add to all other private channels');

// Also list current channels the bot IS in
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

async function listBotChannels() {
  console.log('\n' + '='.repeat(50));
  console.log('📢 Channels Sky AI is Currently In:');
  console.log('='.repeat(50) + '\n');
  
  const options = {
    hostname: 'slack.com',
    path: '/api/users.conversations',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength('{"types":"public_channel,private_channel","exclude_archived":true}')
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.ok && result.channels) {
          const publicCh = result.channels.filter(c => !c.is_private);
          const privateCh = result.channels.filter(c => c.is_private);
          
          console.log(`Sky AI is in ${result.channels.length} channels total:`);
          console.log(`   📢 ${publicCh.length} public channels`);
          console.log(`   🔒 ${privateCh.length} private channels`);
          
          if (privateCh.length > 0) {
            console.log('\n🔒 Private Channels Sky AI IS In:');
            privateCh.forEach(ch => {
              console.log(`   - ${ch.name}`);
            });
          } else {
            console.log('\n⚠️  Sky AI is not in any private channels yet!');
            console.log('Add it to one private channel first, then it can see all others.');
          }
        }
      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  });
  
  req.write('{"types":"public_channel,private_channel","exclude_archived":true}');
  req.end();
}

listBotChannels();