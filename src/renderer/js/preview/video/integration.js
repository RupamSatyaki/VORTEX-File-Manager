/* Video Preview — Integration with FileList & ContextMenu */
const VideoPreviewIntegration = {
  init() {
    this._setupDoubleClick();
    this._setupContextMenu();
    this._setupSpaceKey();
    console.log('🔗 VideoPreviewIntegration initialized');
  },

  /* Double-click on video file → open in Video Player window */
  _setupDoubleClick() {
    document.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.file-item-grid, .file-item-list, .details-row');
      if (!item) return;

      const filePath = item.dataset.path;
      if (!filePath) return;

      const files = FileList.getFiles();
      const file  = files.find(f => f.path === filePath);
      if (!file || file.isDirectory) return;
      if (!VideoPreview.isVideo(file)) return;

      e.preventDefault();
      e.stopPropagation();

      /* Build playlist from all videos in folder */
      const VIDEO_EXTS = ['mp4','mkv','avi','mov','wmv','flv','m4v','ogv','webm','3gp'];
      const playlist = files
        .filter(f => !f.isDirectory && VIDEO_EXTS.includes((f.ext||'').toLowerCase()))
        .map(f => ({ path: f.path, name: f.name, ext: f.ext || '' }));
      const idx = playlist.findIndex(p => p.path === filePath);

      IPC.invoke('video:openPlayer', filePath, playlist, Math.max(0, idx));
    });
  },

  /* Space key on selected video → open player window */
  _setupSpaceKey() {
    document.addEventListener('keydown', (e) => {
      if (VideoPreview.isOpen()) return;
      if (e.key !== ' ') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const selected = Selection.getSelected();
      if (selected.length !== 1) return;
      if (!VideoPreview.isVideo(selected[0])) return;

      e.preventDefault();
      const files = FileList.getFiles();
      const VIDEO_EXTS = ['mp4','mkv','avi','mov','wmv','flv','m4v','ogv','webm','3gp'];
      const playlist = files
        .filter(f => !f.isDirectory && VIDEO_EXTS.includes((f.ext||'').toLowerCase()))
        .map(f => ({ path: f.path, name: f.name, ext: f.ext || '' }));
      const idx = playlist.findIndex(p => p.path === selected[0].path);
      IPC.invoke('video:openPlayer', selected[0].path, playlist, Math.max(0, idx));
    });
  },

  /* Context menu: "Preview Video" option */
  _setupContextMenu() {
    const originalShowForFile = ContextMenu.showForFile?.bind(ContextMenu);
    if (!originalShowForFile) return;

    ContextMenu.showForFile = function(file, x, y) {
      originalShowForFile(file, x, y);
      if (!VideoPreview.isVideo(file)) return;

      const menu = document.getElementById('context-menu');
      if (!menu) return;

      const items = menu.querySelectorAll('.ctx-item');
      if (!items.length) return;

      const previewItem = document.createElement('div');
      previewItem.className = 'ctx-item';
      previewItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
        <span>Preview Video</span>
      `;
      previewItem.addEventListener('click', () => {
        const files = FileList.getFiles();
        VideoPreview.open(file, files);
        ContextMenu.hide();
      });

      items[0].after(previewItem);
    };
  }
};
