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
$TempTar    = "$env:TEMP\personal-site-deploy.tar.gz"
$RemoteTar  = "/tmp/personal-site-deploy.tar.gz"
$CtrlSocket = "$env:TEMP\personal-site-deploy.socket"

# SSH options: ControlMaster for connection reuse (single password prompt)
$SSHOpts = "-o StrictHostKeyChecking=no -o ControlMaster=auto -o ControlPath=`"$CtrlSocket`" -o ControlPersist=120"

# ── Banner ──────────────────────────────────────────────────
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Personal Site - Deploy to Server" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server: ${ServerUser}@${ServerIP}" -ForegroundColor Yellow
Write-Host "  Target: ${RemoteDir}" -ForegroundColor Yellow
Write-Host ""

Push-Location $PSScriptRoot
try {
    # ── Step 1: Pack files locally ──────────────────────────
    Write-Host "--- [1/3] Packing files locally ---" -ForegroundColor Green

    $dirs = @("index.html", "css", "js", "images", "achievements", "awards", "docs")
    $existing = @()
    foreach ($d in $dirs) {
        if (Test-Path $d) { $existing += $d }
    }

    Write-Host "  -> Scanning: $($existing -join ', ')"
    $fileCount = 0
    foreach ($d in $existing) {
        $fileCount += (Get-ChildItem -Path $d -Recurse -File -ErrorAction SilentlyContinue).Count
    }
    Write-Host "  -> Found ${fileCount} files"

    Write-Host "  -> Compressing into archive..."
    # Use cmd /c for reliable tar binary pipe (PowerShell would corrupt it)
    $packArgs = ($existing -join ' ')
    $packCmd = "tar czf `"$TempTar`" $packArgs 2>nul"
    cmd /c $packCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  -> Failed to pack files!" -ForegroundColor Red
        exit 1
    }
    $sizeBytes = (Get-Item $TempTar).Length
    if ($sizeBytes -gt 1MB) {
        $sizeStr = "{0:F1} MB" -f ($sizeBytes / 1MB)
    } elseif ($sizeBytes -gt 1KB) {
        $sizeStr = "{0:F0} KB" -f ($sizeBytes / 1KB)
    } else {
        $sizeStr = "${sizeBytes} B"
    }
    Write-Host "  -> Archive created (${sizeStr})" -ForegroundColor Green
    Write-Host ""

    # ── Step 2: Establish connection + upload ────────────────
    Write-Host "--- [2/3] Uploading to server ---" -ForegroundColor Green
    Write-Host "  -> Connecting to ${ServerUser}@${ServerIP} ..."
    Write-Host "  -> (Enter password when prompted — only once)"

    # Establish master SSH connection in background
    $masterCmd = "ssh $SSHOpts -f -N ${ServerUser}@${ServerIP}"
    cmd /c $masterCmd 2>$null
    Write-Host "  -> Connection established (reuse for all subsequent steps)" -ForegroundColor Green

    Write-Host "  -> Transferring ${sizeStr} ..."

    # scp reuses the master connection (no second password)
    $scpCmd = "scp $SSHOpts `"$TempTar`" ${ServerUser}@${ServerIP}:${RemoteTar}"
    cmd /c $scpCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERROR] Upload failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  -> Upload complete!" -ForegroundColor Green
    Write-Host ""

    # ── Step 3: Deploy on server ────────────────────────────
    Write-Host "--- [3/3] Deploying on server ---" -ForegroundColor Green

    # Build a remote script string (escaping for SSH)
    $remoteScript = @"
set -e

echo '  -> Cleaning old files...'
sudo rm -rf "${RemoteDir}"/* 2>/dev/null || true
echo '  -> Old files removed'

echo '  -> Fixing directory ownership...'
sudo chown ubuntu:ubuntu "${RemoteDir}"
echo '  -> Ownership set'

echo '  -> Extracting archive...'
sudo -u ubuntu tar xzf "${RemoteTar}" -C "${RemoteDir}"
echo '  -> Files extracted'

echo '  -> Setting permissions (755)...'
sudo chmod -R 755 "${RemoteDir}"
echo '  -> Permissions set'

echo '  -> Reloading Nginx...'
sudo systemctl reload nginx
echo '  -> Nginx reloaded'

echo '  -> Cleaning up temp archive...'
rm -f "${RemoteTar}"
echo '  -> Temp file removed'

echo '  >> ALL_OK'
"@

    # Use bash -s to pass the script (reuses master connection)
    $remoteScript | ssh $SSHOpts "${ServerUser}@${ServerIP}" "bash -s"
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERROR] Remote deployment failed!" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
} finally {
    # Close master connection and cleanup temp files
    $exitCmd = "ssh -o ControlPath=`"$CtrlSocket`" -O exit ${ServerUser}@${ServerIP} 2>nul"
    cmd /c $exitCmd | Out-Null
    if (Test-Path $TempTar) { Remove-Item $TempTar -Force }
    if (Test-Path $CtrlSocket) { Remove-Item $CtrlSocket -Force }
    Pop-Location
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Deploy complete!" -ForegroundColor Green
Write-Host "  Visit: http://${ServerIP}" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
