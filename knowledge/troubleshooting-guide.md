# Troubleshooting Guide - Vai Coxinha PWA

## Quick Diagnostic Commands

### Frontend Issues

```bash
# Check if frontend is accessible
curl -I https://vai-coxinha.com

# Check PWA manifest
curl -s https://vai-coxinha.com/manifest.json | jq .

# Check service worker
curl -s https://vai-coxinha.com/sw.js | head -20

# Check for JavaScript errors (browser console)
# Open browser DevTools → Console tab

# Check build status
cd frontend && npm run build
```

### Backend Issues

```bash
# Check backend health
curl -f https://api.vai-coxinha.com/health

# Check API endpoints
curl -s https://api.vai-coxinha.com/api/products | jq '.[:3]'

# Check database connection
docker logs vai-coxinha-backend | grep -i "mongodb\|database"

# Check recent errors
docker logs vai-coxinha-backend --tail 100 | grep -i "error\|exception\|failed"

# Check service status
docker ps | grep vai-coxinha
```

### Database Issues

```bash
# Check MongoDB status
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "db.runCommand({ping: 1})"

# Check collection sizes
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.orders.countDocuments()
db.products.countDocuments()
db.users.countDocuments()
"

# Check for slow queries
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.currentOp({'secs_running': {\$gt: 5}})
"
```

## Common Issues and Solutions

### 1. Frontend Build Failures

**Symptom**: `npm run build` fails with errors

**Diagnosis**:
```bash
# Check Node.js version
node --version

# Check for missing dependencies
npm ls

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Update Next.js
npm install next@latest react@latest react-dom@latest

# Fix import errors
# Check for case-sensitive imports (common on Linux)
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "import.*from.*['\"].*/"
```

### 2. PWA Service Worker Issues

**Symptom**: PWA not installing or offline functionality not working

**Diagnosis**:
```bash
# Check if service worker is registered
# Browser DevTools → Application → Service Workers

# Check manifest validity
curl -s https://vai-coxinha.com/manifest.json | jq .

# Check for mixed content (HTTPS/HTTP)
curl -s https://vai-coxinha.com | grep -i "http://"
```

**Solutions**:

```javascript
// Fix manifest.json
{
  "name": "Vai Coxinha",
  "short_name": "Vai Coxinha",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ff6b35",
  "icons": [
    {
      "src": "/images/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Backend API Connection Issues

**Symptom**: Frontend cannot connect to backend API

**Diagnosis**:
```bash
# Check if backend is running
docker ps | grep backend

# Check backend logs for startup errors
docker logs vai-coxinha-backend | head -50

# Check network connectivity
docker network ls
docker network inspect vai-coxinha-network

# Check environment variables
docker exec vai-coxinha-backend env | grep -E "PORT|DATABASE_URL|JWT_SECRET"
```

**Solutions**:

```bash
# Restart backend service
docker-compose restart backend

# Check and fix environment variables
docker-compose -f docker-compose.production.yml config

# Verify database connection string
# Test MongoDB connection from backend container
docker exec vai-coxinha-backend mongo "mongodb://mongodb:27017/vai-coxinha" --eval "db.runCommand({ping: 1})"

# Check CORS configuration
# Verify CORS_ORIGIN in backend environment matches frontend URL
```

### 4. Database Connection Issues

**Symptom**: "MongoNetworkError" or "connection timeout"

**Diagnosis**:
```bash
# Test MongoDB Atlas connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "db.runCommand({ping: 1})"

# Check connection string format
echo $MONGODB_URI | grep -E "mongodb(\+srv)?://"

# Check IP whitelist in MongoDB Atlas
# Login to MongoDB Atlas → Network Access → IP Whitelist

# Check connection pool status
docker logs vai-coxinha-backend | grep -i "connection.*pool"
```

**Solutions**:

```bash
# Update IP whitelist in MongoDB Atlas
# Add current server IP address

# Increase connection timeout
# In backend .env: MONGODB_OPTIONS="?connectTimeoutMS=30000&socketTimeoutMS=30000"

# Check connection pool settings
# In backend configuration:
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

