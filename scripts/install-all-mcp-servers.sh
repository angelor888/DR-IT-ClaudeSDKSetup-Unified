#!/bin/bash
set -euo pipefail

echo "Installing all 27 MCP servers..."

# Essential (Battery Mode)
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-slack

# Standard (Plugged In)
npm install -g @modelcontextprotocol/server-google-calendar
npm install -g @modelcontextprotocol/server-gmail
npm install -g @modelcontextprotocol/server-google-drive
npm install -g @modelcontextprotocol/server-notion
npm install -g @modelcontextprotocol/server-airtable
npm install -g @modelcontextprotocol/server-quickbooks
npm install -g @modelcontextprotocol/server-jobber
npm install -g @modelcontextprotocol/server-sendgrid

# Performance (Morgan Only)
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-playwright
npm install -g @modelcontextprotocol/server-confluence
npm install -g @modelcontextprotocol/server-matterport
npm install -g @modelcontextprotocol/server-postgresql
npm install -g @modelcontextprotocol/server-redis
npm install -g @modelcontextprotocol/server-firecrawl
npm install -g @modelcontextprotocol/server-tavily

# Additional servers mentioned
npm install -g @modelcontextprotocol/server-everything
npm install -g @modelcontextprotocol/server-openai
npm install -g @modelcontextprotocol/server-neon
npm install -g @modelcontextprotocol/server-cloudflare
npm install -g @modelcontextprotocol/server-firebase
npm install -g @modelcontextprotocol/server-taiga
npm install -g @modelcontextprotocol/server-twilio

echo "All MCP servers installation complete!"
echo "Checking installed servers..."
npm list -g | grep "@modelcontextprotocol"