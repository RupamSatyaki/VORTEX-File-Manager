/* Image Preview System - Main Controller */
const ImagePreview = {
  _isOpen: false,
  _currentFile: null,
  _currentIndex: -1,
  _allImages: [],
  _panel: null,

  init() {
    this._createPanel();
    this._setupKeyboardShortcuts();
    console.log('🖼️ ImagePreview initialized');
  },

  _createPanel() {
    const panel = document.createElement('div');
    panel.id = 'image-preview-panel';
    panel.className = 'preview-panel';
    panel.style.display = 'none';
    
    // Insert panel into file-preview-wrapper
    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) {
      wrapper.appendChild(panel);
    } else {
      // Fallback to content area
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        contentArea.appendChild(panel);
      } else {
        document.body.appendChild(panel);
      }
    }
    
    this._panel = panel;
  },

  open(file, allFiles = []) {
    if (this._isOpen) return;

    // Filter only image files
    this._allImages = allFiles.filter(f => 
      !f.isDirectory && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(f.ext?.toLowerCase())
    );

    // Find current file index
    this._currentIndex = this._allImages.findIndex(f => f.path === file.path);
    if (this._currentIndex === -1) {
      this._allImages = [file];
      this._currentIndex = 0;
    }

    this._currentFile = this._allImages[this._currentIndex];
    this._isOpen = true;

    this._render();
    this._panel.style.display = 'flex';
    
    // Add class to wrapper to enable split view
    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) {
      wrapper.classList.add('preview-active');
    }
    
    setTimeout(() => {
      this._panel.classList.add('preview-panel-open');
    }, 10);

    console.log('🖼️ Opened image preview:', file.name);
  },

  close() {
    if (!this._isOpen) return;

    this._isOpen = false;
    this._panel.classList.remove('preview-panel-open');
    
    // Remove class from wrapper
    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) {
      wrapper.classList.remove('preview-active');
    }
    
    setTimeout(() => {
      this._panel.style.display = 'none';
      this._panel.innerHTML = '';
    }, 300);

    this._currentFile = null;
    this._currentIndex = -1;
    this._allImages = [];

    console.log('🖼️ Closed image preview');
  },

  next() {
    if (this._allImages.length <= 1) return;
    this._currentIndex = (this._currentIndex + 1) % this._allImages.length;
    this._currentFile = this._allImages[this._currentIndex];
    this._render();
  },

  previous() {
    if (this._allImages.length <= 1) return;
    this._currentIndex = (this._currentIndex - 1 + this._allImages.length) % this._allImages.length;
    this._currentFile = this._allImages[this._currentIndex];
    this._render();
  },

  _render() {
    const header = PreviewHeader.render(this._currentFile, this._currentIndex, this._allImages.length);
    const viewer = PreviewViewer.render(this._currentFile);
    const info = PreviewInfo.render(this._currentFile);
    const actions = PreviewActions.render(this._currentFile);

    this._panel.innerHTML = `
      ${header}
      <div class="preview-content-scroll">
        ${viewer}
        ${info}
        ${actions}
      </div>
    `;

    this._attachEvents();
  },

  _attachEvents() {
    // Close button
    const closeBtn = this._panel.querySelector('.preview-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Navigation buttons
    const prevBtn = this._panel.querySelector('.preview-nav-prev');
    const nextBtn = this._panel.querySelector('.preview-nav-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previous());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    // Action buttons
    const openExternal = this._panel.querySelector('.preview-action-open');
    if (openExternal) {
      openExternal.addEventListener('click', () => {
        IPC.invoke('shell:openPath', this._currentFile.path);
      });
    }

    const showInFolder = this._panel.querySelector('.preview-action-folder');
    if (showInFolder) {
      showInFolder.addEventListener('click', () => {
        IPC.invoke('shell:showItemInFolder', this._currentFile.path);
      });
    }

    const copyPath = this._panel.querySelector('.preview-action-copy');
    if (copyPath) {
      copyPath.addEventListener('click', () => {
        navigator.clipboard.writeText(this._currentFile.path);
        Footer.showStatus('Path copied to clipboard', 'success');
      });
    }

    const deleteBtn = this._panel.querySelector('.preview-action-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await Dialogs.confirm(
          'Delete File',
          `Are you sure you want to delete "${this._currentFile.name}"?`
        );
        if (confirmed) {
          const result = await IPC.invoke('fs:delete', [this._currentFile.path]);
          if (result.success) {
            Footer.showStatus('File deleted', 'success');
            // Close preview and refresh
            this.close();
            Navigation.refresh();
          } else {
            Footer.showStatus('Delete failed: ' + result.error, 'error');
          }
        }
      });
    }
  },

  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this._isOpen) return;

      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previous();
          break;
      }
    });
  },

  isOpen() {
    return this._isOpen;
  }
};
