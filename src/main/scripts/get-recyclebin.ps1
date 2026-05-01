# Vortex File Manager — Get Recycle Bin Items
$shell = New-Object -ComObject Shell.Application
$rb = $shell.Namespace(10)
$items = $rb.Items()

$result = @()
foreach ($item in $items) {
    $result += [PSCustomObject]@{
        Name     = $item.Name
        Path     = $item.Path
        Size     = $item.Size
        IsFolder = $item.IsFolder
        Date     = $rb.GetDetailsOf($item, 2)
        OrigPath = $rb.GetDetailsOf($item, 1)
    }
}

$result | ConvertTo-Json -Compress -Depth 2
