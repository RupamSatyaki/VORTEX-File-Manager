# Vortex File Manager — Restore item from Recycle Bin
param([string]$ItemPath)

$shell = New-Object -ComObject Shell.Application
$rb = $shell.Namespace(10)
foreach ($item in $rb.Items()) {
    if ($item.Path -eq $ItemPath) {
        $item.InvokeVerb('undelete')
        Write-Output "restored"
        exit 0
    }
}
Write-Output "not_found"
