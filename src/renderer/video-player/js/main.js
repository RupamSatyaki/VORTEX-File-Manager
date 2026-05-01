/* ============================================================
   VIDEO PLAYER — Main Entry Point
   ============================================================ */

/* ── Get params from URL ── */
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    filePath:  decodeURIComponent(p.get('path')  || ''),
    playlist:  JSON.parse(decodeURIComponent(p.get('playlist') || '[]')),
    playlistIdx: parseInt(p.get('idx') || '0'),
  };
}

/* ── Build layout ── */
function buildLayout() {
  document.getElementById('vp-app').innerHTML = `
    ${Toolbar.render()}
    <div class="vp-body" id="vp-body">
      ${PlaylistPanel.render()}
      <div class="vp-center" id="vp-center">
        ${VideoEngine.render()}
        ${SeekBar.render()}
        ${Controls.render()}
      </div>
      ${InfoPanel.render()}
    </div>
  `;
}

/* ── Init ── */
async function init() {
  const { filePath, playlist, playlistIdx } = getParams();
  if (!filePath) { document.body.innerHTML = '<div style="color:#ef4444;padding:40px;font-family:sans-serif">No file path provided</div>'; return; }

  /* Get media server port */
  try {
    State.mediaPort = await window.vortexAPI.getMediaPort();
  } catch (err) {
    console.error('Failed to get media port:', err);
  }

  /* Set playlist */
  State.playlist    = playlist.length ? playlist : [{ path: filePath, name: filePath.split(/[/\\]/).pop() }];
  State.playlistIdx = playlistIdx;

  /* Build UI */
  buildLayout();

  /* Mount components */
  Toolbar.mount();
  VideoEngine.mount();
  SeekBar.mount();
  Controls.mount();
  InfoPanel.mount();
  KeyboardShortcuts.init();

  /* Populate playlist */
  PlaylistPanel.populate(State.playlist, filePath);

  /* Load file */
  await VideoEngine.loadFile(filePath);
  InfoPanel.populate(filePath);

  /* Sync controls timeupdate → time display */
  const video = VideoEngine.getElement();
  if (video) {
    video.addEventListener('timeupdate', () => {
      const dur = State.isTranscode ? State.duration : (video.duration || State.duration);
      Controls.syncTime(video.currentTime, dur);
    });
  }
}

/* ── Start ── */
document.addEventListener('DOMContentLoaded', init);
