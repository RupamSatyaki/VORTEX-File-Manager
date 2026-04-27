const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

let mainWindow;
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 800, minHeight: 500,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  if (isDev) {
    mainWindow.webContents.openDevTools();
    setupDevReload();
  }
}

app.whenReady().then(() => { createWindow(); registerIpcHandlers(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

function registerIpcHandlers() {
  // ── Window ──────────────────────────────────────────────
  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
  ipcMain.on('window:close',    () => mainWindow.close());

  // ── Paths ────────────────────────────────────────────────
  ipcMain.handle('fs:getHomePath', () => os.homedir());
  ipcMain.handle('fs:getSpecialPath', (e, name) => {
    const m = { home: os.homedir(), desktop: path.join(os.homedir(),'Desktop'), downloads: path.join(os.homedir(),'Downloads'), documents: path.join(os.homedir(),'Documents'), pictures: path.join(os.homedir(),'Pictures'), music: path.join(os.homedir(),'Music'), videos: path.join(os.homedir(),'Videos') };
    return m[name] || os.homedir();
  });

  // ── Read directory ───────────────────────────────────────
  ipcMain.handle('fs:readDir', async (e, dirPath) => {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const files = await Promise.all(entries.map(async entry => {
        const full = path.join(dirPath, entry.name);
        try {
          const stat = await fs.promises.stat(full);
          return { name: entry.name, path: full, isDirectory: entry.isDirectory(), size: stat.size, modified: stat.mtime.getTime(), created: stat.birthtime.getTime(), ext: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase().slice(1) };
        } catch {
          return { name: entry.name, path: full, isDirectory: entry.isDirectory(), size: 0, modified: 0, created: 0, ext: '' };
        }
      }));
      return { success: true, files };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ── Drives ───────────────────────────────────────────────
  ipcMain.handle('fs:getDrives', () => new Promise(resolve => {
    if (process.platform !== 'win32') return resolve({ success: true, drives: [{ letter: os.homedir() + path.sep, freeSpace: 0, size: 0 }] });
    const { exec } = require('child_process');
    exec('wmic logicaldisk get caption,size,freespace /format:csv', { timeout: 4000 }, (err, stdout) => {
      if (err) return resolve({ success: true, drives: [{ letter: 'C:\\', freeSpace: 0, size: 0 }] });
      const drives = stdout.trim().split('\n')
        .filter(l => l.trim() && !l.startsWith('Node'))
        .map(l => { const p = l.split(','); return { letter: (p[1]||'').trim() + '\\', freeSpace: parseInt(p[2])||0, size: parseInt(p[3])||0 }; })
        .filter(d => d.letter.length > 1);
      resolve({ success: true, drives });
    });
  }));

  // ── CRUD ─────────────────────────────────────────────────
  ipcMain.handle('fs:mkdir', async (e, p) => {
    try { await fs.promises.mkdir(p, { recursive: true }); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('fs:createFile', async (e, filePath) => {
    try { await fs.promises.writeFile(filePath, '', { flag: 'wx' }); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('fs:rename', async (e, oldPath, newPath) => {
    try { await fs.promises.rename(oldPath, newPath); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('fs:delete', async (e, filePath) => {
    try { await shell.trashItem(filePath); return { success: true }; }
    catch {
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) await fs.promises.rm(filePath, { recursive: true, force: true });
        else await fs.promises.unlink(filePath);
        return { success: true };
      } catch (err2) { return { success: false, error: err2.message }; }
    }
  });

  ipcMain.handle('fs:copy', async (e, src, dest) => {
    try { await copyRecursive(src, dest); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('fs:move', async (e, src, dest) => {
    try { await fs.promises.rename(src, dest); return { success: true }; }
    catch {
      try { await copyRecursive(src, dest); const s = await fs.promises.stat(src); if (s.isDirectory()) await fs.promises.rm(src,{recursive:true,force:true}); else await fs.promises.unlink(src); return { success: true }; }
      catch (err2) { return { success: false, error: err2.message }; }
    }
  });

  ipcMain.handle('fs:exists', async (e, p) => { try { await fs.promises.access(p); return true; } catch { return false; } });

  // ── Stat ─────────────────────────────────────────────────
  ipcMain.handle('fs:stat', async (e, filePath) => {
    try {
      const stat = await fs.promises.stat(filePath);
      return { success: true, size: stat.size, modified: stat.mtime.getTime(), created: stat.birthtime.getTime(), isDirectory: stat.isDirectory(), mode: stat.mode };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ── Search ───────────────────────────────────────────────
  ipcMain.handle('fs:search', async (e, dirPath, query) => {
    try {
      const q = query.toLowerCase();
      const results = [];
      async function walk(dir, depth) {
        if (depth > 4) return;
        let entries;
        try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          if (entry.name.toLowerCase().includes(q)) {
            const full = path.join(dir, entry.name);
            try {
              const stat = await fs.promises.stat(full);
              results.push({ name: entry.name, path: full, isDirectory: entry.isDirectory(), size: stat.size, modified: stat.mtime.getTime(), created: stat.birthtime.getTime(), ext: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase().slice(1) });
            } catch {}
          }
          if (entry.isDirectory() && results.length < 300) await walk(path.join(dir, entry.name), depth + 1);
          if (results.length >= 300) break;
        }
      }
      await walk(dirPath, 0);
      return { success: true, files: results };
    } catch (err) { return { success: false, error: err.message, files: [] }; }
  });

  // ── Shell ────────────────────────────────────────────────
  ipcMain.handle('shell:openPath', async (e, p) => { const r = await shell.openPath(p); return r === '' ? { success: true } : { success: false, error: r }; });
  ipcMain.on('shell:showInFolder', (e, p) => shell.showItemInFolder(p));
  ipcMain.on('shell:openExternal', (e, url) => shell.openExternal(url));

  // ── Storage ──────────────────────────────────────────────
  const storageDir = path.join(app.getPath('userData'), 'storage');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  ipcMain.handle('storage:read', async (e, key) => {
    try { const f = path.join(storageDir, key + '.json'); if (!fs.existsSync(f)) return null; return JSON.parse(await fs.promises.readFile(f, 'utf8')); }
    catch { return null; }
  });
  ipcMain.handle('storage:write', async (e, key, data) => {
    try { await fs.promises.writeFile(path.join(storageDir, key + '.json'), JSON.stringify(data, null, 2), 'utf8'); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  // ── Dialog ───────────────────────────────────────────────
  ipcMain.handle('dialog:openFolder', async () => {
    const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });
}

async function copyRecursive(src, dest) {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    for (const e of await fs.promises.readdir(src)) await copyRecursive(path.join(src, e), path.join(dest, e));
  } else { await fs.promises.copyFile(src, dest); }
}

// ── Dev Mode Auto-Reload ─────────────────────────────────
function setupDevReload() {
  if (!isDev) return;
  
  const chokidar = require('chokidar');
  const watchPaths = [
    path.join(__dirname, 'src/renderer/**/*.html'),
    path.join(__dirname, 'src/renderer/**/*.css'),
    path.join(__dirname, 'src/renderer/**/*.js'),
  ];

  console.log('🔥 Dev mode: Watching for file changes...');
  
  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  let reloadTimeout;
  watcher.on('change', (filePath) => {
    console.log(`📝 File changed: ${path.basename(filePath)}`);
    
    // Debounce reload
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('🔄 Reloading...');
        mainWindow.webContents.reloadIgnoringCache();
      }
    }, 200);
  });

  watcher.on('error', error => console.error('❌ Watcher error:', error));
}
