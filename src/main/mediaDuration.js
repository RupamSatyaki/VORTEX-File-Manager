/* ============================================================
   MEDIA DURATION PROBE
   Gets video duration directly from file using ffprobe.
   ============================================================ */

const ffmpeg           = require('fluent-ffmpeg');
const ffmpegInstaller  = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path             = require('path');

/* ── Resolve binary paths — works in dev and packed .asar ── */
function resolveBinaryPath(p) {
  return p.replace('app.asar', 'app.asar.unpacked');
}

ffmpeg.setFfmpegPath(resolveBinaryPath(ffmpegInstaller.path));
ffmpeg.setFfprobePath(resolveBinaryPath(ffprobeInstaller.path));
console.log('📏 ffprobe path:', resolveBinaryPath(ffprobeInstaller.path));

/* Cache: filePath → durationSeconds */
const _cache = new Map();

function probeDuration(filePath) {
  if (_cache.has(filePath)) return Promise.resolve(_cache.get(filePath));

  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('ffprobe error:', err.message);
        resolve(0);
        return;
      }
      const dur = metadata?.format?.duration || 0;
      console.log(`📏 Duration: ${path.basename(filePath)} = ${Math.round(dur)}s`);
      _cache.set(filePath, dur);
      resolve(dur);
    });
  });
}

module.exports = { probeDuration };
