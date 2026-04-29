const { app, BrowserWindow, ipcMain, shell, dialog, protocol, net } = require('electron');
const path        = require('path');
const fs          = require('fs');
const os          = require('os');
const mtpHelper   = require('./src/main/mtpHelper');
const mediaServer = require('./src/main/mediaServer');

let mainWindow;
const isDev = process.argv.includes('--dev');
let driveMonitorInterval = null;
let lastDriveList = [];

/* Force software video decoding only — keeps UI hardware accelerated
   but prevents GPU state errors during video playback */
app.commandLine.appendSwitch('disable-accelerated-video-decode');
app.commandLine.appendSwitch('disable-accelerated-video-encode');

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
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    startDriveMonitoring();
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
    setupDevReload();
  }
  
  mainWindow.on('closed', () => {
    stopDriveMonitoring();
  });
}

/* ── Register vortex-media:// stream protocol ───────────────
   Serves local video/audio files with proper range-request
   support so Electron never buffers mid-playback.
   Must be called before app is ready.
──────────────────────────────────────────────────────────── */
const MIME_MAP = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  mkv:  'video/x-matroska',
  mov:  'video/quicktime',
  avi:  'video/x-msvideo',
  wmv:  'video/x-ms-wmv',
  flv:  'video/x-flv',
  m4v:  'video/x-m4v',
  ogv:  'video/ogg',
  '3gp':'video/3gpp',
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  flac: 'audio/flac',
  m4a:  'audio/mp4',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'vortex-media',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    }
  }
]);