# Test with different connection string
# Try direct connection instead of SRV
mongodb://username:password@host1:27017,host2:27017,host3:27017/vai-coxinha?replicaSet=atlas-xyz&ssl=true&authSource=admin
```

### 5. Payment Processing Issues

**Symptom**: Mercado Pago integration not working

**Diagnosis**:
```bash
# Check Mercado Pago configuration
docker exec vai-coxinha-backend env | grep MERCADOPAGO

# Check webhook endpoint
curl -X POST https://api.vai-coxinha.com/api/payments/webhook -H "Content-Type: application/json" -d '{"test": true}'

# Check payment logs
docker logs vai-coxinha-backend | grep -i "mercadopago\|payment\|webhook"
```

**Solutions**:

```bash
# Verify Mercado Pago credentials
# Test with sandbox first
export MERCADOPAGO_ACCESS_TOKEN="TEST-..."

# Check webhook URL configuration
# In Mercado Pago dashboard → Webhooks → Add webhook
# URL: https://api.vai-coxinha.com/api/payments/webhook

# Test payment creation
curl -X POST https://api.vai-coxinha.com/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "test-order-123",
    "amount": 10.00,
    "description": "Test payment"
  }'
```

### 6. Image Upload Issues

**Symptom**: Images not uploading or displaying

**Diagnosis**:
```bash
# Check S3 bucket permissions
aws s3 ls s3://vai-coxinha-images

# Check CloudFront distribution status
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID

# Check image upload endpoint
curl -X POST https://api.vai-coxinha.com/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test.jpg"

# Check file size limits
# In nginx configuration: client_max_body_size 10M;
```

**Solutions**:

```bash
# Update S3 bucket policy
aws s3api put-bucket-policy --bucket vai-coxinha-images --policy file://s3-policy.json

# Increase upload size limit
# In backend middleware or nginx
client_max_body_size 20M;

# Check image processing service
docker logs vai-coxinha-backend | grep -i "sharp\|jimp\|image"

# Test with smaller image
# Resize image before upload: mogrify -resize 1920x1080> input.jpg
```

### 7. Authentication Issues

**Symptom**: Users cannot login or JWT tokens not working

**Diagnosis**:
```bash
# Check JWT secret configuration
docker exec vai-coxinha-backend env | grep JWT

# Test login endpoint
curl -X POST https://api.vai-coxinha.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Check token validation
curl -X GET https://api.vai-coxinha.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check user in database
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.users.findOne({email: 'test@example.com'})
"
```

**Solutions**:

```bash
# Verify JWT secret consistency
# Ensure JWT_SECRET is same across all backend instances

# Check token expiration time
# In backend: JWT_EXPIRES_IN should be reasonable (e.g., "15m")

# Clear expired tokens
# In database: db.sessions.deleteMany({expiresAt: {$lt: new Date()}})

# Test with new user
# Create test user and try login flow
```

### 8. Performance Issues

**Symptom**: Slow page loads or API responses

**Diagnosis**:
```bash
# Check server resources
docker stats --no-stream

# Check database query performance
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.profiling.find().limit(10).sort({ts: -1})
"

# Check for memory leaks
docker logs vai-coxinha-backend | grep -i "memory\|heap\|leak"

# Check CDN cache hit ratio
aws cloudfront get-distribution-metrics --distribution-id YOUR_DISTRIBUTION_ID
```

**Solutions**:

```bash
# Add database indexes
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.orders.createIndex({createdAt: -1})
db.orders.createIndex({customerEmail: 1})
db.products.createIndex({category: 1, available: 1})
"

# Implement caching
# Add Redis caching for frequently accessed data

# Optimize images
# Compress and resize images before upload

# Enable gzip compression
# Verify nginx gzip is enabled: gzip on;

# Implement pagination
# Add pagination to API endpoints returning large datasets
```

### 9. Mobile App Issues

**Symptom**: PWA not working properly on mobile devices

**Diagnosis**:
```bash
# Check viewport meta tag
curl -s https://vai-coxinha.com | grep -i "viewport"

# Check touch event handling
# Browser DevTools → Mobile view → Touch simulation

# Check for mobile-specific CSS
# Look for @media queries and mobile breakpoints

