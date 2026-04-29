/* ============================================================
   PDF READER — Main Logic
   ============================================================ */

/* ── State ── */
const State = {
  pdfDoc:      null,
  totalPages:  0,
  currentPage: 1,
  zoom:        1.0,
  filePath:    '',
  fileName:    '',
  rendering:   new Set(), /* pages currently rendering */
};

/* ── PDF.js worker ── */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  '../js/preview/pdf/lib/pdf.worker.min.js';

/* ── Get file path from URL query ── */
function getFilePath() {
  const params = new URLSearchParams(window.location.search);
  return decodeURIComponent(params.get('path') || '');
}

/* ── Init ── */
async function init() {
  State.filePath = getFilePath();
  if (!State.filePath) { showError('No file path provided'); return; }

  State.fileName = State.filePath.split(/[/\\]/).pop();
  document.title = State.fileName + ' — Vortex PDF Reader';
  document.getElementById('tb-title').textContent = State.fileName;

  /* Get media server port from preload */
  let url;
  try {
    const port = await window.vortexAPI.getMediaPort();
    url = `http://127.0.0.1:${port}/?path=${encodeURIComponent(State.filePath)}`;
  } catch {
    /* Fallback: file:// */
    url = 'file:///' + State.filePath.replace(/\\/g, '/');
  }

  try {
    State.pdfDoc    = await pdfjsLib.getDocument({ url, cMapUrl: '../js/preview/pdf/lib/cmaps/', cMapPacked: true }).promise;
    State.totalPages = State.pdfDoc.numPages;

    document.getElementById('tb-total').textContent = `/ ${State.totalPages}`;
    document.getElementById('tb-page').max = State.totalPages;
    document.getElementById('all-count').textContent = `${State.totalPages} pages`;

    /* Default: fit width */
    await calcFitWidth();

    /* Render all pages */
    await renderAllPages();

    /* Build thumbnails */
    buildThumbnails();

    /* Populate info tab */
    populateInfoTab();

    /* Hide loading */
    document.getElementById('reader-loading').classList.add('hidden');

    /* Wire events */
    wireEvents();

  } catch (err) {
    showError(err.message);
  }
}

/* ── Calculate fit-width zoom ── */
async function calcFitWidth() {
  const main    = document.getElementById('reader-main');
  const page    = await State.pdfDoc.getPage(1);
  const vp      = page.getViewport({ scale: 1.0 });
  const avail   = main.clientWidth - 48;
  State.zoom    = Math.max(0.25, avail / vp.width);
  updateZoomLabel();
}

/* ── Render all pages into main viewer ── */
async function renderAllPages() {
  const main = document.getElementById('reader-main');
  main.innerHTML = '';

  for (let i = 1; i <= State.totalPages; i++) {
    const wrap = document.createElement('div');
    wrap.className  = 'page-wrap';
    wrap.id         = `page-wrap-${i}`;
    wrap.dataset.page = i;

    const canvas = document.createElement('canvas');
    canvas.id = `page-canvas-${i}`;
    wrap.appendChild(canvas);
    main.appendChild(wrap);

    /* Render immediately for first 3 pages, lazy for rest */
    if (i <= 3) {
      await renderPage(i);
    } else {
      /* Placeholder size */
      const page = await State.pdfDoc.getPage(i);
      const vp   = page.getViewport({ scale: State.zoom });
      wrap.style.width  = vp.width  + 'px';
      wrap.style.height = vp.height + 'px';
    }
  }

  /* Lazy render remaining pages on scroll */
  setupLazyRender();
}

