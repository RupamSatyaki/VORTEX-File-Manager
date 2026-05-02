/* Dialog System — Glassmorphism Modals */
const Dialogs = {
  _container: null,

  init() {
    this._container = document.getElementById('dialogs-container');
  },

  // ── Generic Confirm Dialog ───────────────────────────────
  confirm(title, message) {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      const dialog = document.createElement('div');
      dialog.className = 'dialog';
      dialog.innerHTML = `
        <div class="dialog-header">
          <div class="dialog-title">${this._esc(title)}</div>
          <button class="dialog-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="dialog-body">
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.5">${this._esc(message)}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-button dialog-button-secondary" data-action="cancel">Cancel</button>
          <button class="dialog-button dialog-button-primary" data-action="confirm">Confirm</button>
        </div>
      `;
      overlay.appendChild(dialog);
      this._container.appendChild(overlay);
      const close = (val) => { overlay.remove(); resolve(val); };
      dialog.querySelector('.dialog-close').addEventListener('click', () => close(false));
      dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', escHandler); }
      });
      setTimeout(() => dialog.querySelector('[data-action="confirm"]').focus(), 100);
    });
  },

  // ── Delete Confirmation ──────────────────────────────────
  showDeleteConfirm(files, onConfirm, customTitle = null) {
    const count = files.length;
    const title = customTitle || `Delete ${count} item${count !== 1 ? 's' : ''}?`;
    const message = count === 1
      ? `Are you sure you want to delete "${files[0].name}"? This action cannot be undone.`
      : `Are you sure you want to delete ${count} items? This action cannot be undone.`;

    const overlay = this._createOverlay();
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">${this._esc(title)}</div>
        <button class="dialog-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="dialog-body">
        <div class="delete-confirm-info">
          <div class="delete-confirm-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="delete-confirm-text">
            <h3>${this._esc(title)}</h3>
            <p>${this._esc(message)}</p>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="dialog-button dialog-button-secondary" data-action="cancel">Cancel</button>
        <button class="dialog-button dialog-button-danger" data-action="confirm">Delete</button>
      </div>
    `;

    overlay.appendChild(dialog);
    this._container.appendChild(overlay);

    const close = () => overlay.remove();
    dialog.querySelector('.dialog-close').addEventListener('click', close);
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', close);
    dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      close();
      onConfirm();
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });

    // Focus confirm button
    setTimeout(() => dialog.querySelector('[data-action="confirm"]').focus(), 100);
  },

  // ── Rename Dialog ────────────────────────────────────────
  showRenameDialog(file, onConfirm) {
    const overlay = this._createOverlay();
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">Rename</div>
        <button class="dialog-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="dialog-body">
        <label class="dialog-label">New name:</label>
        <input type="text" class="dialog-input" id="rename-input" value="${this._esc(file.name)}" spellcheck="false">
      </div>
      <div class="dialog-footer">
        <button class="dialog-button dialog-button-secondary" data-action="cancel">Cancel</button>
        <button class="dialog-button dialog-button-primary" data-action="confirm">Rename</button>
      </div>
    `;

    overlay.appendChild(dialog);
    this._container.appendChild(overlay);

    const input = dialog.querySelector('#rename-input');
    const close = () => overlay.remove();

    const confirm = () => {
      const newName = input.value.trim();
      if (newName && newName !== file.name) {
        close();
        onConfirm(newName);
      }
    };

    dialog.querySelector('.dialog-close').addEventListener('click', close);
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', close);
    dialog.querySelector('[data-action="confirm"]').addEventListener('click', confirm);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirm(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Select base name without extension
    setTimeout(() => {
      input.focus();
      const ext = file.isDirectory ? '' : (file.ext ? '.' + file.ext : '');
      if (ext && !file.isDirectory) {
        const baseName = file.name.slice(0, file.name.length - ext.length);
        input.setSelectionRange(0, baseName.length);
      } else {
        input.select();
      }
    }, 100);
  },

  // ── Properties Dialog ────────────────────────────────────
  async showProperties(file) {
    const overlay = this._createOverlay();
    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    // Get detailed stats
    const stat = await IPC.invoke('fs:stat', file.path);
    const size = stat.success ? stat.size : file.size;
    const modified = stat.success ? stat.modified : file.modified;
    const created = stat.success ? stat.created : file.created;

    const iconHtml = `<div style="color:${IconMapper.getColor(file)};width:48px;height:48px;display:flex;align-items:center;justify-content:center;">${IconMapper.getSvg(file)}</div>`;

    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">Properties</div>
        <button class="dialog-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="dialog-body">
        <div class="properties-grid">
          <div class="properties-icon-row">
            <div class="properties-big-icon">${iconHtml}</div>
            <div>
              <div class="properties-filename">${this._esc(file.name)}</div>
              <div class="properties-filetype">${file.isDirectory ? 'Folder' : (file.ext ? file.ext.toUpperCase() + ' File' : 'File')}</div>
            </div>
          </div>
          <div class="properties-label">Type:</div>
          <div class="properties-value">${file.isDirectory ? 'Folder' : (file.ext ? file.ext.toUpperCase() + ' File' : 'File')}</div>
          <div class="properties-label">Location:</div>
          <div class="properties-value">${this._esc(PathUtils.getParent(file.path))}</div>
          <div class="properties-label">Size:</div>
          <div class="properties-value">${file.isDirectory ? '--' : FormatUtils.formatSize(size)}</div>
          <div class="properties-label">Created:</div>
          <div class="properties-value">${FormatUtils.formatDate(created)}</div>
          <div class="properties-label">Modified:</div>
          <div class="properties-value">${FormatUtils.formatDate(modified)}</div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="dialog-button dialog-button-primary" data-action="close">Close</button>
      </div>
    `;

    overlay.appendChild(dialog);
    this._container.appendChild(overlay);

    const close = () => overlay.remove();
    dialog.querySelector('.dialog-close').addEventListener('click', close);
    dialog.querySelector('[data-action="close"]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });
  },

  // ── Helper: Create overlay ───────────────────────────────
  _createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    return overlay;
  },

  _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
