/* Tab Manager */
const TabManager = {
  _tabs: [],
  _activeId: null,
  _counter: 0,

  init() {
    document.getElementById('new-tab-btn').addEventListener('click', () => this.createTab());
    Events.on('navigation:pathChanged', ({ path }) => {
      this.updateActiveTab({ path, label: PathUtils.getBasename(path) || path });
    });
  },

  createTab(path = null, activate = true) {
    const id = 'tab_' + (++this._counter);
    // Default to This PC if no path provided
    const defaultPath = path || 'thispc://';
    const tab = { 
      id, 
      path: defaultPath, 
      label: defaultPath === 'thispc://' ? 'This PC' : (PathUtils.getBasename(defaultPath) || defaultPath), 
      history: [], 
      historyIndex: -1 
    };
    this._tabs.push(tab);
    this._renderTab(tab);
    if (activate) this.switchTab(id);
    return id;
  },

  _renderTab(tab) {
    const tabBar = document.getElementById('tab-bar');
    const newBtn = document.getElementById('new-tab-btn');

    const el = document.createElement('div');
    el.className = 'tab';
    el.dataset.tabId = tab.id;
    el.innerHTML = `
      <span class="tab-icon">📁</span>
      <span class="tab-label">${tab.label || 'New Tab'}</span>
      <button class="tab-close" title="Close Tab">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) {
        this.closeTab(tab.id);
      } else {
        this.switchTab(tab.id);
      }
    });
    tabBar.insertBefore(el, newBtn);
  },

  switchTab(id) {
    this._activeId = id;
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tabId === id);
    });
    const tab = this.getTab(id);
    if (tab && tab.path) {
      Navigation.navigateTo(tab.path, false); // false = don't add to history again
    }
  },

  closeTab(id) {
    const idx = this._tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    this._tabs.splice(idx, 1);
    document.querySelector(`.tab[data-tab-id="${id}"]`)?.remove();

    if (this._tabs.length === 0) {
      this.createTab();
    } else if (this._activeId === id) {
      const newActive = this._tabs[Math.min(idx, this._tabs.length - 1)];
      this.switchTab(newActive.id);
    }
  },

  updateActiveTab(data) {
    const tab = this.getTab(this._activeId);
    if (!tab) return;
    Object.assign(tab, data);
    const el = document.querySelector(`.tab[data-tab-id="${this._activeId}"]`);
    if (el) {
      el.querySelector('.tab-label').textContent = data.label || PathUtils.getBasename(data.path) || 'New Tab';
    }
  },

  getActiveTab() {
    return this.getTab(this._activeId);
  },

  getTab(id) {
    return this._tabs.find(t => t.id === id);
  },

  saveTabs() {
    Storage.set('tabs', this._tabs.map(t => ({ path: t.path, label: t.label })));
  },

  async restoreTabs(saved) {
    if (!saved || !saved.length) {
      this.createTab();
      return;
    }
    for (let i = 0; i < saved.length; i++) {
      this.createTab(saved[i].path, i === 0);
    }
  }
};
