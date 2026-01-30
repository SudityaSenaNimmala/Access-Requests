# ==============================================================================
# DB Access Request Tool - Production Dockerfile
# Multi-stage build: Build frontend, then serve with Node.js backend
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Build the frontend
RUN npm run build

# ==============================================================================
# Stage 2: Production Server
FROM node:20-alpine AS production

# Add labels for better container management
LABEL maintainer="CloudFuze"
LABEL description="DB Access Request Tool - Full Stack Application"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy backend source
COPY backend/src ./src

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DOCKER_ENV=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "src/index.js"]

