/* File List Component */
const FileList = {
  _files: [],
  _view: 'grid',
  _sortBy: 'name',
  _sortOrder: 'asc',
  _isSearchMode: false,
  _searchQuery: '',

  init() {
    this._view = Storage.get('view') || 'grid';
    this._sortBy = Storage.get('sortBy') || 'name';
    this._sortOrder = Storage.get('sortOrder') || 'asc';
    Events.on('view:changed', (v) => this.setView(v));
    
    // Show loading state initially
    console.log('📋 FileList init - default view:', this._view);
    this.showLoading();
    
    // Click on empty space to deselect
    this._setupDeselectOnClick();
  },

  _setupDeselectOnClick() {
    const container = document.getElementById('file-list-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // Check if click is directly on container or empty/loading state
      const isEmptyArea = e.target === container || 
                         e.target.closest('.empty-state') ||
                         e.target.closest('.loading-state') ||
                         e.target.id === 'file-grid' ||
                         e.target.id === 'file-list' ||
                         e.target.id === 'file-details';
      
      // Also check if click is on This PC view
      const isThisPCView = e.target.closest('#thispc-view');
      
      if (isEmptyArea || isThisPCView) {
        // Deselect all if clicking on empty space
        Selection.deselectAll();
      }
    });
  },

  setView(view) {
    this._view = view;
    Storage.set('view', view);
    this.render(this._files);
  },

  async loadPath(path) {
    this._isSearchMode = false;
    this._searchQuery = '';
    this._removeBanner();
    
    // Show loading with message for portable devices
    if (path.startsWith('Computer\\')) {
      this.showLoading('Loading device... This may take a few seconds');
    } else {
      this.showLoading();
    }
    
    // Handle special "This PC" view
    if (path === 'thispc://') {
      await this.showThisPC();
      return;
    }
    
    // Mark This PC as inactive when navigating away
    ThisPCView.markInactive();
    
    // Hide This PC view if it exists
    const thisPCView = document.getElementById('thispc-view');
    if (thisPCView) {
      thisPCView.remove();
    }
    
    const result = await IPC.invoke('fs:readDir', path);
    if (!result.success) {
      this.showEmpty();
      Footer.showStatus('Cannot open: ' + result.error, 'error');
      return;
    }
    this._files = result.files;
    this.render(this._files);
    Footer.updateSelectionInfo(0, 0);
    Footer.updateDriveInfo(path);
  },

  async showThisPC() {
    console.log('🖥️ Showing This PC view');
    await ThisPCView.render();
  },

  showSearchResults(files, query) {
    this._isSearchMode = true;
    this._searchQuery = query;
    this._files = files;
    this.render(files);
    this._showBanner(query, files.length);
    Footer.updateSelectionInfo(0, 0);
    // Update footer count
    const el = document.getElementById('selection-info');
    el.textContent = `${files.length} result${files.length !== 1 ? 's' : ''} for "${query}"`;
  },

  _showBanner(query, count) {
    this._removeBanner();
    const container = document.getElementById('file-list-container');
    const banner = document.createElement('div');
    banner.className = 'search-results-banner';
    banner.id = 'search-banner';
    banner.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <span>Search results for: <strong>${this._esc(query)}</strong> — ${count} item${count !== 1 ? 's' : ''} found</span>
      <button class="banner-close" title="Clear search (Esc)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    `;
    banner.querySelector('.banner-close').addEventListener('click', () => {
      Search.clearSearch();
    });
    container.insertBefore(banner, container.firstChild);
  },

  _removeBanner() {
    const existing = document.getElementById('search-banner');
    if (existing) existing.remove();
  },

  render(files) {
    const sorted = this.sortFiles(files);
    document.getElementById('loading-state').style.display = 'none';

    const grid    = document.getElementById('file-grid');
    const list    = document.getElementById('file-list');
    const details = document.getElementById('file-details');
    const empty   = document.getElementById('empty-state');

    grid.style.display = 'none';
    list.style.display = 'none';
    details.style.display = 'none';
    empty.style.display = 'none';

    if (sorted.length === 0) { empty.style.display = 'flex'; return; }

    if (this._view === 'grid')         this.renderGrid(sorted);
    else if (this._view === 'list')    this.renderList(sorted);
    else                               this.renderDetails(sorted);
  },

  renderGrid(files) {
    const c = document.getElementById('file-grid');
    c.style.display = 'grid';
    c.innerHTML = '';
    const frag = document.createDocumentFragment();
    files.forEach(file => {
      const el = document.createElement('div');
      el.className = 'file-item-grid';
      el.dataset.path = file.path;
      
      // Check if we should show thumbnail
      if (Thumbnails.shouldShowThumbnail(file)) {
        if (Thumbnails.isImage(file)) {
          // Image thumbnail
          const thumbnailUrl = Thumbnails.getImageThumbnail(file);
          el.innerHTML = `
            <div class="file-icon-wrap">
              <img class="file-thumbnail" src="${thumbnailUrl}" alt="${this._esc(file.name)}" loading="lazy">
            </div>
            <span class="file-name-grid">${this._esc(file.name)}</span>
          `;
        } else if (Thumbnails.isVideo(file)) {
          // Video thumbnail (async) - show icon first
          el.innerHTML = `
            <div class="file-icon-wrap" style="color:${IconMapper.getColor(file)}">${IconMapper.getSvg(file)}</div>
            <span class="file-name-grid">${this._esc(file.name)}</span>
          `;
          
          // Load video thumbnail asynchronously
          Thumbnails.getVideoThumbnail(file).then(thumbnailUrl => {
            if (thumbnailUrl) {
              const iconWrap = el.querySelector('.file-icon-wrap');
              if (iconWrap) {
                iconWrap.innerHTML = `
                  <img class="file-thumbnail" src="${thumbnailUrl}" alt="${this._esc(file.name)}">
                  <div class="video-play-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                      <polygon points="8,6 18,12 8,18" fill="white"/>
                    </svg>
                  </div>
                `;
              }
            }
          });
        }
      } else {
        // Regular icon
        el.innerHTML = `
          <div class="file-icon-wrap" style="color:${IconMapper.getColor(file)}">${IconMapper.getSvg(file)}</div>
          <span class="file-name-grid">${this._esc(file.name)}</span>
        `;
      }
      
      this._attachEvents(el, file);
      frag.appendChild(el);
    });
    c.appendChild(frag);
  },

  renderList(files) {
    const c = document.getElementById('file-list');
    c.style.display = 'flex';
    c.innerHTML = '';
    const frag = document.createDocumentFragment();
    files.forEach(file => {
      const el = document.createElement('div');
      el.className = 'file-item-list';
      el.dataset.path = file.path;
      el.innerHTML = `
        <div class="file-icon-sm" style="color:${IconMapper.getColor(file)}">${IconMapper.getSvg(file)}</div>
        <span class="file-name-list">${this._esc(file.name)}</span>
        <div class="file-meta">
          <span>${file.isDirectory ? '--' : FormatUtils.formatSize(file.size)}</span>
          <span>${FormatUtils.formatDate(file.modified)}</span>
        </div>
      `;
      this._attachEvents(el, file);
      frag.appendChild(el);
    });
    c.appendChild(frag);
  },

  renderDetails(files) {
    const c = document.getElementById('file-details');
    c.style.display = 'flex';
    c.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'details-header';
    const cols = [
      { key: 'name',     label: 'Name' },
      { key: 'size',     label: 'Size' },
      { key: 'ext',      label: 'Type' },
      { key: 'modified', label: 'Date Modified' },
    ];
    cols.forEach(col => {
      const cell = document.createElement('div');
      cell.className = 'details-header-cell' + (this._sortBy === col.key ? ' sorted' : '');
      cell.innerHTML = col.label + (this._sortBy === col.key ? (this._sortOrder === 'asc' ? ' ↑' : ' ↓') : '');
      cell.addEventListener('click', () => {
        if (this._sortBy === col.key) this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
        else { this._sortBy = col.key; this._sortOrder = 'asc'; }
        Storage.set('sortBy', this._sortBy);
        Storage.set('sortOrder', this._sortOrder);
        this.render(this._files);
      });
      header.appendChild(cell);
    });
    c.appendChild(header);

    const frag = document.createDocumentFragment();
    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'details-row';
      row.dataset.path = file.path;
      row.innerHTML = `
        <div class="details-cell details-cell-name">
          <span style="color:${IconMapper.getColor(file)};width:16px;height:16px;display:flex;align-items:center;flex-shrink:0;">${IconMapper.getSvg(file)}</span>
          <span class="truncate">${this._esc(file.name)}</span>
        </div>
        <div class="details-cell secondary">${file.isDirectory ? '--' : FormatUtils.formatSize(file.size)}</div>
        <div class="details-cell secondary">${file.isDirectory ? 'Folder' : (file.ext ? file.ext.toUpperCase() : 'File')}</div>
        <div class="details-cell secondary">${FormatUtils.formatDate(file.modified)}</div>
      `;
      this._attachEvents(row, file);
      frag.appendChild(row);
    });
    c.appendChild(frag);
  },

  _attachEvents(el, file) {
    el.addEventListener('click',       (e) => Selection.handleClick(el, file, e));
    el.addEventListener('dblclick',    ()  => this.openFile(file));
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!el.classList.contains('selected')) Selection.selectOnly(el, file);
      ContextMenu.showForFile(file, e.clientX, e.clientY);
    });
  },

  openFile(file) {
    if (file.isDirectory) Navigation.navigateTo(file.path);
    else IPC.invoke('shell:openPath', file.path);
  },

  // ── Inline rename ──────────────────────────────────────────
  startInlineRename(el, file) {
    // Find the name element inside the item
    let nameEl = el.querySelector('.file-name-grid, .file-name-list, .truncate');
    if (!nameEl) return;

    const originalName = file.name;
    const ext = file.isDirectory ? '' : (file.ext ? '.' + file.ext : '');
    const baseName = ext ? originalName.slice(0, originalName.length - ext.length) : originalName;

    // Replace name element with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    input.value = originalName;
    input.style.width = Math.max(80, nameEl.offsetWidth || 100) + 'px';

    nameEl.replaceWith(input);
    input.focus();

    // Select just the base name (without extension)
    if (ext && !file.isDirectory) {
      input.setSelectionRange(0, baseName.length);
    } else {
      input.select();
    }

    let committed = false;

    const commit = async () => {
      if (committed) return;
      committed = true;
      const newName = input.value.trim();
      if (!newName || newName === originalName) {
        // Restore original
        input.replaceWith(nameEl);
        return;
      }
      const parentPath = PathUtils.getParent(file.path);
      const newPath = PathUtils.join(parentPath, newName);
      const result = await IPC.invoke('fs:rename', file.path, newPath);
      if (result.success) {
        Navigation.refresh();
      } else {
        input.replaceWith(nameEl);
        Footer.showStatus('Rename failed: ' + result.error, 'error');
      }
    };

    const cancel = () => {
      if (committed) return;
      committed = true;
      input.replaceWith(nameEl);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      e.stopPropagation();
    });

    input.addEventListener('blur', () => commit());
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());
  },

  // ── New file inline creation ───────────────────────────────
  startNewFileInline(parentPath, defaultName = 'New File.txt') {
    console.log('🎨 Creating inline file input...');
    
    // Find which view is active
    const gridContainer = document.getElementById('file-grid');
    const listContainer = document.getElementById('file-list');
    const detailsContainer = document.getElementById('file-details');
    const emptyState = document.getElementById('empty-state');
    
    let targetContainer = null;
    let isGrid = false;
    
    // Check which container is visible
    if (gridContainer.style.display !== 'none') {
      targetContainer = gridContainer;
      isGrid = true;
    } else if (listContainer.style.display !== 'none') {
      targetContainer = listContainer;
      isGrid = false;
    } else if (detailsContainer.style.display !== 'none') {
      targetContainer = detailsContainer;
      isGrid = false;
    } else if (emptyState.style.display !== 'none') {
      // Empty folder - show grid by default
      console.log('📭 Empty folder detected, showing grid view');
      emptyState.style.display = 'none';
      gridContainer.style.display = 'grid';
      targetContainer = gridContainer;
      isGrid = true;
    }
    
    if (!targetContainer) {
      console.error('❌ No target container found!');
      Footer.showStatus('Cannot create file: No container', 'error');
      return;
    }
    
    console.log('✅ Target container:', targetContainer.id, 'isGrid:', isGrid);

    const placeholder = document.createElement('div');
    placeholder.className = isGrid ? 'file-item-grid' : 'file-item-list';
    placeholder.style.outline = '2px solid var(--accent)';
    placeholder.id = 'new-file-placeholder';

    const iconHtml = `<div class="${isGrid ? 'file-icon-wrap' : 'file-icon-sm'}" style="color:#94a3b8">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="${isGrid ? 36 : 18}" height="${isGrid ? 36 : 18}"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    input.value = defaultName;
    input.style.width = isGrid ? '90px' : '200px';

    placeholder.innerHTML = iconHtml;
    placeholder.appendChild(input);

    targetContainer.insertBefore(placeholder, targetContainer.firstChild);
    placeholder.scrollIntoView({ block: 'nearest' });
    
    console.log('✅ Input field created, focusing...');
    setTimeout(() => {
      input.focus();
      // Select base name without extension
      const dotIdx = defaultName.lastIndexOf('.');
      if (dotIdx > 0) input.setSelectionRange(0, dotIdx);
      else input.select();
    }, 50);

    let committed = false;

    const commit = async () => {
      if (committed) return;
      committed = true;
      const name = input.value.trim();
      placeholder.remove();
      
      if (!name) {
        console.log('⚠️ File creation cancelled (empty name)');
        // If folder is still empty, show empty state again
        if (targetContainer.children.length === 0) {
          targetContainer.style.display = 'none';
          emptyState.style.display = 'flex';
        }
        return;
      }
      
      const filePath = PathUtils.join(parentPath, name);
      console.log('📄 Creating file at:', filePath);
      
      const result = await IPC.invoke('fs:createFile', filePath);
      if (result.success) {
        console.log('✅ File created successfully');
        Footer.showStatus(`Created file: ${name}`, 'success');
        Navigation.refresh();
      } else {
        console.error('❌ Failed to create file:', result.error);
        Footer.showStatus('Create failed: ' + result.error, 'error');
        // Show empty state if needed
        if (targetContainer.children.length === 0) {
          targetContainer.style.display = 'none';
          emptyState.style.display = 'flex';
        }
      }
    };

    const cancel = () => {
      if (committed) return;
      committed = true;
      placeholder.remove();
      console.log('⚠️ File creation cancelled');
      // If folder is still empty, show empty state again
      if (targetContainer.children.length === 0) {
        targetContainer.style.display = 'none';
        emptyState.style.display = 'flex';
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      e.stopPropagation();
    });
    input.addEventListener('blur', () => commit());
    input.addEventListener('click', (e) => e.stopPropagation());
  },

  sortFiles(files) {
    const dirs  = files.filter(f =>  f.isDirectory);
    const items = files.filter(f => !f.isDirectory);
    const sort  = arr => arr.sort((a, b) => {
      let va = a[this._sortBy] ?? '';
      let vb = b[this._sortBy] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this._sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return this._sortOrder === 'asc' ?  1 : -1;
      return 0;
    });
    return [...sort(dirs), ...sort(items)];
  },

  showLoading(message = 'Loading...') {
    ['file-grid','file-list','file-details','empty-state'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    const loadingState = document.getElementById('loading-state');
    loadingState.style.display = 'flex';
    
    // Update loading message
    const loadingText = loadingState.querySelector('span');
    if (loadingText) {
      loadingText.textContent = message;
    }
  },

  showEmpty() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
  },

  getFiles() { return this._files; },

  _esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
