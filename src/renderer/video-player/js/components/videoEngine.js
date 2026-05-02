/* Video Engine — <video> element management */
const VideoEngine = {
  _el: null,

  render() {
    return `
      <div class="vp-video-wrap" id="vp-video-wrap">
        <video id="vp-video" class="vp-video" preload="auto"></video>

        <!-- Play overlay -->
        <div class="vp-play-overlay" id="vp-play-overlay">
          <div class="vp-play-btn-big">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>

        <!-- Transcode loading overlay -->
        <div class="vp-transcode-overlay" id="vp-transcode-overlay">
          <div class="vp-transcode-spinner"></div>
          <div class="vp-transcode-msg" id="vp-transcode-msg">Transcoding… please wait</div>
          <div class="vp-transcode-bar-wrap">
            <div class="vp-transcode-bar-fill" id="vp-transcode-bar-fill" style="width:0%"></div>
          </div>
        </div>

        <!-- Buffering spinner -->
        <div class="vp-buffering hidden" id="vp-buffering">
          <div class="vp-spinner"></div>
        </div>
      </div>
    `;
  },

  mount() {
    this._el = document.getElementById('vp-video');
    if (!this._el) return;

    const overlay   = document.getElementById('vp-play-overlay');
    const buffering = document.getElementById('vp-buffering');

    overlay.addEventListener('click', () => this.togglePlay());

    this._el.addEventListener('play',  () => {
      overlay.classList.add('hidden');
      State.paused = false;
      Controls.syncPlayBtn(false);
    });

    this._el.addEventListener('pause', () => {
      overlay.classList.remove('hidden');
      State.paused = true;
      Controls.syncPlayBtn(true);
    });

    this._el.addEventListener('ended', () => {
      overlay.classList.remove('hidden');
      State.paused = true;
      Controls.syncPlayBtn(true);
      /* Don't reset currentTime here — let user replay manually */
      SeekBar.update(State.duration, State.duration);
    });

    /* Stall detection — if video stalls for >5s, show buffering */
    let _stallTimer = null;
    this._el.addEventListener('waiting', () => {
      if (!this._el.paused) {
        _stallTimer = setTimeout(() => buffering.classList.remove('hidden'), 300);
      }
    });
    this._el.addEventListener('playing', () => {
      clearTimeout(_stallTimer);
      buffering.classList.add('hidden');
    });
    this._el.addEventListener('canplay', () => {
      clearTimeout(_stallTimer);
      buffering.classList.add('hidden');
    });

    /* Error handler — log and show message */
    this._el.addEventListener('error', (e) => {
      const err = this._el?.error;
      console.error('Video error:', err?.code, err?.message);
      /* Don't stop — browser may recover on next range request */
    });

    this._el.addEventListener('loadedmetadata', () => {
      /* For non-transcode files use video duration */
      if (!State.isTranscode && this._el.duration > 0 && isFinite(this._el.duration)) {
        State.duration = this._el.duration;
        SeekBar.setDuration(State.duration);
        InfoPanel.updateDuration(State.duration, this._el.videoWidth, this._el.videoHeight);
      } else if (State.isTranscode && State.duration > 0) {
        InfoPanel.updateResolution(this._el.videoWidth, this._el.videoHeight);
      }
      document.getElementById('vp-transcode-overlay')?.classList.add('hidden');
    });

    this._el.addEventListener('timeupdate', () => {
      if (!this._el) return;
      State.currentTime = this._el.currentTime;
      const dur = State.isTranscode ? State.duration : (isFinite(this._el.duration) ? this._el.duration : State.duration);
      SeekBar.update(State.currentTime, dur || 0);
    });

    this._el.addEventListener('volumechange', () => {
      State.volume = this._el.volume;
      State.muted  = this._el.muted;
      Controls.syncVolume();
    });
  },

  async loadFile(filePath) {
    if (!this._el) return;

    State.setFile(filePath);
    Toolbar.setTitle(State.fileName);

    /* Show transcode overlay for MKV etc */
    if (State.isTranscode) {
      document.getElementById('vp-transcode-overlay')?.classList.remove('hidden');
    }

    /* Guard: media port must be set */
    if (!State.mediaPort) {
      console.error('VideoEngine.loadFile: mediaPort not set');
      return;
    }

    /* Get ffprobe duration for transcode files */
    if (State.isTranscode) {
      window.vortexAPI.getMediaDuration(filePath).then(dur => {
        if (dur > 0) {
          State.duration = dur;
          SeekBar.setDuration(dur);
          InfoPanel.updateDuration(dur, 0, 0);
        }
      }).catch(() => {});
    }

    /* Build URL */
    const url = MediaUrl.build(filePath);

    /* For transcode files: wait until server has data, then set src */
    if (State.isTranscode) {
      await this._setSrcWithRetry(url);
    } else {
      this._el.src = url;
    }

    /* Start transcode polling */
    if (State.isTranscode) TranscodeStatus.startPolling(filePath);
  },

  async _setSrcWithRetry(url, maxRetries = 40) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.status === 200 || res.status === 206) break;
        if (res.status === 503) {
          /* Not ready yet — wait and retry */
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        /* Any other status — just try to play */
        break;
      } catch {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (this._el) {
      this._el.src = url;
      /* Don't autoplay — let user press play */
    }
  },

  togglePlay() {
    if (!this._el) return;
    this._el.paused ? this._el.play() : this._el.pause();
  },

  seek(secs) {
    if (!this._el) return;
    this._el.currentTime = Math.max(0, Math.min(secs, State.duration || this._el.duration || 0));
  },

  seekRelative(delta) {
    if (!this._el) return;
    this.seek(this._el.currentTime + delta);
  },

  setVolume(v) {
    if (!this._el) return;
    this._el.volume = Math.max(0, Math.min(1, v));
    this._el.muted  = (v === 0);
  },

  toggleMute() {
    if (!this._el) return;
    this._el.muted = !this._el.muted;
  },

  changeSpeed(delta) {
    if (!this._el) return;
    const newSpeed = Math.max(0.25, Math.min(4, this._el.playbackRate + delta));
    this._el.playbackRate = newSpeed;
    State.speed = newSpeed;
    Controls.syncSpeed(newSpeed);
  },

  setSpeed(rate) {
    if (!this._el) return;
    this._el.playbackRate = rate;
    State.speed = rate;
  },

  getElement() { return this._el; },

  destroy() {
    if (this._el) {
      this._el.pause();
      this._el.removeAttribute('src');
      this._el.load();
      /* Remove element from DOM to kill all event listeners */
      this._el.replaceWith(this._el.cloneNode(false));
    }
    this._el = null;
    TranscodeStatus.stopPolling();
  },
};
