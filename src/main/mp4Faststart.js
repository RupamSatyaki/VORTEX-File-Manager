/* ============================================================
   MP4 FASTSTART — ffmpeg based
   Moves moov atom to beginning using ffmpeg -movflags +faststart
   No re-encoding — just remux (very fast, seconds).
   ============================================================ */

const ffmpeg          = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path            = require('path');
const fs              = require('fs');
const os              = require('os');

/* Set bundled ffmpeg binary path */
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/* ── Check if MP4 needs faststart fix ──
   Simply always fix — ffmpeg -c copy is fast enough (< 1 sec for most files)
   and handles all edge cases correctly.
── */
function needsFaststart(filePath) {
  return true;
}

/* ── Fix faststart — returns temp file path ──
   Returns null if no fix needed.
── */
function fixFaststart(inputPath) {
  return new Promise((resolve, reject) => {
    /* Only fix MP4/M4V */
    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.mp4' && ext !== '.m4v') {
      return resolve(null);
    }

    /* Check if fix is needed */
    if (!needsFaststart(inputPath)) {
      console.log(`✅ Already faststart: ${path.basename(inputPath)}`);
      return resolve(null);
    }

    const tmpPath = path.join(
      os.tmpdir(),
      `vortex_fs_${Date.now()}_${path.basename(inputPath)}`
    );

    console.log(`🔧 Fixing moov atom: ${path.basename(inputPath)}`);

    ffmpeg(inputPath)
      .outputOptions([
        '-movflags', '+faststart',
        '-c',        'copy',        /* no re-encode */
        '-y',                       /* overwrite temp */
      ])
      .output(tmpPath)
      .on('end', () => {
        console.log(`✅ Faststart fixed → ${path.basename(tmpPath)}`);
        resolve(tmpPath);
      })
      .on('error', (err) => {
        console.error('❌ ffmpeg faststart error:', err.message);
        /* Fallback — serve original */
        resolve(null);
      })
      .run();
  });
}

/* ── Cleanup temp file ── */
function cleanupTemp(tmpPath) {
  if (!tmpPath) return;
  try {
    fs.unlinkSync(tmpPath);
    console.log(`🗑️ Cleaned temp: ${path.basename(tmpPath)}`);
  } catch { /* ignore */ }
}

module.exports = { fixFaststart, cleanupTemp };
