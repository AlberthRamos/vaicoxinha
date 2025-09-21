# Maintenance Guide - Vai Coxinha PWA

## Overview

This guide covers ongoing maintenance tasks, monitoring, updates, and troubleshooting for the Vai Coxinha PWA in production.

## Daily Maintenance

### 1. Health Checks

```bash
#!/bin/bash
# scripts/daily-health-check.sh

echo "=== Daily Health Check - $(date) ==="

# Check backend health
curl -f https://api.vai-coxinha.com/health || echo "❌ Backend health check failed"

# Check frontend availability
curl -f https://vai-coxinha.com || echo "❌ Frontend unavailable"

# Check database connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "db.runCommand({ping: 1})" || echo "❌ Database connection failed"

# Check Redis connection
redis-cli -h redis-host ping || echo "❌ Redis connection failed"

# Check SSL certificate expiration
echo | openssl s_client -servername vai-coxinha.com -connect vai-coxinha.com:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" || echo "❌ SSL certificate check failed"

echo "=== Health check completed ==="
```

### 2. Log Monitoring

```bash
#!/bin/bash
# scripts/monitor-logs.sh

# Check for errors in the last 24 hours
echo "=== Error Analysis - Last 24 Hours ==="
docker logs vai-coxinha-backend --since 24h | grep -i "error\|exception\|failed" | tail -20

# Check nginx access logs for unusual patterns
echo "=== Nginx Access Analysis ==="
tail -1000 /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c | sort -nr

# Check for 5xx errors
echo "=== 5xx Errors ==="
tail -1000 /var/log/nginx/access.log | awk '$9 >= 500 {print $9}' | sort | uniq -c

# Check disk usage
echo "=== Disk Usage ==="
df -h

# Check memory usage
echo "=== Memory Usage ==="
free -h
```

## Weekly Maintenance

### 1. Performance Review

```bash
#!/bin/bash
# scripts/weekly-performance-review.sh

echo "=== Weekly Performance Review ==="

# Database performance
mongo "mongodb+srv://username:password@cluster.mongodb.net/vai-coxinha" --eval "
db.currentOp({'secs_running': {\$gt: 5}})
" > /tmp/slow-queries.log

# API response times
curl -s https://api.vai-coxinha.com/metrics | jq '.http_request_duration_seconds'

# CDN cache hit ratio (AWS CloudFront)
aws cloudfront get-distribution-metrics --distribution-id YOUR_DISTRIBUTION_ID --start-time $(date -d '7 days ago' +%Y-%m-%d) --end-time $(date +%Y-%m-%d) --query 'DistributionMetrics.CacheHitRate'

# Error rate analysis
echo "=== Weekly Error Rate ==="
docker logs vai-coxinha-backend --since 7d | grep -c "ERROR"
```

### 2. Security Updates

```bash
#!/bin/bash
# scripts/security-updates.sh

echo "=== Security Updates Check ==="

# Check for npm vulnerabilities in backend
cd /app/backend
npm audit --audit-level=high

# Check for npm vulnerabilities in frontend
cd /app/frontend
npm audit --audit-level=high

# Check SSL certificate expiration
echo | openssl s_client -servername vai-coxinha.com -connect vai-coxinha.com:443 2>/dev/null | openssl x509 -noout -dates

# Check for failed login attempts
docker logs vai-coxinha-backend | grep -i "failed.*login\|authentication.*failed" | tail -50

# Check for suspicious IP addresses
tail -10000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -20
```

## Monthly Maintenance

### 1. Database Maintenance

