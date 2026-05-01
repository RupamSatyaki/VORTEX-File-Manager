/* Time formatting utilities */
const TimeFormat = {
  /* 3661 → "1:01:01" */
  format(secs) {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  },

  /* 3661 → "1h 1m 1s" */
  formatLong(secs) {
    if (!secs || isNaN(secs)) return 'Unknown';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  /* Format bytes */
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024*1024)   return (bytes/1024).toFixed(1) + ' KB';
    if (bytes < 1024**3)     return (bytes/1024/1024).toFixed(1) + ' MB';
    return (bytes/1024/1024/1024).toFixed(2) + ' GB';
  },
};
