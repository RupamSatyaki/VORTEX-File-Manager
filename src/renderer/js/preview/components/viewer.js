/* Preview Viewer Component - Simple Image Display */
const PreviewViewer = {
  render(file) {
    const imagePath = `file:///${file.path.replace(/\\/g, '/')}`;

    // Setup image load event after render
    setTimeout(() => {
      this._setupImageLoad();
    }, 100);

    return `
      <div class="preview-image-wrapper">
        <img 
          src="${imagePath}" 
          alt="${this._escapeHtml(file.name)}"
          class="preview-image"
          id="preview-image"
        >
      </div>
    `;
  },

  _setupImageLoad() {
    const image = document.getElementById('preview-image');
    if (!image) {
      console.warn('Preview image element not found');
      return;
    }

    // If image is already loaded
    if (image.complete && image.naturalWidth > 0) {
      console.log('Image already loaded:', image.naturalWidth, 'x', image.naturalHeight);
      PreviewInfo.updateDimensions(image.naturalWidth, image.naturalHeight);
      return;
    }

    // Wait for image to load
    image.addEventListener('load', () => {
      console.log('Image loaded:', image.naturalWidth, 'x', image.naturalHeight);
      PreviewInfo.updateDimensions(image.naturalWidth, image.naturalHeight);
    });

    image.addEventListener('error', (e) => {
      console.error('Failed to load image:', e);
      PreviewInfo.updateDimensions(0, 0);
    });
  },

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }
};
