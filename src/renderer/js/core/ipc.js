/* IPC Wrapper */
const IPC = {
  invoke(channel, ...args) {
    const map = {
      'fs:getHomePath':   ()          => window.vortexAPI.getHomePath(),
      'fs:readDir':       (p)         => window.vortexAPI.readDir(p),
      'fs:getDrives':     ()          => window.vortexAPI.getDrives(),
      'fs:mkdir':         (p)         => window.vortexAPI.mkdir(p),
      'fs:createFile':    (p)         => window.vortexAPI.createFile(p),
      'fs:rename':        (o, n)      => window.vortexAPI.rename(o, n),
      'fs:delete':        (p)         => window.vortexAPI.delete(p),
      'fs:copy':          (s, d)      => window.vortexAPI.copy(s, d),
      'fs:move':          (s, d)      => window.vortexAPI.move(s, d),
      'fs:exists':        (p)         => window.vortexAPI.exists(p),
      'fs:stat':          (p)         => window.vortexAPI.stat(p),
      'fs:search':        (dir, q)    => window.vortexAPI.search(dir, q),
      'fs:getSpecialPath':(n)         => window.vortexAPI.getSpecialPath(n),
      'fs:readFile':      (p)         => window.vortexAPI.readFile(p),
      'shell:openPath':     (p)       => window.vortexAPI.openPath(p),
      'shell:getAppsForExt':(ext)    => window.vortexAPI.getAppsForExt(ext),
      'shell:openWith':     (f, app) => window.vortexAPI.openWith(f, app),
      'shell:share':        (paths)  => window.vortexAPI.share(paths),
      'shell:setWallpaper': (p)      => window.vortexAPI.setWallpaper(p),
      'shell:openTerminal': (dir)    => window.vortexAPI.openTerminal(dir),
      'fs:compressToZip':   (f, d)   => window.vortexAPI.compressToZip(f, d),
      'fs:extractZip':      (z, d)   => window.vortexAPI.extractZip(z, d),
      'storage:read':     (k)         => window.vortexAPI.storageRead(k),
      'storage:write':    (k, d)      => window.vortexAPI.storageWrite(k, d),
      'dialog:openFolder':()          => window.vortexAPI.openFolderDialog(),
      'media:getPort':         ()  => window.vortexAPI.getMediaPort(),
      'media:getProgress':     (p) => window.vortexAPI.getMediaProgress(p),
      'media:getTranscodeInfo':(p) => window.vortexAPI.getTranscodeInfo(p),
      'media:getDuration':     (p) => window.vortexAPI.getMediaDuration(p),
      'pdf:openReader':        (p) => window.vortexAPI.openPdfReader(p),
    };
    const fn = map[channel];
    if (fn) return fn(...args);
    return Promise.reject(new Error('Unknown channel: ' + channel));
  },

  send(channel, ...args) {
    const map = {
      'shell:showInFolder': (p) => window.vortexAPI.showInFolder(p),
      'shell:openExternal': (u) => window.vortexAPI.openExternal(u),
      'window:minimize':    ()  => window.vortexAPI.minimize(),
      'window:maximize':    ()  => window.vortexAPI.maximize(),
      'window:close':       ()  => window.vortexAPI.close(),
    };
    const fn = map[channel];
    if (fn) fn(...args);
  },
  
  onDrivesChanged(callback) {
    if (window.vortexAPI && window.vortexAPI.onDrivesChanged) {
      window.vortexAPI.onDrivesChanged(callback);
    }
  }
};
