#!/usr/bin/env node

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is not set');
  process.exit(1);
}

// Test GitHub API
const options = {
  hostname: 'api.github.com',
  path: '/user',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'User-Agent': 'Claude-MCP-Test',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.get(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const user = JSON.parse(data);
      console.log(`✅ GitHub authentication successful!`);
      console.log(`Authenticated as: ${user.login}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Public repos: ${user.public_repos}`);
      process.exit(0);
    } else {
      console.error(`❌ GitHub authentication failed: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error connecting to GitHub:', err.message);
  process.exit(1);
});