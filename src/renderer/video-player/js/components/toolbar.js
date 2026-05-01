/* Toolbar — title, transcode badge, window controls */
const Toolbar = {
  render() {
    return `
      <div class="vp-toolbar" id="vp-toolbar">
        <div class="vp-toolbar-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <span class="vp-title" id="vp-title">Loading…</span>
          <span class="vp-transcode-badge hidden" id="vp-transcode-badge">
            <span class="vp-badge-dot"></span>
            <span id="vp-badge-text">Transcoding…</span>
          </span>
        </div>

        <div class="vp-toolbar-right">
          <button class="vp-tb-btn" id="vp-toggle-playlist" title="Toggle Playlist (P)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="vp-tb-btn" id="vp-toggle-info" title="Toggle Info (I)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
          </button>

          <div class="vp-wc-sep"></div>

          <div class="vp-wc-group">
            <button class="vp-wc-btn minimize" id="vp-wc-min" title="Minimize">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="6" x2="10" y2="6"/></svg>
            </button>
            <button class="vp-wc-btn maximize" id="vp-wc-max" title="Maximize">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8"/></svg>
            </button>
            <button class="vp-wc-btn close" id="vp-wc-close" title="Close">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  mount() {
    document.getElementById('vp-wc-min')?.addEventListener('click', () => window.vortexAPI?.videoMinimize());
    document.getElementById('vp-wc-max')?.addEventListener('click', () => window.vortexAPI?.videoMaximize());
    document.getElementById('vp-wc-close')?.addEventListener('click', () => window.vortexAPI?.videoClose());
    document.getElementById('vp-toggle-playlist')?.addEventListener('click', () => PlaylistPanel.toggle());
    document.getElementById('vp-toggle-info')?.addEventListener('click', () => InfoPanel.toggle());
  },

  setTitle(name) {
    const el = document.getElementById('vp-title');
    if (el) el.textContent = name;
    document.title = name + ' — Vortex Player';
  },

  updateTranscodeBadge(pct, done) {
    const badge = document.getElementById('vp-transcode-badge');
    const text  = document.getElementById('vp-badge-text');
    if (!badge || !text) return;
    if (done) { badge.classList.add('hidden'); return; }
    badge.classList.remove('hidden');
    text.textContent = `Transcoding ${Math.round(pct)}%`;
  },
};
