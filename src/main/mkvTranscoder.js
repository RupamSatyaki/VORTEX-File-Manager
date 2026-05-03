/* ============================================================
   MKV TRANSCODER
   Transcodes MKV/AVI/WMV etc to H.264 MP4 using best
   available encoder (GPU preferred, CPU fallback).
   Supports partial file serving for early playback.
   ============================================================ */

const ffmpeg                          = require('fluent-ffmpeg');
const ffmpegInstaller                 = require('@ffmpeg-installer/ffmpeg');
const path                            = require('path');
const fs                              = require('fs');
const os                              = require('os');
const { EventEmitter }                = require('events');
const { detectEncoder, getEncoderOptions } = require('./gpuDetect');

/* ── Resolve ffmpeg path — works both in dev and packed .asar ── */
function resolveBinaryPath(installerPath) {
  /* In packed app, binaries are in app.asar.unpacked, not app.asar */
  return installerPath.replace('app.asar', 'app.asar.unpacked');
}

const ffmpegPath = resolveBinaryPath(ffmpegInstaller.path);
ffmpeg.setFfmpegPath(ffmpegPath);
console.log('🎬 ffmpeg path:', ffmpegPath);

/* Formats that need transcoding */
const NEEDS_TRANSCODE = new Set([
  'mkv', 'avi', 'wmv', 'flv', 'mov', '3gp', 'ogv'
]);

/* ── TranscodeJob ── */
class TranscodeJob extends EventEmitter {
  constructor(srcPath) {
    super();
    this.srcPath  = srcPath;
    this.tmpPath  = path.join(
      os.tmpdir(),
      `vortex_tc_${Date.now()}_${path.basename(srcPath, path.extname(srcPath))}.mp4`
    );
    this.progress          = 0;
    this.duration          = 0;
    this.transcodedSeconds = 0;  /* seconds of video transcoded so far */
    this.done              = false;
    this.error    = null;
    this._ffmpeg  = null;
    this._started = false;
  }

  async start() {
    if (this._started) return;
    this._started = true;

    /* Skip GPU detection for now — use libx264 directly (proven to work) */
    const encoder = 'libx264';
    const encOpts = getEncoderOptions(encoder);

    console.log(`🎬 Transcoding [${encoder}]: ${path.basename(this.srcPath)}`);

    this._ffmpeg = ffmpeg(this.srcPath)
      .outputOptions([
        ...encOpts,
        '-c:a',       'aac',
        '-b:a',       '128k',
        /* Fragmented MP4 — allows partial serving */
        '-movflags',  '+frag_keyframe+empty_moov+default_base_moof',
        '-frag_duration', '1000000', /* 1 second fragments */
        '-y',
      ])
      .output(this.tmpPath)
      .on('codecData', (data) => {
        const match = data.duration?.match(/(\d+):(\d+):(\d+\.?\d*)/);
        if (match) {
          this.duration = parseFloat(match[1]) * 3600 +
                          parseFloat(match[2]) * 60  +
                          parseFloat(match[3]);
        }
      })
      .on('progress', (info) => {
        if (info.percent && info.percent > 0) {
          this.progress = Math.min(99, info.percent);
        } else if (info.timemark && this.duration > 0) {
          const m = info.timemark.match(/(\d+):(\d+):(\d+\.?\d*)/);
          if (m) {
            const secs = parseFloat(m[1]) * 3600 +
                         parseFloat(m[2]) * 60  +
                         parseFloat(m[3]);
            this.transcodedSeconds = secs;
            this.progress = Math.min(99, (secs / this.duration) * 100);
          }
        }
        /* Also update transcodedSeconds from timemark even without duration */
        if (info.timemark) {
          const m = info.timemark.match(/(\d+):(\d+):(\d+\.?\d*)/);
          if (m) {
            this.transcodedSeconds = parseFloat(m[1]) * 3600 +
                                     parseFloat(m[2]) * 60  +
                                     parseFloat(m[3]);
          }
        }
        this.emit('progress', this.progress);
      })
      .on('end', () => {
        this.progress = 100;
        this.done     = true;
        console.log(`✅ Transcode done: ${path.basename(this.tmpPath)}`);
        this.emit('ready', this.tmpPath);
      })
      .on('error', (err) => {
        this.error = err.message;
        console.error(`❌ Transcode error: ${err.message}`);
        this.emit('error', err);
      });

    this._ffmpeg.run();
  }

  kill() {
    try { this._ffmpeg?.kill('SIGKILL'); } catch {}
    this.cleanup();
  }

  cleanup() {
    try { if (fs.existsSync(this.tmpPath)) fs.unlinkSync(this.tmpPath); } catch {}
  }

  bytesReady() {
    try { return fs.statSync(this.tmpPath).size; } catch { return 0; }
  }
}

/* ── Job registry ── */
const _jobs = new Map();

function getJob(srcPath) {
  if (_jobs.has(srcPath)) return _jobs.get(srcPath);
  const job = new TranscodeJob(srcPath);
  _jobs.set(srcPath, job);
  /* start() is async (GPU detection) but we don't await —
     waitForBytes in mediaServer will poll until bytes appear */
  job.start().catch(err => console.error('Job start error:', err));
  return job;
}

function needsTranscode(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return NEEDS_TRANSCODE.has(ext);
}

function cleanupAll() {
  for (const [, job] of _jobs) job.kill();
  _jobs.clear();
}

function killJob(srcPath) {
  if (_jobs.has(srcPath)) {
    _jobs.get(srcPath).kill();
    _jobs.delete(srcPath);
  }
}

module.exports = { getJob, needsTranscode, cleanupAll, killJob, _jobs };
