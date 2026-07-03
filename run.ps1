# One command: setup DB + start backend (PowerShell)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host '=== Step 1: Database Setup ===' -ForegroundColor Cyan
& "$Root\setup-database.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ''
Write-Host '=== Step 2: Start Backend ===' -ForegroundColor Cyan
& "$Root\start-backend.ps1"
