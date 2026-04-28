/* Preview Header Component */
const PreviewHeader = {
  render(file, currentIndex, totalImages) {
    const fileName = this._escapeHtml(file.name);
    const counter = totalImages > 1 ? `<span class="preview-counter">${currentIndex + 1} of ${totalImages}</span>` : '';

    return `
      <div class="preview-header">
        <div class="preview-header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Preview</span>
          ${counter}
        </div>
        <button class="preview-close-btn" title="Close (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="preview-filename">
        <span title="${fileName}">${fileName}</span>
      </div>
      ${totalImages > 1 ? `
        <div class="preview-nav-bar">
          <button class="preview-nav-btn preview-nav-prev" title="Previous (←)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <span>Previous</span>
          </button>
          <button class="preview-nav-btn preview-nav-next" title="Next (→)">
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      ` : ''}
    `;
  },

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }
};
