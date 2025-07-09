#!/bin/bash
# Claude-Slack Integration Bridge
# Handles safe command execution and response formatting

set -euo pipefail

# Configuration
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
RULES_FILE="$(dirname "$0")/../config/auto-response-rules.json"

# Safe command whitelist
SAFE_COMMANDS=(
    "docker ps"
    "docker stats --no-stream"
    "git status"
    "git log --oneline -5"
    "ls -la"
    "pwd"
    "date"
    "uptime"
    "df -h"
    "free -h"
    "cat Claude.md"
    "which claude"
    "claude --version"
)

# Check if command is safe
is_safe_command() {
    local cmd="$1"
    
    # Check against whitelist
    for safe_cmd in "${SAFE_COMMANDS[@]}"; do
        if [[ "$cmd" == "$safe_cmd"* ]]; then
            return 0
        fi
    done
    
    # Check for dangerous patterns
    if [[ "$cmd" =~ (rm|delete|kill|shutdown|reboot|\||\>|\<|;) ]]; then
        return 1
    fi
    
    return 1
}

# Execute command safely
execute_safely() {
    local cmd="$1"
    
    if is_safe_command "$cmd"; then
        # Execute with timeout
        timeout 30 bash -c "$cmd" 2>&1 || echo "Command timed out or failed"
    else
        echo "❌ Command not allowed: $cmd"
        echo "Only safe read-only commands are permitted in auto-response mode"
    fi
}

# Format output for Slack
format_for_slack() {
    local output="$1"
    
    # Escape backticks and limit length
    output=$(echo "$output" | sed 's/`/\\`/g' | head -100)
    
    # Add code block if multiline
    if [[ $(echo "$output" | wc -l) -gt 1 ]]; then
        echo "\`\`\`\\n$output\\n\`\`\`"
    else
        echo "\`$output\`"
    fi
}

# Parse task and execute
parse_and_execute() {
    local task="$1"
    local response=""
    
    # Common task patterns
    if [[ "$task" =~ "docker" ]] && [[ "$task" =~ "status" ]]; then
        response+="📋 Docker Status Check\\n\\n"
        
        # Check Docker daemon
        if docker info &>/dev/null; then
            response+="✅ Docker daemon: Running\\n"
            
            # Get container stats
            local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
            response+="\\n**Active Containers:**\\n"
            response+=$(format_for_slack "$containers")
        else
            response+="❌ Docker daemon: Not running"
        fi
        
    elif [[ "$task" =~ "git" ]] && [[ "$task" =~ "status" ]]; then
        response+="📋 Git Repository Status\\n\\n"
        
        # Get git status
        local git_status=$(cd ~/Projects/DR-IT-ClaudeSDKSetup-Unified && git status --short)
        if [ -z "$git_status" ]; then
            response+="✅ Working tree clean"
        else
            response+="⚠️ Uncommitted changes:\\n"
            response+=$(format_for_slack "$git_status")
        fi
        
    elif [[ "$task" =~ "system" ]] && [[ "$task" =~ "check" ]]; then
        response+="📋 System Health Check\\n\\n"
        
        # System info
        response+="**Uptime:** $(uptime | awk -F'up' '{print $2}' | awk -F',' '{print $1}')\\n"
        response+="**Load:** $(uptime | awk -F'load average:' '{print $2}')\\n"
        response+="**Disk:** $(df -h / | tail -1 | awk '{print $4 " free of " $2}')\\n"
        
    else
        response+="📋 General Request Processing\\n\\n"
        response+="I understand you want me to: $task\\n\\n"
        response+="⚠️ This task requires manual execution or isn't in my automated capabilities yet."
    fi
    
    echo "$response"
}

# Main execution
if [ $# -eq 0 ]; then
    echo "Usage: $0 <task-description>"
    exit 1
fi

TASK="$*"
parse_and_execute "$TASK"