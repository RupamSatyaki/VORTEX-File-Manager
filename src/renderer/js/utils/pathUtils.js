/* Path Utilities */
const PathUtils = {
  sep: '\\',

  join(...parts) {
    return parts.filter(Boolean).join(this.sep).replace(/[/\\]+/g, this.sep);
  },

  getParent(p) {
    if (!p) return p;
    const normalized = p.replace(/[/\\]+$/, '');
    const idx = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
    if (idx <= 0) return normalized.slice(0, 3) || normalized; // drive root like C:\
    return normalized.slice(0, idx) || normalized.slice(0, 3);
  },

  getBasename(p) {
    if (!p) return '';
    const normalized = p.replace(/[/\\]+$/, '');
    const idx = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
    return normalized.slice(idx + 1);
  },

  // Split path into breadcrumb segments
  getSegments(p) {
    if (!p) return [];
    const normalized = p.replace(/\//g, '\\');
    const parts = normalized.split('\\').filter(Boolean);
    const segments = [];
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 && parts[i].endsWith(':')) {
        current = parts[i] + '\\';
      } else {
        current = current.endsWith('\\') ? current + parts[i] : current + '\\' + parts[i];
      }
      segments.push({ label: parts[i] + (i === 0 ? '\\' : ''), path: current });
    }
    return segments;
  },

  isRoot(p) {
    return /^[A-Za-z]:\\?$/.test(p);
  }
};
