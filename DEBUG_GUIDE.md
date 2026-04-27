# 🐛 Debug Guide - Create Folder Issue

## Quick Test Steps

### 1. Open DevTools Console (F12)
```bash
npm run dev
```

### 2. Test in Console Directly
Paste this in console to test IPC:

```javascript
// Test 1: Check if IPC is available
console.log('IPC available:', typeof window.vortexAPI);

// Test 2: Get current tab path
const tab = TabManager.getActiveTab();
console.log('Current path:', tab?.path);

// Test 3: Test mkdir directly
const testPath = 'C:\\Users\\HARIPADA\\Desktop\\TEST_FOLDER_' + Date.now();
window.vortexAPI.mkdir(testPath).then(result => {
  console.log('Direct mkdir result:', result);
});

// Test 4: Check PathUtils
console.log('PathUtils.join test:', PathUtils.join('C:\\Users', 'Test', 'Folder'));
```

### 3. Test Create Folder Flow

**Step by step:**

1. Navigate to Desktop or any folder
2. Right-click in empty area
3. Click "New Folder"
4. Watch console for these logs:
   ```
   📁 Creating folder in: C:\Users\HARIPADA\Desktop
   📁 Creating folder at: C:\Users\HARIPADA\Desktop\New Folder
   ✅ Create folder result: {success: true}
   ```

### 4. Common Issues & Fixes

#### Issue: "PathUtils is not defined"
**Fix:** Check if `pathUtils.js` is loaded before `contextMenu.js` in HTML

#### Issue: "TabManager.getActiveTab() returns null"
**Fix:** Make sure you're in a valid directory, not on empty tab

#### Issue: "Permission denied"
**Fix:** Try creating folder in a location where you have write permissions

#### Issue: "Folder created but not visible"
**Fix:** Check if `Navigation.refresh()` is being called

### 5. Manual Test Script

Run this in console to create folder without UI:

```javascript
async function testCreateFolder() {
  const tab = TabManager.getActiveTab();
  if (!tab || !tab.path) {
    console.error('No active tab or path');
    return;
  }
  
  const folderName = 'TEST_FOLDER_' + Date.now();
  const fullPath = PathUtils.join(tab.path, folderName);
  
  console.log('Testing folder creation...');
  console.log('Parent path:', tab.path);
  console.log('Folder name:', folderName);
  console.log('Full path:', fullPath);
  
  const result = await IPC.invoke('fs:mkdir', fullPath);
  console.log('Result:', result);
  
  if (result.success) {
    console.log('✅ SUCCESS! Refreshing...');
    Navigation.refresh();
  } else {
    console.error('❌ FAILED:', result.error);
  }
}

// Run test
testCreateFolder();
```

### 6. Check File System Directly

After attempting to create folder, check in Windows Explorer if folder was actually created.

**Possible scenarios:**
- ✅ Folder created, just not showing in UI → Refresh issue
- ❌ Folder not created → IPC/permission issue
- ⚠️ Error in console → Check error message

### 7. Enable Verbose Logging

Add this at top of `contextMenu.js`:

```javascript
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[ContextMenu]', ...args);
```

Then replace all `console.log` with `log`.

## Expected Console Output (Success)

```
📁 Creating folder in: C:\Users\HARIPADA\Desktop
📁 Creating folder at: C:\Users\HARIPADA\Desktop\New Folder
✅ Create folder result: {success: true}
🔄 Refreshing navigation...
📂 Loading path: C:\Users\HARIPADA\Desktop
✅ Loaded 15 files
```

## Expected Console Output (Failure)

```
📁 Creating folder in: C:\Users\HARIPADA\Desktop
📁 Creating folder at: C:\Users\HARIPADA\Desktop\New Folder
❌ Failed to create folder: EACCES: permission denied
```

## Quick Fixes

### Fix 1: Restart App
Sometimes Electron needs restart after code changes.

### Fix 2: Check Permissions
Try creating folder in `C:\Users\HARIPADA\Desktop\VORTEX\test`

### Fix 3: Simplify Path
Test with simple path like `C:\test_folder`

### Fix 4: Check if folder already exists
Delete any existing "New Folder" before testing.

## Report Issue

If still not working, provide:
1. Console output (full)
2. Windows version
3. Path where you're trying to create folder
4. Any error messages
