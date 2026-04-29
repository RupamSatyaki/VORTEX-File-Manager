/* PDF Preview — Viewer Component */

/* Set PDF.js worker path (must be set before any PDF operations) */
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'js/preview/pdf/lib/pdf.worker.min.js';
}

const PdfViewer = {
  _pdfDoc:      null,
  _currentPage: 1,
  _totalPages:  0,
  _zoom:        1.0,
  _rendering:   false,
  _canvas:      null,
  _ctx:         null,

  render() {
    return `
      <div class="pdf-viewer-wrap" id="pdf-viewer-wrap">
        <div class="pdf-canvas-container" id="pdf-canvas-container">
          <canvas id="pdf-canvas" class="pdf-canvas"></canvas>
          <div class="pdf-text-layer" id="pdf-text-layer"></div>
        </div>
        <div class="pdf-loading" id="pdf-loading">
          <div class="pdf-spinner"></div>
          <span>Loading PDF…</span>
        </div>
      </div>
    `;
  },

  /* Load PDF from URL */
  async load(url) {
    this._showLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument({
        url,
        cMapUrl:             'js/preview/pdf/lib/cmaps/',
        cMapPacked:          true,
      });

      this._pdfDoc    = await loadingTask.promise;
      this._totalPages = this._pdfDoc.numPages;
      this._currentPage = 1;

      this._canvas = document.getElementById('pdf-canvas');
      this._ctx    = this._canvas?.getContext('2d');

      await this.renderPage(this._currentPage);
      this._showLoading(false);

      return this._totalPages;
    } catch (err) {
      console.error('PDF load error:', err);
      this._showLoading(false);
      this._showError(err.message);
      return 0;
    }
  },

  /* Render a specific page */
  async renderPage(pageNum) {
    if (!this._pdfDoc || this._rendering) return;
    if (pageNum < 1 || pageNum > this._totalPages) return;

    this._rendering   = true;
    this._currentPage = pageNum;

    try {
      const page     = await this._pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this._zoom });

      const canvas  = document.getElementById('pdf-canvas');
      const ctx     = canvas?.getContext('2d');
      if (!canvas || !ctx) { this._rendering = false; return; }

      /* Scale for device pixel ratio (sharp on HiDPI) */
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = viewport.width  * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width  = viewport.width  + 'px';
      canvas.style.height = viewport.height + 'px';
      ctx.scale(dpr, dpr);

      await page.render({ canvasContext: ctx, viewport }).promise;

      /* Update page counter in toolbar */
      const input = document.getElementById('pdf-page-input');
      if (input) input.value = pageNum;

    } catch (err) {
      console.error('PDF render error:', err);
    }

    this._rendering = false;
  },

  /* Navigation */
  async nextPage() {
    if (this._currentPage < this._totalPages) {
      await this.renderPage(this._currentPage + 1);
      return this._currentPage;
    }
    return this._currentPage;
  },

  async prevPage() {
    if (this._currentPage > 1) {
      await this.renderPage(this._currentPage - 1);
      return this._currentPage;
    }
    return this._currentPage;
  },

  async goToPage(num) {
    const n = Math.max(1, Math.min(num, this._totalPages));
    await this.renderPage(n);
    return this._currentPage;
  },

  /* Zoom */
  async zoomIn() {
    this._zoom = Math.min(3.0, this._zoom + 0.25);
    await this.renderPage(this._currentPage);
    this._updateZoomLabel();
  },

  async zoomOut() {
    this._zoom = Math.max(0.25, this._zoom - 0.25);
    await this.renderPage(this._currentPage);
    this._updateZoomLabel();
  },

  async fitWidth() {
    const wrap = document.getElementById('pdf-viewer-wrap');
    if (!wrap || !this._pdfDoc) return;

    const page     = await this._pdfDoc.getPage(this._currentPage);
    const viewport = page.getViewport({ scale: 1.0 });
    const wrapW    = wrap.clientWidth - 48; /* padding */
    this._zoom     = wrapW / viewport.width;
    await this.renderPage(this._currentPage);
    this._updateZoomLabel();
  },

  _updateZoomLabel() {
    const label = document.getElementById('pdf-zoom-label');
    if (label) label.textContent = Math.round(this._zoom * 100) + '%';
  },

  _showLoading(show) {
    const el = document.getElementById('pdf-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  },

  _showError(msg) {
    const container = document.getElementById('pdf-canvas-container');
    if (container) {
      container.innerHTML = `
        <div class="pdf-error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Failed to load PDF</span>
          <small>${msg}</small>
        </div>
      `;
    }
  },

  /* Keyboard scroll */
  setupKeyScroll() {
    const wrap = document.getElementById('pdf-viewer-wrap');
    if (!wrap) return;
    wrap.addEventListener('wheel', async (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) await this.zoomIn();
        else await this.zoomOut();
      }
    }, { passive: false });
  },

  destroy() {
    if (this._pdfDoc) {
      this._pdfDoc.destroy();
      this._pdfDoc = null;
    }
    this._currentPage = 1;
    this._totalPages  = 0;
    this._zoom        = 1.0;
    this._rendering   = false;
    this._canvas      = null;
    this._ctx         = null;
  },

  getPage()       { return this._currentPage; },
  getTotalPages() { return this._totalPages; },
  getZoom()       { return this._zoom; },
};
