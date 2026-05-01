/* Keyboard shortcuts */
const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          VideoEngine.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.shiftKey ? Playlist.next() : VideoEngine.seekRelative(5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.shiftKey ? Playlist.prev() : VideoEngine.seekRelative(-5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          Controls.changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          Controls.changeVolume(-0.1);
          break;
        case 'm': case 'M':
          VideoEngine.toggleMute();
          break;
        case 'f': case 'F':
          Controls.toggleFullscreen();
          break;
        case 'i': case 'I':
          InfoPanel.toggle();
          break;
        case 'p': case 'P':
          if (e.ctrlKey) { e.preventDefault(); Controls.togglePiP(); }
          else PlaylistPanel.toggle();
          break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen();
          break;
        case '+': case '=':
          VideoEngine.changeSpeed(0.25);
          break;
        case '-':
          VideoEngine.changeSpeed(-0.25);
          break;
      }
    });
  },
};
