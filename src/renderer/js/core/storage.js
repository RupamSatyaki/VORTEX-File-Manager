/* Local Storage Wrapper */
const Storage = {
  get(key) {
    try {
      const val = localStorage.getItem('vfm_' + key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set(key, value) {
    try {
      localStorage.setItem('vfm_' + key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    localStorage.removeItem('vfm_' + key);
  }
};
