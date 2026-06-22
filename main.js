'use strict';

const { app, BrowserWindow, shell, Menu, nativeImage } = require('electron');
const path = require('path');

// ─── 启动 Express 服务 ───────────────────────────────────────
// 在 Electron 主进程中直接 require server.js，服务随进程启动
let serverStarted = false;
function startServer() {
  if (serverStarted) return;
  serverStarted = true;
  try {
    require('./server.js');
  } catch (err) {
    console.error('[Electron] 服务启动失败:', err);
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
      webSecurity: false        // 允许加载 localhost 静态资源
    },
    title: 'SendFile — 局域网文件快传',
    autoHideMenuBar: true,
    show: false                 // 等内容加载后再显示，避免白屏
  });

  // 去掉默认菜单
  Menu.setApplicationMenu(null);

  // 加载本地服务地址
  const PORT = Number(process.env.PORT || 3000);
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // 页面加载完毕后再显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 外部链接用系统浏览器打开
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

  // 给 Express 一点时间绑定端口
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

// 捕获未处理异常，防止 Electron 崩溃退出
process.on('uncaughtException', err => {
  console.error('[Electron] 未捕获异常:', err);
});
