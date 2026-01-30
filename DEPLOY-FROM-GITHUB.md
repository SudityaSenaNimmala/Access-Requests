# Deploy from GitHub to Digital Ocean with HTTPS

## Server: 134.209.152.32

---

## Prerequisites

Before deploying with HTTPS, you need:
1. **A domain name** pointing to your server IP (134.209.152.32)
2. **DNS configured** (A record pointing to the server)

> **No domain?** You can use a free service like [nip.io](https://nip.io):
> `134.209.152.32.nip.io` will automatically resolve to `134.209.152.32`

---

## Quick Deployment Steps

### Step 1: SSH into Digital Ocean Server

```bash
ssh root@134.209.152.32
```

### Step 2: Install Docker (if not installed)

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

### Step 3: Clone the Repository

```bash
mkdir -p /opt/apps && cd /opt/apps
git clone https://github.com/SudityaSenaNimmala/Access-Requests.git
cd Access-Requests
```

### Step 4: Configure Environment

```bash
cp env.production.example .env
nano .env
```

**Update these values:**

```bash
# MongoDB
MONGO_ROOT_PASSWORD=YourStrongPassword123

# Generate session secret
SESSION_SECRET=$(openssl rand -hex 64)

# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# HTTPS URLs (replace YOUR_DOMAIN with your actual domain)
FRONTEND_URL=https://YOUR_DOMAIN
MICROSOFT_CALLBACK_URL=https://YOUR_DOMAIN/api/auth/microsoft/callback

# Email
SMTP_USER=your-email@company.com
SMTP_PASS=your-password

# Encryption (32 characters)
ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### Step 5: Open Firewall Ports

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

### Step 6: Build the Application

```bash
chmod +x deploy.sh setup-ssl.sh
./deploy.sh build
```

### Step 7: Setup SSL Certificate

```bash
# Replace with your actual domain and email
./deploy.sh ssl-setup yourdomain.com admin@yourdomain.com

# Example with nip.io (for IP-based access):
./deploy.sh ssl-setup 134.209.152.32.nip.io admin@company.com
```

### Step 8: Verify Deployment

```bash
docker ps
curl -k https://localhost/api/health
```

---

## 🔗 All Commands (Copy-Paste Block)

```bash
# SSH into server: ssh root@134.209.152.32

# Install Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# Clone repository
mkdir -p /opt/apps && cd /opt/apps
git clone https://github.com/SudityaSenaNimmala/Access-Requests.git
cd Access-Requests

# Setup environment
cp env.production.example .env
nano .env  # Edit with your values

# Open firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable

# Build and setup SSL
chmod +x deploy.sh setup-ssl.sh
./deploy.sh build
./deploy.sh ssl-setup YOUR_DOMAIN YOUR_EMAIL

# Verify
docker ps
```

---

## 🌐 Access After Deployment

| Service | URL |
|---------|-----|
| **Application** | https://YOUR_DOMAIN |
| **Health Check** | https://YOUR_DOMAIN/api/health |

---

## ⚠️ Update Azure AD

In [Azure Portal](https://portal.azure.com/) → Azure AD → App registrations:

**Update Redirect URI to:**
```
https://YOUR_DOMAIN/api/auth/microsoft/callback
```

---

## 📋 Deployment Commands Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh build` | Build Docker images |
| `./deploy.sh start` | Start services (HTTP mode) |
| `./deploy.sh ssl-setup domain email` | Setup SSL certificate |
| `./deploy.sh start-ssl` | Start with HTTPS |
| `./deploy.sh stop` | Stop all services |
| `./deploy.sh restart` | Restart services |
| `./deploy.sh logs` | View app logs |
| `./deploy.sh status` | Check service status |
| `./deploy.sh ssl-renew` | Renew SSL certificates |
| `./deploy.sh backup` | Backup MongoDB |
| `./deploy.sh update` | Pull latest & redeploy |

---

## 🔒 SSL Certificate Renewal

SSL certificates from Let's Encrypt are valid for 90 days. The certbot container automatically attempts renewal every 12 hours.

To manually renew:
```bash
./deploy.sh ssl-renew
```

---

## Troubleshooting

### SSL Certificate Issues

```bash
# Check certbot logs
docker compose logs certbot

# Check nginx configuration
docker compose exec nginx nginx -t

# Manually request certificate
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  -d yourdomain.com
```

### Application Issues

```bash
# Check all logs
docker compose logs -f

# Check specific service
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f mongodb

# Restart services
./deploy.sh restart
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb
```

---

## HTTP-Only Deployment (Not Recommended)

If you don't need HTTPS (for testing only):

```bash
# Edit .env to use HTTP URLs
FRONTEND_URL=http://134.209.152.32
MICROSOFT_CALLBACK_URL=http://134.209.152.32/api/auth/microsoft/callback

# Start without SSL
./deploy.sh start
```

Access at: http://134.209.152.32

---

## Complete Reset

```bash
./deploy.sh clean
./deploy.sh build
./deploy.sh ssl-setup yourdomain.com
```
