/* Footer Component */
const Footer = {
  _statusTimer: null,

  init() {
    Events.on('selection:changed', ({ count, size }) => this.updateSelectionInfo(count, size));
  },

  updateSelectionInfo(count, size) {
    const el = document.getElementById('selection-info');
    const sizeEl = document.getElementById('size-info');
    if (count === 0) {
      el.textContent = `${FileList.getFiles().length} items`;
      sizeEl.textContent = '';
    } else {
      el.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
      sizeEl.textContent = size > 0 ? FormatUtils.formatSize(size) : '';
    }
  },

  async updateDriveInfo(currentPath) {
    const driveInfoEl = document.getElementById('drive-info');
    const storageFill = document.getElementById('storage-fill');

    // Handle portable device paths (Computer\DeviceName\...)
    if (currentPath.startsWith('Computer\\')) {
      const parts = currentPath.replace('Computer\\', '').split('\\');
      const deviceName = parts[0];
      driveInfoEl.textContent = `📱 ${deviceName}`;
      storageFill.style.width = '0%';
      storageFill.className = 'storage-fill';
      return;
    }

    // Show drive letter immediately for regular paths
    const letter = currentPath.slice(0, 3);
    driveInfoEl.textContent = letter;

    try {
      const result = await IPC.invoke('fs:getDrives');
      if (result.success) {
        const drive = result.drives.find(d => currentPath.startsWith(d.letter));
        if (drive && drive.size > 0) {
          const free = FormatUtils.formatSize(drive.freeSpace);
          const total = FormatUtils.formatSize(drive.size);
          const usedPct = Math.round(((drive.size - drive.freeSpace) / drive.size) * 100);

          driveInfoEl.textContent = `${drive.letter} — ${free} free of ${total}`;

          // Color coding
          storageFill.className = 'storage-fill';
          if (usedPct >= 90) storageFill.classList.add('red');
          else if (usedPct >= 70) storageFill.classList.add('orange');
          else storageFill.classList.add('green');

          storageFill.style.width = usedPct + '%';
        }
      }
    } catch (e) {
      // Silently ignore drive info errors
    }
  },

  showStatus(message, type = 'info') {
    const el = document.getElementById('selection-info');
    const original = el.textContent;
    el.textContent = message;
    el.style.color = type === 'error' ? 'var(--error)' : type === 'success' ? 'var(--success)' : 'var(--accent)';
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      el.textContent = original;
      el.style.color = '';
    }, 3000);
  }
};
