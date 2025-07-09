#!/bin/bash
# Morgan (Mac Mini) Specific Settings

# Machine identity
export CLAUDE_MACHINE="morgan"
export CLAUDE_MACHINE_TYPE="desktop"
export CLAUDE_MACHINE_COLOR="🟢"  # Green for Morgan

# Performance settings (always plugged in)
export CLAUDE_POWER_MODE="performance"
export CLAUDE_MCP_SERVERS="all"        # All 27 servers active
export CLAUDE_SYNC_INTERVAL="30"       # 30 seconds real-time sync

# Machine-specific aliases
alias megan-note="$UNIFIED_DIR/scripts/leave-note.sh megan"
alias morgan-status="$UNIFIED_DIR/scripts/machine-status.sh"
alias turbo-mode="export CLAUDE_PARALLEL_AGENTS=4 && echo 'Turbo mode activated! 🚀'"

# Morgan's preferred settings
export CLAUDE_DEFAULT_MODEL="claude-3-opus"     # Maximum capability
export CLAUDE_PLAN_MODE_AUTO="false"           # Manual plan mode
export CLAUDE_VOICE_NOTIFICATIONS="false"      # Quiet operation
export CLAUDE_PARALLEL_AGENTS="2"              # Multi-agent by default

# Development shortcuts
alias dev-api="cd ~/Development/api && claude-init"
alias dev-frontend="cd ~/Development/frontend && claude-init"
alias dev-servers="cd ~/Development/servers && claude-init"

# Morgan-specific tools
alias perf-monitor="$UNIFIED_DIR/scripts/performance-monitor.sh"
alias server-dashboard="$UNIFIED_DIR/scripts/mcp-dashboard.sh"

echo "🟢 Morgan's configuration loaded"