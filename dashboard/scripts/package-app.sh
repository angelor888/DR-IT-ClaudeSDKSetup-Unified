#!/bin/bash
# Package DuetRight Dashboard for distribution
# Creates a single ZIP file with all installation options

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="DuetRight-Dashboard-Installer"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$PROJECT_ROOT/dist-packages"
PACKAGE_DIR="$OUTPUT_DIR/$PACKAGE_NAME"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}DuetRight Dashboard Packager${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Create output directory
echo -e "${GREEN}Creating package directory...${NC}"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy installation files
echo -e "${GREEN}Copying installation files...${NC}"

# Windows installer
mkdir -p "$PACKAGE_DIR/Windows"
cp "$PROJECT_ROOT/installers/windows/install-duetright.bat" "$PACKAGE_DIR/Windows/" 2>/dev/null || echo "Windows installer not found"

# macOS installer  
mkdir -p "$PACKAGE_DIR/macOS"
cp "$PROJECT_ROOT/installers/macos/install-duetright.sh" "$PACKAGE_DIR/macOS/" 2>/dev/null || echo "macOS installer not found"

# Quick access files
mkdir -p "$PACKAGE_DIR/Quick-Access"
cp "$PROJECT_ROOT/quick-access/"* "$PACKAGE_DIR/Quick-Access/" 2>/dev/null || echo "Quick access files not found"

# Documentation
cp "$PROJECT_ROOT/EMPLOYEE-ACCESS-GUIDE.md" "$PACKAGE_DIR/README.md"
cp "$PROJECT_ROOT/EMPLOYEE-ACCESS-GUIDE.md" "$PACKAGE_DIR/How-To-Install.md"

# Convert markdown to HTML for easier reading
if command -v pandoc &> /dev/null; then
    echo -e "${GREEN}Converting documentation to HTML...${NC}"
    pandoc "$PACKAGE_DIR/README.md" -o "$PACKAGE_DIR/Installation-Guide.html" --standalone --metadata title="DuetRight Dashboard Installation Guide" 2>/dev/null || true
fi

# Create a simple auto-run HTML file
cat > "$PACKAGE_DIR/START-HERE.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DuetRight Dashboard - Installation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1976d2;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
        }
        .options {
            display: grid;
            gap: 20px;
            margin-bottom: 40px;
        }
        .option {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        .option:hover {
            border-color: #1976d2;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .option h3 {
            color: #1976d2;
            margin-top: 0;
        }
        .option p {
            color: #666;
            margin: 10px 0;
        }
        .button {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 10px 24px;
            border-radius: 6px;
            text-decoration: none;
            transition: background 0.3s;
        }
        .button:hover {
            background: #1565c0;
        }
        .quick-access {
            text-align: center;
            padding: 30px;
            background: #e3f2fd;
            border-radius: 8px;
            margin-top: 30px;
        }
        .quick-access h3 {
            color: #1976d2;
            margin-bottom: 20px;
        }
        .direct-link {
            font-size: 24px;
            color: #1976d2;
            text-decoration: none;
            font-weight: bold;
        }
        .direct-link:hover {
            text-decoration: underline;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DuetRight Dashboard</h1>
        <p class="subtitle">Choose your installation method below</p>
        
        <div class="options">
            <div class="option">
                <h3>💻 Desktop App Installation</h3>
                <p><strong>Windows Users:</strong> Run the installer in the Windows folder</p>
                <p><strong>Mac Users:</strong> Run the installer in the macOS folder</p>
                <p>This will create a desktop app that opens like any other program!</p>
            </div>
            
            <div class="option">
                <h3>🌐 Quick Browser Access</h3>
                <p>Use the shortcuts in the Quick-Access folder to open in your browser</p>
                <p>Or bookmark this link for instant access anytime</p>
            </div>
            
            <div class="option">
                <h3>📱 Mobile Installation</h3>
                <p>Open the QR code file in Quick-Access folder</p>
                <p>Scan with your phone to install on your home screen</p>
            </div>
        </div>
        
        <div class="quick-access">
            <h3>🎯 Or Access Directly Right Now!</h3>
            <a href="https://dashboard.duetright.com" class="direct-link" target="_blank">
                Open DuetRight Dashboard →
            </a>
            <p style="margin-top: 20px; color: #666;">
                Bookmark this page for easy access later!
            </p>
        </div>
        
        <div class="footer">
            <p>Need help? Check the Installation Guide or contact IT Support</p>
            <p>© 2025 DuetRight - Version 1.0.0</p>
        </div>
    </div>
</body>
</html>
EOF

# Create batch file for Windows auto-start
cat > "$PACKAGE_DIR/Install-DuetRight-Windows.bat" << 'EOF'
@echo off
echo Starting DuetRight Dashboard installation...
cd /d "%~dp0Windows"
call install-duetright.bat
pause
EOF

# Create shell script for macOS auto-start
cat > "$PACKAGE_DIR/Install-DuetRight-Mac.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/macOS"
./install-duetright.sh
EOF
chmod +x "$PACKAGE_DIR/Install-DuetRight-Mac.command"

# Create info file
cat > "$PACKAGE_DIR/INFO.txt" << EOF
DuetRight Dashboard Installer Package
=====================================

This package contains everything you need to install and access
the DuetRight Dashboard on any device.

Contents:
- Windows/       : Windows desktop app installer
- macOS/        : Mac desktop app installer  
- Quick-Access/ : Browser shortcuts and mobile QR code
- START-HERE.html : Open this file to begin!

Installation Instructions:
1. Open START-HERE.html in your web browser
2. Follow the instructions for your device
3. Enjoy your new dashboard!

Support: it@duetright.com

Version: 1.0.0
Created: $(date)
EOF

# Build Electron apps if package.json exists
if [ -f "$PROJECT_ROOT/electron/package.json" ]; then
    echo -e "${YELLOW}Building Electron apps (this may take a while)...${NC}"
    cd "$PROJECT_ROOT/electron"
    
    # Install dependencies
    npm install
    
    # Build for current platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        npm run build-mac || echo "Mac build failed"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        npm run build-win || echo "Windows build failed"
    else
        npm run build-linux || echo "Linux build failed"
    fi
    
    # Copy built apps to package
    if [ -d "dist" ]; then
        cp -r dist/* "$PACKAGE_DIR/" 2>/dev/null || true
    fi
    
    cd "$PROJECT_ROOT"
fi

# Create the final ZIP package
echo -e "${GREEN}Creating final package...${NC}"
cd "$OUTPUT_DIR"
zip -r "$PACKAGE_NAME-$TIMESTAMP.zip" "$PACKAGE_NAME"

# Calculate package size
PACKAGE_SIZE=$(du -h "$PACKAGE_NAME-$TIMESTAMP.zip" | cut -f1)

echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Package Created Successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo -e "📦 Package: ${BLUE}$OUTPUT_DIR/$PACKAGE_NAME-$TIMESTAMP.zip${NC}"
echo -e "📏 Size: ${BLUE}$PACKAGE_SIZE${NC}"
echo
echo -e "${YELLOW}This file contains everything needed to install the dashboard:${NC}"
echo "  • Desktop app installers"
echo "  • Browser shortcuts"
echo "  • Mobile installation guide"
echo "  • Complete documentation"
echo
echo -e "${GREEN}Share this single ZIP file with employees!${NC}"
echo

# Cleanup
rm -rf "$PACKAGE_DIR"