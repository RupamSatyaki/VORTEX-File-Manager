/* Image Preview Integration - Connect with FileList */
const PreviewIntegration = {
  init() {
    this._setupImageClickHandlers();
    console.log('🔗 PreviewIntegration initialized');
  },

  _setupImageClickHandlers() {
    // Listen for double-click on image files
    document.addEventListener('dblclick', (e) => {
      const fileItem = e.target.closest('.file-item-grid, .file-item-list, .details-row');
      if (!fileItem) return;

      const filePath = fileItem.dataset.path;
      if (!filePath) return;

      // Find the file in current file list
      const files = FileList.getFiles();
      const file = files.find(f => f.path === filePath);
      
      if (!file || file.isDirectory) return;

      // Check if it's an image
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      if (!imageExts.includes(file.ext?.toLowerCase())) return;

      // Prevent default file opening
      e.preventDefault();
      e.stopPropagation();

      // Open image preview
      ImagePreview.open(file, files);
    });

    // Also add context menu option for images
    this._addContextMenuOption();
  },

  _addContextMenuOption() {
    // Hook into context menu rendering
    const originalShowForFile = ContextMenu.showForFile;
    ContextMenu.showForFile = function(file, x, y) {
      originalShowForFile.call(this, file, x, y);
      
      // Add preview option for images
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      if (!file.isDirectory && imageExts.includes(file.ext?.toLowerCase())) {
        const menu = document.getElementById('context-menu');
        if (!menu) return;

        // Find the "Open" item and add preview after it
        const items = menu.querySelectorAll('.ctx-item');
        if (items.length > 0) {
          const previewItem = document.createElement('div');
          previewItem.className = 'ctx-item';
          previewItem.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Preview Image</span>
          `;
          
          previewItem.addEventListener('click', () => {
            const files = FileList.getFiles();
            ImagePreview.open(file, files);
            ContextMenu.hide();
          });

          // Insert after first item (Open)
          items[0].after(previewItem);
        }
      }
    };
  },

  // Method to open preview programmatically
  openPreview(file) {
    const files = FileList.getFiles();
    ImagePreview.open(file, files);
  }
};
