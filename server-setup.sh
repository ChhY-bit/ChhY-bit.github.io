#!/bin/bash
# ============================================================
# Ubuntu 22.04 服务器端配置脚本
# 用途：安装 Nginx 并配置静态网站托管
# 运行方式：在服务器上执行 bash server-setup.sh
# ============================================================

set -e

DOMAIN="193.112.175.76"
SITE_DIR="/var/www/personal-site"
NGINX_CONF="/etc/nginx/sites-available/personal-site"
NGINX_ENABLED="/etc/nginx/sites-enabled/personal-site"

echo "=============================================="
echo "  个人学术主页 - 服务器部署配置"
echo "=============================================="
echo ""

# 1. 更新系统并安装 Nginx
echo "[1/5] 更新系统并安装 Nginx..."
sudo apt update -y
sudo apt install -y nginx

# 2. 创建网站目录
echo "[2/5] 创建网站目录: ${SITE_DIR}"
sudo mkdir -p ${SITE_DIR}
sudo chown -R $USER:$USER ${SITE_DIR}

# 3. 创建 Nginx 配置文件
echo "[3/5] 配置 Nginx..."
sudo tee ${NGINX_CONF} > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;

    # 替换为你的域名或 IP
    server_name 193.112.175.76;

    root /var/www/personal-site;
    index index.html;

    # 访问日志
    access_log /var/log/nginx/personal-site-access.log;
    error_log /var/log/nginx/personal-site-error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|svg|ico|css|js|json|pdf)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # 主站点配置
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_EOF

# 4. 启用站点
echo "[4/5] 启用站点配置..."
sudo ln -sf ${NGINX_CONF} ${NGINX_ENABLED}

# 删除默认站点（避免冲突）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 5. 重启 Nginx
echo "[5/5] 重启 Nginx 服务..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=============================================="
echo "  服务器配置完成！"
echo "=============================================="
echo ""
echo "  网站目录: ${SITE_DIR}"
echo "  访问地址: http://${DOMAIN}"
echo ""
echo "  下一步：将网站文件上传到 ${SITE_DIR}"
echo "  在 Windows 本地执行: .\\deploy.ps1"
echo ""
echo "  (可选) 配置 HTTPS 证书:"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d your-domain.com"
echo ""
