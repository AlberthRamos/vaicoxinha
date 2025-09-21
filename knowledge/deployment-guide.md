# Deployment Guide - Vai Coxinha PWA

## Overview

This guide covers the complete deployment process for the Vai Coxinha PWA, including frontend, backend, database, and infrastructure setup.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- MongoDB Atlas account (for production)
- AWS account (for S3 and CloudFront)
- Domain name (e.g., vai-coxinha.com)
- SSL certificate

### Environment Variables
Create the following environment files:

```bash
# frontend/.env.production
NEXT_PUBLIC_API_URL=https://api.vai-coxinha.com
NEXT_PUBLIC_APP_NAME=Vai Coxinha
NEXT_PUBLIC_APP_DESCRIPTION=Peça suas coxinhas favoritas com facilidade
NEXT_PUBLIC_PWA_SHORT_NAME=Vai Coxinha
NEXT_PUBLIC_ANALYTICS_ID=GA_TRACKING_ID
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN

# backend/.env.production
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-access-token
MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vai-coxinha-images
AWS_CLOUDFRONT_DOMAIN=https://d123456789.cloudfront.net

# Email Service
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@vai-coxinha.com
SENDGRID_API_KEY=your-sendgrid-api-key

# Security
CORS_ORIGIN=https://vai-coxinha.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## Frontend Deployment

### 1. Build Configuration

```javascript
// frontend/next.config.production.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  exclude: [
    // add buildExcludes here
    ({ asset, compilation }) => {
      if (
        asset.name.startsWith('server/') ||
        asset.name.match(/^((app-|^)build-manifest\.json|react-loadable-manifest\.json)$/)
      ) {
        return true;
      }
      if (process.env.NODE_ENV !== 'production') {
        return false;
      }
      // Exclude images from precache in production
      return asset.name.includes('images/');
    }
  ]
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['vai-coxinha.s3.amazonaws.com', 'd123456789.cloudfront.net'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Internationalization
  i18n: {
    locales: ['pt-BR'],
    defaultLocale: 'pt-BR',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.vai-coxinha.com;"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            enforce: true,
          },
        },
      };
    }
    
    return config;
  }
});
```

### 2. Build Process

```bash
#!/bin/bash
# build-frontend.sh

echo "Building frontend..."

# Set production environment
export NODE_ENV=production

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Generate static assets
npm run export

# Optimize images
npm run optimize-images

# Generate sitemap
npm run generate-sitemap

echo "Frontend build completed!"
```

### 3. Static Site Deployment (AWS S3 + CloudFront)

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build application
        run: |
          cd frontend
          npm run build
          npm run export
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/out s3://vai-coxinha-frontend \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html" \
            --exclude "sw.js" \
            --exclude "workbox-*.js"
          
          aws s3 sync frontend/out s3://vai-coxinha-frontend \
            --cache-control "public, max-age=0, must-revalidate"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

## Backend Deployment

### 1. Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
CMD ["node", "dist/main"]
```

### 2. Docker Compose Configuration

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vai-coxinha-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    depends_on:
      - redis
      - mongodb
    networks:
      - vai-coxinha-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: vai-coxinha-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - vai-coxinha-network

  mongodb:
    image: mongo:6
    container_name: vai-coxinha-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=vai-coxinha
    volumes:
      - mongodb_data:/data/db
    networks:
      - vai-coxinha-network

  nginx:
    image: nginx:alpine
    container_name: vai-coxinha-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - vai-coxinha-network

networks:
  vai-coxinha-network:
    driver: bridge

volumes:
  redis_data:
  mongodb_data:
```

### 3. Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.vai-coxinha.com;" always;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Upstream backend
    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name vai-coxinha.com www.vai-coxinha.com;
        return 301 https://vai-coxinha.com$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name vai-coxinha.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # Static files (if serving from same server)
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}
```

## Database Migration

### 1. MongoDB Atlas Setup

```javascript
// scripts/setup-atlas.js
const { MongoClient } = require('mongodb');

async function setupAtlas() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    
    const db = client.db('vai-coxinha');
    
    // Create collections
    await db.createCollection('orders');
    await db.createCollection('products');
    await db.createCollection('users');
    
    // Create indexes
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('orders').createIndex({ customerEmail: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ available: 1 });
    
    // Create text index for search
    await db.collection('products').createIndex({ 
      name: "text", 
      description: "text" 
    });
    
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await client.close();
  }
}

setupAtlas();
```

