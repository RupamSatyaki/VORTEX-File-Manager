/* MTP Device Helper - Access phones and portable devices */
const { exec } = require('child_process');
const path = require('path');

class MTPHelper {
  // Read directory from portable device using PowerShell
  async readDir(devicePath) {
    return new Promise((resolve) => {
      // Extract device name and subpath from path (Computer\DeviceName\SubPath)
      const pathParts = devicePath.replace('Computer\\', '').split('\\');
      const deviceName = pathParts[0];
      const subPath = pathParts.slice(1).join('\\');
      
      console.log('📱 Reading device:', deviceName, 'SubPath:', subPath || '(root)');
      
      // Use PowerShell script file
      const scriptPath = path.join(__dirname, 'readMTP.ps1');
      const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -DeviceName "${deviceName.replace(/"/g, '""')}" -SubPath "${subPath.replace(/"/g, '""')}"`;
      
      console.log('📱 Executing:', command);
      
      exec(command, {
        timeout: 20000,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        cwd: __dirname
      }, (err, stdout, stderr) => {
        console.log('📱 PowerShell stdout:', stdout);
        if (stderr) console.log('📱 PowerShell stderr:', stderr);
        if (err) console.log('📱 Exec error:', err.message);
        
        // Extract JSON from output (ignore Write-Host lines)
        const lines = stdout.split('\n');
        const jsonLine = lines.find(l => {
          const trimmed = l.trim();
          return trimmed.startsWith('[') || trimmed.startsWith('{');
        });
        
        if (stdout.includes('ERROR:')) {
          const errorMsg = stdout.split('ERROR:')[1].split('\n')[0].trim();
          console.error('📱 MTP error:', errorMsg);
          return resolve({ success: false, error: errorMsg });
        }
        
        if (!jsonLine) {
          console.log('📱 No JSON found');
          return resolve({ success: true, files: [] });
        }
        
        const output = jsonLine.trim();
        console.log('📱 JSON:', output.substring(0, 200));
        
        if (output === '[]') {
          return resolve({ success: true, files: [] });
        }
        
        try {
          let result = JSON.parse(output);
          if (!Array.isArray(result)) result = [result];
          
          const files = result.map(item => ({
            name: item.Name,
            path: item.Path,
            isDirectory: item.IsDirectory,
            size: item.Size || 0,
            modified: new Date(item.Modified).getTime(),
            created: new Date(item.Modified).getTime(),
            ext: item.IsDirectory ? '' : path.extname(item.Name).toLowerCase().slice(1)
          }));
          
          console.log(`📱 Success: ${files.length} items`, files.map(f => f.name));
          resolve({ success: true, files });
        } catch (e) {
          console.error('📱 Parse error:', e.message);
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });
  }
}

module.exports = new MTPHelper();
