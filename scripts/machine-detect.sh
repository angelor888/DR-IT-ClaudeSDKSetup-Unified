#!/bin/bash
# Machine Detection Script - Identifies Megan or Morgan

detect_machine() {
    local hostname=$(hostname -s | tr '[:upper:]' '[:lower:]')
    local model=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Name" | cut -d':' -f2 | xargs)
    
    # Check saved identity first
    if [ -f "$HOME/.claude-machine-id" ]; then
        cat "$HOME/.claude-machine-id"
        return
    fi
    
    # Auto-detect based on hostname
    if [[ "$hostname" == *"morgan"* ]] || [[ "$hostname" == *"mini"* ]]; then
        echo "morgan"
    elif [[ "$hostname" == *"megan"* ]] || [[ "$hostname" == *"book"* ]]; then
        echo "megan"
    # Detect based on model
    elif [[ "$model" == *"Mac mini"* ]]; then
        echo "morgan"
    elif [[ "$model" == *"MacBook"* ]]; then
        echo "megan"
    else
        # Default to interactive setup
        echo "unknown"
    fi
}

# If run directly, output the machine name
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    detect_machine
fi