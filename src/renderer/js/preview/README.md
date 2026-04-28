# Image Preview System

Complete image preview system with glassmorphism design.

## Structure

```
preview/
├── index.js              # Main controller
├── integration.js        # FileList integration
├── components/
│   ├── toolbar.js       # Top toolbar with controls
│   ├── viewer.js        # Image viewer with zoom/pan
│   └── sidebar.js       # Info sidebar
└── README.md
```

## Features

### Viewer
- ✅ Full-screen overlay
- ✅ Zoom in/out (mouse wheel, +/- keys)
- ✅ Pan when zoomed (drag with mouse)
- ✅ Reset zoom (double-click, 0 key)
- ✅ Smooth transitions

### Navigation
- ✅ Previous/Next buttons
- ✅ Arrow key navigation
- ✅ Image counter (1/10)
- ✅ Auto-filter image files

### Toolbar
- ✅ Close button (Esc)
- ✅ File name display
- ✅ Zoom controls
- ✅ Toggle info panel
- ✅ Open in default app
- ✅ Show in folder

### Sidebar
- ✅ File information (name, type, size, date, path)
- ✅ Image dimensions (auto-detected)
- ✅ Keyboard shortcuts guide
- ✅ Toggle visibility (I key)

## Usage

### Open Preview
```javascript
// Double-click on image in grid/list view
// Or programmatically:
ImagePreview.open(file, allFiles);
```

### Keyboard Shortcuts
- `Esc` - Close preview
- `←` `→` - Navigate images
- `+` `-` - Zoom in/out
- `0` - Reset zoom
- `I` - Toggle info panel
- `Double Click` - Reset zoom

## Integration

The preview system automatically integrates with:
- FileList (double-click handler)
- ContextMenu (Preview Image option)
- Keyboard shortcuts

## Styling

CSS located at: `css/preview/image-preview.css`
- Glassmorphism design
- Dark overlay background
- Smooth animations
- Responsive layout
