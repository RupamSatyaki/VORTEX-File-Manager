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

    if (addHistory) {
      this._history = this._history.slice(0, this._index + 1);
      this._history.push(normalized);
      this._index = this._history.length - 1;
    }

    this._emitNavState();
    Events.emit('navigation:pathChanged', { path: normalized });
    
    // Set tab label
    let label = PathUtils.getBasename(normalized) || normalized;
    if (normalized === 'thispc://') {
      label = 'This PC';
    } else if (normalized.startsWith('Computer\\')) {
      // Extract device name for portable devices
      label = normalized.replace('Computer\\', '').split('\\')[0];
    }
    
    TabManager.updateActiveTab({ path: normalized, label });
    await FileList.loadPath(normalized);
    AddressBar.render(normalized);
    Sidebar.setActivePath(normalized);
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
