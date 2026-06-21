#!/bin/bash
# ============================================================
# Linux deploy script
# Upload all website files to Ubuntu server in ONE shot
# Prerequisite: server-setup.sh has been run on the server
# Usage: bash deploy.sh
# ============================================================

set -e

SERVER_USER="ubuntu"
SERVER_IP="193.112.175.76"
REMOTE_DIR="/var/www/personal-site"
TAR_FILE="/tmp/personal-site-deploy-$$.tar.gz"
CTRL_SOCKET="/tmp/personal-site-deploy-$$.socket"

# SSH options: ControlMaster for connection reuse (single password prompt)
SSH_OPTS="-o StrictHostKeyChecking=no -o ControlMaster=auto -o ControlPath=${CTRL_SOCKET} -o ControlPersist=120"

echo "=============================================="
echo "  Personal Site - Deploy to Server"
echo "=============================================="
echo ""
echo "  Server: ${SERVER_USER}@${SERVER_IP}"
echo "  Target: ${REMOTE_DIR}"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Cleanup temp files and close master connection on exit
cleanup() {
    ssh -o ControlPath="${CTRL_SOCKET}" -O exit "${SERVER_USER}@${SERVER_IP}" 2>/dev/null || true
    rm -f "${TAR_FILE}" "${CTRL_SOCKET}"
}
trap cleanup EXIT

# ── Step 1: Pack files locally ─────────────────────────────
echo "━━━ [1/3] Packing files locally ━━━"

# Count files and estimate total
FILE_COUNT=$(find index.html css js images achievements awards docs -type f 2>/dev/null | wc -l)
echo "  → Scanning: index.html css/ js/ images/ achievements/ awards/ docs/"
echo "  → Found ${FILE_COUNT} files"

echo "  → Compressing into archive..."
if tar czf "${TAR_FILE}" index.html css js images achievements awards docs 2>/dev/null; then
    TAR_SIZE=$(du -h "${TAR_FILE}" | cut -f1)
    echo "  ✓ Archive created (${TAR_SIZE})"
else
    echo "  ✗ Failed to pack files!"
    exit 1
fi
echo ""

# ── Step 2: Establish connection + upload ──────────────────
echo "━━━ [2/3] Uploading to server ━━━"
echo "  → Connecting to ${SERVER_USER}@${SERVER_IP} ..."
echo "  → (Enter password when prompted — only once)"

# Establish master SSH connection in background
ssh ${SSH_OPTS} -f -N "${SERVER_USER}@${SERVER_IP}"
echo "  ✓ Connection established (reuse for all subsequent steps)"

echo "  → Transferring ${TAR_SIZE} ..."

# scp reuses the master connection (no second password)
scp ${SSH_OPTS} "${TAR_FILE}" \
    "${SERVER_USER}@${SERVER_IP}:/tmp/personal-site-deploy.tar.gz"

echo "  ✓ Upload complete!"
echo ""

# ── Step 3: Deploy on server ───────────────────────────────
echo "━━━ [3/3] Deploying on server ━━━"

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} bash -s -- "${REMOTE_DIR}" << 'REMOTE_SCRIPT'
REMOTE_DIR="$1"
TAR_PATH="/tmp/personal-site-deploy.tar.gz"

set -e

echo "  → Cleaning old files..."
sudo rm -rf "${REMOTE_DIR:?}"/* 2>/dev/null || true
echo "  ✓ Old files removed"

echo "  → Fixing directory ownership..."
sudo chown ubuntu:ubuntu "${REMOTE_DIR}"
echo "  ✓ Ownership set"

echo "  → Extracting archive (use 'sudo -u ubuntu' to keep correct owner)..."
sudo -u ubuntu tar xzf "${TAR_PATH}" -C "${REMOTE_DIR}"
echo "  ✓ Files extracted"

echo "  → Setting permissions (755)..."
sudo chmod -R 755 "${REMOTE_DIR}"
echo "  ✓ Permissions set"

echo "  → Reloading Nginx..."
sudo systemctl reload nginx
echo "  ✓ Nginx reloaded"

echo "  → Cleaning up temp archive..."
rm -f "${TAR_PATH}"
echo "  ✓ Temp file removed"

echo "  ◆ ALL_OK"
REMOTE_SCRIPT

echo ""
echo "=============================================="
echo "  ✔  Deploy complete!"
echo "  Visit: http://${SERVER_IP}"
echo "=============================================="
