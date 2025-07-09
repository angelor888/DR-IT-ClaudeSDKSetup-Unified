#!/bin/bash
# Claude & MCP Shell Integration
# Source this file in your .zshrc or .bashrc

# Claude CLI aliases
alias cl='claude'
alias claude-update='~/.config/claude/scripts/auto-update.sh'
alias claude-logs='tail -f ~/.config/claude/logs/auto-update-$(date +%Y%m%d).log'
alias claude-status='launchctl list | grep claude'

# MCP Docker aliases
alias mcp='cd ~/easy-mcp'
alias mcp-up='cd ~/easy-mcp && docker-compose up -d'
alias mcp-down='cd ~/easy-mcp && docker-compose down'
alias mcp-restart='cd ~/easy-mcp && docker-compose restart'
alias mcp-logs='cd ~/easy-mcp && docker-compose logs -f'
alias mcp-status='docker ps | grep mcp'
alias mcp-update='cd ~/easy-mcp && docker-compose pull && docker-compose up -d'

# MCP service-specific commands
alias mcp-fs='docker logs -f mcp-filesystem-enhanced'
alias mcp-mem='docker logs -f mcp-memory-enhanced'
alias mcp-pup='docker logs -f mcp-puppeteer-enhanced'
alias mcp-all='docker logs -f mcp-everything-enhanced'
alias mcp-gh='docker logs -f mcp-github-enhanced'
alias mcp-pg='docker logs -f mcp-postgres-enhanced'
alias mcp-redis='docker logs -f mcp-redis-enhanced'
alias mcp-slack='docker logs -f mcp-slack-enhanced'

# Claude SDK aliases
alias claude-sdk='cd ~/.config/claude/sdk-examples'
alias claude-py='cd ~/.config/claude/sdk-examples/python && source venv/bin/activate'
alias claude-ts='cd ~/.config/claude/sdk-examples/typescript'

# Utility functions
claude-help() {
    echo "Claude & MCP Commands:"
    echo "  claude-update    - Run manual update for Claude CLI and MCP"
    echo "  claude-logs      - View today's update logs"
    echo "  claude-status    - Check LaunchAgent status"
    echo ""
    echo "  mcp-up          - Start all MCP services"
    echo "  mcp-down        - Stop all MCP services"
    echo "  mcp-restart     - Restart all MCP services"
    echo "  mcp-logs        - View all MCP service logs"
    echo "  mcp-status      - Check MCP container status"
    echo "  mcp-update      - Update and restart MCP services"
    echo ""
    echo "  mcp-fs          - View filesystem service logs"
    echo "  mcp-mem         - View memory service logs"
    echo "  mcp-pup         - View puppeteer service logs"
    echo "  mcp-all         - View everything service logs"
}

# Interactive update function
claude-update-interactive() {
    export INTERACTIVE=true
    ~/.config/claude/scripts/auto-update.sh
}

# Check for updates on shell startup (non-blocking)
if [ -f ~/.config/claude/scripts/auto-update.sh ]; then
    # Check if last update was more than 24 hours ago
    LAST_UPDATE_FILE="$HOME/.config/claude/.last-update-check"
    if [ ! -f "$LAST_UPDATE_FILE" ] || [ $(find "$LAST_UPDATE_FILE" -mtime +1 2>/dev/null | wc -l) -gt 0 ]; then
        touch "$LAST_UPDATE_FILE"
        (
            # Run in background and check for updates silently
            npm outdated -g @anthropic-ai/claude-code 2>/dev/null | grep -q claude && {
                echo "Claude CLI update available. Run 'claude-update' to update."
            }
        ) &
    fi
fi

# Add completion for Claude CLI if available
if command -v claude &>/dev/null && [ -n "$ZSH_VERSION" ]; then
    # ZSH completion setup would go here if Claude CLI provides it
    :
elif command -v claude &>/dev/null && [ -n "$BASH_VERSION" ]; then
    # Bash completion setup would go here if Claude CLI provides it
    :
fi