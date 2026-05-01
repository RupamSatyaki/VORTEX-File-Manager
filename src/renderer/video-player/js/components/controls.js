/* Controls — play/pause, volume, speed, fullscreen, PiP */
const Controls = {
  render() {
    return `
      <div class="vp-controls" id="vp-controls">
        <div class="vp-controls-row">

          <!-- Left -->
          <div class="vp-ctrl-left">
            <!-- Prev -->
            <button class="vp-ctrl-btn" id="vp-prev" title="Previous (Shift+←)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>

            <!-- Play/Pause -->
            <button class="vp-ctrl-btn vp-play-pause" id="vp-play-pause" title="Play/Pause (Space)">
              <svg class="vp-icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <svg class="vp-icon-pause hidden" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>

            <!-- Next -->
            <button class="vp-ctrl-btn" id="vp-next" title="Next (Shift+→)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>

            <!-- Volume -->
            <div class="vp-volume-wrap">
              <button class="vp-ctrl-btn" id="vp-mute" title="Mute (M)">
                <svg class="vp-icon-vol" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <svg class="vp-icon-mute hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <input type="range" class="vp-volume-slider" id="vp-volume-slider" min="0" max="100" value="100">
            </div>

            <!-- Time -->
            <span class="vp-time" id="vp-time">0:00 / 0:00</span>
          </div>

          <!-- Right -->
          <div class="vp-ctrl-right">
            <!-- Speed -->
            <select class="vp-speed-select" id="vp-speed-select" title="Playback speed">
              <option value="0.25">0.25×</option>
              <option value="0.5">0.5×</option>
              <option value="0.75">0.75×</option>
              <option value="1" selected>1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>

            <!-- PiP -->
            <button class="vp-ctrl-btn" id="vp-pip" title="Picture in Picture (Ctrl+P)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="10" width="9" height="6" rx="1"/></svg>
            </button>

            <!-- Fullscreen -->
            <button class="vp-ctrl-btn" id="vp-fullscreen" title="Fullscreen (F)">
              <svg class="vp-icon-fs-enter" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              <svg class="vp-icon-fs-exit hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            </button>
          </div>

        </div>
      </div>
    `;
  },

  mount() {
    /* Play/Pause */
    document.getElementById('vp-play-pause')?.addEventListener('click', () => VideoEngine.togglePlay());

    /* Prev/Next */
    document.getElementById('vp-prev')?.addEventListener('click', () => PlaylistPanel.prev());
    document.getElementById('vp-next')?.addEventListener('click', () => PlaylistPanel.next());

    /* Volume */
    document.getElementById('vp-mute')?.addEventListener('click', () => VideoEngine.toggleMute());
    document.getElementById('vp-volume-slider')?.addEventListener('input', (e) => {
      VideoEngine.setVolume(e.target.value / 100);
    });

    /* Speed */
    document.getElementById('vp-speed-select')?.addEventListener('change', (e) => {
      VideoEngine.setSpeed(parseFloat(e.target.value));
    });

    /* PiP */
    document.getElementById('vp-pip')?.addEventListener('click', () => this.togglePiP());

    /* Fullscreen */
    document.getElementById('vp-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      document.querySelector('.vp-icon-fs-enter')?.classList.toggle('hidden', isFs);
      document.querySelector('.vp-icon-fs-exit')?.classList.toggle('hidden', !isFs);
    });

    /* Ctrl+scroll zoom */
    document.getElementById('vp-video-wrap')?.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.changeVolume(e.deltaY < 0 ? 0.05 : -0.05);
    }, { passive: false });
  },

  syncPlayBtn(paused) {
    document.querySelector('.vp-icon-play')?.classList.toggle('hidden', !paused);
    document.querySelector('.vp-icon-pause')?.classList.toggle('hidden', paused);
  },

  syncVolume() {
    const el = VideoEngine.getElement();
    if (!el) return;
    const slider = document.getElementById('vp-volume-slider');
    if (slider) slider.value = el.muted ? 0 : el.volume * 100;
    document.querySelector('.vp-icon-vol')?.classList.toggle('hidden', el.muted);
    document.querySelector('.vp-icon-mute')?.classList.toggle('hidden', !el.muted);
  },

  syncSpeed(rate) {
    const sel = document.getElementById('vp-speed-select');
    if (sel) sel.value = rate;
  },

  syncTime(current, duration) {
    const el = document.getElementById('vp-time');
    if (el) el.textContent = `${TimeFormat.format(current)} / ${TimeFormat.format(duration)}`;
  },

  changeVolume(delta) {
    const el = VideoEngine.getElement();
    if (!el) return;
    VideoEngine.setVolume(el.volume + delta);
  },

  toggleFullscreen() {
    const wrap = document.getElementById('vp-video-wrap');
    if (!wrap) return;
    if (!document.fullscreenElement) wrap.requestFullscreen();
    else document.exitFullscreen();
  },

  async togglePiP() {
    const el = VideoEngine.getElement();
    if (!el) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await el.requestPictureInPicture();
    } catch {}
  },
};
