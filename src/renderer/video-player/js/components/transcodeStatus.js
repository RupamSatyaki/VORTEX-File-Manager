/* Transcode Status — polls progress and updates UI */
const TranscodeStatus = {
  _timer: null,

  startPolling(filePath) {
    this.stopPolling();

    /* Poll immediately once, then every second */
    this._poll(filePath);
    this._timer = setInterval(() => this._poll(filePath), 1000);
  },

  async _poll(filePath) {
    try {
      const info = await window.vortexAPI.getTranscodeInfo(filePath);
      if (!info) return;

      const { transcodedSecs, duration, done, error } = info;

      /* Handle transcode error */
      if (error) {
        this.stopPolling();
        const msg = document.getElementById('vp-transcode-msg');
        if (msg) msg.textContent = 'Transcode failed: ' + error;
        return;
      }

      /* Normalise: Infinity means fully done */
      const actualSecs = (transcodedSecs === Infinity || done) ? (duration || 0) : (transcodedSecs || 0);
      const dur        = duration || State.duration || 0;

      /* Update seek bar white (transcoded) layer */
      if (dur > 0) SeekBar.updateTranscoded(done ? dur : actualSecs, dur);

      /* Update info panel */
      InfoPanel.updateTranscode(actualSecs, dur, done);

      /* Update toolbar badge */
      const pct = dur > 0 ? Math.min(99, Math.round((actualSecs / dur) * 100)) : 0;
      Toolbar.updateTranscodeBadge(done ? 100 : pct, done);

      /* Update transcode overlay — hide once we have some data */
      const overlay = document.getElementById('vp-transcode-overlay');
      const msg     = document.getElementById('vp-transcode-msg');
      const fill    = document.getElementById('vp-transcode-bar-fill');

      if (overlay && (actualSecs > 0 || done)) overlay.classList.add('hidden');
      if (msg)  msg.textContent  = done ? 'Transcoding complete' : `Transcoding ${pct}%…`;
      if (fill) fill.style.width = (done ? 100 : pct) + '%';

      /* Update State so seekbar knows total duration */
      if (dur > 0 && State.duration === 0) {
        State.duration = dur;
        SeekBar.setDuration(dur);
      }

      if (done) this.stopPolling();
    } catch (err) {
      /* Silently ignore — IPC may not be ready yet on first poll */
      console.warn('TranscodeStatus poll error:', err.message);
    }
  },

  stopPolling() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },
};
