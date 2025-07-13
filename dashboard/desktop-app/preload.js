const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // File operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Platform detection
  platform: process.platform,
  
  // App controls
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  
  // Notifications
  showNotification: (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
  
  // Local storage helpers for offline functionality
  setStorageItem: (key, value) => {
    localStorage.setItem(`duetright_${key}`, JSON.stringify(value));
  },
  
  getStorageItem: (key) => {
    const item = localStorage.getItem(`duetright_${key}`);
    return item ? JSON.parse(item) : null;
  },
  
  removeStorageItem: (key) => {
    localStorage.removeItem(`duetright_${key}`);
  },
  
  // Network status
  isOnline: () => navigator.onLine,
  
  // App events
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback)
});

// Enhanced offline capabilities
window.addEventListener('DOMContentLoaded', () => {
  // Add offline indicator
  const addOfflineIndicator = () => {
    if (!navigator.onLine) {
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        text-align: center;
        padding: 8px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
      `;
      indicator.textContent = '⚠️ You are offline. Some features may not be available.';
      document.body.insertBefore(indicator, document.body.firstChild);
    }
  };

  const removeOfflineIndicator = () => {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  };

  // Monitor network status
  window.addEventListener('online', removeOfflineIndicator);
  window.addEventListener('offline', addOfflineIndicator);
  
  // Check initial status
  if (!navigator.onLine) {
    addOfflineIndicator();
  }
});

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}