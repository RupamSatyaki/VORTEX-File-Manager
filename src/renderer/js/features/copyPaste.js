/* Copy/Paste */
const CopyPaste = {
  _clipboard: null,

  copy(files) {
    if (!files.length) return;
    this._clipboard = { action: 'copy', files };
    Footer.showStatus(`${files.length} item(s) copied`, 'success');
  },

  cut(files) {
    if (!files.length) return;
    this._clipboard = { action: 'cut', files };
    Footer.showStatus(`${files.length} item(s) cut`, 'success');
  },

  async paste(destPath) {
    if (!this._clipboard || !destPath) return;
    const { action, files } = this._clipboard;
    for (const file of files) {
      const dest = PathUtils.join(destPath, PathUtils.getBasename(file.path));
      if (action === 'copy') await IPC.invoke('fs:copy', file.path, dest);
      else await IPC.invoke('fs:move', file.path, dest);
    }
    if (action === 'cut') this._clipboard = null;
    Navigation.refresh();
    Footer.showStatus('Paste complete', 'success');
  },

  hasClipboard() {
    return !!this._clipboard;
  }
};
