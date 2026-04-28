/* File Preview System */
const Preview = {
  _panel: null,
  _isOpen: false,
  _currentFile: null,

  init() {
    console.log('🔍 Preview system initializing...');
    this._createPanel();
    this._setupKeyboardShortcuts();
    console.log('✅ Preview system ready');
  },

  _createPanel() {
    const panel = document.createElement('div');
    panel.id = 'preview-panel';
    panel.className = 'preview-panel';
    panel.innerHTML = `
      <div class="preview-header">
        <div class="preview-title">Preview</div>
        <button class="preview-close" title="Close (Space or Esc)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="preview-content" id="preview-content">
        <div class="preview-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p>Select a file and press Space to preview</p>
        </div>
      </div>
      <div class="preview-info" id="preview-info"></div>
    `;
    
    document.body.appendChild(panel);
    this._panel = panel;
    
    // Close button
    panel.querySelector('.preview-close').addEventListener('click', () => this.close());
  },

  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Space key to toggle preview
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        console.log('🔍 Space key pressed, toggling preview');
        this.toggle();
      }
      
      // Escape to close
      if (e.key === 'Escape' && this._isOpen) {
        console.log('🔍 Escape pressed, closing preview');
        this.close();
      }
    });
  },

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    console.log('🔍 Opening preview...');
    const selected = Selection.getSelected();
    console.log('🔍 Selected files:', selected.length);
    
    if (selected.length !== 1) {
      Footer.showStatus('Select a single file to preview', 'info');
      return;
    }
    
    const file = selected[0];
    console.log('🔍 File:', file);
    
    if (file.isDirectory) {
      Footer.showStatus('Cannot preview folders', 'info');
      return;
    }
    
    this._isOpen = true;
    this._currentFile = file;
    this._panel.classList.add('open');
    
    // Adjust main content
    document.querySelector('.content-area').classList.add('preview-open');
    
    console.log('🔍 Loading preview for:', file.name);
    this._loadPreview(file);
  },

  close() {
    this._isOpen = false;
    this._currentFile = null;
    this._panel.classList.remove('open');
    document.querySelector('.content-area').classList.remove('preview-open');
    
    // Clear content
    const content = document.getElementById('preview-content');
    content.innerHTML = `
      <div class="preview-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <p>Select a file and press Space to preview</p>
      </div>
    `;
  },

  async _loadPreview(file) {
    const content = document.getElementById('preview-content');
    const info = document.getElementById('preview-info');
    
    // Show loading
    content.innerHTML = '<div class="preview-loading"><div class="spinner"></div><p>Loading preview...</p></div>';
    
    // Update info
    info.innerHTML = `
      <div class="preview-info-item"><strong>Name:</strong> ${this._esc(file.name)}</div>
      <div class="preview-info-item"><strong>Size:</strong> ${FormatUtils.formatSize(file.size)}</div>
      <div class="preview-info-item"><strong>Modified:</strong> ${FormatUtils.formatDate(file.modified)}</div>
      <div class="preview-info-item"><strong>Type:</strong> ${file.ext ? file.ext.toUpperCase() : 'File'}</div>
    `;
    
    const ext = file.ext.toLowerCase();
    
    // Image preview
    if (this._isImage(ext)) {
      await this._previewImage(file, content);
    }
    // Video preview
    else if (this._isVideo(ext)) {
      await this._previewVideo(file, content);
    }
    // Audio preview
    else if (this._isAudio(ext)) {
      await this._previewAudio(file, content);
    }
    // Text preview
    else if (this._isText(ext)) {
      await this._previewText(file, content);
    }
    // PDF preview
    else if (ext === 'pdf') {
      await this._previewPDF(file, content);
    }
    // Unsupported
    else {
      content.innerHTML = `
        <div class="preview-unsupported">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>Preview not available for this file type</p>
          <button class="btn-primary" onclick="IPC.invoke('shell:openPath', '${file.path.replace(/'/g, "\\'")}')">Open with default app</button>
        </div>
      `;
    }
  },

  async _previewImage(file, content) {
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.src = `file:///${file.path.replace(/\\/g, '/')}`;
    
    img.onload = () => {
      content.innerHTML = '';
      content.appendChild(img);
    };
    
    img.onerror = () => {
      content.innerHTML = '<div class="preview-error">Failed to load image</div>';
    };
  },

  async _previewVideo(file, content) {
    const video = document.createElement('video');
    video.className = 'preview-video';
    video.controls = true;
    video.src = `file:///${file.path.replace(/\\/g, '/')}`;
    
    content.innerHTML = '';
    content.appendChild(video);
  },

  async _previewAudio(file, content) {
    content.innerHTML = `
      <div class="preview-audio-container">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <h3>${this._esc(file.name)}</h3>
        <audio controls class="preview-audio">
          <source src="file:///${file.path.replace(/\\/g, '/')}" type="audio/${file.ext}">
        </audio>
      </div>
    `;
  },

  async _previewText(file, content) {
    try {
      // Read file content (limit to 1MB for safety)
      if (file.size > 1024 * 1024) {
        content.innerHTML = '<div class="preview-error">File too large to preview (max 1MB)</div>';
        return;
      }
      
      const result = await IPC.invoke('fs:readFile', file.path);
      if (!result.success) {
        content.innerHTML = `<div class="preview-error">Failed to read file: ${result.error}</div>`;
        return;
      }
      
      const pre = document.createElement('pre');
      pre.className = 'preview-text';
      pre.textContent = result.content;
      
      content.innerHTML = '';
      content.appendChild(pre);
    } catch (err) {
      content.innerHTML = `<div class="preview-error">Error: ${err.message}</div>`;
    }
  },

  async _previewPDF(file, content) {
    content.innerHTML = `
      <div class="preview-pdf">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>PDF Preview</p>
        <button class="btn-primary" onclick="IPC.invoke('shell:openPath', '${file.path.replace(/'/g, "\\'")}')">Open PDF</button>
      </div>
    `;
  },

  _isImage(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext);
  },

  _isVideo(ext) {
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(ext);
  },

  _isAudio(ext) {
    return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(ext);
  },

  _isText(ext) {
    return ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'yml', 'yaml', 'log', 'csv', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'ps1'].includes(ext);
  },

  _esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
