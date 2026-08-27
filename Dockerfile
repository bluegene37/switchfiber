# ==========================================
# SwitchFiber Admin Console - Production Dockerfile
# Multi-Stage Build: Node.js Builder -> Nginx Alpine
# ==========================================

# ----------------- Stage 1: Build -----------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy project source files
COPY . .

# Run static quality analysis, tests, and production build
RUN npm run lint && npm test && npm run build

# ----------------- Stage 2: Production Runtime -----------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx html and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
