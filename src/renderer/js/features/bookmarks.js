/* Bookmarks */
const Bookmarks = {
  _bookmarks: [],

  load() {
    this._bookmarks = Storage.get('bookmarks') || [];
  },

  save() {
    Storage.set('bookmarks', this._bookmarks);
    Sidebar.renderBookmarks(this._bookmarks);
  },

  addCurrent() {
    const tab = TabManager.getActiveTab();
    if (!tab || !tab.path) return;
    const name = prompt('Bookmark name:', PathUtils.getBasename(tab.path) || tab.path);
    if (!name) return;
    this._bookmarks.push({ id: Date.now().toString(), name, path: tab.path });
    this.save();
    Footer.showStatus('Bookmark added', 'success');
  },

  remove(id) {
    this._bookmarks = this._bookmarks.filter(b => b.id !== id);
    this.save();
  }
};
