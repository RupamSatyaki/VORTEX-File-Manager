/* Video Preview — Player Component */
const VideoPlayer = {
  _videoEl:   null,
  _mediaPort: null,   // cached media server port

  async _getMediaUrl(filePath) {
    if (!this._mediaPort) {
      this._mediaPort = await IPC.invoke('media:getPort');
    }
    const encoded = encodeURIComponent(filePath);
    return `http://127.0.0.1:${this._mediaPort}/?path=${encoded}`;
  },

  /* Set src with auto-retry on 503 (transcode starting) */
  async _setSrcWithRetry(videoEl, src, maxRetries = 15) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(src, { method: 'HEAD' });
        if (res.status === 503) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (videoEl && !videoEl.src) videoEl.src = src;
    else if (videoEl) { videoEl.src = src; videoEl.load(); }
  },

  async render(file) {
    const src        = await this._getMediaUrl(file.path);
    const isTranscode = ['mkv','avi','wmv','flv','mov','3gp','ogv']
                          .includes((file.ext||'').toLowerCase());
    /* Store for retry logic */
    this._pendingSrc  = src;
    this._isTranscode = isTranscode;

    return `
      <div class="vp-player-wrap">
        <video
          id="vp-video"
          class="vp-video"
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

        <!-- Loading spinner — shown while transcode starts -->
        <div class="vp-loading ${isTranscode ? '' : 'vp-hidden'}" id="vp-loading">
          <div class="vp-spinner"></div>
          ${isTranscode ? '<span class="vp-loading-label" id="vp-loading-label">Starting transcode…</span>' : ''}
        </div>

        <!-- Transcode buffer bar (white, separate from seek bar) -->
        ${isTranscode ? `
        <div class="vp-transcode-bar" id="vp-transcode-bar">
          <div class="vp-transcode-track">
            <div class="vp-transcode-fill" id="vp-transcode-fill" style="width:0%"></div>
          </div>
          <span class="vp-transcode-label" id="vp-transcode-label">Transcoding 0%</span>
        </div>` : ''}
      </div>
    `;
  },

  mount() {
    this._videoEl = document.getElementById('vp-video');
    if (!this._videoEl) return;

    const overlay = document.getElementById('vp-play-overlay');
    const loading = document.getElementById('vp-loading');
    const label   = document.getElementById('vp-loading-label');

    /* Set src with retry for transcode files */
    if (this._isTranscode) {
      this._setSrcWithRetry(this._videoEl, this._pendingSrc).then(() => {
        if (label) label.textContent = 'Loading video…';
      });
    } else {
      this._videoEl.src = this._pendingSrc;
    }

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

    /* Poll transcode progress if bar exists */
    this._startProgressPoll();
  },

  _startProgressPoll() {
    const bar          = document.getElementById('vp-transcode-bar');
    const label        = document.getElementById('vp-transcode-label');
    const fill         = document.getElementById('vp-transcode-fill');
    const loadingLabel = document.getElementById('vp-loading-label');
    if (!bar) return;

    const src   = this._pendingSrc || '';
    const match = src.match(/[?&]path=([^&]+)/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);

    const poll = async () => {
      if (!this._videoEl) return;

      const info = await IPC.invoke('media:getTranscodeInfo', filePath).catch(() => null);
      if (!info) { setTimeout(poll, 1000); return; }

      const { transcodedSecs, duration, done } = info;

      /* Update white buffered bar in seek bar */
      if (duration > 0) {
        VideoControls.updateBuffered(done ? duration : transcodedSecs, duration);
      }

      if (done) {
        bar.classList.add('vp-hidden');
        return;
      }

      /* Update transcode bar */
      if (duration > 0) {
        const pct = Math.min(99, Math.round((transcodedSecs / duration) * 100));
        if (fill)  fill.style.width  = pct + '%';
        if (label) label.textContent = `Transcoding ${pct}% · ${this._fmtSec(transcodedSecs)} / ${this._fmtSec(duration)}`;
        if (loadingLabel) loadingLabel.textContent = `Transcoding ${pct}% — please wait…`;
      } else {
        if (label) label.textContent = `Transcoding… ${this._fmtSec(transcodedSecs)} done`;
      }

      setTimeout(poll, 1000);
    };
    poll();
  },

  _fmtSec(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
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
