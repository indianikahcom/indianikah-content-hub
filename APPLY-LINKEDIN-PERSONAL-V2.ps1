param(
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRootResolved = (Resolve-Path $ProjectRoot).Path
$source = Join-Path $packageRoot "backend\src\services\platformPublishers.js"
$target = Join-Path $projectRootResolved "backend\src\services\platformPublishers.js"

if (-not (Test-Path $source)) {
    throw "Package source file not found: $source"
}

$sourceResolved = (Resolve-Path $source).Path

if (Test-Path $target) {
    $targetResolved = (Resolve-Path $target).Path

    if ($sourceResolved -eq $targetResolved) {
        Write-Host "The package file is already inside the project at the destination path."
        Write-Host "No copy is required. The LinkedIn personal publisher is already present."
        exit 0
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "$target.backup-$timestamp"
    Copy-Item $target $backup -Force
    Write-Host "Backup created: $backup"
} else {
    $targetDirectory = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
}

Copy-Item $source $target -Force

Write-Host ""
Write-Host "LinkedIn personal/organization publisher v2 installed."
Write-Host "Updated: $target"
Write-Host ""
Write-Host "Restart the backend, then test:"
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3000/api/platforms/linkedin/test" -Method Get | ConvertTo-Json -Depth 10'