```javascript
// scripts/database-maintenance.js
const { MongoClient } = require('mongodb');

async function monthlyDatabaseMaintenance() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('vai-coxinha');
    
    console.log('=== Monthly Database Maintenance ===');
    
    // 1. Analyze collection statistics
    const collections = ['orders', 'products', 'users'];
    
    for (const collectionName of collections) {
      const stats = await db.collection(collectionName).stats();
      console.log(`${collectionName} - Documents: ${stats.count}, Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // 2. Clean up old sessions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db.collection('sessions').deleteMany({
      updatedAt: { $lt: thirtyDaysAgo }
    });
    console.log(`Cleaned up ${result.deletedCount} old sessions`);
    
    // 3. Archive completed orders older than 6 months
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const oldOrders = await db.collection('orders').find({
      status: 'delivered',
      updatedAt: { $lt: sixMonthsAgo }
    }).toArray();
    
    if (oldOrders.length > 0) {
      await db.collection('orders_archive').insertMany(oldOrders);
      await db.collection('orders').deleteMany({
        _id: { $in: oldOrders.map(o => o._id) }
      });
      console.log(`Archived ${oldOrders.length} old orders`);
    }
    
    // 4. Rebuild indexes
    console.log('Rebuilding indexes...');
    await db.collection('orders').reIndex();
    await db.collection('products').reIndex();
    await db.collection('users').reIndex();
    
    // 5. Update statistics
    await db.collection('system_stats').insertOne({
      type: 'monthly_maintenance',
      date: new Date(),
      collections_analyzed: collections.length,
      sessions_cleaned: result.deletedCount,
      orders_archived: oldOrders.length
    });
    
    console.log('Database maintenance completed!');
    
  } catch (error) {
    console.error('Database maintenance failed:', error);
  } finally {
    await client.close();
  }
}

monthlyDatabaseMaintenance();
```

### 2. Backup Verification

```bash
#!/bin/bash
# scripts/backup-verification.sh

echo "=== Monthly Backup Verification ==="

# List recent backups
aws s3 ls s3://vai-coxinha-backups/ --recursive | tail -10

# Test backup restoration (in staging environment)
echo "Testing backup restoration..."

