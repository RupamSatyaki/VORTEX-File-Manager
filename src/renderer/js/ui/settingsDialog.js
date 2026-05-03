/* ============================================================
   SETTINGS DIALOG — Default Apps + General Settings
   ============================================================ */
const SettingsDialog = {

  async show() {
    /* Load current settings */
    const defaultApps = Storage.get('defaultApps') || { video: 'vortex', audio: 'vortex', pdf: 'vortex' };
    const appSettings = Storage.get('settings')    || {};

    const container = document.getElementById('dialogs-container');
    const overlay   = document.createElement('div');
    overlay.className = 'dialog-overlay';

    overlay.innerHTML = `
      <div class="dialog settings-dialog">
        <div class="dialog-header">
          <div class="dialog-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Settings
          </div>
          <button class="dialog-close" id="settings-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="settings-body">

          <!-- Sidebar -->
          <div class="settings-sidebar">
            <div class="settings-nav-item active" data-tab="appearance">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
              Appearance
            </div>
            <div class="settings-nav-item" data-tab="default-apps">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="2"/></svg>
              Default Apps
            </div>
          </div>

          <!-- Content -->
          <div class="settings-content">

            <!-- Appearance Tab -->
            <div class="settings-tab active" id="tab-appearance">
              <div class="settings-section-title">Theme</div>
              <div class="settings-row">
                <div class="settings-label">
                  <span>Color Theme</span>
                  <span class="settings-desc">Choose between dark and light mode</span>
                </div>
                <div class="settings-control">
                  <div class="theme-toggle-group" id="theme-toggle">
                    <button class="theme-btn ${appSettings.theme !== 'light' ? 'active' : ''}" data-theme="dark">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      Dark
                    </button>
                    <button class="theme-btn ${appSettings.theme === 'light' ? 'active' : ''}" data-theme="light">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      Light
                    </button>
                  </div>
                </div>
              </div>

              <div class="settings-section-title" style="margin-top:20px">Accent Color</div>
              <div class="settings-row">
                <div class="settings-label">
                  <span>Accent Color</span>
                  <span class="settings-desc">Highlight color used throughout the UI</span>
                </div>
                <div class="settings-control">
                  <div class="accent-swatches" id="accent-swatches">
                    ${['blue','purple','pink','green','orange','teal'].map(c => `
                      <button class="accent-swatch accent-${c} ${(appSettings.accentColor || 'blue') === c ? 'active' : ''}" data-accent="${c}" title="${c.charAt(0).toUpperCase() + c.slice(1)}"></button>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Default Apps Tab -->
            <div class="settings-tab" id="tab-default-apps">
              <div class="settings-section-title">Default Applications</div>
              <p class="settings-desc" style="margin-bottom:16px">Choose which app opens each file type when you double-click it in Vortex.</p>

              <!-- Video -->
              <div class="settings-row">
                <div class="settings-label">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    Video &amp; Audio Files
                  </span>
                  <span class="settings-desc">mp4, mkv, avi, mov, mp3, flac…</span>
                </div>
                <div class="settings-control">
                  <div class="app-choice-group" id="video-choice">
                    <button class="app-choice-btn ${defaultApps.video === 'vortex' ? 'active' : ''}" data-value="vortex">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      Vortex Player
                    </button>
                    <button class="app-choice-btn ${defaultApps.video === 'system' ? 'active' : ''}" data-value="system">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      System Default
                    </button>
                  </div>
                </div>
              </div>

              <!-- PDF -->
              <div class="settings-row" style="margin-top:16px">
                <div class="settings-label">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    PDF Files
                  </span>
                  <span class="settings-desc">.pdf documents</span>
                </div>
                <div class="settings-control">
                  <div class="app-choice-group" id="pdf-choice">
                    <button class="app-choice-btn ${defaultApps.pdf === 'vortex' ? 'active' : ''}" data-value="vortex">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Vortex PDF Reader
                    </button>
                    <button class="app-choice-btn ${defaultApps.pdf === 'system' ? 'active' : ''}" data-value="system">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      System Default
                    </button>
                  </div>
                </div>
              </div>

              <div class="settings-info-box" style="margin-top:20px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>To make Vortex the system-wide default for files opened from any explorer, click the button below.</span>
              </div>

              <button class="dialog-button dialog-button-primary" id="settings-set-default" style="margin-top:12px;width:100%;justify-content:center;display:flex;align-items:center;gap:8px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Set Vortex as Default in Windows Settings
              </button>
            </div>

          </div><!-- /settings-content -->
        </div><!-- /settings-body -->

        <div class="dialog-footer">
          <button class="dialog-button dialog-button-secondary" id="settings-cancel">Cancel</button>
          <button class="dialog-button dialog-button-primary" id="settings-save">Save</button>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    /* ── Tab switching ── */
    overlay.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        overlay.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        overlay.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        overlay.querySelector(`#tab-${item.dataset.tab}`).classList.add('active');
      });
    });

    /* ── Theme toggle ── */
    overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    /* ── Accent swatches ── */
    overlay.querySelectorAll('.accent-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        overlay.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });

    /* ── App choice buttons ── */
    ['video-choice', 'pdf-choice'].forEach(groupId => {
      overlay.querySelectorAll(`#${groupId} .app-choice-btn`).forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.querySelectorAll(`#${groupId} .app-choice-btn`).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });

    /* ── Set as Default button ── */
    overlay.querySelector('#settings-set-default')?.addEventListener('click', () => {
      /* Open Windows Default Apps settings — deep link to Vortex entry */
      window.vortexAPI?.openExternal('ms-settings:defaultapps');
    });

    /* ── Close ── */
    const close = () => overlay.remove();
    overlay.querySelector('#settings-close').addEventListener('click', close);
    overlay.querySelector('#settings-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });

    /* ── Save ── */
    overlay.querySelector('#settings-save').addEventListener('click', async () => {
      /* Collect theme */
      const activeTheme  = overlay.querySelector('.theme-btn.active')?.dataset.theme  || 'dark';
      const activeAccent = overlay.querySelector('.accent-swatch.active')?.dataset.accent || 'blue';

      /* Collect default apps */
      const videoChoice = overlay.querySelector('#video-choice .app-choice-btn.active')?.dataset.value || 'vortex';
      const pdfChoice   = overlay.querySelector('#pdf-choice .app-choice-btn.active')?.dataset.value   || 'vortex';

      /* Apply theme immediately */
      App.state.theme       = activeTheme;
      App.state.accentColor = activeAccent;
      App.saveSettings();
      App.applyTheme();

      /* Save default apps */
      const newDefaults = { video: videoChoice, audio: videoChoice, pdf: pdfChoice };
      Storage.set('defaultApps', newDefaults);
      await IPC.invoke('settings:setDefaultApps', newDefaults);

      close();
      Footer.showStatus('Settings saved', 'success');
    });
  }
};
