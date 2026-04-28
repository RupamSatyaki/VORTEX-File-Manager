/* Keyboard Shortcuts */
const Shortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Navigation
      if (e.key === 'F5') { e.preventDefault(); Navigation.refresh(); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); Navigation.goBack(); }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); Navigation.goForward(); }
      if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); Navigation.goUp(); }

      // Tabs
      if (ctrl && e.key === 't') { e.preventDefault(); TabManager.createTab(); }
      if (ctrl && e.key === 'w') { e.preventDefault(); TabManager.closeTab(TabManager._activeId); }

      // Selection
      if (ctrl && e.key === 'a') { e.preventDefault(); Selection.selectAll(); }
      if (e.key === 'Escape') { Selection.deselectAll(); }

      // File ops
      if (ctrl && e.key === 'c') { e.preventDefault(); CopyPaste.copy(Selection.getSelected()); }
      if (ctrl && e.key === 'x') { e.preventDefault(); CopyPaste.cut(Selection.getSelected()); }
      if (ctrl && e.key === 'v') { e.preventDefault(); CopyPaste.paste(TabManager.getActiveTab()?.path); }
      if (e.key === 'Delete') {
        const sel = Selection.getSelected();
        if (sel.length) ContextMenu._delete(sel);
      }
      if (e.key === 'F2') {
        const sel = Selection.getSelected();
        if (sel.length === 1) ContextMenu._rename(sel[0]);
      }

      // Search
      if (ctrl && e.key === 'f') { e.preventDefault(); document.getElementById('search-input').focus(); }

      // Address bar
      if (ctrl && e.key === 'l') { e.preventDefault(); AddressBar.enableEdit(); }

      // View
      if (ctrl && e.key === '1') { e.preventDefault(); Header.setView('grid'); }
      if (ctrl && e.key === '2') { e.preventDefault(); Header.setView('list'); }
      if (ctrl && e.key === '3') { e.preventDefault(); Header.setView('details'); }

      // Sidebar
      if (ctrl && e.key === 'b') { e.preventDefault(); App.toggleSidebar(); }

      // Bookmark
      if (ctrl && e.key === 'd') { e.preventDefault(); Bookmarks.addCurrent(); }

      // New File / Folder
      if (ctrl && shift && e.key === 'N') {
        e.preventDefault();
        const tab = TabManager.getActiveTab();
        if (tab && tab.path) ContextMenu._newFolder(tab.path);
      }
      if (ctrl && !shift && e.key === 'n') {
        e.preventDefault();
        const tab = TabManager.getActiveTab();
        if (tab && tab.path) ContextMenu._newFile(tab.path);
      }

      // Image Preview with Space key
      if (e.key === ' ' || e.key === 'Spacebar') {
        const selected = Selection.getSelected();
        if (selected.length === 1) {
          const file = selected[0];
          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
          if (!file.isDirectory && imageExts.includes(file.ext?.toLowerCase())) {
            e.preventDefault();
            const files = FileList.getFiles();
            ImagePreview.open(file, files);
          }
        }
      }
    });
  }
};
