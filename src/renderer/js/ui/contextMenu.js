/* ============================================================
   CONTEXT MENU — with New submenu as separate floating panel
   ============================================================ */
const ContextMenu = {
  _el:  null,
  _sub: null, /* submenu element */

  _icons: {
    open:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    openwith:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    copy:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    cut:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="20" r="2"/><circle cx="6" cy="4" r="2"/><line x1="6" y1="6" x2="6" y2="18"/><line x1="6" y1="12" x2="21" y2="3"/><line x1="6" y1="12" x2="21" y2="21"/></svg>`,
    paste:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>`,
    rename:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    delete:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    link:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    folder:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    refresh:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    bookmark:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    newfile:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
    show:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    properties: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
    chevron:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
    /* New file type icons */
    txt:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    code:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    excel: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`,
    word:  `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    ppt:   `<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/><line x1="12" y1="14" x2="16" y2="14"/></svg>`,
    pdf:   `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    html:  `<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    json:  `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    md:    `<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  },

  /* New file types list */
  _newTypes: [
    { label: 'Folder',              icon: 'folder', ext: null,    color: '#f59e0b' },
    { sep: true },
    { label: 'Text File',           icon: 'txt',    ext: '.txt',  color: '#e8e8f0' },
    { label: 'Markdown File',       icon: 'md',     ext: '.md',   color: '#8b5cf6' },
    { sep: true },
    { label: 'Word Document',       icon: 'word',   ext: '.docx', color: '#3b82f6' },
    { label: 'Excel Spreadsheet',   icon: 'excel',  ext: '.xlsx', color: '#22c55e' },
    { label: 'PowerPoint',          icon: 'ppt',    ext: '.pptx', color: '#f97316' },
    { sep: true },
    { label: 'JavaScript File',     icon: 'code',   ext: '.js',   color: '#f59e0b' },
    { label: 'Python File',         icon: 'code',   ext: '.py',   color: '#3b82f6' },
    { label: 'HTML File',           icon: 'html',   ext: '.html', color: '#f97316' },
    { label: 'CSS File',            icon: 'code',   ext: '.css',  color: '#60a5fa' },
    { label: 'JSON File',           icon: 'json',   ext: '.json', color: '#f59e0b' },
  ],

  init() {
    this._el  = document.getElementById('context-menu');
    this._sub = document.createElement('div');
    this._sub.className = 'context-menu context-submenu';
    this._sub.style.display = 'none';
    document.body.appendChild(this._sub);

    document.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });

    document.addEventListener('contextmenu', (e) => {
      const fileItem = e.target.closest('.file-item-grid,.file-item-list,.details-row');
      if (fileItem) return;

      const fileListArea = e.target.closest('#file-list-container,.file-grid,.file-list,.file-details-wrap,.empty-state');
      if (fileListArea) {
        e.preventDefault();
        this.showForBackground(e.clientX, e.clientY);
      }
    });
  },

  /* ── File context menu ── */
  showForFile(file, x, y) {
    const selected = Selection.getSelected();
    const isMulti  = selected.length > 1;

    this.show(x, y, [
      { label: 'Open',          icon: 'open',     disabled: isMulti, action: () => FileList.openFile(file) },
      {
        label: 'Open with…',
        icon: 'openwith',
        disabled: isMulti,
        hasSubmenu: true,
        submenuAction: (itemEl) => this._showOpenWithSubmenu(itemEl, file),
      },
      { sep: true },
      { label: 'Copy',          icon: 'copy',     shortcut: 'Ctrl+C', action: () => CopyPaste.copy(Selection.getSelected()) },
      { label: 'Cut',           icon: 'cut',      shortcut: 'Ctrl+X', action: () => CopyPaste.cut(Selection.getSelected()) },
      { sep: true },
      { label: 'Rename',        icon: 'rename',   shortcut: 'F2',     disabled: isMulti, action: () => this._rename(file) },
      { label: 'Copy Path',     icon: 'link',     disabled: isMulti,  action: () => navigator.clipboard.writeText(file.path) },
      { label: 'Show in Explorer', icon: 'show',  disabled: isMulti,  action: () => IPC.send('shell:showInFolder', file.path) },
      { sep: true },
      { label: 'Properties',   icon: 'properties', disabled: isMulti, action: () => Dialogs.showProperties(file) },
      { sep: true },
      {
        label: isMulti ? `Delete ${selected.length} items` : 'Delete',
        icon: 'delete', shortcut: 'Del', danger: true,
        action: () => this._delete(Selection.getSelected())
      },
    ]);
  },

  /* ── Open With submenu ── */
  async _showOpenWithSubmenu(anchorEl, file) {
    this._sub.innerHTML = '';

    /* Loading state */
    const loading = document.createElement('div');
    loading.className = 'cm-item disabled';
    loading.innerHTML = `<span class="cm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></span><span class="cm-label">Detecting apps…</span>`;
    this._sub.appendChild(loading);
    this._positionSubmenu(anchorEl);
    this._sub.style.display = 'block';

    const ext  = (file.ext || '').toLowerCase();
    const apps = await IPC.invoke('shell:getAppsForExt', ext).catch(() => []);

    this._sub.innerHTML = '';

    if (!apps.length) {
      const none = document.createElement('div');
      none.className = 'cm-item disabled';
      none.innerHTML = `<span class="cm-label" style="color:var(--text-tertiary)">No apps found</span>`;
      this._sub.appendChild(none);
    } else {
      apps.forEach(app => {
        const el = document.createElement('div');
        el.className = 'cm-item';

        /* Use real app icon if available, else fallback SVG */
        const iconHtml = app.iconDataUrl
          ? `<img src="${app.iconDataUrl}" width="16" height="16" style="border-radius:3px;object-fit:contain;">`
          : this._getAppIcon(app.icon);

        el.innerHTML = `
          <span class="cm-icon">${iconHtml}</span>
          <span class="cm-label">${app.name}</span>
        `;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hide();
          if (app.internal) {
            /* Open in Vortex internal player */
            this._openInternal(file, app.internal);
          } else {
            IPC.invoke('shell:openWith', file.path, app);
          }
        });
        this._sub.appendChild(el);
      });
    }

    /* Always show "Choose another app" at bottom */
    const sep = document.createElement('div');
    sep.className = 'cm-sep';
    this._sub.appendChild(sep);

    const choose = document.createElement('div');
    choose.className = 'cm-item';
    choose.innerHTML = `
      <span class="cm-icon">${this._icons.openwith}</span>
      <span class="cm-label">Choose another app…</span>
    `;
    choose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      IPC.invoke('shell:openPath', file.path);
    });
    this._sub.appendChild(choose);

    this._positionSubmenu(anchorEl);
  },

  /* App icon SVGs */
  _getAppIcon(iconId) {
    const appIcons = {
      chrome:    `<svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`,
      firefox:   `<svg viewBox="0 0 24 24" fill="none" stroke="#ff6611" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 7.07 17.07"/></svg>`,
      edge:      `<svg viewBox="0 0 24 24" fill="none" stroke="#0078d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4"/></svg>`,
      vlc:       `<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
      mpc:       `<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
      wmp:       `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
      photos:    `<svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      irfanview: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>`,
      vscode:    `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      notepad:   `<svg viewBox="0 0 24 24" fill="none" stroke="#e8e8f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      notepadpp: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      word:      `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      excel:     `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      ppt:       `<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      acrobat:   `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      winrar:    `<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
      '7zip':    `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
      vortex:    `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="2"/></svg>`,
    };
    return appIcons[iconId] || this._icons.openwith;
  },

  /* ── Background context menu ── */
  showForBackground(x, y) {
    const tab = TabManager.getActiveTab();
    if (!tab?.path) return;

    this.show(x, y, [
      {
        label: 'New',
        icon: 'folder',
        hasSubmenu: true,
        submenuAction: (itemEl) => this._showNewSubmenu(itemEl, tab.path),
      },
      { sep: true },
      { label: 'Paste',           icon: 'paste',    shortcut: 'Ctrl+V', disabled: !CopyPaste.hasClipboard(), action: () => CopyPaste.paste(tab.path) },
      { sep: true },
      { label: 'Refresh',         icon: 'refresh',  shortcut: 'F5',     action: () => Navigation.refresh() },
      { label: 'Add to Bookmarks',icon: 'bookmark',                      action: () => Bookmarks.addCurrent() },
    ]);
  },

  /* ── Position submenu next to anchor element ── */
  _positionSubmenu(anchorEl) {
    requestAnimationFrame(() => {
      const anchorRect = anchorEl.getBoundingClientRect();
      const subRect    = this._sub.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = anchorRect.right + 4;
      let top  = anchorRect.top;

      if (left + subRect.width  > vw) left = anchorRect.left - subRect.width - 4;
      if (top  + subRect.height > vh) top  = vh - subRect.height - 8;

      this._sub.style.left = left + 'px';
      this._sub.style.top  = top  + 'px';
    });
  },

  /* ── Show "New" submenu ── */
  _showNewSubmenu(anchorEl, parentPath) {
    this._sub.innerHTML = '';

    this._newTypes.forEach(type => {
      if (type.sep) {
        const sep = document.createElement('div');
        sep.className = 'cm-sep';
        this._sub.appendChild(sep);
        return;
      }

      const el = document.createElement('div');
      el.className = 'cm-item';
      el.innerHTML = `
        <span class="cm-icon" style="color:${type.color || 'var(--accent)'}">${this._icons[type.icon] || ''}</span>
        <span class="cm-label">${type.label}</span>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
        if (type.ext === null) {
          /* Folder */
          this._createFolderInline(parentPath);
        } else {
          /* File with extension */
          const defaultName = `New File${type.ext}`;
          FileList.startNewFileInline(parentPath, defaultName);
        }
      });
      this._sub.appendChild(el);
    });

    /* Position submenu next to the "New" item */
    this._sub.style.display = 'block';
    requestAnimationFrame(() => {
      const anchorRect = anchorEl.getBoundingClientRect();
      const subRect    = this._sub.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = anchorRect.right + 4;
      let top  = anchorRect.top;

      /* Flip left if not enough space */
      if (left + subRect.width > vw) left = anchorRect.left - subRect.width - 4;
      /* Flip up if not enough space */
      if (top + subRect.height > vh) top = vh - subRect.height - 8;

      this._sub.style.left = left + 'px';
      this._sub.style.top  = top  + 'px';
    });
  },

  /* ── Build and show menu ── */
  show(x, y, items) {
    this._sub.style.display = 'none';
    this._el.innerHTML = '';

    items.forEach(item => {
      if (item.sep) {
        const sep = document.createElement('div');
        sep.className = 'cm-sep';
        this._el.appendChild(sep);
        return;
      }

      const el = document.createElement('div');
      el.className = 'cm-item' + (item.danger ? ' danger' : '') + (item.disabled ? ' disabled' : '');
      el.innerHTML = `
        <span class="cm-icon">${this._icons[item.icon] || ''}</span>
        <span class="cm-label">${item.label}</span>
        ${item.shortcut    ? `<span class="cm-shortcut">${item.shortcut}</span>` : ''}
        ${item.hasSubmenu  ? `<span class="cm-arrow">${this._icons.chevron}</span>` : ''}
      `;

      if (!item.disabled) {
        if (item.hasSubmenu) {
          /* Hover to open submenu */
          el.addEventListener('mouseenter', () => item.submenuAction(el));
          el.addEventListener('click', (e) => { e.stopPropagation(); item.submenuAction(el); });
        } else {
          el.addEventListener('click', (e) => { e.stopPropagation(); this.hide(); item.action(); });
          /* Hide submenu when hovering other items */
          el.addEventListener('mouseenter', () => { this._sub.style.display = 'none'; });
        }
      }

      this._el.appendChild(el);
    });

    this._el.style.display = 'block';
    requestAnimationFrame(() => {
      const rect = this._el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      this._el.style.left = (x + rect.width  > vw ? vw - rect.width  - 8 : x) + 'px';
      this._el.style.top  = (y + rect.height > vh ? vh - rect.height - 8 : y) + 'px';
    });
  },

  hide() {
    if (this._el)  this._el.style.display  = 'none';
    if (this._sub) this._sub.style.display = 'none';
  },

  /* ── Open in Vortex internal player ── */
  _openInternal(file, type) {
    const files = FileList.getFiles();
    if (type === 'video') {
      VideoPreview.open(file, files);
    } else if (type === 'image') {
      ImagePreview.open(file, files);
    } else if (type === 'pdf') {
      IPC.invoke('pdf:openReader', file.path);
    }
  },

  /* ── Actions ── */
  async _rename(file) {
    const el = document.querySelector(`[data-path="${CSS.escape(file.path)}"]`);
    if (el) {
      FileList.startInlineRename(el, file);
    } else {
      Dialogs.showRenameDialog(file, async (newName) => {
        if (!newName || newName === file.name) return;
        const newPath = PathUtils.join(PathUtils.getParent(file.path), newName);
        const result  = await IPC.invoke('fs:rename', file.path, newPath);
        if (result.success) Navigation.refresh();
        else Footer.showStatus('Rename failed: ' + result.error, 'error');
      });
    }
  },

  async _delete(files) {
    if (!files.length) return;
    Dialogs.showDeleteConfirm(files, async () => {
      for (const f of files) await IPC.invoke('fs:delete', f.path);
      Navigation.refresh();
      Footer.showStatus(`Deleted ${files.length} item${files.length !== 1 ? 's' : ''}`, 'success');
    });
  },

  async _newFolder(parentPath) {
    if (!parentPath) return;
    this._createFolderInline(parentPath);
  },

  _createFolderInline(parentPath) {
    const gridContainer   = document.getElementById('file-grid');
    const listContainer   = document.getElementById('file-list');
    const detailsContainer= document.getElementById('file-details');
    const emptyState      = document.getElementById('empty-state');

    let targetContainer = null;
    let isGrid = false;

    if (gridContainer.style.display !== 'none')        { targetContainer = gridContainer;    isGrid = true;  }
    else if (listContainer.style.display !== 'none')   { targetContainer = listContainer;    isGrid = false; }
    else if (detailsContainer.style.display !== 'none'){ targetContainer = detailsContainer; isGrid = false; }
    else {
      emptyState.style.display = 'none';
      gridContainer.style.display = 'grid';
      targetContainer = gridContainer;
      isGrid = true;
    }

    if (!targetContainer) return;

    const placeholder = document.createElement('div');
    placeholder.className = isGrid ? 'file-item-grid' : 'file-item-list';
    placeholder.style.outline = '2px solid var(--accent)';

    const sz = isGrid ? 36 : 18;
    const folderSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="${sz}" height="${sz}"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    const iconHtml = `<div class="${isGrid ? 'file-icon-wrap' : 'file-icon-sm'}" style="color:#f59e0b">${folderSvg}</div>`;

    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'inline-rename-input';
    input.value     = 'New Folder';
    input.style.width = isGrid ? '90px' : '200px';

    placeholder.innerHTML = iconHtml;
    placeholder.appendChild(input);
    targetContainer.insertBefore(placeholder, targetContainer.firstChild);

    setTimeout(() => { input.focus(); input.select(); }, 50);

    let committed = false;
    const commit = async () => {
      if (committed) return;
      committed = true;
      const name = input.value.trim();
      placeholder.remove();
      if (!name) { this._restoreEmpty(targetContainer, emptyState); return; }
      const result = await IPC.invoke('fs:mkdir', PathUtils.join(parentPath, name));
      if (result.success) { Footer.showStatus(`Created: ${name}`, 'success'); Navigation.refresh(); }
      else { Footer.showStatus('Failed: ' + result.error, 'error'); this._restoreEmpty(targetContainer, emptyState); }
    };
    const cancel = () => { if (committed) return; committed = true; placeholder.remove(); this._restoreEmpty(targetContainer, emptyState); };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      e.stopPropagation();
    });
    input.addEventListener('blur', () => commit());
    input.addEventListener('click', (e) => e.stopPropagation());
  },

  _restoreEmpty(container, emptyState) {
    if (container && container.children.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
    }
  },

  async _newFile(parentPath) {
    if (!parentPath) return;
    FileList.startNewFileInline(parentPath, 'New File.txt');
  }
};
