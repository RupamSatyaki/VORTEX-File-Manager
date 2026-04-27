/* App Initialization */
const App = {
  state: {
    currentView: 'grid',
    theme: 'dark',
    accentColor: 'blue',
    sidebarCollapsed: false,
  },

  async init() {
    this.loadSettings();
    this.applyTheme();

    // Init core UI
    Dialogs.init();
    Header.init();
    Sidebar.init();
    TabManager.init();
    AddressBar.init();
    FileList.init();
    Footer.init();
    ContextMenu.init();
    Search.init();

    // Init features
    Navigation.init();
    Selection.init();
    DragDrop.init();
    Shortcuts.init();
    Bookmarks.load();

    // Open This PC by default (special view)
    const savedTabs = Storage.get('tabs');
    if (savedTabs && savedTabs.length > 0) {
      await TabManager.restoreTabs(savedTabs);
    } else {
      // Open with "This PC" view
      TabManager.createTab('thispc://');
    }
  },

  loadSettings() {
    const s = Storage.get('settings');
    if (s) this.state = { ...this.state, ...s };
  },

  saveSettings() {
    Storage.set('settings', this.state);
  },

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
    document.documentElement.setAttribute('data-accent', this.state.accentColor);
  },

  setView(view) {
    this.state.currentView = view;
    this.saveSettings();
    FileList.setView(view);
  },

  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    this.saveSettings();
    Sidebar.toggle();
  },

  toggleDualPane() {
    Footer.showStatus('Dual pane coming soon!', 'info');
  }
};
