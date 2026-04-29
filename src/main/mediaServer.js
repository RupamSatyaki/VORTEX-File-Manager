/* ============================================================
   VORTEX MEDIA SERVER
   Local HTTP server for zero-buffering video/audio playback.
   - MP4/M4V: faststart fix (moov atom move)
   - MKV/AVI/WMV etc: background H.264 transcode with partial serve
   ============================================================ */

const http                              = require('http');
const fs                                = require('fs');
const path                              = require('path');
const { fixFaststart, cleanupTemp }     = require('./mp4Faststart');
const { getJob, needsTranscode,
        cleanupAll, killJob }           = require('./mkvTranscoder');

const MIME = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  mkv:  'video/mp4',       /* served as mp4 after transcode */
  mov:  'video/mp4',
  avi:  'video/mp4',
  wmv:  'video/mp4',
  flv:  'video/mp4',
  m4v:  'video/mp4',
  ogv:  'video/mp4',
  '3gp':'video/mp4',
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  flac: 'audio/flac',
  m4a:  'audio/mp4',
};

let _server = null;
let _port   = null;

/* Cache: originalPath → { tmpPath, ready: Promise } for MP4 faststart */
const _fixCache = new Map();

/* ── Start server ── */
function start() {
  return new Promise((resolve, reject) => {
    if (_server) return resolve(_port);
    _server = http.createServer(handleRequest);
    _server.listen(0, '127.0.0.1', () => {
      _port = _server.address().port;
      console.log(`🎬 Media server on http://127.0.0.1:${_port}`);
      resolve(_port);
    });
    _server.on('error', reject);
  });
}

/* ── Stop server + cleanup ── */
function stop() {
  if (_server) { _server.close(); _server = null; _port = null; }
  for (const [, e] of _fixCache) if (e.tmpPath) cleanupTemp(e.tmpPath);
  _fixCache.clear();
  cleanupAll();
  console.log('🎬 Media server stopped');
}

function getPort() { return _port; }

/* ── Get transcode progress for a file (0-100) ── */
function getProgress(filePath) {
  if (!needsTranscode(filePath)) return 100;
  const { _jobs } = require('./mkvTranscoder');
  const job = _jobs.get(filePath);
  if (!job) return 0;
  if (job.done) return 100;
  if (job.duration > 0) {
    return Math.min(99, Math.round((job.transcodedSeconds / job.duration) * 100));
  }
  return Math.round(job.progress);
}

/* ── Get transcode info: transcodedSecs + duration ── */
function getTranscodeInfo(filePath) {
  if (!needsTranscode(filePath)) {
    return { transcodedSecs: Infinity, duration: 0, done: true };
  }
  const { _jobs } = require('./mkvTranscoder');
  const job = _jobs.get(filePath);
  if (!job) return { transcodedSecs: 0, duration: 0, done: false };
  return {
    transcodedSecs: job.done ? Infinity : job.transcodedSeconds,
    duration:       job.duration,
    done:           job.done,
  };
}

/* ── MP4 faststart fix (cached) ── */
async function getFaststartPath(originalPath) {
  const ext = path.extname(originalPath).toLowerCase().slice(1);
  if (ext !== 'mp4' && ext !== 'm4v') return originalPath;

  if (_fixCache.has(originalPath)) {
    const entry = _fixCache.get(originalPath);
    await entry.ready;
    return entry.tmpPath || originalPath;
  }

  let resolveFix;
  const entry = { tmpPath: null, ready: new Promise(r => { resolveFix = r; }) };
  _fixCache.set(originalPath, entry);

  try {
    entry.tmpPath = await fixFaststart(originalPath);
  } catch (err) {
    console.warn('⚠️ Faststart failed:', err.message);
  }

  resolveFix();
  return entry.tmpPath || originalPath;
}

/* ── Request handler ── */
async function handleRequest(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end(); return;
  }

  /* Parse path */
  let filePath;
  try {
    const url = new URL(req.url, `http://127.0.0.1:${_port}`);
    filePath  = decodeURIComponent(url.searchParams.get('path') || '');
    if (!filePath) throw new Error('no path');
  } catch { res.writeHead(400); res.end(); return; }

  if (!path.isAbsolute(filePath) || filePath.includes('..')) {
    res.writeHead(403); res.end(); return;
  }

  /* ── MKV / unsupported format → transcode path ── */
  if (needsTranscode(filePath)) {
    await handleTranscode(req, res, filePath);
    return;
  }

  /* ── MP4 → faststart fix then serve ── */
  let servePath;
  try { servePath = await getFaststartPath(filePath); }
  catch { servePath = filePath; }

  serveFile(req, res, servePath, filePath);
}

