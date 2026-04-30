/* ============================================================
   APP DETECTOR — Windows
   Detects installed apps for "Open With" menu.
   Uses registry + known paths.
   ============================================================ */

const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');

/* ── Known app definitions ── */
const KNOWN_APPS = [
  /* Browsers */
  {
    id: 'chrome',
    name: 'Google Chrome',
    icon: 'chrome',
    paths: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ],
    exts: ['pdf','html','htm','svg','png','jpg','jpeg','gif','webp','mp4','webm'],
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    icon: 'firefox',
    paths: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
    ],
    exts: ['pdf','html','htm','svg','png','jpg','jpeg','gif','webp'],
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    icon: 'edge',
    paths: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    exts: ['pdf','html','htm','svg','png','jpg','jpeg','gif','webp','mp4'],
  },
  /* Media players */
  {
    id: 'vlc',
    name: 'VLC Media Player',
    icon: 'vlc',
    paths: [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
    ],
    exts: ['mp4','mkv','avi','mov','wmv','flv','m4v','mp3','wav','flac','ogg','webm','3gp'],
  },
  {
    id: 'mpc',
    name: 'MPC-HC',
    icon: 'mpc',
    paths: [
      'C:\\Program Files\\MPC-HC\\mpc-hc64.exe',
      'C:\\Program Files (x86)\\MPC-HC\\mpc-hc.exe',
    ],
    exts: ['mp4','mkv','avi','mov','wmv','flv','m4v','mp3','wav'],
  },
  {
    id: 'wmplayer',
    name: 'Windows Media Player',
    icon: 'wmp',
    paths: [
      'C:\\Program Files\\Windows Media Player\\wmplayer.exe',
    ],
    exts: ['mp4','avi','wmv','mp3','wav','wma'],
  },
  /* Image viewers */
  {
    id: 'photos',
    name: 'Photos',
    icon: 'photos',
    paths: [], /* UWP app — use shell open */
    uwp: 'Microsoft.Windows.Photos',
    exts: ['jpg','jpeg','png','gif','bmp','webp','tiff','heic','raw'],
  },
  {
    id: 'irfanview',
    name: 'IrfanView',
    icon: 'irfanview',
    paths: [
      'C:\\Program Files\\IrfanView\\i_view64.exe',
      'C:\\Program Files (x86)\\IrfanView\\i_view32.exe',
    ],
    exts: ['jpg','jpeg','png','gif','bmp','webp','tiff','svg'],
  },
  /* Text editors */
  {
    id: 'vscode',
    name: 'VS Code',
    icon: 'vscode',
    paths: [
      process.env.LOCALAPPDATA + '\\Programs\\Microsoft VS Code\\Code.exe',
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
    ],
    exts: ['txt','md','js','ts','py','html','css','json','xml','yaml','yml','sh','bat','ini','cfg','log','csv'],
  },
  {
    id: 'notepad',
    name: 'Notepad',
    icon: 'notepad',
    paths: [
      'C:\\Windows\\System32\\notepad.exe',
      'C:\\Windows\\notepad.exe',
    ],
    exts: ['txt','md','log','ini','cfg','bat','sh','csv','json','xml','html','css','js'],
  },
  {
    id: 'notepadpp',
    name: 'Notepad++',
    icon: 'notepadpp',
    paths: [
      'C:\\Program Files\\Notepad++\\notepad++.exe',
      'C:\\Program Files (x86)\\Notepad++\\notepad++.exe',
    ],
    exts: ['txt','md','log','ini','cfg','bat','sh','csv','json','xml','html','css','js','py','ts'],
  },
  /* Office */
  {
    id: 'word',
    name: 'Microsoft Word',
    icon: 'word',
    paths: [], /* detect via registry */
    regKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\WINWORD.EXE',
    exts: ['docx','doc','rtf','odt'],
  },
  {
    id: 'excel',
    name: 'Microsoft Excel',
    icon: 'excel',
    paths: [],
    regKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\EXCEL.EXE',
    exts: ['xlsx','xls','csv','ods'],
  },
  {
    id: 'powerpoint',
    name: 'Microsoft PowerPoint',
    icon: 'ppt',
    paths: [],
    regKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\POWERPNT.EXE',
    exts: ['pptx','ppt','odp'],
  },
  /* PDF */
  {
    id: 'acrobat',
    name: 'Adobe Acrobat',
    icon: 'acrobat',
    paths: [],
    regKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Acrobat.exe',
    exts: ['pdf'],
  },
  {
    id: 'acroreader',
    name: 'Adobe Reader',
    icon: 'acrobat',
    paths: [],
    regKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\AcroRd32.exe',
    exts: ['pdf'],
  },
  /* Archive */
  {
    id: 'winrar',
    name: 'WinRAR',
    icon: 'winrar',
    paths: [
      'C:\\Program Files\\WinRAR\\WinRAR.exe',
      'C:\\Program Files (x86)\\WinRAR\\WinRAR.exe',
    ],
    exts: ['zip','rar','7z','tar','gz','bz2'],
  },
  {
    id: '7zip',
    name: '7-Zip',
    icon: '7zip',
    paths: [
      'C:\\Program Files\\7-Zip\\7zFM.exe',
      'C:\\Program Files (x86)\\7-Zip\\7zFM.exe',
    ],
    exts: ['zip','rar','7z','tar','gz','bz2'],
  },
];

/* Cache: ext → [{ id, name, icon, exePath }] */
const _cache = new Map();
let   _detected = false;
let   _detectPromise = null;

/* ── Detect all installed apps once ── */
async function detectAll() {
  if (_detected) return;
  if (_detectPromise) return _detectPromise;

  _detectPromise = (async () => {
    for (const app of KNOWN_APPS) {
      let exePath = null;

      /* Check known paths */
      for (const p of (app.paths || [])) {
        if (p && fs.existsSync(p)) { exePath = p; break; }
      }

      /* Check registry */
      if (!exePath && app.regKey) {
        exePath = await queryRegistry(app.regKey);
      }

      if (exePath || app.uwp) {
        app._exePath = exePath;
        app._available = true;
      }
    }
    _detected = true;
  })();

  return _detectPromise;
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

/* ── Get apps for a specific extension ── */
async function getAppsForExt(ext) {
  await detectAll();

  const e = ext.toLowerCase().replace('.', '');
  if (_cache.has(e)) return _cache.get(e);

  const apps = KNOWN_APPS
    .filter(app => app._available && app.exts.includes(e))
    .map(app => ({
      id:     app.id,
      name:   app.name,
      icon:   app.icon,
      exePath: app._exePath || null,
      uwp:    app.uwp || null,
    }));

  _cache.set(e, apps);
  return apps;
}

/* ── Open file with specific app ── */
function openWith(filePath, app) {
  if (app.exePath) {
    const { spawn } = require('child_process');
    spawn(app.exePath, [filePath], { detached: true, stdio: 'ignore' }).unref();
  } else if (app.uwp) {
    /* UWP apps — use shell open */
    const { shell } = require('electron');
    shell.openPath(filePath);
  }
}

module.exports = { getAppsForExt, openWith, detectAll };
