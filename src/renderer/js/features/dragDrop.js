/* Drag & Drop Feature */
const DragDrop = {
  _draggedItems: [],
  _draggedPaths: [],
  _isDragging: false,
  _dragStartPos: { x: 0, y: 0 },
  _dragThreshold: 5,

  init() {
    this.setupFileItemDrag();
    this.setupFolderDrop();
    this.setupExternalDrop();
    console.log('✅ Drag & Drop initialized');
  },

  // ── Setup drag on file items ────────────────────────────
  setupFileItemDrag() {
    // Use event delegation on containers
    const containers = ['file-grid', 'file-list', 'file-details'];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.file-item-grid, .file-item-list, .details-row');
        if (!item || e.button !== 0) return;

        // Don't drag if clicking on input or button
        if (e.target.closest('input, button')) return;

        this._dragStartPos = { x: e.clientX, y: e.clientY };
        
        const onMove = (e) => {
          const dx = Math.abs(e.clientX - this._dragStartPos.x);
          const dy = Math.abs(e.clientY - this._dragStartPos.y);
          
          if (dx > this._dragThreshold || dy > this._dragThreshold) {
            this._startDrag(item, e);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          }
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  },

  _startDrag(item, e) {
    // Get selected items
    const selected = Selection.getSelected();
    if (selected.length === 0) return;

    // If dragged item is not in selection, select only it
    const itemPath = item.dataset.path;
    const isInSelection = selected.some(f => f.path === itemPath);
    if (!isInSelection) {
      const file = FileList.getFiles().find(f => f.path === itemPath);
      if (file) {
        Selection.selectOnly(item, file);
        this._draggedItems = [file];
      }
    } else {
      this._draggedItems = selected;
    }

    this._draggedPaths = this._draggedItems.map(f => f.path);
    this._isDragging = true;

    console.log('🎯 Drag started:', this._draggedItems.length, 'items');

    // Create drag ghost
    this._createDragGhost(e);

    // Add dragging class to items
    document.querySelectorAll('.file-item-grid, .file-item-list, .details-row').forEach(el => {
      if (this._draggedPaths.includes(el.dataset.path)) {
        el.classList.add('dragging');
      }
    });

    // Setup drag events
    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);
  },

  _createDragGhost(e) {
    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost';
    ghost.className = 'drag-ghost';
    
    const count = this._draggedItems.length;
    const firstItem = this._draggedItems[0];
    
    ghost.innerHTML = `
      <div class="drag-ghost-icon" style="color:${IconMapper.getColor(firstItem)}">
        ${IconMapper.getSvg(firstItem)}
      </div>
      <div class="drag-ghost-text">
        <div class="drag-ghost-name">${this._esc(firstItem.name)}</div>
        ${count > 1 ? `<div class="drag-ghost-count">+${count - 1} more</div>` : ''}
      </div>
    `;

    document.body.appendChild(ghost);
    this._updateGhostPosition(e);
  },

  _onDragMove: function(e) {
    if (!DragDrop._isDragging) return;
    
    DragDrop._updateGhostPosition(e);
    
    // Check if hovering over a folder
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const folderItem = target?.closest('.file-item-grid, .file-item-list, .details-row');
    
    // Remove previous highlights
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    
    if (folderItem) {
      const path = folderItem.dataset.path;
      const file = FileList.getFiles().find(f => f.path === path);
      
      // Only highlight folders that are not being dragged
      if (file && file.isDirectory && !DragDrop._draggedPaths.includes(path)) {
        folderItem.classList.add('drop-target');
      }
    }
  },

  _onDragEnd: function(e) {
    if (!DragDrop._isDragging) return;
    
    console.log('🎯 Drag ended');
    
    // Find drop target
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const folderItem = target?.closest('.file-item-grid, .file-item-list, .details-row');
    
    let dropPath = null;
    
    if (folderItem) {
      const path = folderItem.dataset.path;
      const file = FileList.getFiles().find(f => f.path === path);
      
      if (file && file.isDirectory && !DragDrop._draggedPaths.includes(path)) {
        dropPath = path;
      }
    } else {
      // Dropped on empty area - use current directory
      const tab = TabManager.getActiveTab();
      if (tab && tab.path) {
        dropPath = tab.path;
      }
    }
    
    // Perform move operation
    if (dropPath) {
      DragDrop._performMove(dropPath);
    }
    
    // Cleanup
    DragDrop._cleanup();
  },

  _updateGhostPosition(e) {
    const ghost = document.getElementById('drag-ghost');
    if (ghost) {
      ghost.style.left = (e.clientX + 10) + 'px';
      ghost.style.top = (e.clientY + 10) + 'px';
    }
  },

  async _performMove(targetPath) {
    const count = this._draggedItems.length;
    console.log('📦 Moving', count, 'items to:', targetPath);
    
    Footer.showStatus(`Moving ${count} item${count !== 1 ? 's' : ''}...`, 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of this._draggedItems) {
      // Don't move to same location
      const currentParent = PathUtils.getParent(item.path);
      if (currentParent === targetPath) {
        console.log('⚠️ Skipping (same location):', item.name);
        continue;
      }
      
      const newPath = PathUtils.join(targetPath, item.name);
      
      // Check if destination already exists
      const exists = await IPC.invoke('fs:exists', newPath);
      if (exists) {
        console.warn('⚠️ Already exists:', newPath);
        failCount++;
        continue;
      }
      
      const result = await IPC.invoke('fs:move', item.path, newPath);
      if (result.success) {
        console.log('✅ Moved:', item.name);
        successCount++;
      } else {
        console.error('❌ Failed to move:', item.name, result.error);
        failCount++;
      }
    }
    
    // Show result
    if (successCount > 0) {
      Footer.showStatus(`Moved ${successCount} item${successCount !== 1 ? 's' : ''}`, 'success');
      Navigation.refresh();
    }
    
    if (failCount > 0) {
      Footer.showStatus(`Failed to move ${failCount} item${failCount !== 1 ? 's' : ''}`, 'error');
    }
  },

  _cleanup() {
    this._isDragging = false;
    this._draggedItems = [];
    this._draggedPaths = [];
    
    // Remove ghost
    const ghost = document.getElementById('drag-ghost');
    if (ghost) ghost.remove();
    
    // Remove classes
    document.querySelectorAll('.dragging, .drop-target').forEach(el => {
      el.classList.remove('dragging', 'drop-target');
    });
    
    // Remove listeners
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  },

  // ── Setup drop on folders ───────────────────────────────
  setupFolderDrop() {
    // Sidebar items
    document.addEventListener('dragover', (e) => {
      const sidebarItem = e.target.closest('.sidebar-item[data-full-path]');
      if (sidebarItem) {
        e.preventDefault();
        sidebarItem.classList.add('drop-target');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const sidebarItem = e.target.closest('.sidebar-item[data-full-path]');
      if (sidebarItem) {
        sidebarItem.classList.remove('drop-target');
      }
    });
  },

  // ── Setup external file drop ────────────────────────────
  setupExternalDrop() {
    const dropZone = document.getElementById('file-list-container');
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('external-drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('external-drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('external-drag-over');

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const tab = TabManager.getActiveTab();
      if (!tab || !tab.path) return;

      console.log('📥 External drop:', files.length, 'files');
      Footer.showStatus(`Copying ${files.length} file${files.length !== 1 ? 's' : ''}...`, 'info');

      let successCount = 0;
      for (const file of files) {
        const sourcePath = file.path;
        const destPath = PathUtils.join(tab.path, file.name);
        
        const result = await IPC.invoke('fs:copy', sourcePath, destPath);
        if (result.success) successCount++;
      }

      if (successCount > 0) {
        Footer.showStatus(`Copied ${successCount} file${successCount !== 1 ? 's' : ''}`, 'success');
        Navigation.refresh();
      }
    });
  },

  _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
