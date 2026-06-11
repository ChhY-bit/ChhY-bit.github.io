# ============================================================
# Windows deploy script
# Upload all website files to Ubuntu server in ONE shot
# Prerequisite: server-setup.sh has been run on the server
# Usage: .\deploy.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ServerUser = "ubuntu"
$ServerIP   = "193.112.175.76"
$RemoteDir  = "/var/www/personal-site"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Personal Site - Deploy to Server" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server: ${ServerUser}@${ServerIP}" -ForegroundColor Yellow
Write-Host "  Target: ${RemoteDir}" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/2] Uploading files + setting permissions..." -ForegroundColor Green

# PowerShell corrupts binary pipe data, so we use cmd /c to run tar|ssh
# Remote chain: clear old + fix parent owner (sudo) -> extract (ubuntu) -> chmod 755 (sudo) -> reload nginx
# We keep owner as ubuntu, nginx reads via 755 (world-readable)
$deployCmd = "tar czf - index.html css js images achievements awards docs 2>nul | ssh -o StrictHostKeyChecking=no ${ServerUser}@${ServerIP} `"sudo rm -rf ${RemoteDir}/* 2>/dev/null; sudo chown ubuntu:ubuntu ${RemoteDir}; tar xzf - -C ${RemoteDir} && sudo chmod -R 755 ${RemoteDir} && sudo systemctl reload nginx && echo ALL_OK`""

Push-Location $PSScriptRoot
try {
    cmd /c $deployCmd

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERROR] Deploy failed!" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "[2/2] Done!" -ForegroundColor Green

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Deploy complete!" -ForegroundColor Green
Write-Host "  Visit: http://${ServerIP}" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
