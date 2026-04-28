/* ============================================================
   VORTEX MEDIA SERVER
   Local HTTP server for zero-buffering video/audio playback.
   Runs on a random available port, localhost only.
   Supports HTTP Range requests for instant seeking.
   Auto-fixes MP4 moov atom position (faststart) on first open.
   ============================================================ */

const http           = require('http');
const fs             = require('fs');
const path           = require('path');
const { fixFaststart, cleanupTemp } = require('./mp4Faststart');

const MIME = {
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

let _server  = null;
let _port    = null;

/* Cache: originalPath → { tmpPath, ready: Promise } 
   So we only fix each file once per session.           */
const _fixCache = new Map();

/* ── Start server ── */
function start() {
  return new Promise((resolve, reject) => {
    if (_server) return resolve(_port);

    _server = http.createServer(handleRequest);

    _server.listen(0, '127.0.0.1', () => {
      _port = _server.address().port;
      console.log(`🎬 Media server running on http://127.0.0.1:${_port}`);
      resolve(_port);
    });

    _server.on('error', (err) => {
      console.error('❌ Media server error:', err.message);
      reject(err);
    });
  });
}

/* ── Stop server + cleanup all temp files ── */
function stop() {
  if (_server) {
    _server.close();
    _server = null;
    _port   = null;
  }
  /* Cleanup all temp faststart files */
  for (const [, entry] of _fixCache) {
    if (entry.tmpPath) cleanupTemp(entry.tmpPath);
  }
  _fixCache.clear();
  console.log('🎬 Media server stopped');
}

function getPort() { return _port; }

/* ── Get serve path (fix moov if needed, cached) ── */
async function getServePath(originalPath) {
  console.log('🔍 getServePath called:', originalPath);
  const ext = path.extname(originalPath).toLowerCase().slice(1);

  /* Only attempt faststart fix for MP4/M4V */
  if (ext !== 'mp4' && ext !== 'm4v') return originalPath;

  /* Return cached result */
  if (_fixCache.has(originalPath)) {
    const entry = _fixCache.get(originalPath);
    await entry.ready; /* wait if fix is in progress */
    return entry.tmpPath || originalPath;
  }

  /* Start fix — store promise so concurrent requests wait */
  let resolveFix;
  const entry = { tmpPath: null, ready: new Promise(r => { resolveFix = r; }) };
  _fixCache.set(originalPath, entry);

  try {
    const tmpPath = await fixFaststart(originalPath);
    entry.tmpPath = tmpPath; /* null = already faststart */
  } catch (err) {
    console.warn('⚠️ Faststart fix failed, serving original:', err.message);
  }

  resolveFix();
  return entry.tmpPath || originalPath;
}

/* ── Request handler ── */
async function handleRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }

  /* Parse file path */
  let filePath;
  try {
    const url     = new URL(req.url, `http://127.0.0.1:${_port}`);
    const rawPath = url.searchParams.get('path');
    if (!rawPath) throw new Error('No path');
    filePath = decodeURIComponent(rawPath);
  } catch {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  /* Security */
  if (!path.isAbsolute(filePath) || filePath.includes('..')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  /* Get serve path (may be temp faststart-fixed file) */
  let servePath;
  try {
    servePath = await getServePath(filePath);
  } catch {
    servePath = filePath;
  }

  /* Stat */
  let stat;
  try { stat = fs.statSync(servePath); }
  catch { res.writeHead(404); res.end('Not Found'); return; }

  const total = stat.size;
  const ext   = path.extname(filePath).toLowerCase().slice(1);
  const mime  = MIME[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);

  /* ── Range request ── */
  const rangeHeader = req.headers['range'];
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      res.end(); return;
    }

    const start     = parseInt(match[1], 10);
    const end       = match[2] ? parseInt(match[2], 10) : total - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Content-Length': chunkSize,
    });

    if (req.method === 'HEAD') { res.end(); return; }

    const stream = fs.createReadStream(servePath, {
      start,
      end,
      highWaterMark: 2 * 1024 * 1024,
    });
    stream.pipe(res);
    stream.on('error', () => res.end());
    return;
  }

  /* ── Full file ── */
  res.writeHead(200, { 'Content-Length': total });
  if (req.method === 'HEAD') { res.end(); return; }

  const stream = fs.createReadStream(servePath, {
    highWaterMark: 2 * 1024 * 1024,
  });
  stream.pipe(res);
  stream.on('error', () => res.end());
}

module.exports = { start, stop, getPort };
