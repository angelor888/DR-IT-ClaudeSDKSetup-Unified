#!/bin/bash
#
# Claude & MCP Auto-Update Script
# Version: 1.0.0
# Description: Automatically updates Claude CLI and MCP Docker services
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$HOME/.config/claude/logs"
BACKUP_DIR="$HOME/.config/claude/backups"
LOG_FILE="$LOG_DIR/auto-update-$(date +%Y%m%d).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure directories exist
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Logging function
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if running in interactive mode
INTERACTIVE=${INTERACTIVE:-false}

log "========================================="
log "Starting Claude & MCP Auto-Update"
log "========================================="

# 1. Update Homebrew packages
log "Checking Homebrew updates..."
if command -v brew &> /dev/null; then
    brew update >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to update Homebrew"
    
    # Check for outdated packages
    OUTDATED=$(brew outdated 2>/dev/null || echo "")
    if [ -n "$OUTDATED" ]; then
        log "Updating Homebrew packages..."
        brew upgrade >> "$LOG_FILE" 2>&1 || log "WARNING: Some Homebrew upgrades failed"
    else
        log "All Homebrew packages are up to date"
    fi
else
    log "Homebrew not found, skipping..."
fi

# 2. Update Claude CLI
log "Checking Claude CLI updates..."
if command -v npm &> /dev/null; then
    # Get current version
    CURRENT_VERSION=$(claude --version 2>/dev/null | awk '{print $1}' || echo "unknown")
    log "Current Claude CLI version: $CURRENT_VERSION"
    
    # Check for updates
    LATEST_VERSION=$(npm view @anthropic-ai/claude-code version 2>/dev/null || echo "")
    
    if [ -n "$LATEST_VERSION" ] && [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
        log "Updating Claude CLI from $CURRENT_VERSION to $LATEST_VERSION..."
        
        # Backup current installation info
        echo "{\"version\": \"$CURRENT_VERSION\", \"date\": \"$TIMESTAMP\"}" > "$BACKUP_DIR/claude-cli-backup-$(date +%Y%m%d).json"
        
        # Update Claude CLI
        npm update -g @anthropic-ai/claude-code >> "$LOG_FILE" 2>&1 || error_exit "Failed to update Claude CLI"
        
        log "Claude CLI updated successfully to $LATEST_VERSION"
    else
        log "Claude CLI is up to date (version: $CURRENT_VERSION)"
    fi
else
    log "npm not found, cannot update Claude CLI"
fi

# 3. Update MCP Docker services
log "Checking MCP Docker services..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    MCP_DIR="$HOME/easy-mcp"
    
    if [ -d "$MCP_DIR" ]; then
        cd "$MCP_DIR"
        
        # Pull latest images
        log "Pulling latest MCP Docker images..."
        docker-compose pull >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to pull some Docker images"
        
        # Get running containers
        RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null || echo "")
        
        if [ -n "$RUNNING_CONTAINERS" ]; then
            log "Recreating MCP containers with updated images..."
            
            # Recreate containers with new images
            docker-compose up -d --force-recreate >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to recreate some containers"
            
            # Clean up old images
            log "Cleaning up old Docker images..."
            docker image prune -f >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to prune images"
        else
            log "No MCP containers are running"
        fi
    else
        log "MCP directory not found at $MCP_DIR"
    fi
else
    log "Docker not available, skipping MCP updates"
fi

# 4. Update npm packages
log "Checking for npm updates..."
if command -v npm &> /dev/null; then
    # Update npm itself
    CURRENT_NPM=$(npm --version)
    log "Current npm version: $CURRENT_NPM"
    
    # Check if npm needs updating
    LATEST_NPM=$(npm view npm version 2>/dev/null || echo "")
    if [ -n "$LATEST_NPM" ] && [ "$CURRENT_NPM" != "$LATEST_NPM" ]; then
        log "Updating npm from $CURRENT_NPM to $LATEST_NPM..."
        npm install -g npm@latest >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to update npm"
    fi
    
    # Update npm check updates tool if installed
    if npm list -g npm-check-updates &> /dev/null; then
        npm update -g npm-check-updates >> "$LOG_FILE" 2>&1 || log "WARNING: Failed to update npm-check-updates"
    fi
fi

# 5. Clean up old logs (keep last 30 days)
log "Cleaning up old logs..."
find "$LOG_DIR" -name "auto-update-*.log" -mtime +30 -delete 2>/dev/null || log "WARNING: Failed to clean some old logs"

# 6. Send notification (if in interactive mode)
if [ "$INTERACTIVE" = "true" ] && command -v osascript &> /dev/null; then
    osascript -e 'display notification "Claude & MCP auto-update completed" with title "Auto-Update"' 2>/dev/null || true
fi

log "========================================="
log "Auto-update completed successfully"
log "========================================="

# Return success
exit 0