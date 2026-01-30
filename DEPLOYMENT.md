# Deployment Guide - DB Access Request Tool

## Target Server: 134.209.152.32 (Digital Ocean)

---

## Prerequisites

### On the Digital Ocean Server

1. **Install Docker & Docker Compose**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

2. **Configure Firewall**:
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw enable
```

---

## Deployment Steps

### Step 1: Transfer Project Files

**Option A - Using Git (Recommended)**:
```bash
# SSH into your server
ssh root@134.209.152.32

# Clone the repository
git clone <your-repo-url> /opt/db-access-tool
cd /opt/db-access-tool/Access-Requests
```

**Option B - Using SCP**:
```bash
# From your local machine
scp -r Access-Requests root@134.209.152.32:/opt/db-access-tool
```

### Step 2: Configure Environment

```bash
cd /opt/db-access-tool

# Copy the example environment file
cp env.production.example .env

# Edit the environment file with your values
nano .env
```

**Required Environment Variables to Update**:

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Generate with: `openssl rand -hex 64` |
| `MONGO_ROOT_PASSWORD` | Strong password for MongoDB |
| `MICROSOFT_CLIENT_ID` | From Azure Portal |
| `MICROSOFT_CLIENT_SECRET` | From Azure Portal |
| `MICROSOFT_TENANT_ID` | Your Azure AD tenant ID |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Your email password |
| `ENCRYPTION_KEY` | Exactly 32 characters |

### Step 3: Configure Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Update your app's **Redirect URI** to:
   ```
   http://134.209.152.32/api/auth/microsoft/callback
   ```
   (Or with port 5000 if not using nginx: `http://134.209.152.32:5000/api/auth/microsoft/callback`)

### Step 4: Build and Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Build Docker images
./deploy.sh build

# Start all services
./deploy.sh start

# Check status
./deploy.sh status
```

### Step 5: Verify Deployment

```bash
# Check running containers
docker ps

# Check application health
curl http://localhost:5000/api/health

# View logs
./deploy.sh logs
```

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh build` | Build Docker images |
| `./deploy.sh start` | Start all services |
| `./deploy.sh stop` | Stop all services |
| `./deploy.sh restart` | Restart all services |
| `./deploy.sh logs` | View application logs |
| `./deploy.sh status` | Check service status |
| `./deploy.sh backup` | Backup MongoDB data |
| `./deploy.sh clean` | Remove containers and volumes |

---

## Using Docker Compose Directly

```bash
# Build
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## With Nginx (Optional - for port 80)

If you want to run on port 80 with nginx:

```bash
# Start with nginx profile
./deploy.sh start-nginx

# Or directly with docker-compose
docker-compose --profile with-nginx up -d
```

---

## SSL/HTTPS Setup (Recommended for Production)

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot -y

# Generate certificates (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx ssl folder
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

Then uncomment the SSL section in `nginx/nginx.conf`.

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Check if ports are in use
sudo lsof -i :5000
sudo lsof -i :27017
```

### MongoDB connection issues
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Test connection from app container
docker-compose exec app wget -qO- http://mongodb:27017
```

### OAuth not working
1. Verify `MICROSOFT_CALLBACK_URL` matches Azure Portal settings
2. Check `FRONTEND_URL` is correct
3. Ensure ports/firewall allow the callback

### Reset everything
```bash
# Complete cleanup
./deploy.sh clean

# Recreate
./deploy.sh build
./deploy.sh start
```

---

## Backup & Restore

### Backup MongoDB
```bash
./deploy.sh backup
# Backups saved to ./backups/
```

### Restore MongoDB
```bash
# Restore from backup file
docker-compose exec -T mongodb mongorestore --archive --gzip < ./backups/mongodb_backup_TIMESTAMP.gz
```

---

## Monitoring

### View Resource Usage
```bash
docker stats
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongodb
```

---

## Production Checklist

- [ ] Strong `SESSION_SECRET` generated
- [ ] Strong `MONGO_ROOT_PASSWORD` set
- [ ] Strong `ENCRYPTION_KEY` (exactly 32 chars)
- [ ] Microsoft Azure OAuth configured
- [ ] SMTP email credentials configured
- [ ] Firewall configured (ports 22, 80, 443, 5000)
- [ ] SSL certificates installed (recommended)
- [ ] Backup strategy in place
- [ ] Monitoring setup (optional)

---

## Access URLs

| Service | URL |
|---------|-----|
| Application | http://134.209.152.32:5000 |
| API Health | http://134.209.152.32:5000/api/health |
| MongoDB | mongodb://134.209.152.32:27017 (internal only) |

---

## Support

For issues or questions, check the logs first:
```bash
./deploy.sh logs
```

