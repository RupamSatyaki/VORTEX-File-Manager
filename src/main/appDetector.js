/* ============================================================
   APP DETECTOR — Windows
   - Detects installed apps on startup (parallel)
   - Extracts real icons from .exe files
   - Persists cache to disk → instant on next launch
   ============================================================ */

const { exec }        = require('child_process');
const { app, nativeImage } = require('electron');
const fs   = require('fs');
const path = require('path');

/* ── Cache file path ── */
const CACHE_FILE = path.join(app.getPath('userData'), 'app-detector-cache.json');

/* ── Known app definitions ── */
const KNOWN_APPS = [
  /* Browsers */
  { id:'chrome',     name:'Google Chrome',        icon:'chrome',    exts:['pdf','html','htm','svg','png','jpg','jpeg','gif','webp','mp4','webm'],
    paths:['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', (process.env.LOCALAPPDATA||'')+'\\Google\\Chrome\\Application\\chrome.exe'] },
  { id:'firefox',    name:'Mozilla Firefox',       icon:'firefox',   exts:['pdf','html','htm','svg','png','jpg','jpeg','gif','webp'],
    paths:['C:\\Program Files\\Mozilla Firefox\\firefox.exe','C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'] },
  { id:'edge',       name:'Microsoft Edge',        icon:'edge',      exts:['pdf','html','htm','svg','png','jpg','jpeg','gif','webp','mp4'],
    paths:['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'] },
  /* Media */
  { id:'vlc',        name:'VLC Media Player',      icon:'vlc',       exts:['mp4','mkv','avi','mov','wmv','flv','m4v','mp3','wav','flac','ogg','webm','3gp'],
    paths:['C:\\Program Files\\VideoLAN\\VLC\\vlc.exe','C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'] },
  { id:'mpc',        name:'MPC-HC',                icon:'mpc',       exts:['mp4','mkv','avi','mov','wmv','flv','m4v','mp3','wav'],
    paths:['C:\\Program Files\\MPC-HC\\mpc-hc64.exe','C:\\Program Files (x86)\\MPC-HC\\mpc-hc.exe'] },
  { id:'wmplayer',   name:'Windows Media Player',  icon:'wmp',       exts:['mp4','avi','wmv','mp3','wav','wma'],
    paths:['C:\\Program Files\\Windows Media Player\\wmplayer.exe'] },
  /* Images */
  { id:'photos',     name:'Photos',                icon:'photos',    exts:['jpg','jpeg','png','gif','bmp','webp','tiff','heic'],
    paths:[], uwp:'Microsoft.Windows.Photos' },
  { id:'irfanview',  name:'IrfanView',             icon:'irfanview', exts:['jpg','jpeg','png','gif','bmp','webp','tiff','svg'],
    paths:['C:\\Program Files\\IrfanView\\i_view64.exe','C:\\Program Files (x86)\\IrfanView\\i_view32.exe'] },
  /* Text editors */
  { id:'vscode',     name:'VS Code',               icon:'vscode',    exts:['txt','md','js','ts','py','html','css','json','xml','yaml','yml','sh','bat','ini','cfg','log','csv'],
    paths:[(process.env.LOCALAPPDATA||'')+'\\Programs\\Microsoft VS Code\\Code.exe','C:\\Program Files\\Microsoft VS Code\\Code.exe'] },
  { id:'notepad',    name:'Notepad',               icon:'notepad',   exts:['txt','md','log','ini','cfg','bat','sh','csv','json','xml','html','css','js'],
    paths:['C:\\Windows\\System32\\notepad.exe','C:\\Windows\\notepad.exe'] },
  { id:'notepadpp',  name:'Notepad++',             icon:'notepadpp', exts:['txt','md','log','ini','cfg','bat','sh','csv','json','xml','html','css','js','py','ts'],
    paths:['C:\\Program Files\\Notepad++\\notepad++.exe','C:\\Program Files (x86)\\Notepad++\\notepad++.exe'] },
  /* Office */
  { id:'word',       name:'Microsoft Word',        icon:'word',      exts:['docx','doc','rtf','odt'],
    paths:[], regKey:'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\WINWORD.EXE' },
  { id:'excel',      name:'Microsoft Excel',       icon:'excel',     exts:['xlsx','xls','csv','ods'],
    paths:[], regKey:'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\EXCEL.EXE' },
  { id:'powerpoint', name:'Microsoft PowerPoint',  icon:'ppt',       exts:['pptx','ppt','odp'],
    paths:[], regKey:'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\POWERPNT.EXE' },
  /* PDF */
  { id:'acrobat',    name:'Adobe Acrobat',         icon:'acrobat',   exts:['pdf'],
    paths:[], regKey:'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Acrobat.exe' },
  { id:'acroreader', name:'Adobe Reader',          icon:'acrobat',   exts:['pdf'],
    paths:[], regKey:'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\AcroRd32.exe' },
  /* Archives */
  { id:'winrar',     name:'WinRAR',                icon:'winrar',    exts:['zip','rar','7z','tar','gz','bz2'],
    paths:['C:\\Program Files\\WinRAR\\WinRAR.exe','C:\\Program Files (x86)\\WinRAR\\WinRAR.exe'] },
  { id:'7zip',       name:'7-Zip',                 icon:'7zip',      exts:['zip','rar','7z','tar','gz','bz2'],
    paths:['C:\\Program Files\\7-Zip\\7zFM.exe','C:\\Program Files (x86)\\7-Zip\\7zFM.exe'] },
];

