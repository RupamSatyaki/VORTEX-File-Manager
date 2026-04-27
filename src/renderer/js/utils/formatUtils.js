/* Format Utilities */
const FormatUtils = {
  formatSize(bytes) {
    if (bytes === 0 || bytes == null) return '--';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  },

  formatDate(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const day = 86400000;

    if (diff < day && date.getDate() === now.getDate()) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 2 * day) return 'Yesterday';
    if (diff < 7 * day) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
};
