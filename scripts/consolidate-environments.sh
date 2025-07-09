#!/bin/bash
set -euo pipefail

# Consolidate all Claude environments into unified setup
UNIFIED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_DIR="$HOME/Claude-Archives/archive-$(date +%Y%m%d-%H%M%S)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Consolidating Claude Environments${NC}"
echo "This will merge all your Claude setups into one unified environment."
echo

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Function to safely move and archive
archive_project() {
    local source=$1
    local name=$2
    
    if [ -d "$source" ]; then
        echo -e "${YELLOW}📦 Archiving $name...${NC}"
        mv "$source" "$ARCHIVE_DIR/$name"
        echo -e "${GREEN}  ✓ Archived to $ARCHIVE_DIR/$name${NC}"
    fi
}

# Step 1: Copy best configurations from main setup
echo -e "${BLUE}📋 Copying configurations from DR-IT-ClaudeSDKSetup...${NC}"
if [ -d "$HOME/Projects/DR-IT-ClaudeSDKSetup" ]; then
    # Copy scripts
    cp -n "$HOME/Projects/DR-IT-ClaudeSDKSetup/scripts/"*.sh "$UNIFIED_DIR/scripts/" 2>/dev/null || true
    
    # Copy documentation
    cp -n "$HOME/Projects/DR-IT-ClaudeSDKSetup/"*.md "$UNIFIED_DIR/docs/" 2>/dev/null || true
    
    echo -e "${GREEN}  ✓ Configurations copied${NC}"
fi

# Step 2: Merge Alex Finn workflow
echo -e "${BLUE}📚 Merging Alex Finn workflow...${NC}"
if [ -d "$HOME/Projects/claude-code-project" ]; then
    mkdir -p "$UNIFIED_DIR/best-practices/alex-finn-workflow"
    cp -r "$HOME/Projects/claude-code-project/"*.md "$UNIFIED_DIR/best-practices/alex-finn-workflow/" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Alex Finn workflow integrated${NC}"
fi

# Step 3: Copy Claude configurations
echo -e "${BLUE}⚙️  Copying Claude configurations...${NC}"
if [ -d "$HOME/.config/claude" ]; then
    # Ensure unified config exists
    mkdir -p "$HOME/.config/claude-unified"
    
    # Copy important files
    for file in settings.json shell-integration.sh environment mode-config.json; do
        if [ -f "$HOME/.config/claude/$file" ]; then
            cp "$HOME/.config/claude/$file" "$HOME/.config/claude-unified/"
        fi
    done
    
    # Copy scripts and templates
    cp -r "$HOME/.config/claude/scripts" "$HOME/.config/claude-unified/" 2>/dev/null || true
    cp -r "$HOME/.config/claude/templates" "$HOME/.config/claude-unified/" 2>/dev/null || true
    
    echo -e "${GREEN}  ✓ Configurations copied${NC}"
fi

# Step 4: Update shell configuration
echo -e "${BLUE}🐚 Updating shell configuration...${NC}"
SHELL_RC="$HOME/.zshrc"
if ! grep -q "claude-start" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# Claude Unified Environment" >> "$SHELL_RC"
    echo "alias claude-start='$HOME/claude-start'" >> "$SHELL_RC"
    echo "alias megan-note='$UNIFIED_DIR/scripts/leave-note.sh megan'" >> "$SHELL_RC"
    echo "alias morgan-note='$UNIFIED_DIR/scripts/leave-note.sh morgan'" >> "$SHELL_RC"
    echo -e "${GREEN}  ✓ Shell aliases added${NC}"
fi

# Step 5: Archive old projects
echo
echo -e "${YELLOW}📦 Ready to archive old projects${NC}"
echo "The following will be moved to $ARCHIVE_DIR:"
echo "  • claude-code-project"
echo "  • easy-mcp"
echo "  • DR-IT-ClaudeSDKSetup (original)"
echo
read -p "Continue with archiving? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    archive_project "$HOME/Projects/claude-code-project" "claude-code-project"
    archive_project "$HOME/Projects/easy-mcp" "easy-mcp"
    archive_project "$HOME/Projects/DR-IT-ClaudeSDKSetup" "DR-IT-ClaudeSDKSetup-original"
    archive_project "$HOME/.claude" "dot-claude"
    
    echo
    echo -e "${GREEN}✅ Archives created in: $ARCHIVE_DIR${NC}"
fi

# Step 6: Create first-time setup indicator
touch "$HOME/.claude-unified-setup"

echo
echo -e "${GREEN}🎉 Consolidation Complete!${NC}"
echo
echo "Next steps:"
echo "1. Run: source ~/.zshrc"
echo "2. Test: claude-start"
echo "3. Set machine identity when prompted"
echo
echo "Your old projects are safely archived in:"
echo "$ARCHIVE_DIR"
echo
echo -e "${BLUE}Enjoy your unified Claude environment!${NC}"