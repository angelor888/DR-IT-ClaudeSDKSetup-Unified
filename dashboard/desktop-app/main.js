const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');

// Configure store for app settings
const store = new Store();

// Keep a global reference of the window object
let mainWindow;

const isDev = process.env.ELECTRON_IS_DEV === 'true';
const DASHBOARD_URL = 'https://duetright-dashboard.web.app';

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false // Don't show until ready
  });

  // Load the dashboard
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(DASHBOARD_URL);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== DASHBOARD_URL && parsedUrl.origin !== 'http://localhost:3000') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Set up menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'DuetRight Dashboard',
      submenu: [
        {
          label: 'About DuetRight Dashboard',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DuetRight Dashboard',
              message: 'DuetRight Dashboard',
              detail: 'Professional IT services management platform\\n\\nVersion: 1.0.0\\nCopyright © 2025 DuetRight LLC'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            // Open preferences window or navigate to settings
            mainWindow.webContents.executeJavaScript(`
              if (window.location.hash !== '#/settings') {
                window.location.hash = '#/settings';
              }
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Services',
          submenu: [
            { label: 'Hide DuetRight Dashboard', accelerator: 'Cmd+H', role: 'hide' },
            { label: 'Hide Others', accelerator: 'Cmd+Alt+H', role: 'hideothers' },
            { label: 'Show All', role: 'unhide' }
          ]
        },
        { type: 'separator' },
        {
          label: 'Quit DuetRight Dashboard',
          accelerator: 'Cmd+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Customer',
          accelerator: 'Cmd+N',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/customers/new';
            `);
          }
        },
        {
          label: 'New Job',
          accelerator: 'Cmd+Shift+N',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/jobs/new';
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Refresh',
          accelerator: 'Cmd+R',
          click: () => {
            mainWindow.reload();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
        { label: 'Select All', accelerator: 'Cmd+A', role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'Cmd+1',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/dashboard';
            `);
          }
        },
        {
          label: 'Customers',
          accelerator: 'Cmd+2',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/customers';
            `);
          }
        },
        {
          label: 'Jobs',
          accelerator: 'Cmd+3',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/jobs';
            `);
          }
        },
        {
          label: 'Communications',
          accelerator: 'Cmd+4',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '#/communications';
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'Cmd+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'Cmd+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetzoom' },
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomin' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomout' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Close', accelerator: 'Cmd+W', role: 'close' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'DuetRight Website',
          click: () => {
            shell.openExternal('https://www.duetright.com');
          }
        },
        {
          label: 'Dashboard Help',
          click: () => {
            shell.openExternal('https://duetright-dashboard.web.app/help');
          }
        },
        {
          label: 'Contact Support',
          click: () => {
            shell.openExternal('mailto:info@duetright.com?subject=Dashboard Support');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Auto-updater events
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update available',
    message: 'A new version of DuetRight Dashboard is available. It will be downloaded in the background.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update ready',
    message: 'Update downloaded. The application will restart to apply the update.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// IPC handlers for app functionality
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Excel', extensions: ['xlsx'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
    ]
  });
  return result;
});

// Handle app protocol for deep linking
app.setAsDefaultProtocolClient('duetright-dashboard');