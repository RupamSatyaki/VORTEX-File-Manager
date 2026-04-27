/* Header Component */
const Header = {
  init() {
    // Navigation
    document.getElementById('btn-back').addEventListener('click', () => Navigation.goBack());
    document.getElementById('btn-forward').addEventListener('click', () => Navigation.goForward());
    document.getElementById('btn-up').addEventListener('click', () => Navigation.goUp());
    document.getElementById('btn-refresh').addEventListener('click', () => Navigation.refresh());

    // View toggles
    document.getElementById('btn-view-grid').addEventListener('click', () => this.setView('grid'));
    document.getElementById('btn-view-list').addEventListener('click', () => this.setView('list'));
    document.getElementById('btn-view-details').addEventListener('click', () => this.setView('details'));
    document.getElementById('btn-dual-pane').addEventListener('click', () => App.toggleDualPane());

    // Window controls (macOS-style)
    document.getElementById('btn-close').addEventListener('click', () => IPC.send('window:close'));
    document.getElementById('btn-min').addEventListener('click', () => IPC.send('window:minimize'));
    document.getElementById('btn-max').addEventListener('click', () => IPC.send('window:maximize'));

    // Toolbar: New Folder / New File
    document.getElementById('btn-new-folder').addEventListener('click', () => {
      const tab = TabManager.getActiveTab();
      if (tab && tab.path) ContextMenu._newFolder(tab.path);
    });
    document.getElementById('btn-new-file').addEventListener('click', () => {
      const tab = TabManager.getActiveTab();
      if (tab && tab.path) ContextMenu._newFile(tab.path);
    });

    // Navigation state
    Events.on('navigation:changed', ({ canBack, canForward, canUp }) => {
      document.getElementById('btn-back').disabled = !canBack;
      document.getElementById('btn-forward').disabled = !canForward;
      document.getElementById('btn-up').disabled = !canUp;
    });
  },

  setView(view) {
    document.querySelectorAll('.view-btn[id^="btn-view"]').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-view-' + view);
    if (btn) btn.classList.add('active');
    App.setView(view);
  }
};
