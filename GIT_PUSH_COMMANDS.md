# 🚀 Git Push Commands

## Initial Setup & Push to GitHub

Run these commands in **Git Bash** or **PowerShell** from the `vortex-file-manager` directory:

### Step 1: Initialize Git Repository
```bash
cd vortex-file-manager
git init
```

### Step 2: Add Remote Repository
```bash
git remote add origin https://github.com/RupamSatyaki/VORTEX-File-Manager.git
```

### Step 3: Configure Git (if not already done)
```bash
git config user.name "Rupam Satyaki"
git config user.email "your-email@example.com"
```

### Step 4: Add All Files
```bash
git add .
```

### Step 5: Create Initial Commit
```bash
git commit -m "🎉 Initial commit: Vortex File Manager v1.0.0

Features:
- Glassmorphism UI with transparent window
- Multi-tab file browsing
- Grid/List/Details views
- Inline file/folder creation and rename
- Recursive search with results view
- Live disk usage with color coding
- Context menus with shortcuts
- Bookmarks and quick access
- Dark/Light themes with accent colors
- Dev mode with auto-reload
- Full keyboard shortcuts support

Tech Stack:
- Electron 28
- Vanilla JavaScript (modular architecture)
- CSS with glassmorphism effects
- Chokidar for file watching
- IPC for main-renderer communication"
```

### Step 6: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## Alternative: If Repository Already Has Content

If the GitHub repo already has files (like README), use force push:

```bash
git push -u origin main --force
```

⚠️ **Warning:** This will overwrite any existing content on GitHub!

---

## Verify Push

After pushing, check:
1. Go to: https://github.com/RupamSatyaki/VORTEX-File-Manager
2. Verify all files are uploaded
3. Check README is displaying correctly

---

## Future Updates

For future commits:

```bash
# Make changes to files
git add .
git commit -m "Your commit message"
git push
```

---

## Common Issues

### Issue: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/RupamSatyaki/VORTEX-File-Manager.git
```

### Issue: "failed to push some refs"
```bash
git pull origin main --rebase
git push origin main
```

### Issue: Authentication required
Use GitHub Personal Access Token instead of password:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with 'repo' scope
3. Use token as password when prompted

---

## Quick Copy-Paste Commands

```bash
cd vortex-file-manager
git init
git remote add origin https://github.com/RupamSatyaki/VORTEX-File-Manager.git
git add .
git commit -m "🎉 Initial commit: Vortex File Manager v1.0.0"
git branch -M main
git push -u origin main
```

---

## Files Being Pushed

✅ Source code (main.js, preload.js, src/)
✅ Documentation (README.md, LICENSE, docs/)
✅ Configuration (package.json, .gitignore)
✅ Debug guides (TEST_OPERATIONS.md, DEBUG_GUIDE.md)

❌ node_modules/ (excluded by .gitignore)
❌ dist/ (excluded by .gitignore)
❌ package-lock.json (excluded by .gitignore)

---

**Total Files:** ~50+ files
**Total Size:** ~500KB (without node_modules)

Good luck! 🚀
