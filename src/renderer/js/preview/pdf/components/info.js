/* PDF Preview — Info Panel Component */
const PdfInfo = {
  render(file) {
    const size = FormatUtils.formatSize(file.size);
    const date = FormatUtils.formatDate
      ? FormatUtils.formatDate(file.modified)
      : new Date(file.modified).toLocaleDateString();

    return `
      <div class="pdf-info">
        <div class="pdf-info-title">File Info</div>

        <div class="pdf-info-row">
          <span class="pdf-info-label">Pages</span>
          <span class="pdf-info-value" id="pdf-info-pages">Loading…</span>
        </div>
        <div class="pdf-info-row">
          <span class="pdf-info-label">Size</span>
          <span class="pdf-info-value">${size}</span>
        </div>
        <div class="pdf-info-row" id="pdf-info-author-row" style="display:none">
          <span class="pdf-info-label">Author</span>
          <span class="pdf-info-value" id="pdf-info-author">—</span>
        </div>
        <div class="pdf-info-row" id="pdf-info-title-row" style="display:none">
          <span class="pdf-info-label">Title</span>
          <span class="pdf-info-value" id="pdf-info-title-val">—</span>
        </div>
        <div class="pdf-info-row">
          <span class="pdf-info-label">Modified</span>
          <span class="pdf-info-value">${date}</span>
        </div>
        <div class="pdf-info-row pdf-info-path-row">
          <span class="pdf-info-label">Path</span>
          <button class="pdf-copy-path-btn" id="pdf-copy-path" title="Copy path">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <div class="pdf-info-path">${this._escape(file.path)}</div>
      </div>

      <!-- Actions -->
      <div class="pdf-actions">
        <div class="pdf-info-title">Actions</div>

        <button class="pdf-action-btn pdf-action-open">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open in Reader
        </button>

        <button class="pdf-action-btn pdf-action-folder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Show in Folder
        </button>

        <div class="pdf-actions-divider"></div>

        <button class="pdf-action-btn pdf-action-delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
      </div>
    `;
  },

  /* Update after PDF loaded */
  updateMeta(totalPages, metadata) {
    const pagesEl = document.getElementById('pdf-info-pages');
    if (pagesEl) pagesEl.textContent = totalPages;

    if (metadata?.info) {
      const { Author, Title } = metadata.info;
      if (Author) {
        const row = document.getElementById('pdf-info-author-row');
        const val = document.getElementById('pdf-info-author');
        if (row) row.style.display = '';
        if (val) val.textContent = Author;
      }
      if (Title) {
        const row = document.getElementById('pdf-info-title-row');
        const val = document.getElementById('pdf-info-title-val');
        if (row) row.style.display = '';
        if (val) val.textContent = Title;
      }
    }
  },

  _escape(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
