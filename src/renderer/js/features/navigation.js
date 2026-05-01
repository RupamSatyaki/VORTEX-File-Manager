/* Navigation */
const Navigation = {
  _history: [],
  _index: -1,

  init() {},

  async navigateTo(path, addHistory = true) {
    if (!path) return;
    
    console.log('🧭 Navigation.navigateTo called with path:', path);
    
    // Don't normalize special paths like thispc:// or Computer\ (portable devices)
    let normalized = path;
    if (!path.includes('://') && !path.startsWith('Computer\\')) {
      // Convert forward slashes to backslashes
      normalized = path.replace(/\//g, '\\');
      
      // Remove trailing backslashes EXCEPT for drive roots (e.g., C:\)
      // Drive root pattern: single letter followed by colon and backslash
      if (!/^[A-Za-z]:\\$/.test(normalized)) {
        normalized = normalized.replace(/\\+$/, '');
      }
      
      normalized = normalized || path;
    }
    
    console.log('🧭 Normalized path:', normalized);

    // Check if path is a file (not folder or special path)
    let targetPath = normalized;
    let fileToSelect = null;
    
    if (!normalized.includes('://') && !normalized.startsWith('Computer\\')) {
      // Check if it's a file
      const checkResult = await IPC.invoke('fs:stat', normalized);
      if (checkResult.success) {
        if (!checkResult.isDirectory) {
          // It's a file - navigate to parent and select file
          console.log('📄 Path is a file, navigating to parent folder');
          fileToSelect = normalized;
          targetPath = PathUtils.getParent(normalized);
          console.log('📁 Parent folder:', targetPath);
          console.log('📄 File to select:', fileToSelect);
        }
      }
    }

    if (addHistory) {
      this._history = this._history.slice(0, this._index + 1);
      this._history.push(targetPath);
      this._index = this._history.length - 1;
    }

    this._emitNavState();
    Events.emit('navigation:pathChanged', { path: targetPath });
    
    // Set tab label
    let label = PathUtils.getBasename(targetPath) || targetPath;
    if (targetPath === 'thispc://') {
      label = 'This PC';
    } else if (targetPath === 'recyclebin://') {
      label = 'Recycle Bin';
    } else if (targetPath.startsWith('Computer\\')) {
      label = targetPath.replace('Computer\\', '').split('\\')[0];
    }
    
    TabManager.updateActiveTab({ path: targetPath, label });
    await FileList.loadPath(targetPath);
    AddressBar.render(targetPath);
    Sidebar.setActivePath(targetPath);
    
    // Select the file if path was a file
    if (fileToSelect) {
      setTimeout(() => {
        this._selectFileByPath(fileToSelect);
      }, 100);
    }
  },

  _selectFileByPath(filePath) {
    console.log('🎯 Selecting file:', filePath);
    
    // Find the file element
    const fileElements = document.querySelectorAll('[data-path]');
    for (const el of fileElements) {
      if (el.dataset.path === filePath) {
        // Find the file object
        const files = FileList.getFiles();
        const file = files.find(f => f.path === filePath);
        
        if (file) {
          // Deselect all first
          Selection.deselectAll();
          
          // Select this file
          Selection.selectOnly(el, file);
          
          // Scroll into view
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          
          console.log('✅ File selected:', file.name);
          Footer.showStatus(`Selected: ${file.name}`, 'success');
        }
        break;
      }
    }
  },

  goBack() {
    if (this._index > 0) {
      this._index--;
      this.navigateTo(this._history[this._index], false);
    }
  },

  goForward() {
    if (this._index < this._history.length - 1) {
      this._index++;
      this.navigateTo(this._history[this._index], false);
    }
  },

  async goUp() {
    const tab = TabManager.getActiveTab();
    if (!tab || !tab.path) return;
    const parent = PathUtils.getParent(tab.path);
    if (parent && parent !== tab.path) this.navigateTo(parent);
  },

  refresh() {
    const tab = TabManager.getActiveTab();
    if (tab && tab.path) FileList.loadPath(tab.path);
  },

  _emitNavState() {
    Events.emit('navigation:changed', {
      canBack: this._index > 0,
      canForward: this._index < this._history.length - 1,
      canUp: true
    });
  }
};
