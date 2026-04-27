/* ============================================================
   ICON MAPPER — SVG icons for file types (Lucide-style)
   ============================================================ */

const IconMapper = {
  // SVG path data for each category
  _svgs: {
    folder:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    file:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    image:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    video:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    audio:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    pdf:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    word:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    excel:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`,
    archive:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    code:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    exe:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    text:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    font:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    drive:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2"/></svg>`,
  },

  _extMap: {
    // Images
    jpg:'image', jpeg:'image', png:'image', gif:'image', webp:'image',
    bmp:'image', ico:'image', tiff:'image', tif:'image', svg:'image', heic:'image',
    // Videos
    mp4:'video', avi:'video', mkv:'video', mov:'video', wmv:'video',
    flv:'video', webm:'video', m4v:'video', mpg:'video', mpeg:'video',
    // Audio
    mp3:'audio', wav:'audio', flac:'audio', ogg:'audio', m4a:'audio',
    aac:'audio', wma:'audio', opus:'audio',
    // Documents
    pdf:'pdf',
    doc:'word', docx:'word', odt:'word', rtf:'word',
    xls:'excel', xlsx:'excel', csv:'excel', ods:'excel',
    ppt:'word', pptx:'word', odp:'word',
    // Text / Code
    txt:'text', md:'text', log:'text', ini:'text', cfg:'text', conf:'text',
    json:'code', xml:'code', yaml:'code', yml:'code', toml:'code',
    js:'code', ts:'code', jsx:'code', tsx:'code',
    py:'code', java:'code', cpp:'code', c:'code', h:'code', cs:'code',
    php:'code', rb:'code', go:'code', rs:'code', swift:'code', kt:'code',
    html:'code', css:'code', scss:'code', less:'code', sh:'code', bat:'code', ps1:'code',
    // Archives
    zip:'archive', rar:'archive', '7z':'archive', tar:'archive',
    gz:'archive', bz2:'archive', xz:'archive',
    // Executables
    exe:'exe', msi:'exe', dmg:'exe', deb:'exe', rpm:'exe', appimage:'exe',
    // Fonts
    ttf:'font', otf:'font', woff:'font', woff2:'font',
    // Database
    db:'database', sqlite:'database', sql:'database',
  },

  _colors: {
    folder:   '#f59e0b',
    image:    '#8b5cf6',
    video:    '#ec4899',
    audio:    '#06b6d4',
    pdf:      '#ef4444',
    word:     '#3b82f6',
    excel:    '#22c55e',
    archive:  '#6b7280',
    code:     '#f97316',
    exe:      '#6b7280',
    text:     '#94a3b8',
    font:     '#a78bfa',
    database: '#14b8a6',
    file:     '#64748b',
  },

  _getType(file) {
    if (file.isDirectory) return 'folder';
    return this._extMap[(file.ext || '').toLowerCase()] || 'file';
  },

  getSvg(file) {
    const type = this._getType(file);
    return this._svgs[type] || this._svgs.file;
  },

  getColor(file) {
    const type = this._getType(file);
    return this._colors[type] || this._colors.file;
  },

  // Returns full <span> with colored SVG
  getIconHtml(file, size = 20) {
    const type = this._getType(file);
    const svg  = this._svgs[type] || this._svgs.file;
    const color = this._colors[type] || this._colors.file;
    return `<span style="color:${color};width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">${svg}</span>`;
  }
};
