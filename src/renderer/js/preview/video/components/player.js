/* Video Preview — Player Component */
const VideoPlayer = {
  _videoEl: null,

  render(file) {
    const src = `file:///${file.path.replace(/\\/g, '/')}`;
    return `
      <div class="vp-player-wrap">
        <video
          id="vp-video"
          class="vp-video"
          src="${src}"
          preload="metadata"
        ></video>

        <!-- Overlay play button (shown when paused) -->
        <div class="vp-play-overlay" id="vp-play-overlay">
          <div class="vp-play-overlay-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>

        <!-- Loading spinner -->
        <div class="vp-loading" id="vp-loading">
          <div class="vp-spinner"></div>
        </div>
      </div>
    `;
  },

  /* Called after render is injected into DOM */
  mount() {
    this._videoEl = document.getElementById('vp-video');
    if (!this._videoEl) return;

    const overlay  = document.getElementById('vp-play-overlay');
    const loading  = document.getElementById('vp-loading');

    /* Toggle play/pause on overlay click */
    overlay.addEventListener('click', () => this.togglePlay());

    /* Show/hide overlay based on play state */
    this._videoEl.addEventListener('play',  () => overlay.classList.add('vp-hidden'));
    this._videoEl.addEventListener('pause', () => overlay.classList.remove('vp-hidden'));
    this._videoEl.addEventListener('ended', () => overlay.classList.remove('vp-hidden'));

    /* Loading state */
    this._videoEl.addEventListener('waiting', () => loading.classList.remove('vp-hidden'));
    this._videoEl.addEventListener('canplay', () => loading.classList.add('vp-hidden'));
    this._videoEl.addEventListener('playing', () => loading.classList.add('vp-hidden'));

    /* Propagate timeupdate to controls */
    this._videoEl.addEventListener('timeupdate', () => {
      VideoControls.onTimeUpdate(
        this._videoEl.currentTime,
        this._videoEl.duration || 0
      );
    });

    /* Propagate metadata to info panel */
    this._videoEl.addEventListener('loadedmetadata', () => {
      VideoInfo.updateVideoMeta(
        this._videoEl.duration,
        this._videoEl.videoWidth,
        this._videoEl.videoHeight
      );
      VideoControls.onDurationReady(this._videoEl.duration);
      loading.classList.add('vp-hidden');
    });
  },

  /* ── Playback controls ── */
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

  isPaused() { return this._videoEl?.paused ?? true; },

  getElement() { return this._videoEl; },

  destroy() {
    if (this._videoEl) {
      this._videoEl.pause();
      this._videoEl.src = '';
      this._videoEl.load();
    }
    this._videoEl = null;
  }
};
