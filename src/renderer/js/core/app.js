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

    // Load default app settings from main process
    await this.loadDefaultApps();

    // Listen for file-association navigation from main process
    this.setupFileAssociationHandler();

    // Wire settings button now that DOM is ready
    this._wireSettingsBtn();

    // Open This PC by default (special view)
    const savedTabs = Storage.get('tabs');
    if (savedTabs && savedTabs.length > 0) {
      await TabManager.restoreTabs(savedTabs);
    } else {
      // Open with "This PC" view
      TabManager.createTab('thispc://');
    }
  },

  async loadDefaultApps() {
    try {
      const defaults = await window.vortexAPI.getDefaultApps();
      Storage.set('defaultApps', defaults);
    } catch (e) {
      /* fallback — use vortex for everything */
      Storage.set('defaultApps', { video: 'vortex', audio: 'vortex', pdf: 'vortex' });
    }
  },

  setupFileAssociationHandler() {
    if (typeof window.vortexAPI?.onNavigateToFile !== 'function') return;
    window.vortexAPI.onNavigateToFile((filePath) => {
      /* Navigate to parent folder and select the file */
      const parentPath = filePath.substring(0, Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/')) );
      if (parentPath) {
        Navigation.navigateTo(parentPath);
        /* After navigation, select the file */
        Events.once('navigation:pathChanged', () => {
          setTimeout(() => {
            const el = document.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
            if (el) {
              const file = FileList.getFiles().find(f => f.path === filePath);
              if (file) Selection.selectOnly(el, file);
              el.scrollIntoView({ block: 'center' });
            }
          }, 300);
        });
      }
    });
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

  _wireSettingsBtn() {
    const btn = document.getElementById('sidebar-settings-btn');
    if (btn && !btn._wired) {
      btn._wired = true;
      btn.addEventListener('click', () => SettingsDialog.show());
    }
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
