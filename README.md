# 🌪️ Vortex File Manager

A modern, fast, and powerful file manager built with Electron featuring glassmorphism UI design.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Electron](https://img.shields.io/badge/electron-28.0.0-blue.svg)

## ✨ Features

### 🎨 Modern UI
- **Glassmorphism Design** - Transparent window with desktop wallpaper blur
- **Dark/Light Themes** - Multiple theme options
- **Custom Accent Colors** - Blue, Purple, Pink, Green, Orange, Teal
- **Smooth Animations** - Fluid transitions and interactions
- **macOS-style Window Controls** - Colored dots for close/minimize/maximize

### 📁 File Operations
- **Create/Delete/Rename** - Full CRUD operations with inline editing
- **Copy/Cut/Paste** - Clipboard operations with visual feedback
- **Drag & Drop** - Move files by dragging (coming soon)
- **Batch Operations** - Multi-select and bulk actions
- **Context Menus** - Right-click menus with shortcuts

### 🔍 Search & Navigation
- **Instant Search** - Type-ahead search with suggestions
- **Recursive Search** - Deep search with Enter key (max 300 results, depth 4)
- **Breadcrumb Navigation** - Click segments to navigate
- **Back/Forward History** - Browser-like navigation
- **Quick Access** - Sidebar with Home, Desktop, Downloads, etc.

### 📊 Views & Display
- **Grid View** - Large icons with names
- **List View** - Compact list with metadata
- **Details View** - Sortable table with full info
- **Dual Pane** - Side-by-side browsing (coming soon)

### 💾 Storage & Drives
- **Live Disk Usage** - Real-time storage bars with color coding
  - 🟢 Green: < 70% used
  - 🟠 Orange: 70-90% used
  - 🔴 Red: > 90% used
- **Drive Enumeration** - All connected drives in sidebar
- **Auto-refresh** - Updates every 30 seconds

### ⌨️ Keyboard Shortcuts
- `Ctrl+N` - New File
- `Ctrl+Shift+N` - New Folder
- `Ctrl+C/X/V` - Copy/Cut/Paste
- `Ctrl+A` - Select All
- `Ctrl+F` - Focus Search
- `Ctrl+L` - Edit Address Bar
- `Ctrl+T` - New Tab
- `Ctrl+W` - Close Tab
- `Ctrl+B` - Toggle Sidebar
- `Ctrl+1/2/3` - Switch Views
- `F2` - Rename
- `F5` - Refresh
- `Delete` - Delete with confirmation
- `Alt+←/→` - Back/Forward
- `Alt+↑` - Go Up
- `Esc` - Clear Search / Deselect

### 🔖 Bookmarks & Tabs
- **Multi-tab Support** - Multiple folders in tabs
- **Bookmarks** - Save favorite locations
- **Session Restore** - Reopens last tabs on startup

### 🛠️ Developer Features
- **Dev Mode** - Auto-reload on file changes
- **Console Logging** - Detailed operation logs
- **DevTools** - Built-in debugging

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- Windows 10/11 (primary), macOS, Linux (experimental)

### Setup
```bash
# Clone repository
git clone https://github.com/RupamSatyaki/VORTEX-File-Manager.git
cd VORTEX-File-Manager/vortex-file-manager

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Build for Windows
npm run build
```

## 📖 Usage

### Basic Operations
1. **Navigate** - Click folders to open, use breadcrumbs or sidebar
2. **Create** - Right-click → New Folder/File, or use toolbar buttons
3. **Rename** - Select file → Press F2 → Edit inline
4. **Delete** - Select files → Press Delete → Confirm
5. **Search** - Type in search bar → Press Enter for deep search

### Advanced Features
- **Multi-select** - Ctrl+Click or Shift+Click
- **Properties** - Right-click → Properties for file details
- **Copy Path** - Right-click → Copy Path to clipboard
- **Show in Explorer** - Right-click → Show in Explorer

## 🏗️ Project Structure

```
vortex-file-manager/
├── main.js                 # Electron main process
├── preload.js             # IPC bridge
├── package.json           # Dependencies & scripts
├── src/
│   ├── renderer/
│   │   ├── index.html     # Main HTML
│   │   ├── css/           # Stylesheets (11 files)
│   │   │   ├── themes.css
│   │   │   ├── main.css
│   │   │   ├── header.css
│   │   │   ├── sidebar.css
│   │   │   ├── file-list.css
│   │   │   └── ...
│   │   └── js/            # JavaScript modules
│   │       ├── core/      # Core systems
│   │       │   ├── app.js
│   │       │   ├── ipc.js
│   │       │   ├── events.js
│   │       │   └── storage.js
│   │       ├── ui/        # UI components
│   │       │   ├── header.js
│   │       │   ├── sidebar.js
│   │       │   ├── fileList.js
│   │       │   ├── tabs.js
│   │       │   ├── contextMenu.js
│   │       │   ├── dialogs.js
│   │       │   └── ...
│   │       ├── features/  # Features
│   │       │   ├── navigation.js
│   │       │   ├── selection.js
│   │       │   ├── copyPaste.js
│   │       │   ├── bookmarks.js
│   │       │   └── shortcuts.js
│   │       └── utils/     # Utilities
│   │           ├── formatUtils.js
│   │           ├── pathUtils.js
│   │           └── iconMapper.js
│   └── assets/
│       └── icon.png
└── docs/
    ├── CONTEXT.txt
    ├── FEATURES.md
    ├── SHORTCUTS.md
    └── ...
```

## 🎨 Customization

### Themes
Edit `src/renderer/css/themes.css` to customize colors:
```css
:root {
  --accent: #3b82f6;        /* Primary accent color */
  --glass-bg: rgba(...);    /* Background transparency */
  --blur: blur(40px);       /* Blur intensity */
}
```

### Accent Colors
Available presets: `blue`, `purple`, `pink`, `green`, `orange`, `teal`

Change in settings or modify `data-accent` attribute.

## 🐛 Debugging

### Enable Dev Mode
```bash
npm run dev
```

Features:
- Auto-reload on file changes (HTML, CSS, JS)
- DevTools open automatically
- Console logging for all operations

### Debug Console Commands
```javascript
// Test IPC
window.vortexAPI.mkdir('C:\\test').then(console.log);

// Check current path
TabManager.getActiveTab()?.path

// Test path joining
PathUtils.join('C:\\Users', 'Test', 'Folder')
```

See `DEBUG_GUIDE.md` for detailed debugging steps.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Icons inspired by [Lucide](https://lucide.dev/)
- UI design inspired by modern file managers

## 📧 Contact

**Rupam Satyaki**
- GitHub: [@RupamSatyaki](https://github.com/RupamSatyaki)
- Repository: [VORTEX-File-Manager](https://github.com/RupamSatyaki/VORTEX-File-Manager)

## 🗺️ Roadmap

- [ ] File Preview Panel (Quick Look)
- [ ] Drag & Drop Support
- [ ] Image Thumbnails
- [ ] Archive Support (ZIP, RAR)
- [ ] Recent Files List
- [ ] Advanced Filtering
- [ ] Batch Rename
- [ ] Cloud Storage Integration
- [ ] Plugin System

---

**Made with ❤️ by Vortex Team**
