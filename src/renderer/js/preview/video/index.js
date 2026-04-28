/* ============================================================
   VIDEO PREVIEW — Main Controller
   ============================================================ */
const VideoPreview = {
  _isOpen:       false,
  _currentFile:  null,
  _currentIndex: -1,
  _allVideos:    [],
  _panel:        null,

  /* Supported extensions */
  EXTS: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v', 'ogv', '3gp'],

  init() {
    this._createPanel();
    this._setupKeyboard();
    console.log('🎬 VideoPreview initialized');
  },

  /* ── Create panel DOM ── */
  _createPanel() {
    const panel = document.createElement('div');
    panel.id        = 'video-preview-panel';
    panel.className = 'vp-panel';
    panel.style.display = 'none';

    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) wrapper.appendChild(panel);
    else document.querySelector('.content-area')?.appendChild(panel) || document.body.appendChild(panel);

    this._panel = panel;
  },

  /* ── Open ── */
  open(file, allFiles = []) {
    if (this._isOpen) this._forceClose();

    /* Filter video files from current folder */
    this._allVideos = allFiles.filter(f =>
      !f.isDirectory && this.EXTS.includes((f.ext || '').toLowerCase())
    );

    this._currentIndex = this._allVideos.findIndex(f => f.path === file.path);
    if (this._currentIndex === -1) {
      this._allVideos    = [file];
      this._currentIndex = 0;
    }

    this._currentFile = this._allVideos[this._currentIndex];
    this._isOpen      = true;

    this._render();
    this._panel.style.display = 'flex';

    document.getElementById('file-preview-wrapper')?.classList.add('preview-active');

    requestAnimationFrame(() => {
      this._panel.classList.add('vp-panel-open');
    });

    console.log('🎬 Opened video preview:', file.name);
  },

  /* ── Close ── */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    VideoPlayer.destroy();

    this._panel.classList.remove('vp-panel-open');
    document.getElementById('file-preview-wrapper')?.classList.remove('preview-active');

    setTimeout(() => {
      this._panel.style.display = 'none';
      this._panel.innerHTML     = '';
    }, 300);

    this._currentFile  = null;
    this._currentIndex = -1;
    this._allVideos    = [];
    console.log('🎬 Closed video preview');
  },

  _forceClose() {
    VideoPlayer.destroy();
    this._panel.classList.remove('vp-panel-open');
    this._panel.style.display = 'none';
    this._panel.innerHTML     = '';
    document.getElementById('file-preview-wrapper')?.classList.remove('preview-active');
    this._isOpen = false;
  },

  /* ── Navigate ── */
  next() {
    if (this._allVideos.length <= 1) return;
    this._currentIndex = (this._currentIndex + 1) % this._allVideos.length;
    this._currentFile  = this._allVideos[this._currentIndex];
    VideoPlayer.destroy();
    this._render();
  },

  previous() {
    if (this._allVideos.length <= 1) return;
    this._currentIndex = (this._currentIndex - 1 + this._allVideos.length) % this._allVideos.length;
    this._currentFile  = this._allVideos[this._currentIndex];
    VideoPlayer.destroy();
    this._render();
  },

  /* ── Render ── */
  _render() {
    const toolbar  = VideoToolbar.render(this._currentFile, this._currentIndex, this._allVideos.length);
    const player   = VideoPlayer.render(this._currentFile);
    const controls = VideoControls.render();
    const info     = VideoInfo.render(this._currentFile);

    this._panel.innerHTML = `
      ${toolbar}
      <div class="vp-body">
        ${player}
        ${controls}
        <div class="vp-scroll">
          ${info}
        </div>
      </div>
    `;

    /* Mount interactive components after DOM is ready */
    VideoPlayer.mount();
    VideoControls.mount();
    this._attachEvents();
  },

  /* ── Wire up buttons ── */
  _attachEvents() {
    /* Toolbar */
    this._panel.querySelector('.vp-close-btn')
      ?.addEventListener('click', () => this.close());

    this._panel.querySelector('.vp-nav-prev')
      ?.addEventListener('click', () => this.previous());

    this._panel.querySelector('.vp-nav-next')
      ?.addEventListener('click', () => this.next());

    this._panel.querySelector('.vp-open-external')
      ?.addEventListener('click', () => IPC.invoke('shell:openPath', this._currentFile.path));

    /* Info actions */
    this._panel.querySelector('.vp-action-open')
      ?.addEventListener('click', () => IPC.invoke('shell:openPath', this._currentFile.path));

    this._panel.querySelector('.vp-action-folder')
      ?.addEventListener('click', () => IPC.invoke('shell:showItemInFolder', this._currentFile.path));

    this._panel.querySelector('#vp-copy-path')
      ?.addEventListener('click', () => {
        navigator.clipboard.writeText(this._currentFile.path);
        Footer.showStatus('Path copied', 'success');
      });

    this._panel.querySelector('.vp-action-delete')
      ?.addEventListener('click', async () => {
        const ok = await Dialogs.confirm('Delete File', `Delete "${this._currentFile.name}"?`);
        if (!ok) return;
        const res = await IPC.invoke('fs:delete', [this._currentFile.path]);
        if (res.success) {
          Footer.showStatus('File deleted', 'success');
          this.close();
          Navigation.refresh();
        } else {
          Footer.showStatus('Delete failed: ' + res.error, 'error');
        }
      });
  },

  /* ── Keyboard shortcuts ── */
  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this._isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case ' ':
          e.preventDefault();
          VideoPlayer.togglePlay();
          break;
        case 'ArrowRight':
          /* Shift+→ = next video, plain → = seek +5s */
          e.shiftKey ? this.next() : VideoPlayer.seekRelative(5);
          break;
        case 'ArrowLeft':
          e.shiftKey ? this.previous() : VideoPlayer.seekRelative(-5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          VideoPlayer.setVolume((VideoPlayer.getElement()?.volume ?? 1) + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          VideoPlayer.setVolume((VideoPlayer.getElement()?.volume ?? 1) - 0.1);
          break;
        case 'm':
        case 'M':
          VideoPlayer.toggleMute();
          break;
        case 'f':
        case 'F':
          document.getElementById('vp-fullscreen-btn')?.click();
          break;
      }
    });
  },

  isOpen()    { return this._isOpen; },
  isVideo(f)  { return !f.isDirectory && this.EXTS.includes((f.ext || '').toLowerCase()); }
};
