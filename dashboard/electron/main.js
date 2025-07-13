const { app, BrowserWindow, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;
let tray;

// Enable live reload for Electron too
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// Dashboard URL - change this to your production URL
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://dashboard.duetright.com';

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    title: 'DuetRight Dashboard',
    show: false // Don't show until ready
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Customer',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/customers/new`);
          }
        },
        {
          label: 'New Job',
          accelerator: 'CmdOrCtrl+J',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/jobs/new`);
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.loadURL(DASHBOARD_URL);
          }
        },
        {
          label: 'Customers',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/customers`);
          }
        },
        {
          label: 'Jobs',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/jobs`);
          }
        },
        {
          label: 'Communications',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/communications`);
          }
        },
        {
          label: 'Calendar',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.loadURL(`${DASHBOARD_URL}/calendar`);
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://docs.duetright.com');
          }
        },
        {
          label: 'Support',
          click: async () => {
            await shell.openExternal('https://support.duetright.com');
          }
        },
        { type: 'separator' },
        {
          label: 'About DuetRight Dashboard',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DuetRight Dashboard',
              message: 'DuetRight Dashboard Desktop',
              detail: 'Version 1.0.0\n\nUnified dashboard for business operations, customer management, and communications.\n\n© 2025 DuetRight',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the dashboard
  mainWindow.loadURL(DASHBOARD_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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

  // Create system tray
  createTray();
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icons', 'tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'New Customer',
      click: () => {
        mainWindow.show();
        mainWindow.loadURL(`${DASHBOARD_URL}/customers/new`);
      }
    },
    {
      label: 'New Job',
      click: () => {
        mainWindow.show();
        mainWindow.loadURL(`${DASHBOARD_URL}/jobs/new`);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('DuetRight Dashboard');
  tray.setContextMenu(contextMenu);
  
  // Show window on tray double-click
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // In production, only accept valid certificates
  if (process.env.NODE_ENV === 'development') {
    // Ignore certificate errors in development
    event.preventDefault();
    callback(true);
  } else {
    // Use default behavior in production
    callback(false);
  }
});

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});