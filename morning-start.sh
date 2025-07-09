#!/bin/bash
set -euo pipefail

# Claude Unified Morning Startup Script
# One command to start your entire Claude environment

UNIFIED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MACHINE_NAME=""
MACHINE_MODE=""

# Colors for beautiful output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Fancy banner
show_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║      🚀  Claude Unified Environment Startup  🚀           ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Detect which machine we're on
detect_machine() {
    local hostname=$(hostname -s | tr '[:upper:]' '[:lower:]')
    local serial=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Serial Number" | awk '{print $NF}' || echo "unknown")
    
    # Check for machine identity file first
    if [ -f "$HOME/.claude-machine-id" ]; then
        MACHINE_NAME=$(cat "$HOME/.claude-machine-id")
    elif [[ "$hostname" == *"morgan"* ]] || [[ "$hostname" == *"mac-mini"* ]]; then
        MACHINE_NAME="morgan"
    elif [[ "$hostname" == *"megan"* ]] || [[ "$hostname" == *"macbook"* ]] || [[ "$hostname" == *"laptop"* ]]; then
        MACHINE_NAME="megan"
    else
        # First time setup - ask the user
        echo -e "${YELLOW}🤖 First time setup detected!${NC}"
        echo -e "${BLUE}Is this computer Megan (laptop) or Morgan (Mac mini)?${NC}"
        echo "1) Megan (Laptop)"
        echo "2) Morgan (Mac mini)"
        read -p "Select (1 or 2): " choice
        
        case $choice in
            1) MACHINE_NAME="megan" ;;
            2) MACHINE_NAME="morgan" ;;
            *) echo "Invalid choice. Defaulting to megan."; MACHINE_NAME="megan" ;;
        esac
        
        # Save for next time
        echo "$MACHINE_NAME" > "$HOME/.claude-machine-id"
    fi
    
    # Set machine mode based on power status
    if [[ "$MACHINE_NAME" == "megan" ]]; then
        # Check if on battery
        if pmset -g batt | grep -q "Battery Power"; then
            MACHINE_MODE="battery-optimized"
        else
            MACHINE_MODE="plugged-in"
        fi
    else
        MACHINE_MODE="performance"
    fi
}

# Show personalized greeting
show_greeting() {
    local hour=$(date +%H)
    local greeting="Good morning"
    
    if [ $hour -ge 12 ] && [ $hour -lt 17 ]; then
        greeting="Good afternoon"
    elif [ $hour -ge 17 ]; then
        greeting="Good evening"
    fi
    
    echo -e "${GREEN}$greeting! You're on ${PURPLE}${MACHINE_NAME}${GREEN} in ${YELLOW}${MACHINE_MODE}${GREEN} mode.${NC}"
    echo
}

# Check for messages from other machine
check_messages() {
    local other_machine="morgan"
    [ "$MACHINE_NAME" == "morgan" ] && other_machine="megan"
    
    local message_file="$UNIFIED_DIR/.messages/${other_machine}-to-${MACHINE_NAME}.txt"
    
    if [ -f "$message_file" ] && [ -s "$message_file" ]; then
        echo -e "${YELLOW}📬 You have a message from ${other_machine}:${NC}"
        echo -e "${CYAN}$(cat "$message_file")${NC}"
        echo
        
        # Mark as read
        > "$message_file"
    fi
}

# Sync with GitHub
sync_github() {
    echo -e "${BLUE}🔄 Syncing with GitHub...${NC}"
    cd "$UNIFIED_DIR"
    
    # Check for updates
    git fetch --quiet
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    
    if [ $LOCAL != $REMOTE ]; then
        echo -e "${YELLOW}  📥 Updates available! Pulling...${NC}"
        git pull --quiet
        echo -e "${GREEN}  ✓ Updated to latest version${NC}"
    else
        echo -e "${GREEN}  ✓ Already up to date${NC}"
    fi
}

# Load machine-specific configuration
load_machine_config() {
    echo -e "${BLUE}⚙️  Loading ${MACHINE_NAME} configuration...${NC}"
    
    # Source machine-specific settings
    if [ -f "$UNIFIED_DIR/machine-config/${MACHINE_NAME}/settings.sh" ]; then
        source "$UNIFIED_DIR/machine-config/${MACHINE_NAME}/settings.sh"
        echo -e "${GREEN}  ✓ Machine settings loaded${NC}"
    fi
    
    # Load environment variables
    if [ -f "$HOME/.config/claude/environment" ]; then
        source "$HOME/.config/claude/environment"
        echo -e "${GREEN}  ✓ Environment variables loaded${NC}"
    fi
}

