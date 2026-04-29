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
    ImagePreview.init();
    PreviewIntegration.init();
    VideoPreview.init();
    VideoPreviewIntegration.init();
    PdfPreview.init();
    PdfPreviewIntegration.init();
    
    // Setup drive monitoring
    this.setupDriveMonitoring();

    // Open This PC by default (special view)
    const savedTabs = Storage.get('tabs');
    if (savedTabs && savedTabs.length > 0) {
      await TabManager.restoreTabs(savedTabs);
    } else {
      // Open with "This PC" view
      TabManager.createTab('thispc://');
    }
  },
  
  setupDriveMonitoring() {
    console.log('🔧 Setting up drive monitoring...');
    
    if (typeof IPC.onDrivesChanged !== 'function') {
      console.warn('⚠️ Drive monitoring not available');
      return;
    }
    
    IPC.onDrivesChanged((data) => {
      console.log('💿 Drives changed:', data);
      
      // Show notification
      if (data.added.length > 0) {
        const deviceName = data.added.join(', ');
        const isPhone = deviceName.includes('📱');
        Footer.showStatus(isPhone ? `Device connected: ${deviceName.replace('📱 ', '')}` : `Drive connected: ${deviceName}`, 'success');
      }
      if (data.removed.length > 0) {
        const deviceName = data.removed.join(', ');
        const isPhone = deviceName.includes('📱');
        Footer.showStatus(isPhone ? `Device disconnected: ${deviceName.replace('📱 ', '')}` : `Drive disconnected: ${deviceName}`, 'info');
      }
      
      // Refresh This PC view if active
      if (ThisPCView.isActive()) {
        console.log('🔄 Refreshing This PC view...');
        ThisPCView.refreshDrives();
      }
      
      // Refresh sidebar drives
      if (typeof Sidebar.loadDrives === 'function') {
        Sidebar.loadDrives();
      }
    });
    
    console.log('✅ Drive monitoring setup complete');
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
