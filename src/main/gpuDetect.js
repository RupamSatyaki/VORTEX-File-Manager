/* ============================================================
   GPU ENCODER DETECTOR
   Detects available hardware video encoder on Windows.
   Priority: NVIDIA (nvenc) > Intel (qsv) > AMD (amf) > CPU
   ============================================================ */

const ffmpeg          = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const os              = require('os');

/* ── Resolve binary path — works in dev and packed .asar ── */
function resolveBinaryPath(p) {
  return p.replace('app.asar', 'app.asar.unpacked');
}

ffmpeg.setFfmpegPath(resolveBinaryPath(ffmpegInstaller.path));

let _cachedEncoder = null; /* cache result */

/* ── Test if a specific encoder works ── */
function testEncoder(encoder) {
  return new Promise((resolve) => {
    /* Try to encode 1 frame with this encoder */
    ffmpeg()
      .input('color=black:size=64x64:rate=1')
      .inputFormat('lavfi')
      .outputOptions([
        '-c:v', encoder,
        '-frames:v', '1',
        '-f', 'null',
      ])
      .output(os.platform() === 'win32' ? 'NUL' : '/dev/null')
      .on('end',   () => resolve(true))
      .on('error', () => resolve(false))
      .run();
  });
}

/* ── Detect best available encoder ── */
async function detectEncoder() {
  if (_cachedEncoder) return _cachedEncoder;

  console.log('🔍 Detecting GPU encoder...');

  const candidates = [
    { name: 'h264_nvenc', label: 'NVIDIA NVENC' },
    { name: 'h264_qsv',   label: 'Intel QSV'    },
    { name: 'h264_amf',   label: 'AMD AMF'       },
  ];

  for (const c of candidates) {
    const ok = await testEncoder(c.name);
    if (ok) {
      console.log(`✅ GPU encoder: ${c.label} (${c.name})`);
      _cachedEncoder = c.name;
      return c.name;
    }
  }

  console.log('⚠️ No GPU encoder found — using CPU (libx264 ultrafast)');
  _cachedEncoder = 'libx264';
  return 'libx264';
}

/* ── Get encoder-specific options ── */
function getEncoderOptions(encoder) {
  switch (encoder) {
    case 'h264_nvenc':
      return [
        '-c:v',    'h264_nvenc',
        '-preset', 'p1',          /* fastest NVENC preset */
        '-tune',   'll',          /* low latency */
        '-rc',     'vbr',
        '-cq',     '28',
      ];
    case 'h264_qsv':
      return [
        '-c:v',    'h264_qsv',
        '-preset', 'veryfast',
        '-global_quality', '28',
      ];
    case 'h264_amf':
      return [
        '-c:v',    'h264_amf',
        '-quality','speed',
        '-rc',     'vbr_latency',
      ];
    default: /* libx264 CPU */
      return [
        '-c:v',    'libx264',
        '-preset', 'ultrafast',
        '-tune',   'zerolatency',
        '-crf',    '28',
      ];
  }
}

module.exports = { detectEncoder, getEncoderOptions };
