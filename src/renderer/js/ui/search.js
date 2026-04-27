/* Search Component */
const Search = {
  _timer: null,

  init() {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('search-clear');
    const suggestions = document.getElementById('search-suggestions');

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clear.style.display = q ? 'flex' : 'none';
      clearTimeout(this._timer);
      if (!q) { suggestions.style.display = 'none'; return; }
      this._timer = setTimeout(() => this.search(q), 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { 
        this.clearSearch();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = input.value.trim();
        if (q) this.searchRecursive(q);
      }
    });

    clear.addEventListener('click', () => {
      input.value = '';
      clear.style.display = 'none';
      suggestions.style.display = 'none';
      input.focus();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) suggestions.style.display = 'none';
    });
  },

  search(query) {
    const files = FileList.getFiles();
    const q = query.toLowerCase();
    const results = files.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10);
    this.showSuggestions(results, query);
  },

  showSuggestions(results, query) {
    const container = document.getElementById('search-suggestions');
    if (!results.length) { container.style.display = 'none'; return; }

    container.innerHTML = '';
    results.forEach(file => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      const highlighted = file.name.replace(new RegExp(query, 'gi'), m => `<mark style="background:var(--accent-light);color:var(--accent)">${m}</mark>`);
      item.innerHTML = `
        <div class="suggestion-icon" style="color:${IconMapper.getColor(file)}">${IconMapper.getIcon(file)}</div>
        <div class="suggestion-info">
          <div class="suggestion-name">${highlighted}</div>
          <div class="suggestion-meta">${PathUtils.getParent(file.path)} • ${file.isDirectory ? 'Folder' : FormatUtils.formatSize(file.size)}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        container.style.display = 'none';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').style.display = 'none';
        if (file.isDirectory) Navigation.navigateTo(file.path);
        else IPC.invoke('shell:openPath', file.path);
      });
      container.appendChild(item);
    });
    container.style.display = 'block';
  },

  // ── Recursive search (Enter key) ─────────────────────────
  async searchRecursive(query) {
    const tab = TabManager.getActiveTab();
    if (!tab || !tab.path) return;

    // Hide suggestions
    document.getElementById('search-suggestions').style.display = 'none';

    // Show loading
    FileList.showLoading();
    Footer.showStatus(`Searching for "${query}"...`, 'info');

    try {
      const result = await IPC.invoke('fs:search', tab.path, query);
      if (result.success) {
        FileList.showSearchResults(result.files, query);
        Footer.showStatus(`Found ${result.files.length} result${result.files.length !== 1 ? 's' : ''}`, 'success');
      } else {
        FileList.showEmpty();
        Footer.showStatus('Search failed: ' + result.error, 'error');
      }
    } catch (err) {
      FileList.showEmpty();
      Footer.showStatus('Search error: ' + err.message, 'error');
    }
  },

  // ── Clear search ─────────────────────────────────────────
  clearSearch() {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('search-clear');
    const suggestions = document.getElementById('search-suggestions');
    
    input.value = '';
    clear.style.display = 'none';
    suggestions.style.display = 'none';
    
    // If in search mode, refresh to show normal directory
    if (FileList._isSearchMode) {
      Navigation.refresh();
    }
  }
};
