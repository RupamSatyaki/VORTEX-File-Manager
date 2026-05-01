/* Transcode Status — polls progress and updates UI */
const TranscodeStatus = {
  _timer: null,

  startPolling(filePath) {
    this.stopPolling();
    this._timer = setInterval(async () => {
      try {
        const info = await window.vortexAPI.getTranscodeInfo(filePath);
        if (!info) return;

        const { transcodedSecs, duration, done } = info;

        /* Update seek bar white layer */
        const dur = duration || State.duration || 0;
        if (dur > 0) SeekBar.updateTranscoded(done ? dur : transcodedSecs, dur);

        /* Update info panel */
        InfoPanel.updateTranscode(transcodedSecs, dur, done);

        /* Update toolbar badge */
        const pct = dur > 0 ? Math.min(99, Math.round((transcodedSecs / dur) * 100)) : 0;
        Toolbar.updateTranscodeBadge(pct, done);

        /* Update transcode overlay */
        const overlay = document.getElementById('vp-transcode-overlay');
        const msg     = document.getElementById('vp-transcode-msg');
        const fill    = document.getElementById('vp-transcode-bar-fill');
        if (overlay && transcodedSecs > 0) overlay.classList.add('hidden');
        if (msg)  msg.textContent  = `Transcoding ${pct}%…`;
        if (fill) fill.style.width = pct + '%';

        if (done) this.stopPolling();
      } catch {}
    }, 1000);
  },

  stopPolling() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },
};
