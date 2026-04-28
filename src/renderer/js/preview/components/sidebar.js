/* Preview Info Component - File Information */
const PreviewInfo = {
  render(file) {
    const fileSize = FormatUtils.formatSize(file.size);
    const fileDate = FormatUtils.formatDate(file.modified);
    const fileExt = file.ext ? file.ext.toUpperCase() : 'Unknown';

    return `
      <div class="preview-info">
        <div class="preview-info-row">
          <span class="preview-info-label">Type:</span>
          <span class="preview-info-value">${fileExt}</span>
        </div>
        <div class="preview-info-row">
          <span class="preview-info-label">Size:</span>
          <span class="preview-info-value">${fileSize}</span>
        </div>
        <div class="preview-info-row">
          <span class="preview-info-label">Dimensions:</span>
          <span class="preview-info-value" id="preview-dimensions">Loading...</span>
        </div>
        <div class="preview-info-row">
          <span class="preview-info-label">Modified:</span>
          <span class="preview-info-value">${fileDate}</span>
        </div>
      </div>
    `;
  },

  updateDimensions(width, height) {
    const dimensionsEl = document.getElementById('preview-dimensions');
    if (dimensionsEl) {
      if (width > 0 && height > 0) {
        dimensionsEl.textContent = `${width} × ${height}`;
        console.log('✅ Dimensions updated:', width, 'x', height);
      } else {
        dimensionsEl.textContent = 'Unknown';
        console.warn('⚠️ Invalid dimensions:', width, 'x', height);
      }
    } else {
      console.warn('⚠️ Dimensions element not found');
    }
  }
};
