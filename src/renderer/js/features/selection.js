/* Selection Manager */
const Selection = {
  _selected: new Map(), // path → file
  _lastEl: null,

  init() {},

  handleClick(el, file, e) {
    if (e.ctrlKey) {
      this._toggle(el, file);
    } else if (e.shiftKey && this._lastEl) {
      this._rangeSelect(el, file);
    } else {
      this.selectOnly(el, file);
    }
    this._lastEl = el;
    this._emit();
  },

  selectOnly(el, file) {
    document.querySelectorAll('.file-item-grid.selected, .file-item-list.selected, .file-details-row.selected')
      .forEach(e => e.classList.remove('selected'));
    this._selected.clear();
    el.classList.add('selected');
    this._selected.set(file.path, file);
    this._lastEl = el;
    this._emit();
  },

  _toggle(el, file) {
    if (this._selected.has(file.path)) {
      this._selected.delete(file.path);
      el.classList.remove('selected');
    } else {
      this._selected.set(file.path, file);
      el.classList.add('selected');
    }
  },

  _rangeSelect(endEl, endFile) {
    const allEls = [...document.querySelectorAll('.file-item-grid, .file-item-list, .file-details-row')];
    const startIdx = allEls.indexOf(this._lastEl);
    const endIdx = allEls.indexOf(endEl);
    if (startIdx === -1 || endIdx === -1) return;
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    allEls.slice(from, to + 1).forEach(el => {
      el.classList.add('selected');
      const path = el.dataset.path;
      const file = FileList.getFiles().find(f => f.path === path);
      if (file) this._selected.set(path, file);
    });
  },

  selectAll() {
    this._selected.clear();
    document.querySelectorAll('.file-item-grid, .file-item-list, .file-details-row').forEach(el => {
      el.classList.add('selected');
      const path = el.dataset.path;
      const file = FileList.getFiles().find(f => f.path === path);
      if (file) this._selected.set(path, file);
    });
    this._emit();
  },

  deselectAll() {
    document.querySelectorAll('.file-item-grid.selected, .file-item-list.selected, .file-details-row.selected')
      .forEach(e => e.classList.remove('selected'));
    this._selected.clear();
    this._emit();
  },

  getSelected() {
    return [...this._selected.values()];
  },

  _emit() {
    const files = this.getSelected();
    const size = files.reduce((s, f) => s + (f.size || 0), 0);
    Events.emit('selection:changed', { count: files.length, size });
  }
};
