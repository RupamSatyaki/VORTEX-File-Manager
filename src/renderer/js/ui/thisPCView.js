/* This PC Custom View */
const ThisPCView = {
  _isActive: false,
  
  async render() {
    console.log('🖥️ Rendering This PC view');
    this._isActive = true;
    
    // Get special folders
    const folders = await this._getSpecialFolders();
    
    // Get drives
    const drives = await this._getDrives();
    
    // Hide all file list containers
    document.getElementById('file-grid').style.display = 'none';
    document.getElementById('file-list').style.display = 'none';
    document.getElementById('file-details').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('loading-state').style.display = 'none';
    
    // Create custom This PC view
    const container = document.getElementById('file-list-container');
    
    // Remove existing This PC view if any
    const existing = document.getElementById('thispc-view');
    if (existing) existing.remove();
    
    const view = document.createElement('div');
    view.id = 'thispc-view';
    view.className = 'thispc-view';
    
    view.innerHTML = `
      <div class="thispc-section">
        <h2 class="thispc-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Folders
        </h2>
        <div class="thispc-grid" id="folders-grid"></div>
      </div>
      
      <div class="thispc-section">
        <h2 class="thispc-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2"/></svg>
          Devices and drives
        </h2>
        <div class="thispc-grid" id="drives-grid"></div>
      </div>
    `;
    
    container.appendChild(view);
    
    // Render folders
    this._renderFolders(folders);
    
    // Render drives
    this._renderDrives(drives);
    
    // Update footer - only for This PC view
    document.getElementById('selection-info').textContent = `${folders.length + drives.length} items`;
    document.getElementById('drive-info').textContent = '';
    document.getElementById('storage-fill').style.width = '0%';
  },
  
  markInactive() {
    this._isActive = false;
  },
  
  isActive() {
    return this._isActive;
  },
  
  async refreshDrives() {
    if (!this._isActive) return;
    
    console.log('🔄 Refreshing drives in This PC view...');
    
    // Check if drives-grid exists
    const drivesGrid = document.getElementById('drives-grid');
    if (!drivesGrid) {
      console.warn('⚠️ drives-grid not found, This PC view may not be active');
      return;
    }
    
    const drives = await this._getDrives();
    this._renderDrives(drives);
    
    // Update item count
    const foldersGrid = document.getElementById('folders-grid');
    const foldersCount = foldersGrid ? foldersGrid.children.length : 0;
    const selectionInfo = document.getElementById('selection-info');
    if (selectionInfo) {
      selectionInfo.textContent = `${foldersCount + drives.length} items`;
    }
  },
  
  async _getSpecialFolders() {
    // Fetch all paths first
    const desktop = await IPC.invoke('fs:getSpecialPath', 'desktop');
    const documents = await IPC.invoke('fs:getSpecialPath', 'documents');
    const downloads = await IPC.invoke('fs:getSpecialPath', 'downloads');
    const pictures = await IPC.invoke('fs:getSpecialPath', 'pictures');
    const music = await IPC.invoke('fs:getSpecialPath', 'music');
    const videos = await IPC.invoke('fs:getSpecialPath', 'videos');
    
    return [
      { 
        name: 'Desktop', 
        path: desktop,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        color: '#3b82f6'
      },
      { 
        name: 'Documents', 
        path: documents,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        color: '#3b82f6'
      },
      { 
        name: 'Downloads', 
        path: downloads,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        color: '#22c55e'
      },
      { 
        name: 'Pictures', 
        path: pictures,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        color: '#8b5cf6'
      },
      { 
        name: 'Music', 
        path: music,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
        color: '#06b6d4'
      },
      { 
        name: 'Videos', 
        path: videos,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
        color: '#ec4899'
      },
    ];
  },
  
  async _getDrives() {
    const result = await IPC.invoke('fs:getDrives');
    console.log('🖥️ Drives result:', result);
    if (!result.success) return [];
    
    const drives = result.drives.map(d => {
      const isPortable = d.isPortable || d.type === 'portable';
      return {
        letter: d.letter,
        path: d.path || d.letter, // Use path if available (for MTP devices)
        size: d.size,
        freeSpace: d.freeSpace,
        type: d.type || 'drive',
        isPortable: isPortable,
        icon: isPortable 
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="10" ry="6"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2"/></svg>`,
        color: isPortable ? '#ec4899' : '#f59e0b'
      };
    });
    
    console.log('🖥️ Mapped drives:', drives);
    return drives;
  },
  
  _renderFolders(folders) {
    const grid = document.getElementById('folders-grid');
    grid.innerHTML = '';
    
    folders.forEach(folder => {
      const card = document.createElement('div');
      card.className = 'thispc-card';
      card.innerHTML = `
        <div class="thispc-card-icon" style="color:${folder.color}">${folder.icon}</div>
        <div class="thispc-card-info">
          <div class="thispc-card-name">${folder.name}</div>
          <div class="thispc-card-path">${folder.path}</div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        Navigation.navigateTo(folder.path);
      });
      
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Show context menu for folder
      });
      
      grid.appendChild(card);
    });
  },
  
  _renderDrives(drives) {
    const grid = document.getElementById('drives-grid');
    if (!grid) {
      console.warn('⚠️ drives-grid element not found');
      return;
    }
    
    grid.innerHTML = '';
    
    drives.forEach(drive => {
      const isPortable = drive.isPortable || drive.type === 'portable';
      const usedPct = drive.size > 0 ? Math.round(((drive.size - drive.freeSpace) / drive.size) * 100) : 0;
      const freeStr = drive.size > 0 ? FormatUtils.formatSize(drive.freeSpace) + ' free of ' + FormatUtils.formatSize(drive.size) : (isPortable ? 'Portable Device' : 'Unknown');
      
      let barClass = 'green';
      if (usedPct >= 90) barClass = 'red';
      else if (usedPct >= 70) barClass = 'orange';
      
      // Different icon for portable devices
      const icon = isPortable 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="10" ry="6"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2"/></svg>`;
      
      const color = isPortable ? '#ec4899' : '#f59e0b';
      
      const card = document.createElement('div');
      card.className = 'thispc-card';
      card.innerHTML = `
        <div class="thispc-card-icon" style="color:${color}">${icon}</div>
        <div class="thispc-card-info">
          <div class="thispc-card-name">${drive.letter}</div>
          <div class="thispc-card-path">${freeStr}</div>
          ${drive.size > 0 ? `
            <div class="thispc-drive-bar">
              <div class="thispc-drive-fill ${barClass}" style="width:${usedPct}%"></div>
            </div>
          ` : ''}
        </div>
      `;
      
      // Click handler for both drives and portable devices
      card.addEventListener('click', () => {
        const pathToOpen = drive.path || drive.letter;
        console.log('🖱️ Device clicked:', drive.letter, 'Path:', pathToOpen, 'IsPortable:', isPortable);
        Navigation.navigateTo(pathToOpen);
      });
      
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Show context menu for drive
      });
      
      grid.appendChild(card);
    });
  }
};
