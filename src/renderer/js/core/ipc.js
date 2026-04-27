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
      'shell:openPath':   (p)         => window.vortexAPI.openPath(p),
      'storage:read':     (k)         => window.vortexAPI.storageRead(k),
      'storage:write':    (k, d)      => window.vortexAPI.storageWrite(k, d),
      'dialog:openFolder':()          => window.vortexAPI.openFolderDialog(),
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
  }
};
