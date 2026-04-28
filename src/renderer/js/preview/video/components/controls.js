/* Video Preview — Controls Component */
const VideoControls = {
  _duration: 0,

  render() {
    return `
      <div class="vp-controls">

        <!-- Seek bar -->
        <div class="vp-seek-wrap">
          <div class="vp-seek-bar" id="vp-seek-bar">
            <div class="vp-seek-fill" id="vp-seek-fill" style="width:0%"></div>
            <div class="vp-seek-thumb" id="vp-seek-thumb" style="left:0%"></div>
            <div class="vp-seek-tooltip" id="vp-seek-tooltip">0:00</div>
          </div>
        </div>

        <!-- Bottom row -->
        <div class="vp-controls-row">

          <!-- Left: play + time -->
          <div class="vp-controls-left">
            <button class="vp-ctrl-btn vp-play-btn" id="vp-play-btn" title="Play / Pause (Space)">
              <svg class="vp-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg class="vp-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:none">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            </button>

            <!-- Volume -->
            <div class="vp-volume-wrap">
              <button class="vp-ctrl-btn vp-mute-btn" id="vp-mute-btn" title="Mute (M)">
                <svg class="vp-icon-vol" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <svg class="vp-icon-mute" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              </button>
              <input type="range" class="vp-volume-slider" id="vp-volume-slider"
                min="0" max="100" value="100" title="Volume">
            </div>

            <span class="vp-time" id="vp-time">0:00 / 0:00</span>
          </div>

          <!-- Right: speed + fullscreen -->
          <div class="vp-controls-right">
            <select class="vp-speed-select" id="vp-speed-select" title="Playback speed">
              <option value="0.25">0.25×</option>
              <option value="0.5">0.5×</option>
              <option value="0.75">0.75×</option>
              <option value="1" selected>1×</option>
              <option value="1.25">1.25×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>

            <button class="vp-ctrl-btn vp-pip-btn" id="vp-pip-btn" title="Picture in Picture">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <rect x="12" y="10" width="9" height="6" rx="1"/>
              </svg>
            </button>

            <button class="vp-ctrl-btn vp-fullscreen-btn" id="vp-fullscreen-btn" title="Fullscreen (F)">
              <svg class="vp-icon-fs-enter" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              <svg class="vp-icon-fs-exit" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    `;
  },

  /* Called after render is injected into DOM */
  mount() {
    this._mountSeekBar();
    this._mountPlayBtn();
    this._mountVolume();
    this._mountSpeed();
    this._mountFullscreen();
    this._mountPiP();
  },

  /* ── Seek bar ── */
  _mountSeekBar() {
    const bar     = document.getElementById('vp-seek-bar');
    const tooltip = document.getElementById('vp-seek-tooltip');
    if (!bar) return;

    const getPercent = (e) => {
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    bar.addEventListener('mousemove', (e) => {
      const pct = getPercent(e);
      tooltip.textContent = this._formatTime(pct * this._duration);
      tooltip.style.left  = (pct * 100) + '%';
      tooltip.style.opacity = '1';
    });

    bar.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    bar.addEventListener('click', (e) => {
      const pct = getPercent(e);
      VideoPlayer.seek(pct * this._duration);
    });

    /* Drag seek */
    let dragging = false;
    bar.addEventListener('mousedown', (e) => {
      dragging = true;
      VideoPlayer.seek(getPercent(e) * this._duration);
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      VideoPlayer.seek(getPercent(e) * this._duration);
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  },

  /* ── Play button ── */
  _mountPlayBtn() {
    const btn = document.getElementById('vp-play-btn');
    if (!btn) return;
    btn.addEventListener('click', () => VideoPlayer.togglePlay());

    const video = VideoPlayer.getElement();
    if (!video) return;
    video.addEventListener('play',  () => this._setPlayIcon(true));
    video.addEventListener('pause', () => this._setPlayIcon(false));
    video.addEventListener('ended', () => this._setPlayIcon(false));
  },

  _setPlayIcon(playing) {
    const btn = document.getElementById('vp-play-btn');
    if (!btn) return;
    btn.querySelector('.vp-icon-play').style.display  = playing ? 'none'  : '';
    btn.querySelector('.vp-icon-pause').style.display = playing ? ''      : 'none';
  },

  /* ── Volume ── */
  _mountVolume() {
    const muteBtn = document.getElementById('vp-mute-btn');
    const slider  = document.getElementById('vp-volume-slider');
    if (!muteBtn || !slider) return;

    muteBtn.addEventListener('click', () => VideoPlayer.toggleMute());
    slider.addEventListener('input', () => {
      VideoPlayer.setVolume(slider.value / 100);
      this._updateMuteIcon(slider.value == 0);
    });
  },

  /* ── Speed ── */
  _mountSpeed() {
    const sel = document.getElementById('vp-speed-select');
    if (!sel) return;
    sel.addEventListener('change', () => VideoPlayer.setSpeed(parseFloat(sel.value)));
  },

  /* ── Fullscreen ── */
  _mountFullscreen() {
    const btn  = document.getElementById('vp-fullscreen-btn');
    const wrap = document.querySelector('.vp-player-wrap');
    if (!btn || !wrap) return;

    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        wrap.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      btn.querySelector('.vp-icon-fs-enter').style.display = isFs ? 'none' : '';
      btn.querySelector('.vp-icon-fs-exit').style.display  = isFs ? ''     : 'none';
    });
  },

  /* ── Picture in Picture ── */
  _mountPiP() {
    const btn   = document.getElementById('vp-pip-btn');
    const video = VideoPlayer.getElement();
    if (!btn || !video) return;

    if (!document.pictureInPictureEnabled) {
      btn.style.display = 'none';
      return;
    }

    btn.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (e) {
        console.warn('PiP not available:', e);
      }
    });
  },

  /* ── Called by VideoPlayer on timeupdate ── */
  onTimeUpdate(current, duration) {
    const fill  = document.getElementById('vp-seek-fill');
    const thumb = document.getElementById('vp-seek-thumb');
    const time  = document.getElementById('vp-time');
    if (!fill || !thumb || !time) return;

    const pct = duration > 0 ? (current / duration) * 100 : 0;
    fill.style.width  = pct + '%';
    thumb.style.left  = pct + '%';
    time.textContent  = `${this._formatTime(current)} / ${this._formatTime(duration)}`;
  },

  onDurationReady(duration) {
    this._duration = duration || 0;
  },

  onMuteChange(muted, volume) {
    this._updateMuteIcon(muted);
    const slider = document.getElementById('vp-volume-slider');
    if (slider) slider.value = muted ? 0 : volume * 100;
  },

  _updateMuteIcon(muted) {
    const btn = document.getElementById('vp-mute-btn');
    if (!btn) return;
    btn.querySelector('.vp-icon-vol').style.display  = muted ? 'none' : '';
    btn.querySelector('.vp-icon-mute').style.display = muted ? ''     : 'none';
  },

  /* ── Helpers ── */
  _formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }
};