### 2. Data Migration Script

```javascript
// scripts/migrate-data.js
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;

async function migrateData() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('vai-coxinha');
    
    // Load sample data
    const productsData = JSON.parse(await fs.readFile('./data/products.json', 'utf8'));
    const categoriesData = JSON.parse(await fs.readFile('./data/categories.json', 'utf8'));
    
    // Insert categories first
    await db.collection('categories').insertMany(categoriesData);
    console.log('Categories migrated');
    
    // Insert products
    await db.collection('products').insertMany(productsData);
    console.log('Products migrated');
    
    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await db.collection('users').insertOne({
      email: 'admin@vai-coxinha.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date()
    });
    
    console.log('Admin user created');
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateData();
```

## Monitoring and Logging

### 1. Application Monitoring

```typescript
// backend/src/monitoring/monitoring.service.ts
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class MonitoringService {
  constructor() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });
  }

  captureException(error: Error, context?: any) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  captureMessage(message: string, level: Sentry.Severity = Sentry.Severity.Info) {
    Sentry.captureMessage(message, level);
  }

  setUser(user: any) {
    Sentry.setUser(user);
  }
}
```

### 2. Health Check Endpoint

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', threshold: 0.9 }),
    ]);
  }
}
```

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backup created
- [ ] DNS records configured
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Security headers verified
- [ ] Rate limiting configured
- [ ] Health checks implemented

### Deployment Process
- [ ] Build frontend application
- [ ] Deploy to CDN/S3
- [ ] Build backend Docker image
- [ ] Deploy backend containers
- [ ] Run database migrations
- [ ] Update DNS records
- [ ] Configure SSL certificates
- [ ] Test all endpoints
- [ ] Verify PWA functionality
- [ ] Test payment flow

### Post-deployment
- [ ] Monitor application logs
- [ ] Check error rates
- [ ] Verify performance metrics
- [ ] Test mobile responsiveness
- [ ] Validate offline functionality
- [ ] Check search engine indexing
- [ ] Monitor server resources
- [ ] Set up alerts
- [ ] Document deployment
- [ ] Update team on changes

## Rollback Strategy

### 1. Database Rollback

```bash
#!/bin/bash
# scripts/rollback-database.sh

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    exit 1
fi

echo "Rolling back database to backup: $BACKUP_DATE"

# Restore from backup
mongorestore --uri="$MONGODB_URI" \
  --drop \
  --archive="backups/vai-coxinha-$BACKUP_DATE.gz" \
  --gzip

echo "Database rollback completed"
```

### 2. Application Rollback

```bash
#!/bin/bash
# scripts/rollback-application.sh

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Rolling back application to version: $VERSION"

# Rollback Docker containers
docker-compose -f docker-compose.production.yml \
  pull backend:$VERSION

docker-compose -f docker-compose.production.yml \
  up -d backend

# Rollback frontend (if using previous S3 objects)
aws s3 cp s3://vai-coxinha-frontend/backups/$VERSION/ s3://vai-coxinha-frontend/ --recursive

echo "Application rollback completed"
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify environment variables
   - Clear npm cache
   - Check for missing dependencies

2. **Database Connection Issues**
   - Verify MongoDB Atlas whitelist
   - Check connection string format
   - Ensure network connectivity
   - Verify credentials

3. **SSL Certificate Issues**
   - Verify certificate chain
   - Check certificate expiration
   - Ensure proper domain configuration
   - Validate nginx configuration

4. **Performance Issues**
   - Monitor server resources
   - Check database query performance
   - Verify CDN configuration
   - Analyze application logs

5. **PWA Issues**
   - Verify service worker registration
   - Check manifest.json validity
   - Ensure HTTPS deployment
   - Test offline functionality

### Support Contacts
- Development Team: dev@vai-coxinha.com
- Infrastructure Team: infra@vai-coxinha.com
- Emergency Support: +55 11 99999-9999