/* ── Render a single page ── */
async function renderPage(pageNum) {
  if (State.rendering.has(pageNum)) return;
  State.rendering.add(pageNum);

  try {
    const page   = await State.pdfDoc.getPage(pageNum);
    const vp     = page.getViewport({ scale: State.zoom });
    const canvas = document.getElementById(`page-canvas-${pageNum}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width  = vp.width  * dpr;
    canvas.height = vp.height * dpr;
    canvas.style.width  = vp.width  + 'px';
    canvas.style.height = vp.height + 'px';
    ctx.scale(dpr, dpr);

    const wrap = document.getElementById(`page-wrap-${pageNum}`);
    if (wrap) {
      wrap.style.width  = vp.width  + 'px';
      wrap.style.height = vp.height + 'px';
    }

    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  } catch (err) {
    console.error(`Page ${pageNum} render error:`, err);
  }

  State.rendering.delete(pageNum);
}

/* ── Lazy render on scroll ── */
function setupLazyRender() {
  const main = document.getElementById('reader-main');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageNum = parseInt(entry.target.dataset.page);
        if (pageNum > 3) renderPage(pageNum);
        /* Update current page indicator */
        State.currentPage = pageNum;
        updatePageInput();
        updateSidebarActive(pageNum);
      }
    });
  }, { root: main, threshold: 0.1 });

  document.querySelectorAll('.page-wrap').forEach(el => observer.observe(el));
}

/* ── Build sidebar thumbnails ── */
async function buildThumbnails() {
  const sidebar = document.getElementById('reader-sidebar');
  sidebar.innerHTML = '';

  for (let i = 1; i <= State.totalPages; i++) {
    const item = document.createElement('div');
    item.className  = 'thumb-item' + (i === 1 ? ' active' : '');
    item.id         = `thumb-${i}`;
    item.dataset.page = i;

    const wrap   = document.createElement('div');
    wrap.className = 'thumb-canvas-wrap';
    const canvas = document.createElement('canvas');
    wrap.appendChild(canvas);

    const label = document.createElement('span');
    label.className   = 'thumb-label';
    label.textContent = i;

    item.appendChild(wrap);
    item.appendChild(label);
    sidebar.appendChild(item);

    item.addEventListener('click', () => scrollToPage(i));

    /* Render thumbnail async */
    renderThumbnail(i, canvas);
  }
}

async function renderThumbnail(pageNum, canvas) {
  try {
    const page = await State.pdfDoc.getPage(pageNum);
    const vp   = page.getViewport({ scale: 0.2 });
    canvas.width  = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  } catch {}
}

/* ── Scroll to page ── */
function scrollToPage(pageNum) {
  const wrap = document.getElementById(`page-wrap-${pageNum}`);
  if (wrap) {
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    State.currentPage = pageNum;
    updatePageInput();
    updateSidebarActive(pageNum);
  }
}

/* ── Re-render all pages at new zoom ── */
async function reRenderAll() {
  State.rendering.clear();
  for (let i = 1; i <= State.totalPages; i++) {
    await renderPage(i);
  }
}

/* ── Update UI helpers ── */
function updateZoomLabel() {
  document.getElementById('tb-zoom').textContent = Math.round(State.zoom * 100) + '%';
}

function updatePageInput() {
  const input = document.getElementById('tb-page');
  if (input) input.value = State.currentPage;
  document.getElementById('tb-prev').disabled = State.currentPage <= 1;
  document.getElementById('tb-next').disabled = State.currentPage >= State.totalPages;
}

function updateSidebarActive(pageNum) {
  document.querySelectorAll('.thumb-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.page) === pageNum);
  });
}

/* ── Wire all events ── */
function wireEvents() {
  /* Page nav */
  document.getElementById('tb-prev').addEventListener('click', () => {
    if (State.currentPage > 1) scrollToPage(State.currentPage - 1);
  });
  document.getElementById('tb-next').addEventListener('click', () => {
    if (State.currentPage < State.totalPages) scrollToPage(State.currentPage + 1);
  });

  const pageInput = document.getElementById('tb-page');
  pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const n = Math.max(1, Math.min(parseInt(pageInput.value) || 1, State.totalPages));
      scrollToPage(n);
    }
  });
  pageInput.addEventListener('blur', () => {
    const n = Math.max(1, Math.min(parseInt(pageInput.value) || 1, State.totalPages));
    scrollToPage(n);
  });

  /* Zoom */
  document.getElementById('tb-zoom-in').addEventListener('click', async () => {
    State.zoom = Math.min(4.0, State.zoom + 0.25);
    updateZoomLabel();
    await reRenderAll();
  });
  document.getElementById('tb-zoom-out').addEventListener('click', async () => {
    State.zoom = Math.max(0.25, State.zoom - 0.25);
    updateZoomLabel();
    await reRenderAll();
  });
  document.getElementById('tb-fit-width').addEventListener('click', async () => {
    await calcFitWidth();
    await reRenderAll();
  });
  document.getElementById('tb-fit-page').addEventListener('click', async () => {
    const main = document.getElementById('reader-main');
    const page = await State.pdfDoc.getPage(1);
    const vp   = page.getViewport({ scale: 1.0 });
    State.zoom = Math.min(
      (main.clientWidth  - 48) / vp.width,
      (main.clientHeight - 48) / vp.height
    );
    updateZoomLabel();
    await reRenderAll();
  });

  /* Ctrl+scroll zoom */
  document.getElementById('reader-main').addEventListener('wheel', async (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    State.zoom = e.deltaY < 0
      ? Math.min(4.0, State.zoom + 0.1)
      : Math.max(0.25, State.zoom - 0.1);
    updateZoomLabel();
    await reRenderAll();
  }, { passive: false });

  /* Info tab */
  document.getElementById('tb-info').addEventListener('click', () => toggleInfoTab());
  document.getElementById('info-tab-close').addEventListener('click', () => toggleInfoTab());
  document.getElementById('info-copy-path').addEventListener('click', () => {
    navigator.clipboard.writeText(State.filePath);
  });

  /* Print */
  document.getElementById('tb-print').addEventListener('click', () => openPrintDialog());
  document.getElementById('print-cancel').addEventListener('click', () => closePrintDialog());
  document.getElementById('print-confirm').addEventListener('click', () => doPrint());

  /* Print radio options */
  document.querySelectorAll('.print-radio input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.print-radio').forEach(r => r.classList.remove('active'));
      radio.closest('.print-radio').classList.add('active');
      const rangeInput = document.getElementById('print-range-input');
      rangeInput.disabled = radio.value !== 'range';
      if (radio.value === 'range') rangeInput.focus();
    });
  });

  /* Close */
  document.getElementById('wc-close').addEventListener('click', () => window.vortexAPI?.pdfClose());
  document.getElementById('wc-min').addEventListener('click',   () => window.vortexAPI?.pdfMinimize());
  document.getElementById('wc-max').addEventListener('click',   () => window.vortexAPI?.pdfMaximize());

  /* Keyboard shortcuts */
  document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); openPrintDialog(); return; }
    if (e.key === 'Escape') { closePrintDialog(); return; }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { if (State.currentPage > 1) scrollToPage(State.currentPage - 1); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  { if (State.currentPage < State.totalPages) scrollToPage(State.currentPage + 1); }
    if (e.key === '+' || e.key === '=') {
      State.zoom = Math.min(4.0, State.zoom + 0.25);
      updateZoomLabel(); await reRenderAll();
    }
    if (e.key === '-') {
      State.zoom = Math.max(0.25, State.zoom - 0.25);
      updateZoomLabel(); await reRenderAll();
    }
    if (e.key === 'w' || e.key === 'W') { await calcFitWidth(); await reRenderAll(); }
    if (e.key === 'i' || e.key === 'I') { toggleInfoTab(); }
  });
}

/* ── Populate info floating tab ── */
async function populateInfoTab() {
  document.getElementById('info-filename').textContent = State.fileName;
  document.getElementById('info-pages').textContent    = State.totalPages;
  document.getElementById('info-path').textContent     = State.filePath;

  /* File size via fetch HEAD */
  try {
    const port = await window.vortexAPI.getMediaPort();
    const res  = await fetch(
      `http://127.0.0.1:${port}/?path=${encodeURIComponent(State.filePath)}`,
      { method: 'HEAD' }
    );
    const bytes = parseInt(res.headers.get('content-length') || '0');
    if (bytes > 0) {
      document.getElementById('info-size').textContent = formatBytes(bytes);
    }
  } catch {}

  /* PDF metadata */
  try {
    const meta = await State.pdfDoc.getMetadata();
    const info = meta?.info || {};
    if (info.Author)   { showInfoRow('info-author-row',  'info-author',    info.Author); }
    if (info.Title)    { showInfoRow('info-title-row',   'info-title-val', info.Title); }
    if (info.Subject)  { showInfoRow('info-subject-row', 'info-subject',   info.Subject); }
    if (info.Creator)  { showInfoRow('info-creator-row', 'info-creator',   info.Creator); }
  } catch {}
}