/* ── Handle transcode request ── */
async function handleTranscode(req, res, srcPath) {
  const job = getJob(srcPath);

  /* Wait until 30 seconds of video is transcoded before starting playback */
  await waitForDuration(job, 30, 120000);

  const ready = job.bytesReady();
  if (ready === 0 && !job.done) {
    res.writeHead(503, { 'Retry-After': '3' });
    res.end('Transcoding not ready');
    return;
  }

  const tmpPath = job.tmpPath;
  const total   = job.done ? fs.statSync(tmpPath).size : null;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('X-Transcode-Progress', String(Math.round(job.progress)));

  /* ── Range request ── */
  const rangeHeader = req.headers['range'];
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) { res.writeHead(416); res.end(); return; }

    const available = job.bytesReady();
    const start     = parseInt(match[1], 10);
    const end       = match[2]
      ? Math.min(parseInt(match[2], 10), available - 1)
      : available - 1;

    if (start >= available) {
      /* Wait for more data */
      await waitForBytes(job, start + 65536, 60000);
    }

    const actualEnd   = Math.min(end, job.bytesReady() - 1);
    const chunkSize   = actualEnd - start + 1;

    if (chunkSize <= 0) { res.writeHead(416); res.end(); return; }

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${actualEnd}/${total || '*'}`,
      'Content-Length': chunkSize,
      'Accept-Ranges':  'bytes',
    });

    if (req.method === 'HEAD') { res.end(); return; }

    const stream = fs.createReadStream(tmpPath, {
      start, end: actualEnd, highWaterMark: 2 * 1024 * 1024
    });
    stream.pipe(res);
    stream.on('error', () => res.end());
    return;
  }

  /* ── Full / streaming response ── */
  if (job.done && total) {
    res.writeHead(200, { 'Content-Length': total, 'Accept-Ranges': 'bytes' });
  } else {
    res.writeHead(200, { 'Transfer-Encoding': 'chunked' });
  }

  if (req.method === 'HEAD') { res.end(); return; }
  streamGrowing(req, res, job);
}

/* ── Stream a growing file (transcode in progress) ── */
function streamGrowing(req, res, job) {
  let position = 0;
  let closed   = false;

  req.on('close', () => { closed = true; });

  const pump = () => {
    if (closed) return;

    const available = job.bytesReady();

    if (available > position) {
      const readStream = fs.createReadStream(job.tmpPath, {
        start:          position,
        end:            available - 1,
        highWaterMark:  512 * 1024, /* 512KB chunks */
      });

      readStream.on('data', (chunk) => {
        if (closed) { readStream.destroy(); return; }
        const ok = res.write(chunk);
        position += chunk.length;
        if (!ok) readStream.pause();
      });

      res.on('drain', () => readStream.resume());

      readStream.on('end', () => {
        if (closed) return;
        if (job.done && position >= job.bytesReady()) {
          res.end();
        } else {
          /* Poll faster — 200ms */
          setTimeout(pump, 200);
        }
      });

      readStream.on('error', () => { if (!closed) res.end(); });

    } else if (job.done) {
      res.end();
    } else {
      /* Nothing new yet — wait 200ms */
      setTimeout(pump, 200);
    }
  };

  pump();
}

/* ── Wait until N seconds of video transcoded ── */
function waitForDuration(job, seconds, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (job.done || job.error) { resolve(); return; }
      if (job.transcodedSeconds >= seconds) { resolve(); return; }
      if (Date.now() >= deadline) { resolve(); return; }
      setTimeout(check, 500);
    };
    check();
  });
}

/* ── Wait until job has at least `bytes` bytes ready ── */
function waitForBytes(job, bytes, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const ready = job.bytesReady();
      if (ready >= bytes || job.done || job.error) { resolve(ready); return; }
      if (Date.now() >= deadline) { resolve(ready); return; }
      setTimeout(check, 100);
    };
    check();
  });
}

/* ── Serve a static file with range support ── */
function serveFile(req, res, servePath, originalPath) {
  let stat;
  try { stat = fs.statSync(servePath); }
  catch { res.writeHead(404); res.end(); return; }

  const total = stat.size;
  const ext   = path.extname(originalPath).toLowerCase().slice(1);
  const mime  = MIME[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);

  const rangeHeader = req.headers['range'];
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) { res.writeHead(416, { 'Content-Range': `bytes */${total}` }); res.end(); return; }

    const start     = parseInt(match[1], 10);
    const end       = match[2] ? parseInt(match[2], 10) : total - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Content-Length': chunkSize,
    });
    if (req.method === 'HEAD') { res.end(); return; }

    const stream = fs.createReadStream(servePath, { start, end, highWaterMark: 2 * 1024 * 1024 });
    stream.pipe(res);
    stream.on('error', () => res.end());
    return;
  }

  res.writeHead(200, { 'Content-Length': total });
  if (req.method === 'HEAD') { res.end(); return; }

  const stream = fs.createReadStream(servePath, { highWaterMark: 2 * 1024 * 1024 });
  stream.pipe(res);
  stream.on('error', () => res.end());
}

module.exports = { start, stop, getPort, getProgress, getTranscodeInfo };
