/* Address Bar Component */
const AddressBar = {
  _editing: false,

  init() {
    const bar = document.getElementById('address-bar');
    const input = document.getElementById('path-input');

    // Click on bar to edit
    bar.addEventListener('click', (e) => {
      if (!e.target.closest('.breadcrumb-item') && !this._editing) {
        this.enableEdit();
      }
    });

    // Input: navigate on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) Navigation.navigateTo(val);
        this.disableEdit();
      }
      if (e.key === 'Escape') this.disableEdit();
    });

    input.addEventListener('blur', () => this.disableEdit());

    Events.on('navigation:pathChanged', ({ path }) => {
      if (!this._editing) this.render(path);
    });
  },

  render(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    
    // Handle special "This PC" path
    if (path === 'thispc://') {
      breadcrumb.innerHTML = '';
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = '🖥️ This PC';
      item.style.fontWeight = '600';
      breadcrumb.appendChild(item);
      return;
    }
    
    // Handle portable device paths (Computer\DeviceName\...)
    if (path.startsWith('Computer\\')) {
      breadcrumb.innerHTML = '';
      
      const parts = path.replace('Computer\\', '').split('\\');
      
      // Add "This PC" root
      const rootItem = document.createElement('span');
      rootItem.className = 'breadcrumb-item';
      rootItem.textContent = '🖥️ This PC';
      rootItem.addEventListener('click', (e) => {
        e.stopPropagation();
        Navigation.navigateTo('thispc://');
      });
      breadcrumb.appendChild(rootItem);
      
      // Add separator
      const sep1 = document.createElement('span');
      sep1.className = 'breadcrumb-separator';
      sep1.textContent = '›';
      breadcrumb.appendChild(sep1);
      
      // Add device name and path segments
      parts.forEach((part, i) => {
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        item.textContent = i === 0 ? `📱 ${part}` : part;
        
        const segmentPath = 'Computer\\' + parts.slice(0, i + 1).join('\\');
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          Navigation.navigateTo(segmentPath);
        });
        breadcrumb.appendChild(item);
        
        if (i < parts.length - 1) {
          const sep = document.createElement('span');
          sep.className = 'breadcrumb-separator';
          sep.textContent = '›';
          breadcrumb.appendChild(sep);
        }
      });
      
      return;
    }
    
    const segments = PathUtils.getSegments(path);
    breadcrumb.innerHTML = '';

    segments.forEach((seg, i) => {
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = seg.label;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        Navigation.navigateTo(seg.path);
      });
      breadcrumb.appendChild(item);

      if (i < segments.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = '›';
        breadcrumb.appendChild(sep);
      }
    });
  },

  enableEdit() {
    this._editing = true;
    const breadcrumb = document.getElementById('breadcrumb');
    const input = document.getElementById('path-input');
    const tab = TabManager.getActiveTab();
    breadcrumb.style.display = 'none';
    input.style.display = 'block';
    input.value = tab ? tab.path : '';
    input.focus();
    input.select();
  },

  disableEdit() {
    this._editing = false;
    const breadcrumb = document.getElementById('breadcrumb');
    const input = document.getElementById('path-input');
    breadcrumb.style.display = '';
    input.style.display = 'none';
  }
};
