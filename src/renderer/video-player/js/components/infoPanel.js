/* Info Panel — right sidebar with file metadata */
const InfoPanel = {
  _visible: true,

  render() {
    return `
      <div class="vp-info-panel" id="vp-info-panel">
        <div class="vp-info-header">File Info</div>

        <div class="vp-info-row">
          <span class="vp-info-label">Format</span>
          <span class="vp-info-value" id="vpi-format">—</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Size</span>
          <span class="vp-info-value" id="vpi-size">—</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Duration</span>
          <span class="vp-info-value" id="vpi-duration">—</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Resolution</span>
          <span class="vp-info-value" id="vpi-resolution">—</span>
        </div>
        <div class="vp-info-row" id="vpi-transcode-row" style="display:none">
          <span class="vp-info-label">Transcoding</span>
          <span class="vp-info-value vp-transcode-status" id="vpi-transcode">
            <span class="vp-transcode-dot"></span>
            <span id="vpi-transcode-text">Starting…</span>
          </span>
        </div>

        <div class="vp-info-divider"></div>

        <div class="vp-info-header">Actions</div>
        <button class="vp-info-action" id="vpi-open-external">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open in Default Player
        </button>
        <button class="vp-info-action" id="vpi-show-folder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Show in Folder
        </button>
        <button class="vp-info-action" id="vpi-copy-path">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Path
        </button>
      </div>
    `;
  },

  mount() {
    document.getElementById('vpi-open-external')?.addEventListener('click', () => {
      window.vortexAPI?.openPath(State.filePath);
    });
    document.getElementById('vpi-show-folder')?.addEventListener('click', () => {
      window.vortexAPI?.showInFolder(State.filePath);
    });
    document.getElementById('vpi-copy-path')?.addEventListener('click', () => {
      navigator.clipboard.writeText(State.filePath);
    });
  },

  populate(filePath) {
    const ext  = filePath.split('.').pop().toUpperCase();
    const name = filePath.split(/[/\\]/).pop();

    const fmt  = document.getElementById('vpi-format');
    const size = document.getElementById('vpi-size');
    if (fmt)  fmt.textContent  = ext;

    /* Get file size via HEAD request */
    if (State.mediaPort) {
      fetch(`http://127.0.0.1:${State.mediaPort}/?path=${encodeURIComponent(filePath)}`, { method: 'HEAD' })
        .then(r => {
          const bytes = parseInt(r.headers.get('content-length') || '0');
          if (size && bytes > 0) size.textContent = TimeFormat.formatSize(bytes);
        }).catch(() => {});
    }

    /* Show transcode row for MKV etc */
    const row = document.getElementById('vpi-transcode-row');
    if (row) row.style.display = State.isTranscode ? '' : 'none';
  },

  updateDuration(secs, w, h) {
    const dur = document.getElementById('vpi-duration');
    const res = document.getElementById('vpi-resolution');
    if (dur && secs > 0) dur.textContent = TimeFormat.formatLong(secs);
    if (res && w && h)   res.textContent = `${w} × ${h}`;
  },

  updateResolution(w, h) {
    const res = document.getElementById('vpi-resolution');
    if (res && w && h) res.textContent = `${w} × ${h}`;
  },

  updateTranscode(transcodedSecs, totalDur, done) {
    const row  = document.getElementById('vpi-transcode-row');
    const text = document.getElementById('vpi-transcode-text');
    if (!row || !text) return;

    if (done) { row.style.display = 'none'; return; }
    row.style.display = '';

    if (totalDur > 0) {
      const pct = Math.min(99, Math.round((transcodedSecs / totalDur) * 100));
      text.textContent = `${pct}% · ${TimeFormat.format(transcodedSecs)} / ${TimeFormat.format(totalDur)}`;
    } else {
      text.textContent = `${TimeFormat.format(transcodedSecs)} done`;
    }
  },

  toggle() {
    this._visible = !this._visible;
    const el = document.getElementById('vp-info-panel');
    if (el) el.classList.toggle('hidden', !this._visible);
    State.showInfo = this._visible;
  },
};
