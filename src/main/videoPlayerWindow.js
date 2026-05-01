/* ============================================================
   VIDEO PLAYER WINDOW — Creator + IPC handlers
   ============================================================ */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

/* __dirname = vortex-file-manager/src/main/
   HTML file  = vortex-file-manager/src/renderer/video-player/index.html
   preload    = vortex-file-manager/preload.js                           */
const HTML_PATH    = path.join(__dirname, '../renderer/video-player/index.html');
const PRELOAD_PATH = path.join(__dirname, '../../preload.js');

let _win = null;

function createVideoPlayerWindow(filePath, playlist, playlistIdx) {
  const encoded     = encodeURIComponent(filePath);
  const playlistEnc = encodeURIComponent(JSON.stringify(playlist));
  const query       = { path: encoded, playlist: playlistEnc, idx: String(playlistIdx) };

  /* Reuse existing window */
  if (_win && !_win.isDestroyed()) {
    _win.loadFile(HTML_PATH, { query });
    _win.focus();
    return;
  }

  _win = new BrowserWindow({
    width:  1280, height: 780,
    minWidth: 800, minHeight: 500,
    title: 'Vortex Player',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    menuBarVisible:  false,
    webPreferences: {
      preload:          PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  _win.setMenu(null);
  _win.loadFile(HTML_PATH, { query });
  _win.on('closed', () => { _win = null; });

  /* Window controls — re-register on each new window */
  ipcMain.removeAllListeners('video:minimize');
  ipcMain.removeAllListeners('video:maximize');
  ipcMain.removeAllListeners('video:close');

  ipcMain.on('video:minimize', () => _win?.minimize());
  ipcMain.on('video:maximize', () => _win?.isMaximized() ? _win.unmaximize() : _win.maximize());
  ipcMain.on('video:close',    () => _win?.close());
}

function register(isDev) {
  ipcMain.handle('video:openPlayer', (e, filePath, playlist, playlistIdx) => {
    createVideoPlayerWindow(filePath, playlist || [], playlistIdx || 0);
  });

  if (isDev) {
    ipcMain.removeAllListeners('video:openDevTools');
    ipcMain.handle('video:openDevTools', () => {
      _win?.webContents.openDevTools({ mode: 'detach' });
    });
  }
}

module.exports = { register };
