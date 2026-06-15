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

echo "=============================================="
echo "  Personal Site - Deploy to Server"
echo "=============================================="
echo ""
echo "  Server: ${SERVER_USER}@${SERVER_IP}"
echo "  Target: ${REMOTE_DIR}"
echo ""

# Change to script directory
cd "$(dirname "$0")"

echo "[1/2] Uploading files + setting permissions..."

# Pack files and pipe via SSH
# Remote chain: clear old + fix parent owner (sudo) -> extract (ubuntu) -> chmod 755 (sudo) -> reload nginx
tar czf - index.html css js images achievements awards docs 2>/dev/null | \
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
    "sudo rm -rf ${REMOTE_DIR}/* 2>/dev/null; \
     sudo chown ubuntu:ubuntu ${REMOTE_DIR}; \
     tar xzf - -C ${REMOTE_DIR} && \
     sudo chmod -R 755 ${REMOTE_DIR} && \
     sudo systemctl reload nginx && \
     echo ALL_OK"

echo ""
echo "[2/2] Done!"

echo ""
echo "=============================================="
echo "  Deploy complete!"
echo "  Visit: http://${SERVER_IP}"
echo "=============================================="