function showInfoRow(rowId, valId, value) {
  const row = document.getElementById(rowId);
  const val = document.getElementById(valId);
  if (row) row.style.display = '';
  if (val) val.textContent = value;
}

function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}

/* ── Toggle info tab ── */
function toggleInfoTab() {
  const tab = document.getElementById('info-tab');
  tab.classList.toggle('hidden');
}

/* ── Print dialog ── */
function openPrintDialog() {
  document.getElementById('print-overlay').classList.remove('hidden');
}
function closePrintDialog() {
  document.getElementById('print-overlay').classList.add('hidden');
}

async function doPrint() {
  const selected = document.querySelector('input[name="pages"]:checked')?.value || 'all';
  let pages = [];

  if (selected === 'all') {
    pages = Array.from({ length: State.totalPages }, (_, i) => i + 1);
  } else if (selected === 'odd') {
    pages = Array.from({ length: State.totalPages }, (_, i) => i + 1).filter(p => p % 2 !== 0);
  } else if (selected === 'even') {
    pages = Array.from({ length: State.totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
  } else if (selected === 'range') {
    const rangeStr = document.getElementById('print-range-input').value;
    pages = parsePageRange(rangeStr, State.totalPages);
  }

  if (!pages.length) { alert('No pages selected'); return; }

  closePrintDialog();

  /* Create hidden iframe with selected pages rendered as images */
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; }
    .print-page { page-break-after: always; display:flex; justify-content:center; align-items:center; }
    .print-page:last-child { page-break-after: avoid; }
    img { max-width:100%; height:auto; display:block; }
  </style></head><body>`);

  for (const pageNum of pages) {
    const page = await State.pdfDoc.getPage(pageNum);
    const vp   = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width  = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    doc.write(`<div class="print-page"><img src="${canvas.toDataURL('image/jpeg', 0.95)}"></div>`);
  }

  doc.write('</body></html>');
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

/* ── Parse page range string ── */
function parsePageRange(str, total) {
  const pages = new Set();
  const parts = str.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number);
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) pages.add(i);
    } else {
      const n = parseInt(trimmed);
      if (n >= 1 && n <= total) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

/* ── Error ── */
function showError(msg) {
  document.getElementById('reader-loading').innerHTML = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span style="color:#ef4444;font-size:14px">Failed to load PDF</span>
    <small style="color:rgba(255,255,255,0.4);font-size:12px">${msg}</small>
  `;
}

/* ── Start ── */
init();
