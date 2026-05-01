/* ============================================================
   VIDEO PLAYER — Global State
   Single source of truth for the entire player window.
   ============================================================ */
const State = {
  /* Current file */
  filePath:    '',
  fileName:    '',
  fileExt:     '',
  fileSize:    0,

  /* Playlist */
  playlist:    [],   /* [{ path, name, ext }] */
  playlistIdx: 0,

  /* Playback */
  duration:    0,    /* seconds (from ffprobe) */
  currentTime: 0,
  volume:      1.0,
  muted:       false,
  speed:       1.0,
  paused:      true,

  /* Transcode */
  isTranscode:       false,
  transcodedSecs:    0,
  transcodeTotal:    0,
  transcodeDone:     false,

  /* UI */
  showPlaylist:  true,
  showInfo:      true,
  mediaPort:     null,

  /* ── Helpers ── */
  isVideo(ext) {
    return ['mp4','mkv','avi','mov','wmv','flv','m4v','ogv','webm','3gp']
      .includes((ext || '').toLowerCase());
  },

  needsTranscode(ext) {
    return ['mkv','avi','wmv','flv','mov','3gp','ogv']
      .includes((ext || '').toLowerCase());
  },

  setFile(filePath) {
    this.filePath  = filePath;
    this.fileName  = filePath.split(/[/\\]/).pop();
    this.fileExt   = (this.fileName.split('.').pop() || '').toLowerCase();
    this.isTranscode = this.needsTranscode(this.fileExt);
    this.duration  = 0;
    this.currentTime = 0;
    this.transcodedSecs = 0;
    this.transcodeTotal = 0;
    this.transcodeDone  = false;
    this.paused = true;
  },

  getMediaUrl() {
    if (!this.mediaPort) return '';
    return `http://127.0.0.1:${this.mediaPort}/?path=${encodeURIComponent(this.filePath)}`;
  },
};
