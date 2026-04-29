/* Video Preview — Player Component */
const VideoPlayer = {
  _videoEl:        null,
  _mediaPort:      null,
  _probedDuration: 0,

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
    const src         = await this._getMediaUrl(file.path);
    const isTranscode = ['mkv','avi','wmv','flv','mov','3gp','ogv']
                          .includes((file.ext||'').toLowerCase());
    this._pendingSrc  = src;
    this._isTranscode = isTranscode;
    this._filePath    = file.path;

    return `
      <div class="vp-player-wrap">
        <video
          id="vp-video"
          class="vp-video"
          preload="auto"
        ></video>

        <!-- Overlay play button -->
        <div class="vp-play-overlay" id="vp-play-overlay">
          <div class="vp-play-overlay-btn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>

        <!-- Loading spinner -->
        <div class="vp-loading ${isTranscode ? '' : 'vp-hidden'}" id="vp-loading">
          <div class="vp-spinner"></div>
          ${isTranscode ? '<span class="vp-loading-label" id="vp-loading-label">Transcoding… please wait</span>' : ''}
        </div>
      </div>
    `;
  },

  mount() {
    this._videoEl = document.getElementById('vp-video');
    if (!this._videoEl) return;

    const overlay = document.getElementById('vp-play-overlay');
    const loading = document.getElementById('vp-loading');
    const label   = document.getElementById('vp-loading-label');

    /* For transcode files — get real duration from ffprobe immediately */
    if (this._isTranscode && this._filePath) {
      IPC.invoke('media:getDuration', this._filePath).then(dur => {
        if (dur > 0) {
          this._probedDuration = dur;
          VideoControls.onDurationReady(dur);
          VideoInfo.updateVideoMeta(dur, 0, 0);
        }
      });
    }

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

    this._videoEl.addEventListener('play',  () => {
      if (!this._videoEl) return;
      overlay.classList.add('vp-hidden');
    });
    this._videoEl.addEventListener('pause', () => {
      if (!this._videoEl) return;
      overlay.classList.remove('vp-hidden');
    });

    this._videoEl.addEventListener('ended', () => {
      if (!this._videoEl) return;
      this._videoEl.currentTime = 0;
      overlay.classList.remove('vp-hidden');
      VideoControls.onTimeUpdate(0, this._videoEl.duration || 0);
    });

    this._videoEl.addEventListener('waiting', () => {
      if (!this._videoEl) return;
      if (!this._videoEl.paused) loading.classList.remove('vp-hidden');
    });
    this._videoEl.addEventListener('playing',        () => loading.classList.add('vp-hidden'));
    this._videoEl.addEventListener('canplaythrough', () => loading.classList.add('vp-hidden'));

    this._videoEl.addEventListener('loadedmetadata', () => {
      if (!this._videoEl) return;
      /* For transcode files — use probed duration, NOT transcoded file duration
         (transcoded file is partial, its duration is wrong) */
      const dur = this._isTranscode && this._probedDuration > 0
        ? this._probedDuration
        : this._videoEl.duration;

      VideoInfo.updateVideoMeta(
        dur,
        this._videoEl.videoWidth,
        this._videoEl.videoHeight
      );
      /* Only set controls duration from video element for non-transcode files */
      if (!this._isTranscode) {
        VideoControls.onDurationReady(this._videoEl.duration);
      }
      /* For transcode — duration already set from ffprobe in mount() */
      loading.classList.add('vp-hidden');
    });

    this._videoEl.addEventListener('timeupdate', () => {
      if (!this._videoEl) return;
      const dur = this._isTranscode && this._probedDuration > 0
        ? this._probedDuration
        : (this._videoEl.duration || 0);
      VideoControls.onTimeUpdate(this._videoEl.currentTime, dur);
    });

    /* Poll transcode progress for buffered bar + info panel */
    if (this._isTranscode) this._startProgressPoll();
  },

  _startProgressPoll() {
    const src   = this._pendingSrc || '';
    const match = src.match(/[?&]path=([^&]+)/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);

    const poll = async () => {
      if (!this._videoEl) return;

      const info = await IPC.invoke('media:getTranscodeInfo', filePath).catch(() => null);
      if (!info) { setTimeout(poll, 1000); return; }

      const { transcodedSecs, done } = info;

      /* Use probed duration (from ffprobe) — most accurate */
      const dur = this._probedDuration || VideoControls._duration || info.duration || 0;

      /* Update white buffered bar */
      if (dur > 0) {
        VideoControls.updateBuffered(done ? dur : transcodedSecs, dur);
      }

      /* Update transcoding status in info panel */
      VideoInfo.updateTranscodeStatus(transcodedSecs, dur, done);

      if (done) return;
      setTimeout(poll, 1000);
    };
    poll();
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
    this._videoEl       = null;
    this._probedDuration = 0;
  }
};
