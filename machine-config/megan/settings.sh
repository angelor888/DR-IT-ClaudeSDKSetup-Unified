#!/bin/bash
# Megan (Laptop) Specific Settings

# Machine identity
export CLAUDE_MACHINE="megan"
export CLAUDE_MACHINE_TYPE="laptop"
export CLAUDE_MACHINE_COLOR="🟣"  # Purple for Megan

# Performance settings
if pmset -g batt | grep -q "Battery Power"; then
    export CLAUDE_POWER_MODE="battery"
    export CLAUDE_MCP_SERVERS="essential"  # Only essential servers on battery
    export CLAUDE_SYNC_INTERVAL="300"      # 5 minutes
else
    export CLAUDE_POWER_MODE="plugged"
    export CLAUDE_MCP_SERVERS="standard"   # Standard set when plugged in
    export CLAUDE_SYNC_INTERVAL="60"       # 1 minute
fi

# Machine-specific aliases
alias morgan-note="$UNIFIED_DIR/scripts/leave-note.sh morgan"
alias megan-status="$UNIFIED_DIR/scripts/machine-status.sh"
alias battery-mode="export CLAUDE_MCP_SERVERS=essential && echo 'Switched to battery mode'"
alias performance-mode="export CLAUDE_MCP_SERVERS=all && echo 'Switched to performance mode'"

# Megan's preferred settings
export CLAUDE_DEFAULT_MODEL="claude-3-sonnet"  # More efficient for laptop
export CLAUDE_PLAN_MODE_AUTO="true"            # Always use plan mode
export CLAUDE_VOICE_NOTIFICATIONS="true"       # Audio feedback

# Project shortcuts
alias proj-current="cd ~/Projects/current && claude-init"
alias proj-personal="cd ~/Projects/personal && claude-init"

echo "💜 Megan's configuration loaded"