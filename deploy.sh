#!/bin/bash
# ==============================================================================
# DB Access Request Tool - Deployment Script
# Target Server: 134.209.152.32
# Supports both HTTP and HTTPS deployment
# ==============================================================================

set -e

echo "🚀 DB Access Request Tool - Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ Error: .env file not found!${NC}"
        echo "Please create .env file from env.production.example:"
        echo "  cp env.production.example .env"
        echo "Then update the values with your credentials."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build         Build Docker images"
    echo "  start         Start all services (HTTP mode)"
    echo "  start-ssl     Start all services with HTTPS"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  logs          View application logs"
    echo "  status        Check service status"
    echo "  ssl-setup     Setup SSL certificates (requires domain)"
    echo "  clean         Remove all containers and volumes"
    echo "  update        Pull latest code and rebuild"
    echo "  backup        Backup MongoDB data"
    echo "  help          Show this help message"
}

# Build Docker images
build() {
    check_env
    echo -e "${YELLOW}📦 Building Docker images...${NC}"
    docker compose build --no-cache
    echo -e "${GREEN}✅ Build complete!${NC}"
}

# Start services (HTTP mode - for initial setup)
start() {
    check_env
    echo -e "${YELLOW}🚀 Starting services (HTTP mode)...${NC}"
    
    # Use initial nginx config if SSL not set up
    if [ ! -d "certbot/conf/live" ]; then
        echo -e "${YELLOW}📄 Using HTTP-only nginx config (SSL not configured)${NC}"
        cp nginx/nginx-initial.conf nginx/nginx.conf 2>/dev/null || true
    fi
    
    docker compose up -d
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    
    # Get the frontend URL from .env
    FRONTEND_URL=$(grep FRONTEND_URL .env | cut -d '=' -f2)
    echo -e "Application is running at: ${CYAN}${FRONTEND_URL}${NC}"
    echo ""
    status
}

# Start with SSL
start_ssl() {
    check_env
    
    # Check if SSL certificates exist
    if [ ! -d "certbot/conf/live" ]; then
        echo -e "${RED}❌ SSL certificates not found!${NC}"
        echo "Run './deploy.sh ssl-setup yourdomain.com' first."
        exit 1
    fi
    
    echo -e "${YELLOW}🔒 Starting services with HTTPS...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅ Services started with SSL!${NC}"
    echo ""
    
    FRONTEND_URL=$(grep FRONTEND_URL .env | cut -d '=' -f2)
    echo -e "Application is running at: ${CYAN}${FRONTEND_URL}${NC}"
    echo ""
    status
}

# SSL Setup
ssl_setup() {
    check_env
    
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Domain name required!${NC}"
        echo "Usage: ./deploy.sh ssl-setup yourdomain.com [email]"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh ssl-setup dbaccess.mycompany.com"
        echo "  ./deploy.sh ssl-setup dbaccess.mycompany.com admin@mycompany.com"
        exit 1
    fi
    
    chmod +x setup-ssl.sh
    ./setup-ssl.sh "$1" "$2"
}

# Stop services
stop() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

# Restart services
restart() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
}

# View logs
logs() {
    echo -e "${YELLOW}📜 Application logs:${NC}"
    docker compose logs -f --tail=100 app
}

# View all logs
logs_all() {
    echo -e "${YELLOW}📜 All service logs:${NC}"
    docker compose logs -f --tail=100
}

# Check status
status() {
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker compose ps
    echo ""
    echo -e "${YELLOW}🏥 Health Check:${NC}"
    curl -s http://localhost:5000/api/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Health check pending..."
}

# Clean up
clean() {
    echo -e "${RED}⚠️  Warning: This will remove all containers, volumes, and SSL certificates!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🧹 Cleaning up...${NC}"
        docker compose down -v --rmi all
        rm -rf certbot/
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
    fi
}

# Update and rebuild
update() {
    check_env
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin main
    echo -e "${YELLOW}🔄 Rebuilding and restarting...${NC}"
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✅ Update complete!${NC}"
}

# Backup MongoDB
backup() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/mongodb_backup_${TIMESTAMP}.gz"
    
    mkdir -p $BACKUP_DIR
    
    echo -e "${YELLOW}💾 Creating MongoDB backup...${NC}"
    docker compose exec -T mongodb mongodump --archive --gzip | cat > $BACKUP_FILE
    echo -e "${GREEN}✅ Backup saved to: ${BACKUP_FILE}${NC}"
}

# Renew SSL certificates
ssl_renew() {
    echo -e "${YELLOW}🔄 Renewing SSL certificates...${NC}"
    docker compose run --rm certbot renew
    docker compose exec nginx nginx -s reload
    echo -e "${GREEN}✅ SSL certificates renewed!${NC}"
}

# Main command handler
case "${1:-help}" in
    build)
        build
        ;;
    start)
        start
        ;;
    start-ssl)
        start_ssl
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-all)
        logs_all
        ;;
    status)
        status
        ;;
    ssl-setup)
        ssl_setup "$2" "$3"
        ;;
    ssl-renew)
        ssl_renew
        ;;
    clean)
        clean
        ;;
    update)
        update
        ;;
    backup)
        backup
        ;;
    help|*)
        show_help
        ;;
esac
