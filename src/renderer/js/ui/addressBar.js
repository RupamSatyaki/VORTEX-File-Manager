/* ============================================================
   ADDRESS BAR — Windows 11 Explorer Style
   ============================================================ */
const AddressBar = {
  _editing: false,
  _currentPath: '',
  _openDropdown: null,   // { el, segmentPath }

  /* SVG icons */
  _icons: {
    drive:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01"/><circle cx="17" cy="12" r="2"/></svg>`,
    folder:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    thispc:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    phone:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    chevron:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
    chevdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
    desktop:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    docs:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    pictures: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    music:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    videos:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    downloads:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  },

  /* Map known folder names to icons */
  _getFolderIcon(name) {
    const n = (name || '').toLowerCase().replace(/[:\\]/g, '');
    if (n === 'desktop')   return this._icons.desktop;
    if (n === 'documents') return this._icons.docs;
    if (n === 'pictures')  return this._icons.pictures;
    if (n === 'music')     return this._icons.music;
    if (n === 'videos')    return this._icons.videos;
    if (n === 'downloads') return this._icons.downloads;
    return this._icons.folder;
  },

  /* Detect if segment is a drive root (e.g. "C:\") */
  _isDrive(label) {
    return /^[A-Za-z]:\\?$/.test(label);
  },

  init() {
    const bar   = document.getElementById('address-bar');
    const input = document.getElementById('path-input');

    /* Click on bar background → enter edit mode */
    bar.addEventListener('click', (e) => {
      if (e.target.closest('.bc-segment') || e.target.closest('.bc-arrow')) return;
      if (!this._editing) this.enableEdit();
    });

    /* Keyboard in input */
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (val) Navigation.navigateTo(val);
        this.disableEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.disableEdit();
      }
      /* Ctrl+V paste */
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          const start = input.selectionStart;
          const end   = input.selectionEnd;
          input.value = input.value.substring(0, start) + text + input.value.substring(end);
          const pos = start + text.length;
          input.setSelectionRange(pos, pos);
        } catch (err) {
          Footer.showStatus('Paste failed', 'error');
        }
      }
    });

    input.addEventListener('paste', () => { /* native paste handled above */ });

    input.addEventListener('blur', () => {
      setTimeout(() => this.disableEdit(), 120);
    });

    /* Refresh button */
    const refreshBtn = document.getElementById('addr-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        Navigation.refresh();
        setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
      });
    }

    /* Close dropdown on outside click */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.bc-dropdown') && !e.target.closest('.bc-arrow')) {
        this._closeDropdown();
      }
    });

    /* Listen for path changes */
    Events.on('navigation:pathChanged', ({ path }) => {
      this._currentPath = path;
      if (!this._editing) this.render(path);
    });
  },

  /* ── Render breadcrumb ── */
  render(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    const locIcon    = document.getElementById('addr-loc-icon');
    breadcrumb.innerHTML = '';
    this._closeDropdown();

    /* ── This PC ── */
    if (path === 'thispc://') {
      if (locIcon) locIcon.innerHTML = this._icons.thispc;
      this._appendSegment(breadcrumb, {
        label: 'This PC',
        icon: this._icons.thispc,
        path: 'thispc://',
        isLast: true,
        parentPath: null
      });
      return;
    }

    /* ── Portable device path ── */
    if (path.startsWith('Computer\\')) {
      if (locIcon) locIcon.innerHTML = this._icons.phone;
      const parts = path.replace('Computer\\', '').split('\\');

      // "This PC" root
      this._appendSegment(breadcrumb, {
        label: 'This PC',
        icon: this._icons.thispc,
        path: 'thispc://',
        isLast: false,
        parentPath: null
      });

      parts.forEach((part, i) => {
        const segPath = 'Computer\\' + parts.slice(0, i + 1).join('\\');
        this._appendSegment(breadcrumb, {
          label: part,
          icon: i === 0 ? this._icons.phone : this._icons.folder,
          path: segPath,
          isLast: i === parts.length - 1,
          parentPath: i === 0 ? null : 'Computer\\' + parts.slice(0, i).join('\\')
        });
      });
      return;
    }

    /* ── Normal path ── */
    const segments = PathUtils.getSegments(path);
    if (!segments.length) return;

    // Update location icon based on first segment
    const firstLabel = segments[0].label;
    if (locIcon) {
      locIcon.innerHTML = this._isDrive(firstLabel)
        ? this._icons.drive
        : this._icons.folder;
    }

    segments.forEach((seg, i) => {
      const isLast     = i === segments.length - 1;
      const parentPath = i === 0 ? null : segments[i - 1].path;
      const icon       = this._isDrive(seg.label)
        ? this._icons.drive
        : this._getFolderIcon(seg.label);

      this._appendSegment(breadcrumb, {
        label: seg.label,
        icon,
        path: seg.path,
        isLast,
        parentPath
      });
    });

    /* Check overflow */
    requestAnimationFrame(() => {
      breadcrumb.classList.toggle('overflowing', breadcrumb.scrollWidth > breadcrumb.clientWidth);
      // Scroll to end so last segment is visible
      breadcrumb.scrollLeft = breadcrumb.scrollWidth;
    });
  },

  /* ── Build one breadcrumb segment ── */
  _appendSegment(container, { label, icon, path, isLast, parentPath }) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-segment';

    /* Separator (not for first item) */
    if (container.children.length > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.innerHTML = this._icons.chevron;
      container.appendChild(sep);
    }

    /* Label chip */
    const item = document.createElement('span');
    item.className = 'bc-item' + (isLast ? ' last' : '');
    item.innerHTML = `<span class="bc-item-icon">${icon}</span>${label}`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      Navigation.navigateTo(path);
    });
    wrap.appendChild(item);

    /* Dropdown arrow */
    const arrow = document.createElement('button');
    arrow.className = 'bc-arrow';
    arrow.title = 'Show subfolders';
    arrow.innerHTML = this._icons.chevdown;
    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleDropdown(arrow, path);
    });
    wrap.appendChild(arrow);

    container.appendChild(wrap);
  },

  /* ── Dropdown: show sibling folders ── */
  async _toggleDropdown(arrowEl, parentPath) {
    /* Close if same dropdown already open */
    if (this._openDropdown && this._openDropdown.arrowEl === arrowEl) {
      this._closeDropdown();
      return;
    }
    this._closeDropdown();

    arrowEl.classList.add('open');

    const dropdown = document.createElement('div');
    dropdown.className = 'bc-dropdown';
    dropdown.innerHTML = `<div class="bc-dropdown-loading">Loading…</div>`;
    document.body.appendChild(dropdown);

    /* Position below the arrow */
    const rect = arrowEl.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top  = (rect.bottom + 4) + 'px';

    this._openDropdown = { el: dropdown, arrowEl };

    /* Fetch subfolders */
    try {
      const result = await IPC.invoke('fs:readDir', parentPath);
      dropdown.innerHTML = '';

      if (!result.success || !result.files) {
        dropdown.innerHTML = `<div class="bc-dropdown-loading">No folders</div>`;
        return;
      }

      const folders = result.files.filter(f => f.isDirectory);
      if (!folders.length) {
        dropdown.innerHTML = `<div class="bc-dropdown-loading">No subfolders</div>`;
        return;
      }

      folders.forEach(folder => {
        const fullPath = PathUtils.join(parentPath, folder.name);
        const isActive = this._currentPath === fullPath ||
                         this._currentPath.startsWith(fullPath + '\\');

        const item = document.createElement('div');
        item.className = 'bc-dropdown-item' + (isActive ? ' active' : '');
        item.innerHTML = `${this._icons.folder}<span>${folder.name}</span>`;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          Navigation.navigateTo(fullPath);
          this._closeDropdown();
        });
        dropdown.appendChild(item);
      });
    } catch (err) {
      dropdown.innerHTML = `<div class="bc-dropdown-loading">Error loading</div>`;
    }
  },

  _closeDropdown() {
    if (this._openDropdown) {
      this._openDropdown.el.remove();
      if (this._openDropdown.arrowEl) {
        this._openDropdown.arrowEl.classList.remove('open');
      }
      this._openDropdown = null;
    }
  },

  /* ── Edit mode ── */
  enableEdit() {
    this._editing = true;
    const bar        = document.getElementById('address-bar');
    const breadcrumb = document.getElementById('breadcrumb');
    const input      = document.getElementById('path-input');
    const locIcon    = document.getElementById('addr-loc-icon');

    bar.classList.add('editing');
    breadcrumb.style.display = 'none';
    if (locIcon) locIcon.style.display = 'none';
    input.style.display = 'block';

    const tab = TabManager.getActiveTab();
    input.value = tab ? tab.path : this._currentPath;
    input.focus();
    input.select();
  },

  disableEdit() {
    this._editing = false;
    const bar        = document.getElementById('address-bar');
    const breadcrumb = document.getElementById('breadcrumb');
    const input      = document.getElementById('path-input');
    const locIcon    = document.getElementById('addr-loc-icon');

    bar.classList.remove('editing');
    breadcrumb.style.display = '';
    if (locIcon) locIcon.style.display = '';
    input.style.display = 'none';
  }
};
