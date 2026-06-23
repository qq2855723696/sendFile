'use strict';

const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// ─── 启动 Express 服务 ───────────────────────────────────────
let serverStarted = false;
let serverModule = null;
function startServer() {
  if (serverStarted) return;
  serverStarted = true;
  try {
    // server/index.js 会自动处理端口递增
    serverModule = require('../server/index.js');
  } catch (err) {
    console.error('[Electron] 服务启动失败:', err.message);
  }
}

// ─── 创建主窗口 ──────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#eef2f7',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    title: 'SendFile — 局域网文件快传',
    autoHideMenuBar: true,
    show: false
  });

  Menu.setApplicationMenu(null);

  const PORT = Number(process.env.PORT || 3000);
  setTimeout(() => {
    const actualPort = serverModule && serverModule.port ? serverModule.port : PORT;
    mainWindow.loadURL(`http://localhost:${actualPort}`);
  }, 100);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Electron 生命周期 ───────────────────────────────────────
app.whenReady().then(() => {
  startServer();

  setTimeout(() => {
    createWindow();
  }, 900);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', err => {
  console.error('[Electron] 未捕获异常:', err);
});
