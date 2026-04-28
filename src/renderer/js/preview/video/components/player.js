/* Video Preview — Player Component */
const VideoPlayer = {
  _videoEl:   null,
  _mediaPort: null,   // cached media server port

  async _getMediaUrl(filePath) {
    /* Get port once and cache it */
    if (!this._mediaPort) {
      this._mediaPort = await IPC.invoke('media:getPort');
    }
    const encoded = encodeURIComponent(filePath);
    return `http://127.0.0.1:${this._mediaPort}/?path=${encoded}`;
  },

  async render(file) {
    const src = await this._getMediaUrl(file.path);
    return `
      <div class="vp-player-wrap">
        <video
          id="vp-video"
          class="vp-video"
          src="${src}"
          preload="auto"
        ></video>

        <!-- Overlay play button (shown when paused) -->
        <div class="vp-play-overlay" id="vp-play-overlay">
          <div class="vp-play-overlay-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>

        <!-- Loading spinner (hidden by default) -->
        <div class="vp-loading vp-hidden" id="vp-loading">
          <div class="vp-spinner"></div>
        </div>
      </div>
    `;
  },

  mount() {
    this._videoEl = document.getElementById('vp-video');
    if (!this._videoEl) return;

    const overlay = document.getElementById('vp-play-overlay');
    const loading = document.getElementById('vp-loading');

    /* Overlay click → play/pause */
    overlay.addEventListener('click', () => this.togglePlay());

    /* Play state → overlay visibility */
    this._videoEl.addEventListener('play',  () => {
      if (!this._videoEl) return;
      overlay.classList.add('vp-hidden');
    });
    this._videoEl.addEventListener('pause', () => {
      if (!this._videoEl) return;
      overlay.classList.remove('vp-hidden');
    });

    /* End → reset to start, stay paused */
    this._videoEl.addEventListener('ended', () => {
      if (!this._videoEl) return;
      this._videoEl.currentTime = 0;
      overlay.classList.remove('vp-hidden');
      VideoControls.onTimeUpdate(0, this._videoEl.duration || 0);
    });

    /* Buffering spinner — only during actual network/disk wait */
    this._videoEl.addEventListener('waiting', () => {
      if (!this._videoEl) return;
      if (!this._videoEl.paused) loading.classList.remove('vp-hidden');
    });
    this._videoEl.addEventListener('playing',        () => loading.classList.add('vp-hidden'));
    this._videoEl.addEventListener('canplaythrough', () => loading.classList.add('vp-hidden'));

    /* Metadata loaded → update info + controls */
    this._videoEl.addEventListener('loadedmetadata', () => {
      if (!this._videoEl) return;
      VideoInfo.updateVideoMeta(
        this._videoEl.duration,
        this._videoEl.videoWidth,
        this._videoEl.videoHeight
      );
      VideoControls.onDurationReady(this._videoEl.duration);
      loading.classList.add('vp-hidden');
    });

    /* Seek bar sync */
    this._videoEl.addEventListener('timeupdate', () => {
      if (!this._videoEl) return;
      VideoControls.onTimeUpdate(
        this._videoEl.currentTime,
        this._videoEl.duration || 0
      );
    });
  },

  /* ── Controls ── */
  togglePlay() {
    if (!this._videoEl) return;
    this._videoEl.paused ? this._videoEl.play() : this._videoEl.pause();
  },

  play()  { this._videoEl?.play(); },
  pause() { this._videoEl?.pause(); },

  seek(seconds) {
    if (!this._videoEl) return;
    this._videoEl.currentTime = Math.max(0, Math.min(seconds, this._videoEl.duration || 0));
  },

  seekRelative(delta) {
    if (!this._videoEl) return;
    this.seek(this._videoEl.currentTime + delta);
  },

  setVolume(v) {
    if (!this._videoEl) return;
    this._videoEl.volume = Math.max(0, Math.min(1, v));
    this._videoEl.muted  = (v === 0);
  },

  toggleMute() {
    if (!this._videoEl) return;
    this._videoEl.muted = !this._videoEl.muted;
    VideoControls.onMuteChange(this._videoEl.muted, this._videoEl.volume);
  },

  setSpeed(rate) {
    if (!this._videoEl) return;
    this._videoEl.playbackRate = rate;
  },

  isPaused()   { return this._videoEl?.paused ?? true; },
  getElement() { return this._videoEl; },

  destroy() {
    if (this._videoEl) {
      this._videoEl.pause();
      this._videoEl.removeAttribute('src');
      this._videoEl.load();
    }
    this._videoEl = null;
  }
};
