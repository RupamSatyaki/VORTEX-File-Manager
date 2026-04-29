/* PDF Preview — Integration with FileList & ContextMenu */
const PdfPreviewIntegration = {
  init() {
    this._setupDoubleClick();
    this._setupSpaceKey();
    this._setupContextMenu();
    console.log('🔗 PdfPreviewIntegration initialized');
  },

  /* Double-click on PDF → open preview */
  _setupDoubleClick() {
    document.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.file-item-grid, .file-item-list, .details-row');
      if (!item) return;

      const filePath = item.dataset.path;
      if (!filePath) return;

      const files = FileList.getFiles();
      const file  = files.find(f => f.path === filePath);
      if (!file || file.isDirectory) return;
      if (!PdfPreview.isPdf(file)) return;

      e.preventDefault();
      e.stopPropagation();
      PdfPreview.open(file, files);
    });
  },

  /* Space key on selected PDF → open preview */
  _setupSpaceKey() {
    document.addEventListener('keydown', (e) => {
      if (PdfPreview.isOpen()) return;
      if (e.key !== ' ') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const selected = Selection.getSelected();
      if (selected.length !== 1) return;
      if (!PdfPreview.isPdf(selected[0])) return;

      e.preventDefault();
      const files = FileList.getFiles();
      PdfPreview.open(selected[0], files);
    });
  },

  /* Context menu: "Preview PDF" option */
  _setupContextMenu() {
    const originalShowForFile = ContextMenu.showForFile?.bind(ContextMenu);
    if (!originalShowForFile) return;

    ContextMenu.showForFile = function(file, x, y) {
      originalShowForFile(file, x, y);
      if (!PdfPreview.isPdf(file)) return;

      const menu = document.getElementById('context-menu');
      if (!menu) return;

      const items = menu.querySelectorAll('.ctx-item');
      if (!items.length) return;

      const previewItem = document.createElement('div');
      previewItem.className = 'ctx-item';
      previewItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span>Preview PDF</span>
      `;
      previewItem.addEventListener('click', () => {
        const files = FileList.getFiles();
        PdfPreview.open(file, files);
        ContextMenu.hide();
      });

      items[0].after(previewItem);
    };
  }
};
