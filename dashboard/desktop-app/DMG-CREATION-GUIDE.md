# 🔧 DuetRight Dashboard - DMG Creation Guide

## 📋 Prerequisites

### Apple Developer Requirements
1. **Apple Developer Account**: $99/year membership required
2. **Code Signing Certificate**: Download from Apple Developer Portal
3. **macOS Development Environment**: Xcode Command Line Tools
4. **Node.js**: Version 16+ installed

### Required Tools
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Node.js dependencies
npm install -g electron
npm install -g electron-builder
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd desktop-app
npm install
```

### 2. Development Testing
```bash
# Test in development mode
npm run electron-dev

# Test with production dashboard
npm run electron
```

### 3. Build DMG (Requires Code Signing)
```bash
# Build for macOS
npm run build-mac

# Create DMG package
npm run build-dmg
```

## 🔐 Code Signing Setup

### 1. Apple Developer Certificate
1. Log into [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create new certificate: "Developer ID Application"
4. Download and install in Keychain Access

### 2. Configure Signing
```bash
# List available certificates
security find-identity -v -p codesigning

# Set environment variables
export CSC_NAME="Developer ID Application: DuetRight LLC"
export CSC_KEY_PASSWORD="your-certificate-password"
```

### 3. Notarization Setup
```bash
# Create app-specific password at appleid.apple.com
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

## 📦 Build Configuration

### Custom DMG Appearance
1. **Background Image**: Place `dmg-background.png` in `assets/`
2. **App Icon**: Convert to ICNS format and place in `assets/icon.icns`
3. **Window Size**: Configured in `package.json` build settings

### Icon Creation
```bash
# Create ICNS from PNG (requires iconutil)
mkdir icon.iconset
cp icon-1024x1024.png icon.iconset/icon_512x512@2x.png
cp icon-512x512.png icon.iconset/icon_512x512.png
cp icon-256x256.png icon.iconset/icon_256x256.png
# ... add other sizes
iconutil -c icns icon.iconset
```

## 🏗️ Build Process

### 1. Prepare Assets
```bash
# Create assets directory
mkdir -p assets

# Copy icons from main project
cp ../frontend/public/icons/icon-512x512.svg assets/
# Convert SVG to PNG/ICNS as needed
```

### 2. Build Application
```bash
# Clean previous builds
rm -rf dist/

# Build for distribution
npm run build

# Output will be in dist/ directory
```

### 3. DMG Contents
The created DMG will include:
- **DuetRight Dashboard.app**: Main application
- **Applications shortcut**: Drag-drop installation
- **Custom background**: Professional appearance
- **Read-first instructions**: Usage guidelines

## 🚀 Distribution

### Secure Sharing Options
1. **Encrypted Cloud Storage**: Google Drive, Dropbox with password
2. **Direct Download**: Host on company website
3. **Internal Distribution**: Email to team members
4. **Enterprise Distribution**: MDM deployment

### Installation Instructions
Include these instructions with DMG:

```
DuetRight Dashboard Installation

1. Double-click the DMG file to mount
2. Drag "DuetRight Dashboard" to Applications folder
3. Right-click the app and select "Open" (first time only)
4. Click "Open" in the security dialog
5. The app will launch and connect to the dashboard

System Requirements:
- macOS 10.15 (Catalina) or later
- 4GB RAM recommended
- Internet connection required
```

## 🔒 Security Features

### App Hardening
- **Hardened Runtime**: Enabled for security
- **Library Validation**: Prevents code injection
- **Network Isolation**: Controlled external access
- **Automatic Updates**: Via electron-updater

### User Privacy
- **No Telemetry**: No usage data collection
- **Local Storage**: Offline data encrypted
- **Credential Security**: Web-based OAuth only
- **Sandbox Compliance**: Apple security requirements

## 🐛 Troubleshooting

### Common Issues
1. **Gatekeeper Blocking**: Use "Right-click → Open" for first launch
2. **Certificate Issues**: Verify code signing setup
3. **Notarization Failures**: Check Apple ID configuration
4. **Build Errors**: Ensure all dependencies installed

### Debug Commands
```bash
# Verify app signature
codesign -dv --verbose=4 "DuetRight Dashboard.app"

# Check entitlements
codesign -d --entitlements :- "DuetRight Dashboard.app"

# Test notarization
xcrun altool --notarize-app --file app.dmg --primary-bundle-id com.duetright.dashboard
```

## 📊 Performance Optimization

### App Size Reduction
- **Remove Dev Dependencies**: Production build only
- **Asset Optimization**: Compress images and icons
- **Code Splitting**: Lazy load features
- **Bundle Analysis**: Identify large dependencies

### Memory Management
- **Window Limits**: Single main window
- **Cache Control**: Automatic cleanup
- **Background Processing**: Minimal CPU usage
- **Network Efficiency**: Batch API calls

## 🔄 Automatic Updates

### Update Server Setup
1. **Release Hosting**: Firebase hosting with releases/ folder
2. **Version Management**: Semantic versioning (1.0.0, 1.0.1, etc.)
3. **Update Manifest**: Auto-generated by electron-builder
4. **User Notifications**: In-app update prompts

### Update Process
```javascript
// In main.js - already configured
autoUpdater.checkForUpdatesAndNotify();
```

## 📈 Analytics & Monitoring

### Usage Tracking (Optional)
- **Crash Reporting**: Electron's built-in crash reporter
- **Performance Metrics**: App launch time, memory usage
- **Feature Usage**: Dashboard page visits
- **Error Logging**: Network failures, API errors

### Privacy Compliance
- **Opt-in Analytics**: User permission required
- **Data Minimization**: Essential metrics only
- **Local Storage**: No cloud data collection
- **Transparency**: Clear privacy policy

## 🎯 Next Steps

### Phase 1: Development Setup
1. Install Apple Developer tools
2. Create code signing certificates
3. Test build process locally
4. Verify app functionality

### Phase 2: Production Build
1. Configure release signing
2. Set up notarization
3. Create professional DMG
4. Test installation process

### Phase 3: Distribution
1. Set up secure hosting
2. Create installation guides
3. Train team on deployment
4. Monitor app performance

---

**Note**: DMG creation requires a macOS system with Xcode. This guide provides the complete framework, but final compilation must be done on macOS hardware with proper Apple Developer certificates.

For immediate distribution, consider the PWA installation option available at the live dashboard URL.