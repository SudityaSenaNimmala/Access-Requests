#!/bin/bash
# ==============================================================================
# SSL Certificate Setup Script for DB Access Request Tool
# Uses Let's Encrypt with Certbot
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔐 SSL Certificate Setup for DB Access Request Tool${NC}"
echo "=============================================="

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Domain name is required!${NC}"
    echo ""
    echo "Usage: ./setup-ssl.sh yourdomain.com [email@example.com]"
    echo ""
    echo "Examples:"
    echo "  ./setup-ssl.sh dbaccess.mycompany.com admin@mycompany.com"
    echo "  ./setup-ssl.sh 134.209.152.32.nip.io admin@company.com"
    echo ""
    echo "Note: For IP-only access, you can use a service like nip.io:"
    echo "  134.209.152.32.nip.io will resolve to 134.209.152.32"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Email:  $EMAIL"
echo ""

# Create required directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p nginx/conf.d

# Step 1: Use initial nginx config (HTTP only)
echo -e "${YELLOW}📄 Setting up initial nginx configuration...${NC}"
cp nginx/nginx-initial.conf nginx/nginx.conf

# Step 2: Update nginx.conf with the domain
echo -e "${YELLOW}🔧 Configuring domain: $DOMAIN${NC}"

# Create the SSL nginx config with the actual domain
cat > nginx/nginx-ssl.conf << EOF
# ==============================================================================
# Nginx Configuration with SSL for: $DOMAIN
# ==============================================================================

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/rss+xml application/atom+xml image/svg+xml;

    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

    upstream app_backend {
        server app:5000;
        keepalive 32;
    }

    # HTTP - Redirect to HTTPS
    server {
        listen 80;
        server_name $DOMAIN;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        # SSL Certificates
        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
        
        # SSL Security
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        client_max_body_size 10M;

        # API
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Socket.io
        location /socket.io/ {
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Frontend
        location / {
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location ~ /\. {
            deny all;
        }
    }
}
EOF

# Step 3: Start services with HTTP only first
echo -e "${YELLOW}🚀 Starting services (HTTP mode)...${NC}"
docker compose up -d mongodb app nginx

# Wait for nginx to start
echo -e "${YELLOW}⏳ Waiting for nginx to start...${NC}"
sleep 10

# Step 4: Get SSL certificate
echo -e "${YELLOW}🔐 Obtaining SSL certificate from Let's Encrypt...${NC}"
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
    
    # Step 5: Switch to SSL nginx config
    echo -e "${YELLOW}🔧 Switching to HTTPS configuration...${NC}"
    cp nginx/nginx-ssl.conf nginx/nginx.conf
    
    # Step 6: Reload nginx
    echo -e "${YELLOW}🔄 Reloading nginx with SSL...${NC}"
    docker compose exec nginx nginx -s reload
    
    # Step 7: Update .env file
    echo -e "${YELLOW}📝 Updating environment configuration...${NC}"
    if [ -f .env ]; then
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env
        sed -i "s|MICROSOFT_CALLBACK_URL=.*|MICROSOFT_CALLBACK_URL=https://$DOMAIN/api/auth/microsoft/callback|g" .env
    fi
    
    echo ""
    echo -e "${GREEN}=============================================="
    echo -e "🎉 SSL Setup Complete!"
    echo -e "==============================================${NC}"
    echo ""
    echo -e "${CYAN}Your application is now available at:${NC}"
    echo -e "   🔒 https://$DOMAIN"
    echo ""
    echo -e "${YELLOW}⚠️  Don't forget to update Azure AD:${NC}"
    echo -e "   Redirect URI: https://$DOMAIN/api/auth/microsoft/callback"
    echo ""
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "  - Domain does not point to this server's IP"
    echo "  - Port 80 is blocked by firewall"
    echo "  - Rate limit exceeded (try again later)"
    exit 1
fi

