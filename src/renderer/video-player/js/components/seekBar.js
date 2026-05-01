/* Seek Bar — 3 layers: played(blue) / transcoded(white) / total(gray) */
const SeekBar = {
  _duration: 0,
  _dragging: false,

  render() {
    return `
      <div class="vp-seekbar-wrap">
        <div class="vp-seekbar" id="vp-seekbar">
          <!-- Gray = total -->
          <!-- White = transcoded/buffered -->
          <div class="vp-seekbar-transcoded" id="vp-seekbar-transcoded" style="width:0%"></div>
          <!-- Blue = played -->
          <div class="vp-seekbar-played" id="vp-seekbar-played" style="width:0%"></div>
          <!-- Thumb -->
          <div class="vp-seekbar-thumb" id="vp-seekbar-thumb" style="left:0%"></div>
          <!-- Tooltip -->
          <div class="vp-seekbar-tooltip" id="vp-seekbar-tooltip">0:00</div>
        </div>
      </div>
    `;
  },

  mount() {
    const bar     = document.getElementById('vp-seekbar');
    const tooltip = document.getElementById('vp-seekbar-tooltip');
    if (!bar) return;

    const getPct = (e) => {
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    bar.addEventListener('mousemove', (e) => {
      const pct = getPct(e);
      tooltip.textContent = TimeFormat.format(pct * this._duration);
      tooltip.style.left  = (pct * 100) + '%';
      tooltip.style.opacity = '1';
    });
    bar.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

    bar.addEventListener('click', (e) => {
      VideoEngine.seek(getPct(e) * this._duration);
    });

    /* Drag */
    bar.addEventListener('mousedown', (e) => {
      this._dragging = true;
      VideoEngine.seek(getPct(e) * this._duration);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this._dragging) return;
      VideoEngine.seek(getPct(e) * this._duration);
    });
    document.addEventListener('mouseup', () => { this._dragging = false; });
  },

  setDuration(dur) {
    this._duration = dur || 0;
  },

  update(current, duration) {
    if (duration > 0) this._duration = duration;
    const pct = this._duration > 0 ? (current / this._duration) * 100 : 0;
    const played     = document.getElementById('vp-seekbar-played');
    const thumb      = document.getElementById('vp-seekbar-thumb');
    if (played) played.style.width = pct + '%';
    if (thumb)  thumb.style.left   = pct + '%';
  },

  updateTranscoded(transcodedSecs, totalDur) {
    const buf = document.getElementById('vp-seekbar-transcoded');
    if (!buf || !totalDur) return;
    const pct = Math.min(100, (transcodedSecs / totalDur) * 100);
    buf.style.width = pct + '%';
  },
};