# Test on different devices
# Use browser DevTools device emulation
```

**Solutions**:

```html
<!-- Add viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<!-- Add mobile-specific CSS -->
<style>
@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-menu { display: block; }
}
</style>

<!-- Add touch event handlers -->
<script>
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
</script>
```

### 10. SEO and Meta Issues

**Symptom**: Poor search engine ranking or social media previews

**Diagnosis**:
```bash
# Check robots.txt
curl -s https://vai-coxinha.com/robots.txt

# Check meta tags
curl -s https://vai-coxinha.com | grep -i "<meta"

# Check sitemap.xml
curl -s https://vai-coxinha.com/sitemap.xml

# Check structured data
# Use Google's Structured Data Testing Tool
```

**Solutions**:

```html
<!-- Add proper meta tags -->
<meta name="description" content="Peça suas coxinhas favoritas com facilidade. Entrega rápida e pagamento seguro.">
<meta property="og:title" content="Vai Coxinha - Delivery de Coxinhas">
<meta property="og:description" content="As melhores coxinhas da cidade, entregues em sua casa.">
<meta property="og:image" content="https://vai-coxinha.com/images/og-image.jpg">
<meta property="og:url" content="https://vai-coxinha.com">
<meta name="twitter:card" content="summary_large_image">

<!-- Add structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Vai Coxinha",
  "url": "https://vai-coxinha.com",
  "description": "Delivery de coxinhas artesanais",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://vai-coxinha.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

## Advanced Debugging

### 1. Network Issues

```bash
# Trace network route
traceroute vai-coxinha.com

# Check DNS resolution
dig vai-coxinha.com
nslookup vai-coxinha.com

# Check SSL certificate chain
echo | openssl s_client -servername vai-coxinha.com -connect vai-coxinha.com:443 2>/dev/null | openssl x509 -text -noout

# Test with different networks
# Use mobile hotspot or VPN to test from different locations
```

### 2. Memory and Performance Profiling

```bash
# Check memory usage
docker exec vai-coxinha-backend node -e "console.log(process.memoryUsage())"

# Profile Node.js application
docker exec vai-coxinha-backend node --prof dist/main.js

# Generate heap snapshot
# Add to application: require('heapdump').writeSnapshot()

# Check for event loop lag
# Add to application: setInterval(() => console.log(Date.now()), 1000)
```

### 3. Database Performance Analysis

```javascript
// Enable MongoDB profiling
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.setProfilingLevel(2)
"

// Analyze slow queries
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.profiling.find({millis: {\$gt: 100}}).sort({ts: -1}).limit(10)
"

// Check index usage
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.orders.explain('executionStats').find({status: 'pending'})
"
```

## Emergency Contacts

### Internal Team
- **Development Team**: dev@vai-coxinha.com
- **DevOps Team**: devops@vai-coxinha.com
- **Database Administrator**: dba@vai-coxinha.com

### External Services
- **AWS Support**: Support case through AWS Console
- **MongoDB Atlas**: Support ticket through Atlas UI
- **CloudFlare**: Support through CloudFlare dashboard
- **Mercado Pago**: Developer support via email

### Emergency Escalation
1. **Level 1**: System Administrator (+55 11 99999-9999)
2. **Level 2**: Senior Developer (+55 11 99999-9998)
3. **Level 3**: Technical Lead (+55 11 99999-9997)

## Useful Tools

### Browser DevTools
- **Chrome DevTools**: F12 → Network, Console, Application tabs
- **Firefox Developer Tools**: F12 → Network, Console, Storage tabs
- **Lighthouse**: Built-in performance auditing

### Command Line Tools
- **curl**: HTTP requests and debugging
- **jq**: JSON parsing and formatting
- **dig/nslookup**: DNS troubleshooting
- **openssl**: SSL certificate analysis
- **docker logs**: Container log analysis

### Online Tools
- **GTmetrix**: Performance analysis
- **Google PageSpeed Insights**: Performance scoring
- **SSL Labs**: SSL certificate testing
- **MongoDB Atlas**: Database monitoring
- **AWS CloudWatch**: Infrastructure monitoring