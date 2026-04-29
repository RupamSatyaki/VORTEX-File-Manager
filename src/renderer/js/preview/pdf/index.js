/* ============================================================
   PDF PREVIEW — Main Controller
   ============================================================ */
const PdfPreview = {
  _isOpen:       false,
  _currentFile:  null,
  _currentIndex: -1,
  _allPdfs:      [],
  _panel:        null,
  _mediaPort:    null,

  EXTS: ['pdf'],

  init() {
    /* Set PDF.js worker */
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'js/preview/pdf/lib/pdf.worker.min.js';
    }
    this._createPanel();
    this._setupKeyboard();
    console.log('📄 PdfPreview initialized');
  },

  /* ── Create panel DOM ── */
  _createPanel() {
    const panel = document.createElement('div');
    panel.id        = 'pdf-preview-panel';
    panel.className = 'pdf-panel';
    panel.style.display = 'none';

    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) wrapper.appendChild(panel);
    else document.querySelector('.content-area')?.appendChild(panel)
      || document.body.appendChild(panel);

    this._panel = panel;
  },

  /* ── Open ── */
  async open(file, allFiles = []) {
    if (this._isOpen) this._forceClose();

    this._allPdfs = allFiles.filter(f =>
      !f.isDirectory && this.EXTS.includes((f.ext || '').toLowerCase())
    );

    this._currentIndex = this._allPdfs.findIndex(f => f.path === file.path);
    if (this._currentIndex === -1) {
      this._allPdfs      = [file];
      this._currentIndex = 0;
    }

    this._currentFile = this._allPdfs[this._currentIndex];
    this._isOpen      = true;

    await this._render();
    this._panel.style.display = 'flex';
    document.getElementById('file-preview-wrapper')?.classList.add('preview-active');

    requestAnimationFrame(() => this._panel.classList.add('pdf-panel-open'));
    console.log('📄 Opened PDF preview:', file.name);
  },

  /* ── Close ── */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    PdfViewer.destroy();
    this._panel.classList.remove('pdf-panel-open');
    document.getElementById('file-preview-wrapper')?.classList.remove('preview-active');

    setTimeout(() => {
      this._panel.style.display = 'none';
      this._panel.innerHTML     = '';
    }, 300);

    this._currentFile  = null;
    this._currentIndex = -1;
    this._allPdfs      = [];
    console.log('📄 Closed PDF preview');
  },

  _forceClose() {
    PdfViewer.destroy();
    this._panel.classList.remove('pdf-panel-open');
    this._panel.style.display = 'none';
    this._panel.innerHTML     = '';
    document.getElementById('file-preview-wrapper')?.classList.remove('preview-active');
    this._isOpen = false;
  },

  /* ── Navigate between PDF files ── */
  async nextFile() {
    if (this._allPdfs.length <= 1) return;
    this._currentIndex = (this._currentIndex + 1) % this._allPdfs.length;
    this._currentFile  = this._allPdfs[this._currentIndex];
    PdfViewer.destroy();
    await this._render();
  },

  async prevFile() {
    if (this._allPdfs.length <= 1) return;
    this._currentIndex = (this._currentIndex - 1 + this._allPdfs.length) % this._allPdfs.length;
    this._currentFile  = this._allPdfs[this._currentIndex];
    PdfViewer.destroy();
    await this._render();
  },

  /* ── Get media URL ── */
  async _getUrl(filePath) {
    if (!this._mediaPort) {
      this._mediaPort = await IPC.invoke('media:getPort');
    }
    return `http://127.0.0.1:${this._mediaPort}/?path=${encodeURIComponent(filePath)}`;
  },

  /* ── Render ── */
  async _render() {
    const page  = PdfViewer.getPage()  || 1;
    const total = PdfViewer.getTotalPages() || 1;
    const zoom  = PdfViewer.getZoom()  || 1.0;

    const toolbar = PdfToolbar.render(
      this._currentFile, page, total, zoom,
      this._allPdfs.length, this._currentIndex
    );
    const viewer = PdfViewer.render();
    const info   = PdfInfo.render(this._currentFile);

    this._panel.innerHTML = `
      ${toolbar}
      <div class="pdf-body">
        ${viewer}
        <div class="pdf-scroll">
          ${info}
        </div>
      </div>
    `;

    this._attachEvents();

    /* Load PDF */
    const url        = await this._getUrl(this._currentFile.path);
    const totalPages = await PdfViewer.load(url);

    /* Update toolbar with correct page count */
    this._refreshToolbar();

    /* Get PDF metadata */
    if (PdfViewer._pdfDoc) {
      const meta = await PdfViewer._pdfDoc.getMetadata().catch(() => null);
      PdfInfo.updateMeta(totalPages, meta);
    }

    PdfViewer.setupKeyScroll();
  },

  /* Refresh toolbar after page count known */
  _refreshToolbar() {
    const toolbar = this._panel.querySelector('.pdf-toolbar');
    if (!toolbar) return;
    const page  = PdfViewer.getPage();
    const total = PdfViewer.getTotalPages();
    const zoom  = PdfViewer.getZoom();

    const newToolbar = document.createElement('div');
    newToolbar.innerHTML = PdfToolbar.render(
      this._currentFile, page, total, zoom,
      this._allPdfs.length, this._currentIndex
    );
    toolbar.replaceWith(newToolbar.firstElementChild);
    this._attachToolbarEvents();
  },

  /* ── Wire events ── */
  _attachEvents() {
    this._attachToolbarEvents();

    /* Info actions */
    this._panel.querySelector('.pdf-action-open')
      ?.addEventListener('click', () => IPC.invoke('pdf:openReader', this._currentFile.path));

    this._panel.querySelector('.pdf-action-folder')
      ?.addEventListener('click', () => IPC.invoke('shell:showItemInFolder', this._currentFile.path));

    this._panel.querySelector('#pdf-copy-path')
      ?.addEventListener('click', () => {
        navigator.clipboard.writeText(this._currentFile.path);
        Footer.showStatus('Path copied', 'success');
      });

    this._panel.querySelector('.pdf-action-delete')
      ?.addEventListener('click', async () => {
        const ok = await Dialogs.confirm('Delete File', `Delete "${this._currentFile.name}"?`);
        if (!ok) return;
        const res = await IPC.invoke('fs:delete', [this._currentFile.path]);
        if (res.success) {
          Footer.showStatus('File deleted', 'success');
          this.close();
          Navigation.refresh();
        } else {
          Footer.showStatus('Delete failed: ' + res.error, 'error');
        }
      });
  },

  _attachToolbarEvents() {
    /* Close */
    this._panel.querySelector('.pdf-close-btn')
      ?.addEventListener('click', () => this.close());

    /* Open external */
    this._panel.querySelector('.pdf-open-external')
      ?.addEventListener('click', () => IPC.invoke('pdf:openReader', this._currentFile.path));

    /* File navigation */
    this._panel.querySelector('.pdf-file-prev')
      ?.addEventListener('click', () => this.prevFile());
    this._panel.querySelector('.pdf-file-next')
      ?.addEventListener('click', () => this.nextFile());

    /* Page navigation */
    this._panel.querySelector('.pdf-page-prev')
      ?.addEventListener('click', async () => {
        await PdfViewer.prevPage();
        this._refreshToolbar();
      });

    this._panel.querySelector('.pdf-page-next')
      ?.addEventListener('click', async () => {
        await PdfViewer.nextPage();
        this._refreshToolbar();
      });

    /* Page input */
    const pageInput = this._panel.querySelector('#pdf-page-input');
    pageInput?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        await PdfViewer.goToPage(parseInt(pageInput.value));
        this._refreshToolbar();
      }
    });
    pageInput?.addEventListener('blur', async () => {
      await PdfViewer.goToPage(parseInt(pageInput.value));
      this._refreshToolbar();
    });

    /* Zoom */
    this._panel.querySelector('.pdf-zoom-in')
      ?.addEventListener('click', async () => {
        await PdfViewer.zoomIn();
        this._refreshToolbar();
      });

    this._panel.querySelector('.pdf-zoom-out')
      ?.addEventListener('click', async () => {
        await PdfViewer.zoomOut();
        this._refreshToolbar();
      });

    this._panel.querySelector('.pdf-zoom-fit')
      ?.addEventListener('click', async () => {
        await PdfViewer.fitWidth();
        this._refreshToolbar();
      });
  },

  /* ── Keyboard shortcuts ── */
  _setupKeyboard() {
    document.addEventListener('keydown', async (e) => {
      if (!this._isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close(); break;
        case 'ArrowRight':
        case 'ArrowDown':
          if (e.shiftKey) { await this.nextFile(); }
          else { await PdfViewer.nextPage(); this._refreshToolbar(); }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (e.shiftKey) { await this.prevFile(); }
          else { await PdfViewer.prevPage(); this._refreshToolbar(); }
          break;
        case '+':
        case '=':
          await PdfViewer.zoomIn(); this._refreshToolbar(); break;
        case '-':
          await PdfViewer.zoomOut(); this._refreshToolbar(); break;
        case '0':
          await PdfViewer.fitWidth(); this._refreshToolbar(); break;
      }
    });
  },

  isOpen()  { return this._isOpen; },
  isPdf(f)  { return !f.isDirectory && this.EXTS.includes((f.ext || '').toLowerCase()); }
};