app.whenReady().then(async () => {
  /* Pre-detect GPU encoder so first transcode is instant */
  const { detectEncoder } = require('./src/main/gpuDetect');
  detectEncoder().catch(() => {});

  /* Start local media server for zero-buffering video playback */
  await mediaServer.start();

  /* Register the actual handler after app is ready */
  protocol.handle('vortex-media', (request) => {
    /* URL format: vortex-media:///C:/path/to/file.mp4 */
    const rawPath = decodeURIComponent(
      request.url.replace('vortex-media:///', '')
    );

    /* Normalise Windows path separators */
    const filePath = rawPath.replace(/\//g, path.sep);

    try {
      const stat = fs.statSync(filePath);
      const ext  = path.extname(filePath).toLowerCase().slice(1);
      const mime = MIME_MAP[ext] || 'application/octet-stream';
      const total = stat.size;

      /* Parse Range header for seek support */
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        const [, startStr, endStr] = rangeHeader.match(/bytes=(\d+)-(\d*)/) || [];
        const start = parseInt(startStr, 10);
        const end   = endStr ? parseInt(endStr, 10) : total - 1;
        const chunkSize = end - start + 1;

        return new Response(
          fs.createReadStream(filePath, { start, end, highWaterMark: 1024 * 1024 }),
          {
            status: 206,
            headers: {
              'Content-Type':   mime,
              'Content-Range':  `bytes ${start}-${end}/${total}`,
              'Accept-Ranges':  'bytes',
              'Content-Length': String(chunkSize),
            }
          }
        );
      }

      /* Full file response */
      return new Response(
        fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }),
        {
          status: 200,
          headers: {
            'Content-Type':   mime,
            'Accept-Ranges':  'bytes',
            'Content-Length': String(total),
          }
        }
      );
    } catch (err) {
      console.error('vortex-media protocol error:', err.message);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();
  registerIpcHandlers();
});
app.on('window-all-closed', () => {
  mediaServer.stop();
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

function registerIpcHandlers() {
  // ── Window ──────────────────────────────────────────────
  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
  ipcMain.on('window:close',    () => mainWindow.close());

  // ── Media server port ────────────────────────────────────
  ipcMain.handle('media:getPort',          () => mediaServer.getPort());
  ipcMain.handle('media:getProgress',      (e, p) => mediaServer.getProgress(p));
  ipcMain.handle('media:getTranscodeInfo', (e, p) => mediaServer.getTranscodeInfo(p));

  // ── Paths ────────────────────────────────────────────────
  ipcMain.handle('fs:getHomePath', () => os.homedir());
  ipcMain.handle('fs:getSpecialPath', (e, name) => {
    const m = { home: os.homedir(), desktop: path.join(os.homedir(),'Desktop'), downloads: path.join(os.homedir(),'Downloads'), documents: path.join(os.homedir(),'Documents'), pictures: path.join(os.homedir(),'Pictures'), music: path.join(os.homedir(),'Music'), videos: path.join(os.homedir(),'Videos') };
    return m[name] || os.homedir();
  });

  // ── Read directory ───────────────────────────────────────
  ipcMain.handle('fs:readDir', async (e, dirPath) => {
    // Check if it's a portable device path (starts with Computer\)
    if (dirPath.startsWith('Computer\\')) {
      console.log('📱 Reading portable device:', dirPath);
      return await mtpHelper.readDir(dirPath);
    }
    
    // Regular file system
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
  ipcMain.handle('fs:getDrives', async () => {
    if (process.platform !== 'win32') return { success: true, drives: [{ letter: os.homedir() + path.sep, freeSpace: 0, size: 0 }] };
    
    const { exec } = require('child_process');
    const drives = [];
    
    // Get logical drives
    await new Promise(resolve => {
      exec('wmic logicaldisk get caption,size,freespace /format:csv', { timeout: 4000 }, (err, stdout) => {
        if (!err) {
          const logicalDrives = stdout.trim().split('\n')
            .filter(l => l.trim() && !l.startsWith('Node'))
            .map(l => { 
              const p = l.split(','); 
              return { 
                letter: (p[1]||'').trim() + '\\', 
                freeSpace: parseInt(p[2])||0, 
                size: parseInt(p[3])||0,
                type: 'drive'
              }; 
            })
            .filter(d => d.letter.length > 1);
          drives.push(...logicalDrives);
        }
        resolve();
      });
    });
    
    console.log('💿 Logical drives:', drives.length);
    
    // Get portable devices using WMIC (simpler approach)
    await new Promise(resolve => {
      exec('wmic path Win32_PnPEntity where "PNPClass=\'WPD\' OR PNPClass=\'MTP\'" get Caption /format:csv', { timeout: 4000 }, (err, stdout) => {
        if (!err) {
          const portableDevices = stdout.trim().split('\n')
            .filter(l => l.trim() && !l.startsWith('Node'))
            .map(l => {
              const parts = l.split(',');
              const name = (parts[1] || '').trim();
              if (name) {
                // Use Computer\{device-name} as path (Windows portable device path format)
                return {
                  letter: name,
                  path: `Computer\\${name}`,
                  freeSpace: 0,
                  size: 0,
                  type: 'portable',
                  isPortable: true
                };
              }
              return null;
            })
            .filter(d => d !== null);
          
          console.log('📱 Portable devices found:', portableDevices.length, portableDevices);
          drives.push(...portableDevices);
        }
        resolve();
      });
    });
    
    console.log('💿 Total drives (logical + portable):', drives.length);
    
    return { success: true, drives };
  });

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
  
  // ── Read File ────────────────────────────────────────────
  ipcMain.handle('fs:readFile', async (e, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return { success: true, content };
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

// ── Drive Monitoring ─────────────────────────────────────
function startDriveMonitoring() {
  console.log('💿 Starting drive monitoring...');
  
  // Initial drive list
  getDriveList().then(drives => {
    lastDriveList = drives;
  });
  
  // Check every 2 seconds (faster for better UX)
  driveMonitorInterval = setInterval(async () => {
    const currentDrives = await getDriveList();
    
    // Compare with last list
    if (JSON.stringify(currentDrives) !== JSON.stringify(lastDriveList)) {
      console.log('💿 Drive change detected!');
      
      // Find added drives
      const added = currentDrives.filter(d => !lastDriveList.includes(d));
      // Find removed drives
      const removed = lastDriveList.filter(d => !currentDrives.includes(d));
      
      if (added.length > 0) {
        console.log('✅ Drives added:', added);
      }
      if (removed.length > 0) {
        console.log('❌ Drives removed:', removed);
      }
      
      // Notify renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('drives:changed', { added, removed });
      }
      
      lastDriveList = currentDrives;
    }
  }, 2000);
}

function stopDriveMonitoring() {
  if (driveMonitorInterval) {
    clearInterval(driveMonitorInterval);
    driveMonitorInterval = null;
    console.log('💿 Drive monitoring stopped');
  }
}

async function getDriveList() {
  return new Promise(resolve => {
    if (process.platform !== 'win32') {
      return resolve([]);
    }
    
    const { exec } = require('child_process');
    
    // Get both logical drives AND portable devices (phones, cameras, etc.)
    const commands = [
      // Logical drives (USB, HDD, etc.)
      'wmic logicaldisk get caption /format:csv',
      // Portable devices (phones via MTP)
      'wmic path Win32_PnPEntity where "PNPClass=\'WPD\' OR PNPClass=\'MTP\'" get Caption /format:csv'
    ];
    
    Promise.all(commands.map(cmd => 
      new Promise(res => {
        exec(cmd, { timeout: 2000 }, (err, stdout) => {
          if (err) return res([]);
          const items = stdout.trim().split('\n')
            .filter(l => l.trim() && !l.startsWith('Node'))
            .map(l => {
              const parts = l.split(',');
              return (parts[1] || '').trim();
            })
            .filter(d => d.length > 0);
          res(items);
        });
      })
    )).then(results => {
      // Combine logical drives and portable devices
      const drives = [...results[0]]; // Logical drives
      const portableDevices = results[1]; // Phones, cameras, etc.
      
      // Add portable devices with special prefix
      portableDevices.forEach(device => {
        if (device && !drives.includes(device)) {
          drives.push('📱 ' + device);
        }
      });
      
      resolve(drives);
    });
  });
}
