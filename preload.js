const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vortexAPI', {
  // Window
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // File system
  readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
  getDrives: () => ipcRenderer.invoke('fs:getDrives'),
  mkdir: (path) => ipcRenderer.invoke('fs:mkdir', path),
  createFile: (path) => ipcRenderer.invoke('fs:createFile', path),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  delete: (path) => ipcRenderer.invoke('fs:delete', path),
  copy: (src, dest) => ipcRenderer.invoke('fs:copy', src, dest),
  move: (src, dest) => ipcRenderer.invoke('fs:move', src, dest),
  exists: (path) => ipcRenderer.invoke('fs:exists', path),
  stat: (path) => ipcRenderer.invoke('fs:stat', path),
  search: (dirPath, query) => ipcRenderer.invoke('fs:search', dirPath, query),
  getHomePath: () => ipcRenderer.invoke('fs:getHomePath'),
  getSpecialPath: (name) => ipcRenderer.invoke('fs:getSpecialPath', name),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),

  // Shell
  openPath:         (path) => ipcRenderer.invoke('shell:openPath', path),
  showInFolder:     (path) => ipcRenderer.send('shell:showInFolder', path),
  openExternal:     (url)  => ipcRenderer.send('shell:openExternal', url),
  getAppsForExt:    (ext)  => ipcRenderer.invoke('shell:getAppsForExt', ext),
  openWith:         (filePath, app) => ipcRenderer.invoke('shell:openWith', filePath, app),
  share:            (paths) => ipcRenderer.invoke('shell:share', paths),
  setWallpaper:     (p)    => ipcRenderer.invoke('shell:setWallpaper', p),
  openTerminal:     (dir)  => ipcRenderer.invoke('shell:openTerminal', dir),
  compressToZip:    (files, dest) => ipcRenderer.invoke('fs:compressToZip', files, dest),
  extractZip:       (zip, dest)   => ipcRenderer.invoke('fs:extractZip', zip, dest),

  // Storage
  storageRead: (key) => ipcRenderer.invoke('storage:read', key),
  storageWrite: (key, data) => ipcRenderer.invoke('storage:write', key, data),

  // Dialog
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  
  // Drive monitoring
  onDrivesChanged: (callback) => {
    ipcRenderer.on('drives:changed', (event, data) => callback(data));
  },

  // Media server
  getMediaPort:         () => ipcRenderer.invoke('media:getPort'),
  getMediaProgress:     (p) => ipcRenderer.invoke('media:getProgress', p),
  getTranscodeInfo:     (p) => ipcRenderer.invoke('media:getTranscodeInfo', p),
  getMediaDuration:     (p) => ipcRenderer.invoke('media:getDuration', p),

  // PDF Reader
  openPdfReader:        (p) => ipcRenderer.invoke('pdf:openReader', p),
  pdfMinimize:          ()  => ipcRenderer.send('pdf:minimize'),
  pdfMaximize:          ()  => ipcRenderer.send('pdf:maximize'),
  pdfClose:             ()  => ipcRenderer.send('pdf:close'),
});
