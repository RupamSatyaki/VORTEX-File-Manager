/* Sidebar Component */
const Sidebar = {
  _collapsed: false,
  _refreshTimer: null,

  init() {
    // Collapse button
    document.getElementById('sidebar-toggle').addEventListener('click', () => this.toggle());

    // Section headers (expand/collapse)
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.dataset.section;
        const content = document.getElementById(section + '-content');
        if (!content) return;
        const isCollapsed = content.classList.toggle('collapsed');
        header.classList.toggle('collapsed', isCollapsed);
      });
    });

    // Subsection headers (expand/collapse)
    document.querySelectorAll('.sidebar-subsection-header').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        if (!content) return;
        const isCollapsed = content.classList.toggle('collapsed');
        header.classList.toggle('collapsed', isCollapsed);
      });
    });

    // Quick access items
    document.querySelectorAll('.sidebar-item[data-special]').forEach(item => {
      item.addEventListener('click', async () => {
        const name = item.dataset.special;
        const fullPath = await IPC.invoke('fs:getSpecialPath', name);
        Navigation.navigateTo(fullPath);
        this.setActive(item);
      });
    });

    // Add bookmark button
    document.getElementById('add-bookmark').addEventListener('click', () => Bookmarks.addCurrent());

    // Load drives
    this.loadDrives();

    // Auto-refresh drives every 30 seconds
    this._refreshTimer = setInterval(() => this.loadDrives(), 30000);

    // Load bookmarks
    this.loadBookmarks();

    // Sidebar resize
    this.initResize();

    // Restore collapsed state
    const collapsed = Storage.get('sidebarCollapsed');
    if (collapsed) this.toggle(true);
  },

  toggle(force) {
    const sidebar = document.getElementById('sidebar');
    this._collapsed = force !== undefined ? force : !this._collapsed;
    sidebar.classList.toggle('collapsed', this._collapsed);
    Storage.set('sidebarCollapsed', this._collapsed);
    
    // Update toggle button icon
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = this._collapsed 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
    }
  },

  setActive(el) {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
  },

  setActivePath(currentPath) {
    document.querySelectorAll('.sidebar-item[data-full-path]').forEach(item => {
      item.classList.toggle('active', item.dataset.fullPath === currentPath);
    });
  },

  async loadDrives() {
    const drivesContainer = document.getElementById('drives-content');
    const portableContainer = document.getElementById('portable-content');
    const result = await IPC.invoke('fs:getDrives');
    if (!result.success || !result.drives.length) return;

    // Separate logical drives and portable devices
    const logicalDrives = result.drives.filter(d => !d.isPortable);
    const portableDevices = result.drives.filter(d => d.isPortable);

    // Render Logical Drives
    drivesContainer.innerHTML = '';
    logicalDrives.forEach(drive => {
      this._renderDrive(drive, drivesContainer, true);
    });

    // Render Portable Devices
    portableContainer.innerHTML = '';
    portableDevices.forEach(device => {
      this._renderDrive(device, portableContainer, true);
    });
  },

  _renderDrive(drive, container) {
    const isPortable = drive.isPortable;
    const driveSvg = isPortable
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01"/><circle cx="17" cy="12" r="2"/></svg>`;

    const usedPct = drive.size > 0 ? Math.round(((drive.size - drive.freeSpace) / drive.size) * 100) : 0;
    const freeStr = drive.size > 0
      ? FormatUtils.formatSize(drive.freeSpace) + ' free'
      : '';

    // Color coding
    let barClass = 'green';
    if (usedPct >= 90) barClass = 'red';
    else if (usedPct >= 70) barClass = 'orange';

    const item = document.createElement('div');
    item.className = 'sidebar-item nested';
    item.dataset.fullPath = drive.path || drive.letter;
    item.innerHTML = `
      <span class="sidebar-item-icon" style="color:${isPortable ? '#3b82f6' : '#f59e0b'}">${driveSvg}</span>
      <span class="sidebar-item-label">${drive.letter}</span>
    `;
    item.addEventListener('click', () => {
      Navigation.navigateTo(drive.path || drive.letter);
      this.setActive(item);
    });
    container.appendChild(item);

    if (drive.size > 0) {
      const bar = document.createElement('div');
      bar.className = 'drive-bar-wrap nested';
      bar.innerHTML = `
        <div class="drive-bar-row">
          <div class="drive-bar">
            <div class="drive-bar-fill ${barClass}" style="width:${usedPct}%"></div>
          </div>
          <span style="font-size:10px;color:var(--text-tertiary)">${usedPct}%</span>
        </div>
        <span class="drive-bar-text">${freeStr}</span>
      `;
      container.appendChild(bar);
    }
  },

  loadBookmarks() {
    const bookmarks = Storage.get('bookmarks') || [];
    this.renderBookmarks(bookmarks);
  },

  renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmarks-content');
    const addBtn = document.getElementById('add-bookmark');
    container.innerHTML = '';

    const folderSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

    bookmarks.forEach(bm => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.dataset.fullPath = bm.path;
      item.innerHTML = `
        <span class="sidebar-item-icon" style="color:#f59e0b">${folderSvg}</span>
        <span class="sidebar-item-label">${bm.name}</span>
      `;
      item.addEventListener('click', () => {
        Navigation.navigateTo(bm.path);
        this.setActive(item);
      });
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Dialogs.showDeleteConfirm(
          [{ name: bm.name }],
          () => Bookmarks.remove(bm.id),
          'Remove bookmark'
        );
      });
      container.appendChild(item);
    });

    container.appendChild(addBtn);
  },

  initResize() {
    const handle = document.getElementById('sidebar-resize');
    const sidebar = document.getElementById('sidebar');
    let startX, startWidth;

    handle.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.classList.add('resizing');
      handle.classList.add('resizing');

      const onMove = (e) => {
        const newWidth = Math.max(60, Math.min(400, startWidth + e.clientX - startX));
        sidebar.style.width = newWidth + 'px';
      };
      const onUp = () => {
        document.body.classList.remove('resizing');
        handle.classList.remove('resizing');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        Storage.set('sidebarWidth', sidebar.offsetWidth);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Restore width
    const savedWidth = Storage.get('sidebarWidth');
    if (savedWidth) sidebar.style.width = savedWidth + 'px';
  }
};
