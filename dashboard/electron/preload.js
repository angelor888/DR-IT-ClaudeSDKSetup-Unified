// Preload script for Electron
// This runs in the renderer process before the page loads
// It has access to both renderer globals (window, document) and Node.js

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Add any additional APIs needed by the dashboard here
// For security, we don't expose the full Node.js or Electron APIs