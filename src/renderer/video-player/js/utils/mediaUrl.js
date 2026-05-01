/* Build HTTP media server URL */
const MediaUrl = {
  build(filePath) {
    if (!State.mediaPort) return '';
    return `http://127.0.0.1:${State.mediaPort}/?path=${encodeURIComponent(filePath)}`;
  },
};
