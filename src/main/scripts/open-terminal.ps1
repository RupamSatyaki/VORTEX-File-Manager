# Vortex File Manager — Open Terminal Here
# Usage: powershell.exe -NoExit -File "open-terminal.ps1" -Path "C:\some\folder"
param(
    [string]$Path = $PWD
)

# Set window title
$host.UI.RawUI.WindowTitle = "Terminal — $Path"

# Navigate to the folder
if (Test-Path $Path) {
    Set-Location $Path
    Write-Host "Vortex File Manager — Terminal" -ForegroundColor Cyan
    Write-Host "Location: $Path" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Path not found: $Path" -ForegroundColor Red
}
