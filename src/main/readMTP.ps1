param(
    [string]$DeviceName,
    [string]$SubPath = ""
)

$ErrorActionPreference = 'Stop'

try {
    Write-Host "Starting..."
    Write-Host "Device: $DeviceName"
    Write-Host "SubPath: $SubPath"
    
    $shell = New-Object -ComObject Shell.Application
    $computer = $shell.NameSpace(17)
    
    # Find the device
    $device = $null
    foreach ($item in $computer.Items()) {
        if ($item.Name -eq $DeviceName) {
            $device = $item
            Write-Host "Device found: $($item.Name)"
            break
        }
    }
    
    if ($device -eq $null) {
        Write-Output "ERROR:Device not found"
        exit 1
    }
    
    # Start from device root
    $folder = $device.GetFolder
    Write-Host "Got device folder"
    
    # Navigate to subfolder if specified
    if ($SubPath -ne "") {
        $pathParts = $SubPath -split '\\'
        foreach ($part in $pathParts) {
            if ($part -ne "") {
                Write-Host "Navigating to: $part"
                $found = $false
                foreach ($item in $folder.Items()) {
                    if ($item.Name -eq $part) {
                        $folder = $item.GetFolder
                        $found = $true
                        Write-Host "Found: $part"
                        break
                    }
                }
                if (-not $found) {
                    Write-Output "ERROR:Folder not found: $part"
                    exit 1
                }
            }
        }
    }
    
    # Read items in current folder
    $items = @()
    foreach ($item in $folder.Items()) {
        # Skip metadata fetching for faster loading
        $size = 0
        $modified = (Get-Date).ToString("o")
        
        # Only get size for files if needed (skip for faster loading)
        # try {
        #     if (-not $item.IsFolder) {
        #         $size = [int64]$item.Size
        #     }
        #     $modified = $item.ModifyDate.ToString("o")
        # } catch {}
        
        $itemPath = "Computer\$DeviceName"
        if ($SubPath -ne "") {
            $itemPath += "\$SubPath"
        }
        $itemPath += "\$($item.Name)"
        
        $items += @{
            Name = $item.Name
            Path = $itemPath
            IsDirectory = $item.IsFolder
            Size = $size
            Modified = $modified
        }
    }
    
    Write-Host "Total items: $($items.Count)"
    
    if ($items.Count -eq 0) {
        Write-Output "[]"
    } else {
        Write-Output ($items | ConvertTo-Json -Compress)
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Stack: $($_.ScriptStackTrace)"
    exit 1
}
