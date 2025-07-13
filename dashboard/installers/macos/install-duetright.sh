#!/bin/bash
# DuetRight Dashboard Quick Installer for macOS
# This script creates an app bundle and installs it

set -e

echo "===================================="
echo "DuetRight Dashboard Quick Setup"
echo "===================================="
echo

# Dashboard URL
DASHBOARD_URL="https://dashboard.duetright.com"
APP_NAME="DuetRight Dashboard"
INSTALL_DIR="/Applications/${APP_NAME}.app"

# Check if running with proper permissions
if [ ! -w "/Applications" ]; then
    echo "This installer needs write access to /Applications."
    echo "Please run with: sudo ./install-duetright.sh"
    exit 1
fi

# Create app bundle structure
echo "Creating app bundle..."
mkdir -p "${INSTALL_DIR}/Contents/MacOS"
mkdir -p "${INSTALL_DIR}/Contents/Resources"

# Create Info.plist
cat > "${INSTALL_DIR}/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.duetright.dashboard</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
</dict>
</plist>
EOF

# Create launcher script
cat > "${INSTALL_DIR}/Contents/MacOS/launcher" << EOF
#!/bin/bash
# Open DuetRight Dashboard in default browser app mode

# Try different browsers in order of preference
if command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" &> /dev/null; then
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --app="${DASHBOARD_URL}" --start-fullscreen
elif command -v "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" &> /dev/null; then
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --app="${DASHBOARD_URL}" --start-fullscreen
elif command -v "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" &> /dev/null; then
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --app="${DASHBOARD_URL}" --start-fullscreen
else
    # Fallback to default browser
    open "${DASHBOARD_URL}"
fi
EOF

# Make launcher executable
chmod +x "${INSTALL_DIR}/Contents/MacOS/launcher"

# Download icon
echo "Downloading icon..."
curl -s -o "${INSTALL_DIR}/Contents/Resources/icon.png" "${DASHBOARD_URL}/icons/icon-512x512.png" || echo "Could not download icon"

# Create .icns file from PNG (if sips is available)
if command -v sips &> /dev/null && [ -f "${INSTALL_DIR}/Contents/Resources/icon.png" ]; then
    sips -s format icns "${INSTALL_DIR}/Contents/Resources/icon.png" --out "${INSTALL_DIR}/Contents/Resources/icon.icns" 2>/dev/null || true
fi

# Create alias on Desktop
echo "Creating Desktop alias..."
osascript << EOF
tell application "Finder"
    try
        make alias file to POSIX file "${INSTALL_DIR}" at desktop
        set name of result to "${APP_NAME}"
    end try
end tell
EOF

# Add to Dock
echo "Adding to Dock..."
defaults write com.apple.dock persistent-apps -array-add "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>${INSTALL_DIR}</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
killall Dock

# Create uninstaller
cat > "/tmp/uninstall-duetright.sh" << EOF
#!/bin/bash
echo "Uninstalling DuetRight Dashboard..."
rm -rf "${INSTALL_DIR}"
rm -f ~/Desktop/"${APP_NAME}"
echo "Uninstall complete."
EOF
chmod +x "/tmp/uninstall-duetright.sh"
mv "/tmp/uninstall-duetright.sh" "${INSTALL_DIR}/Contents/MacOS/uninstall.sh"

echo
echo "===================================="
echo "Installation Complete!"
echo "===================================="
echo
echo "The DuetRight Dashboard has been installed successfully."
echo
echo "You can now:"
echo "- Click the app in your Applications folder"
echo "- Use the Desktop alias"
echo "- Find it in your Dock"
echo "- Access it directly at: ${DASHBOARD_URL}"
echo
echo "For the best experience, we recommend using:"
echo "- Google Chrome"
echo "- Microsoft Edge"
echo "- Safari"
echo
echo "Would you like to launch the dashboard now? (y/n)"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "${INSTALL_DIR}"
fi