/* ── In-memory cache: ext → apps[] ── */
const _extCache = new Map();
let   _ready    = false;
let   _readyPromise = null;

/* ── Load disk cache ── */
function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (data && data.apps && data.timestamp) {
        /* Cache valid for 24 hours */
        const age = Date.now() - data.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          /* Populate ext cache from disk */
          for (const [ext, apps] of Object.entries(data.apps)) {
            _extCache.set(ext, apps);
          }
          _ready = true;
          console.log('✅ App detector: loaded from disk cache');
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ App detector cache read error:', err.message);
  }
  return false;
}

/* ── Save to disk cache ── */
function saveDiskCache() {
  try {
    const data = {
      timestamp: Date.now(),
      apps: Object.fromEntries(_extCache),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    console.log('💾 App detector: saved to disk cache');
  } catch (err) {
    console.warn('⚠️ App detector cache write error:', err.message);
  }
}

/* ── Query Windows registry ── */
function queryRegistry(key) {
  return new Promise((resolve) => {
    exec(`reg query "${key}" /ve`, { timeout: 2000 }, (err, stdout) => {
      if (err) { resolve(null); return; }
      const match = stdout.match(/REG_SZ\s+(.+)/);
      const val   = match ? match[1].trim().replace(/^"|"$/g, '') : null;
      resolve(val && fs.existsSync(val) ? val : null);
    });
  });
}

/* ── Extract icon from exe ── */
async function extractIcon(exePath) {
  if (!exePath) return null;
  try {
    const img = await app.getFileIcon(exePath, { size: 'normal' });
    if (!img.isEmpty()) return img.toDataURL();
  } catch {}
  return null;
}

/* ── Detect all apps + extract icons (parallel) ── */
async function detectAll() {
  if (_ready) return;
  if (_readyPromise) return _readyPromise;

  /* Try disk cache first */
  if (loadDiskCache()) return;

  console.log('🔍 App detector: scanning installed apps...');

  _readyPromise = (async () => {
    /* Step 1: Find exe paths for all apps (parallel) */
    await Promise.all(KNOWN_APPS.map(async (appDef) => {
      /* Check known paths */
      for (const p of (appDef.paths || [])) {
        if (p && fs.existsSync(p)) { appDef._exePath = p; break; }
      }
      /* Check registry */
      if (!appDef._exePath && appDef.regKey) {
        appDef._exePath = await queryRegistry(appDef.regKey);
      }
      appDef._available = !!(appDef._exePath || appDef.uwp);
    }));

    /* Step 2: Extract icons for available apps (parallel) */
    const available = KNOWN_APPS.filter(a => a._available);
    await Promise.all(available.map(async (appDef) => {
      appDef._iconDataUrl = await extractIcon(appDef._exePath);
    }));

    /* Step 3: Build ext → apps map */
    const allExts = new Set(KNOWN_APPS.flatMap(a => a.exts));
    for (const ext of allExts) {
      const apps = KNOWN_APPS
        .filter(a => a._available && a.exts.includes(ext))
        .map(a => ({
          id:          a.id,
          name:        a.name,
          icon:        a.icon,
          iconDataUrl: a._iconDataUrl || null,
          exePath:     a._exePath    || null,
          uwp:         a.uwp         || null,
        }));
      _extCache.set(ext, apps);
    }

    _ready = true;
    console.log(`✅ App detector: found ${available.length} apps`);

    /* Save to disk for next launch */
    saveDiskCache();
  })();

  return _readyPromise;
}

/* ── Get apps for extension (instant if cached) ── */
async function getAppsForExt(ext) {
  /* If not ready yet, wait */
  if (!_ready) await detectAll();

  const e = ext.toLowerCase().replace('.', '');
  return _extCache.get(e) || [];
}

/* ── Open file with specific app ── */
function openWith(filePath, appInfo) {
  if (appInfo.exePath) {
    const { spawn } = require('child_process');
    spawn(appInfo.exePath, [filePath], { detached: true, stdio: 'ignore' }).unref();
  } else if (appInfo.uwp) {
    const { shell } = require('electron');
    shell.openPath(filePath);
  }
}

/* ── Invalidate disk cache (call when apps installed/uninstalled) ── */
function invalidateCache() {
  _ready = false;
  _readyPromise = null;
  _extCache.clear();
  try { fs.unlinkSync(CACHE_FILE); } catch {}
}

module.exports = { detectAll, getAppsForExt, openWith, invalidateCache };
