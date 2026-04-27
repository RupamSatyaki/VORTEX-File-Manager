/* Navigation */
const Navigation = {
  _history: [],
  _index: -1,

  init() {},

  async navigateTo(path, addHistory = true) {
    if (!path) return;
    const normalized = path.replace(/\//g, '\\').replace(/\\+$/, '') || path;

    if (addHistory) {
      this._history = this._history.slice(0, this._index + 1);
      this._history.push(normalized);
      this._index = this._history.length - 1;
    }

    this._emitNavState();
    Events.emit('navigation:pathChanged', { path: normalized });
    TabManager.updateActiveTab({ path: normalized, label: PathUtils.getBasename(normalized) || normalized });
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
