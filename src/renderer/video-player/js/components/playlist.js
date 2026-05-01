/* Playlist Panel — left sidebar with all videos in folder */
const PlaylistPanel = {
  _visible: true,

  render() {
    return `
      <div class="vp-playlist" id="vp-playlist">
        <div class="vp-playlist-header">
          <span>Playlist</span>
          <span class="vp-playlist-count" id="vp-playlist-count">0 videos</span>
        </div>
        <div class="vp-playlist-items" id="vp-playlist-items"></div>
      </div>
    `;
  },

  populate(playlist, currentPath) {
    const container = document.getElementById('vp-playlist-items');
    const countEl   = document.getElementById('vp-playlist-count');
    if (!container) return;

    container.innerHTML = '';
    if (countEl) countEl.textContent = `${playlist.length} video${playlist.length !== 1 ? 's' : ''}`;

    playlist.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'vp-playlist-item' + (item.path === currentPath ? ' active' : '');
      el.dataset.idx = idx;
      el.innerHTML = `
        <div class="vp-playlist-item-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        </div>
        <span class="vp-playlist-item-name" title="${item.name}">${item.name}</span>
        ${item.path === currentPath ? '<span class="vp-playlist-playing">▶</span>' : ''}
      `;
      el.addEventListener('click', () => {
        State.playlistIdx = idx;
        VideoEngine.destroy();
        VideoEngine.loadFile(item.path);
        this.setActive(idx);
      });
      container.appendChild(el);
    });

    /* Scroll active into view */
    setTimeout(() => {
      const active = container.querySelector('.active');
      active?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
  },

  setActive(idx) {
    document.querySelectorAll('.vp-playlist-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      const playing = el.querySelector('.vp-playlist-playing');
      if (playing) playing.remove();
      if (i === idx) {
        const span = document.createElement('span');
        span.className = 'vp-playlist-playing';
        span.textContent = '▶';
        el.appendChild(span);
      }
    });
  },

  next() {
    const next = (State.playlistIdx + 1) % State.playlist.length;
    State.playlistIdx = next;
    VideoEngine.destroy();
    VideoEngine.loadFile(State.playlist[next].path);
    this.setActive(next);
  },

  prev() {
    const prev = (State.playlistIdx - 1 + State.playlist.length) % State.playlist.length;
    State.playlistIdx = prev;
    VideoEngine.destroy();
    VideoEngine.loadFile(State.playlist[prev].path);
    this.setActive(prev);
  },

  toggle() {
    this._visible = !this._visible;
    const el = document.getElementById('vp-playlist');
    if (el) el.classList.toggle('hidden', !this._visible);
    State.showPlaylist = this._visible;
  },
};
