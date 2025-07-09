# Configs Directory Context

## Purpose
This directory contains configuration files for various services and tools used in the Claude SDK setup ecosystem.

## Public Interfaces

### docker-compose.yml
- **Purpose**: Defines all MCP Docker services
- **Services**: filesystem, memory, puppeteer, everything, github, postgres, redis, slack, watchtower
- **Usage**: `docker-compose up -d` from ~/easy-mcp/

### claude-desktop-config.json
- **Purpose**: Configuration for Claude Desktop application
- **Format**: JSON with mcpServers definitions
- **Location**: Gets copied to ~/Library/Application Support/Claude/

### shell-integration.sh
- **Purpose**: Shell aliases and functions for Claude & MCP
- **Key Commands**: 
  - `claude-update`: Run manual update
  - `mcp-status`: Check service status
  - `claude-py`: Python environment activation

### auto-update.sh
- **Purpose**: Automated update script for all Claude components
- **Schedule**: Daily at 2 AM via LaunchAgent
- **Updates**: Homebrew, Claude CLI, MCP Docker services, npm packages

### .env.example
- **Purpose**: Template for environment variables
- **Required Keys**: ANTHROPIC_API_KEY, GITHUB_TOKEN
- **Security**: Never commit actual .env files

## Learned Facts
<!-- Auto-updated by memory watch -->