# Download latest backup
LATEST_BACKUP=$(aws s3 ls s3://vai-coxinha-backups/ --recursive | sort | tail -1 | awk '{print $4}')
aws s3 cp s3://vai-coxinha-backups/$LATEST_BACKUP /tmp/latest-backup.gz

# Verify backup integrity
gunzip -t /tmp/latest-backup.gz && echo "✅ Backup integrity verified" || echo "❌ Backup corrupted"

# Test MongoDB restoration to staging
mongorestore --uri="mongodb+srv://staging-user:password@staging-cluster.mongodb.net/vai-coxinha-staging" \
  --drop --archive=/tmp/latest-backup.gz --gzip && echo "✅ Restoration test passed" || echo "❌ Restoration failed"

# Clean up
rm -f /tmp/latest-backup.gz

echo "Backup verification completed"
```

## Quarterly Maintenance

### 1. Performance Optimization

```bash
#!/bin/bash
# scripts/quarterly-optimization.sh

echo "=== Quarterly Performance Optimization ==="

# 1. Update dependencies
echo "Updating dependencies..."
cd /app/backend
npm update
npm audit fix

cd /app/frontend
npm update
npm audit fix

# 2. Optimize images
echo "Optimizing images..."
find /app/frontend/public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs -I {} mogrify -strip -interlace Plane -gaussian-blur 0.05 -quality 85 {}

# 3. Clean up Docker
echo "Cleaning up Docker..."
docker system prune -af
docker volume prune -f

# 4. Update SSL certificates (if using Let's Encrypt)
echo "Updating SSL certificates..."
certbot renew --quiet

# 5. Review and update security headers
echo "Reviewing security headers..."
curl -I https://vai-coxinha.com | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Content-Security-Policy"

echo "Quarterly optimization completed"
```

### 2. Security Audit

```bash
#!/bin/bash
# scripts/security-audit.sh

echo "=== Quarterly Security Audit ==="

# 1. Run OWASP ZAP scan (automated)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://vai-coxinha.com -r security-report.html

# 2. Check for outdated packages
echo "Checking for outdated packages..."
cd /app/backend
npm outdated

cd /app/frontend
npm outdated

# 3. Review user access logs
echo "Reviewing access patterns..."
tail -10000 /var/log/nginx/access.log | awk '{print $1, $7, $9}' | sort | uniq -c | sort -nr | head -20

# 4. Check for SQL injection attempts (even though we use MongoDB)
echo "Checking for injection attempts..."
grep -i "union.*select\|drop.*table\|insert.*into" /var/log/nginx/access.log | tail -20

# 5. Review failed authentication attempts
echo "Reviewing authentication failures..."
docker logs vai-coxinha-backend --since 90d | grep -i "authentication.*failed\|unauthorized" | wc -l

echo "Security audit completed"
```

## Emergency Procedures

### 1. Service Outage Response

```bash
#!/bin/bash
# scripts/emergency-response.sh

echo "=== Emergency Response Procedure ==="

# 1. Check service status
echo "Checking service status..."
docker ps | grep vai-coxinha

# 2. Check recent logs
echo "Recent error logs..."
docker logs vai-coxinha-backend --tail 100 | grep -i "error\|exception\|fatal"

# 3. Check resource usage
echo "Resource usage..."
docker stats --no-stream

# 4. Restart services if needed
echo "Restarting services..."
docker-compose -f docker-compose.production.yml restart backend frontend nginx

# 5. Verify restoration
echo "Verifying restoration..."
sleep 10
curl -f https://api.vai-coxinha.com/health && echo "✅ Backend restored" || echo "❌ Backend still down"
curl -f https://vai-coxinha.com && echo "✅ Frontend restored" || echo "❌ Frontend still down"

echo "Emergency response completed"
```

### 2. Database Recovery

```bash
#!/bin/bash
# scripts/database-recovery.sh

BACKUP_DATE=${1:-$(date +%Y%m%d)}

echo "=== Database Recovery Procedure ==="
echo "Restoring from backup: $BACKUP_DATE"

# 1. Stop application
docker-compose -f docker-compose.production.yml stop backend

# 2. Download backup
aws s3 cp s3://vai-coxinha-backups/vai-coxinha-$BACKUP_DATE.gz /tmp/restore-backup.gz

# 3. Restore database
mongorestore --uri="$MONGODB_URI" \
  --drop \
  --archive=/tmp/restore-backup.gz \
  --gzip

# 4. Verify restoration
mongo "$MONGODB_URI" --eval "
db.orders.countDocuments()
db.products.countDocuments()
db.users.countDocuments()
"

# 5. Restart application
docker-compose -f docker-compose.production.yml start backend

echo "Database recovery completed"
```

## Monitoring Dashboard

### 1. Key Metrics to Monitor

```yaml
# monitoring/key-metrics.yaml
metrics:
  availability:
    - uptime_percentage: ">99.9%"
    - response_time_p95: "<500ms"
    - error_rate: "<1%"
  
  performance:
    - api_response_time: "<200ms"
    - database_query_time: "<100ms"
    - page_load_time: "<3s"
    - time_to_first_byte: "<600ms"
  
  business:
    - daily_orders: "track trend"
    - conversion_rate: ">2%"
    - cart_abandonment_rate: "<70%"
    - average_order_value: ">R$30"
  
  infrastructure:
    - cpu_usage: "<80%"
    - memory_usage: "<80%"
    - disk_usage: "<85%"
    - network_throughput: "monitor"
  
  security:
    - failed_login_attempts: "<10/hour"
    - suspicious_requests: "monitor"
    - ssl_certificate_days_remaining: ">30"
```

### 2. Alerting Rules

```yaml
# monitoring/alerts.yaml
groups:
  - name: availability
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          
  - name: performance
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time is high"
          
      - alert: HighDatabaseConnections
        expr: mongodb_connections{state="current"} > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections"
          
  - name: infrastructure
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          
      - alert: HighMemoryUsage
        expr: memory_usage_percent > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          
      - alert: DiskSpaceLow
        expr: disk_free_percent < 15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
```

## Maintenance Calendar

### Daily (Automated)
- [ ] Health checks
- [ ] Log monitoring
- [ ] Error rate monitoring
- [ ] Performance metrics

### Weekly
- [ ] Performance review
- [ ] Security updates check
- [ ] Backup verification
- [ ] User feedback analysis

### Monthly
- [ ] Database maintenance
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance optimization

### Quarterly
- [ ] Major dependency updates
- [ ] Security penetration testing
- [ ] Infrastructure review
- [ ] Disaster recovery testing

### Annually
- [ ] Full security audit
- [ ] Infrastructure planning
- [ ] Documentation review
- [ ] Team training updates

## Contact Information

### Escalation Matrix
1. **Level 1**: System Administrator
   - Email: admin@vai-coxinha.com
   - Phone: +55 11 99999-9999
   - Response time: 1 hour

2. **Level 2**: Senior Developer
   - Email: senior-dev@vai-coxinha.com
   - Phone: +55 11 99999-9998
   - Response time: 4 hours

3. **Level 3**: Technical Lead
   - Email: tech-lead@vai-coxinha.com
   - Phone: +55 11 99999-9997
   - Response time: 8 hours

### External Services
- **AWS Support**: Business Support Plan
- **MongoDB Atlas**: Premium Support
- **CloudFlare**: Enterprise Support
- **Sentry**: Business Plan