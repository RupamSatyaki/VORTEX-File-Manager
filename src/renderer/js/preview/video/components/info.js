/* Video Preview — Info Panel Component */
const VideoInfo = {
  render(file) {
    const size = FormatUtils.formatSize(file.size);
    const date = FormatUtils.formatDate ? FormatUtils.formatDate(file.modified) : new Date(file.modified).toLocaleDateString();
    const ext  = (file.ext || '').toUpperCase() || 'VIDEO';

    return `
      <div class="vp-info">
        <div class="vp-info-title">File Info</div>

        <div class="vp-info-row">
          <span class="vp-info-label">Format</span>
          <span class="vp-info-value">${ext}</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Size</span>
          <span class="vp-info-value">${size}</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Duration</span>
          <span class="vp-info-value" id="vp-info-duration">Loading…</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Resolution</span>
          <span class="vp-info-value" id="vp-info-resolution">Loading…</span>
        </div>
        <div class="vp-info-row">
          <span class="vp-info-label">Modified</span>
          <span class="vp-info-value">${date}</span>
        </div>
        <div class="vp-info-row vp-info-path-row">
          <span class="vp-info-label">Path</span>
          <button class="vp-copy-path-btn" id="vp-copy-path" title="Copy path">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <div class="vp-info-path" id="vp-info-path">${this._escape(file.path)}</div>
      </div>

      <!-- Actions -->
      <div class="vp-actions">
        <div class="vp-info-title">Actions</div>

        <button class="vp-action-btn vp-action-open">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open in Player
        </button>

        <button class="vp-action-btn vp-action-folder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Show in Folder
        </button>

        <div class="vp-actions-divider"></div>

        <button class="vp-action-btn vp-action-delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
      </div>
    `;
  },

  /* Called by VideoPlayer after loadedmetadata */
  updateVideoMeta(duration, width, height) {
    const durEl = document.getElementById('vp-info-duration');
    const resEl = document.getElementById('vp-info-resolution');

    if (durEl) durEl.textContent = this._formatDuration(duration);
    if (resEl) resEl.textContent = (width && height) ? `${width} × ${height}` : 'Unknown';
  },

  _formatDuration(s) {
    if (!s || isNaN(s)) return 'Unknown';
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  },

  _escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};
