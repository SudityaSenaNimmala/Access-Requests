#!/bin/bash
# ==============================================================================
# DB Access Request Tool - Deployment Script
# Target Server: 134.209.152.32
# ==============================================================================

set -e

echo "🚀 DB Access Request Tool - Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from env.production.example:"
    echo "  cp env.production.example .env"
    echo "Then update the values with your credentials."
    exit 1
fi

# Function to show help
show_help() {
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build Docker images"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        View application logs"
    echo "  status      Check service status"
    echo "  clean       Remove all containers and volumes"
    echo "  update      Pull latest code and rebuild"
    echo "  backup      Backup MongoDB data"
    echo "  help        Show this help message"
}

# Build Docker images
build() {
    echo -e "${YELLOW}📦 Building Docker images...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Build complete!${NC}"
}

# Start services
start() {
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo "Application is running at: http://134.209.152.32:5000"
    echo ""
    status
}

# Start with nginx
start_with_nginx() {
    echo -e "${YELLOW}🚀 Starting services with Nginx...${NC}"
    docker-compose --profile with-nginx up -d
    echo -e "${GREEN}✅ Services started with Nginx!${NC}"
    echo ""
    echo "Application is running at: http://134.209.152.32"
}

# Stop services
stop() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

# Restart services
restart() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
}

# View logs
logs() {
    echo -e "${YELLOW}📜 Application logs:${NC}"
    docker-compose logs -f --tail=100 app
}

# Check status
status() {
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${YELLOW}🏥 Health Check:${NC}"
    curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "Health check pending..."
}

# Clean up
clean() {
    echo -e "${RED}⚠️  Warning: This will remove all containers and volumes!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🧹 Cleaning up...${NC}"
        docker-compose down -v --rmi all
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
    fi
}

# Update and rebuild
update() {
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin main
    echo -e "${YELLOW}🔄 Rebuilding and restarting...${NC}"
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Update complete!${NC}"
}

# Backup MongoDB
backup() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/mongodb_backup_${TIMESTAMP}.gz"
    
    mkdir -p $BACKUP_DIR
    
    echo -e "${YELLOW}💾 Creating MongoDB backup...${NC}"
    docker-compose exec -T mongodb mongodump --archive --gzip | cat > $BACKUP_FILE
    echo -e "${GREEN}✅ Backup saved to: ${BACKUP_FILE}${NC}"
}

# Main command handler
case "${1:-help}" in
    build)
        build
        ;;
    start)
        start
        ;;
    start-nginx)
        start_with_nginx
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
    status)
        status
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