# Start required services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    # Start based on machine mode
    if [[ "$MACHINE_MODE" == "battery-optimized" ]]; then
        echo -e "${YELLOW}  🔋 Battery mode: Starting essential services only${NC}"
        # Start only essential MCP servers
        "$UNIFIED_DIR/scripts/start-essential-services.sh"
    else
        echo -e "${GREEN}  ⚡ Performance mode: Starting all services${NC}"
        # Start all MCP servers
        "$UNIFIED_DIR/scripts/start-all-services.sh"
    fi
    
    # Start memory watch
    if ! pgrep -f "memory-watch.sh" > /dev/null; then
        "$HOME/.config/claude/scripts/memory-watch.sh" &
        echo -e "${GREEN}  ✓ Memory watch started${NC}"
    else
        echo -e "${GREEN}  ✓ Memory watch already running${NC}"
    fi
}

# Load shell integration
load_shell_integration() {
    echo -e "${BLUE}🐚 Loading shell integration...${NC}"
    
    if [ -f "$HOME/.config/claude/shell-integration.sh" ]; then
        source "$HOME/.config/claude/shell-integration.sh"
        echo -e "${GREEN}  ✓ Claude commands loaded${NC}"
    fi
}

# Show status dashboard
show_dashboard() {
    echo
    echo -e "${CYAN}📊 Status Dashboard${NC}"
    echo -e "${CYAN}══════════════════${NC}"
    
    # Claude version
    if command -v claude &> /dev/null; then
        local claude_version=$(claude --version 2>&1 | head -n1)
        echo -e "Claude Code: ${GREEN}✓ ${claude_version}${NC}"
    else
        echo -e "Claude Code: ${RED}✗ Not installed${NC}"
    fi
    
    # Current project
    if [ -f "Claude.md" ] || [ -f ".claude/Claude.md" ]; then
        echo -e "Project: ${GREEN}✓ $(basename $(pwd))${NC}"
    else
        echo -e "Project: ${YELLOW}No Claude.md found${NC}"
    fi
    
    # API tokens status
    local configured_tokens=$(grep -E "^[A-Z_]+=.+" "$HOME/.config/claude/environment" 2>/dev/null | grep -v "=$" | wc -l | tr -d ' ')
    echo -e "API Tokens: ${GREEN}$configured_tokens configured${NC}"
    
    # Git status
    if git rev-parse --git-dir > /dev/null 2>&1; then
        local branch=$(git branch --show-current)
        local changes=$(git status --porcelain | wc -l | tr -d ' ')
        if [ $changes -eq 0 ]; then
            echo -e "Git: ${GREEN}✓ $branch (clean)${NC}"
        else
            echo -e "Git: ${YELLOW}$branch ($changes changes)${NC}"
        fi
    fi
}

# Show quick tips
show_tips() {
    echo
    echo -e "${PURPLE}💡 Quick Commands:${NC}"
    echo "  • ${CYAN}claude-init${NC} - Initialize new project"
    echo "  • ${CYAN}claude-plan${NC} - Enter plan mode"
    echo "  • ${CYAN}claude-checkpoint${NC} - Save git checkpoint"
    echo "  • ${CYAN}${MACHINE_NAME}-note${NC} - Leave message for other machine"
    echo "  • ${CYAN}claude-help${NC} - Show all commands"
}

# Main execution
main() {
    show_banner
    detect_machine
    show_greeting
    check_messages
    sync_github
    load_machine_config
    start_services
    load_shell_integration
    show_dashboard
    show_tips
    
    echo
    echo -e "${GREEN}🎉 Claude environment ready! Happy coding!${NC}"
    echo
    
    # Optional: Change to last project directory
    if [ -f "$HOME/.claude-last-project" ]; then
        local last_project=$(cat "$HOME/.claude-last-project")
        if [ -d "$last_project" ]; then
            echo -e "${BLUE}📁 Returning to last project: $last_project${NC}"
            cd "$last_project"
        fi
    fi
}

# Run main function
main "$@"