/* Context Menu */
const ContextMenu = {
  _el: null,

  _icons: {
    open:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
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
    openwith:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
    show:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    properties: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
  },

  init() {
    this._el = document.getElementById('context-menu');
    document.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.file-item-grid,.file-item-list,.details-row')) {
        e.preventDefault();
        this.showForBackground(e.clientX, e.clientY);
      }
    });
  },

  showForFile(file, x, y) {
    const selected = Selection.getSelected();
    const isMulti = selected.length > 1;

    this.show(x, y, [
      { label: 'Open',             icon: 'open',       disabled: isMulti, action: () => FileList.openFile(file) },
      { label: 'Open with...',     icon: 'openwith',   disabled: isMulti, action: () => IPC.invoke('shell:openPath', file.path) },
      { sep: true },
      { label: 'Copy',             icon: 'copy',       shortcut: 'Ctrl+C', action: () => CopyPaste.copy(Selection.getSelected()) },
      { label: 'Cut',              icon: 'cut',        shortcut: 'Ctrl+X', action: () => CopyPaste.cut(Selection.getSelected()) },
      { sep: true },
      { label: 'Rename',           icon: 'rename',     shortcut: 'F2',     disabled: isMulti, action: () => this._rename(file) },
      { label: 'Copy Path',        icon: 'link',                           disabled: isMulti, action: () => navigator.clipboard.writeText(file.path) },
      { label: 'Show in Explorer', icon: 'show',                           disabled: isMulti, action: () => IPC.send('shell:showInFolder', file.path) },
      { sep: true },
      { label: 'Properties',       icon: 'properties',                     disabled: isMulti, action: () => Dialogs.showProperties(file) },
      { sep: true },
      { label: isMulti ? `Delete ${selected.length} items` : 'Delete',
        icon: 'delete', shortcut: 'Del', danger: true,
        action: () => this._delete(Selection.getSelected()) },
    ]);
  },

  showForBackground(x, y) {
    const tab = TabManager.getActiveTab();
    this.show(x, y, [
      { label: 'New Folder',        icon: 'folder',   action: () => this._newFolder(tab?.path) },
      { label: 'New File',          icon: 'newfile',  action: () => this._newFile(tab?.path) },
      { sep: true },
      { label: 'Paste',             icon: 'paste',    shortcut: 'Ctrl+V', disabled: !CopyPaste.hasClipboard(), action: () => CopyPaste.paste(tab?.path) },
      { sep: true },
      { label: 'Refresh',           icon: 'refresh',  shortcut: 'F5',     action: () => Navigation.refresh() },
      { label: 'Add to Bookmarks',  icon: 'bookmark',                     action: () => Bookmarks.addCurrent() },
    ]);
  },

  show(x, y, items) {
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
        ${item.shortcut ? `<span class="cm-shortcut">${item.shortcut}</span>` : ''}
      `;
      if (!item.disabled) {
        el.addEventListener('click', (e) => { e.stopPropagation(); this.hide(); item.action(); });
      }
      this._el.appendChild(el);
    });

    this._el.style.display = 'block';
    // Position after display so we can measure
    requestAnimationFrame(() => {
      const rect = this._el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      this._el.style.left = (x + rect.width  > vw ? vw - rect.width  - 8 : x) + 'px';
      this._el.style.top  = (y + rect.height > vh ? vh - rect.height - 8 : y) + 'px';
    });
  },

  hide() { if (this._el) this._el.style.display = 'none'; },

  async _rename(file) {
    // Find the element for this file and do inline rename
    const el = document.querySelector(`[data-path="${CSS.escape(file.path)}"]`);
    if (el) {
      FileList.startInlineRename(el, file);
    } else {
      // Fallback: dialog
      Dialogs.showRenameDialog(file, async (newName) => {
        if (!newName || newName === file.name) return;
        const newPath = PathUtils.join(PathUtils.getParent(file.path), newName);
        const result = await IPC.invoke('fs:rename', file.path, newPath);
        if (result.success) Navigation.refresh();
        else Footer.showStatus('Rename failed: ' + result.error, 'error');
      });
    }
  },

  async _delete(files) {
    if (!files.length) return;
    console.log('Delete requested for:', files);
    Dialogs.showDeleteConfirm(files, async () => {
      console.log('Delete confirmed, deleting files...');
      for (const f of files) {
        const result = await IPC.invoke('fs:delete', f.path);
        console.log('Delete result for', f.path, ':', result);
      }
      Navigation.refresh();
      Footer.showStatus(`Deleted ${files.length} item${files.length !== 1 ? 's' : ''}`, 'success');
    });
  },

  async _newFolder(parentPath) {
    if (!parentPath) {
      console.error('❌ No parent path provided for new folder');
      Footer.showStatus('Cannot create folder: No path', 'error');
      return;
    }
    
    console.log('📁 Creating folder in:', parentPath);
    
    // Use inline creation instead of prompt
    this._createFolderInline(parentPath);
  },

  _createFolderInline(parentPath) {
    const defaultName = 'New Folder';
    
    // Find the active file list container
    const container = document.getElementById('file-grid');
    const isGrid = container.style.display !== 'none';

    const placeholder = document.createElement('div');
    placeholder.className = isGrid ? 'file-item-grid' : 'file-item-list';
    placeholder.style.outline = '2px solid var(--accent)';

    const folderSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="${isGrid ? 36 : 18}" height="${isGrid ? 36 : 18}"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

    const iconHtml = `<div class="${isGrid ? 'file-icon-wrap' : 'file-icon-sm'}" style="color:#f59e0b">${folderSvg}</div>`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    input.value = defaultName;
    input.style.width = isGrid ? '90px' : '200px';

    placeholder.innerHTML = iconHtml;
    placeholder.appendChild(input);

    const targetContainer = isGrid
      ? document.getElementById('file-grid')
      : (document.getElementById('file-list').style.display !== 'none'
          ? document.getElementById('file-list')
          : document.getElementById('file-details'));

    targetContainer.insertBefore(placeholder, targetContainer.firstChild);
    placeholder.scrollIntoView({ block: 'nearest' });
    input.focus();
    input.select();

    let committed = false;

    const commit = async () => {
      if (committed) return;
      committed = true;
      const name = input.value.trim();
      placeholder.remove();
      
      if (!name) {
        console.log('⚠️ Folder creation cancelled (empty name)');
        return;
      }
      
      const fullPath = PathUtils.join(parentPath, name);
      console.log('📁 Creating folder at:', fullPath);
      
      try {
        const result = await IPC.invoke('fs:mkdir', fullPath);
        console.log('✅ Create folder result:', result);
        
        if (result.success) {
          Footer.showStatus(`Created folder: ${name}`, 'success');
          Navigation.refresh();
        } else {
          console.error('❌ Failed to create folder:', result.error);
          Footer.showStatus('Failed: ' + result.error, 'error');
        }
      } catch (err) {
        console.error('❌ Exception creating folder:', err);
        Footer.showStatus('Error: ' + err.message, 'error');
      }
    };

    const cancel = () => {
      if (committed) return;
      committed = true;
      placeholder.remove();
      console.log('⚠️ Folder creation cancelled');
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      e.stopPropagation();
    });
    input.addEventListener('blur', () => commit());
    input.addEventListener('click', (e) => e.stopPropagation());
  },

  async _newFile(parentPath) {
    if (!parentPath) {
      console.error('No parent path provided for new file');
      return;
    }
    console.log('Creating file in:', parentPath);
    FileList.startNewFileInline(parentPath, 'New File.txt');
  }
};
