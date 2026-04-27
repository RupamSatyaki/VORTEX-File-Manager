/* ============================================================================
   VORTEX FILE MANAGER — MAIN ENTRY POINT
   Initialize all modules and start the app
   ============================================================================ */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌪️ Vortex File Manager starting...');
  
  // Initialize core modules
  App.init();
  
  console.log('✅ Vortex File Manager ready!');
});

// Handle window close
window.addEventListener('beforeunload', () => {
  // Save current state
  const activeTab = TabManager.getActiveTab();
  if (activeTab) {
    Storage.set('lastPath', activeTab.path);
  }
  
  // Save tabs
  TabManager.saveTabs();
  
  console.log('👋 Vortex File Manager closing...');
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
  // Show error notification
  Footer.showStatus('An error occurred', 'error');
});

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled rejection:', event.reason);
  Footer.showStatus('An error occurred', 'error');
});
