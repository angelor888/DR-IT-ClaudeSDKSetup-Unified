# Operational Runbooks

## Table of Contents
1. [Service Start/Stop Procedures](#service-startstop-procedures)
2. [Deployment Procedures](#deployment-procedures)
3. [Troubleshooting Runbooks](#troubleshooting-runbooks)
4. [Emergency Procedures](#emergency-procedures)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Performance Tuning](#performance-tuning)

---

## Service Start/Stop Procedures

### Starting the Application

#### Docker Deployment
```bash
# Start all services
cd /opt/duetright-dashboard
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f dashboard

# Verify health
curl http://localhost:5001/api/health
```

#### Systemd Deployment
```bash
# Start the service
sudo systemctl start duetright-dashboard

# Enable on boot
sudo systemctl enable duetright-dashboard

# Check status
sudo systemctl status duetright-dashboard

# View logs
sudo journalctl -u duetright-dashboard -f
```

### Stopping the Application

#### Docker
```bash
# Graceful shutdown
docker-compose down

# Force stop (if needed)
docker-compose kill
docker-compose rm -f
```

#### Systemd
```bash
# Stop the service
sudo systemctl stop duetright-dashboard

# Disable on boot
sudo systemctl disable duetright-dashboard
```

---

## Deployment Procedures

### Blue-Green Deployment

1. **Prepare Green Environment**
```bash
# Build new version
cd /opt/duetright-dashboard-green
git pull origin main
./scripts/deploy.sh

# Test green environment
curl http://localhost:5002/api/health
```

2. **Switch Traffic**
```bash
# Update nginx configuration
sudo cp /etc/nginx/sites-available/duetright-green /etc/nginx/sites-available/duetright-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

3. **Verify and Cleanup**
```bash
# Monitor new deployment
tail -f /var/log/nginx/access.log

# If successful, stop blue environment
cd /opt/duetright-dashboard-blue
docker-compose down
```

### Rolling Update

```bash
# For Kubernetes deployments
kubectl set image deployment/duetright-dashboard \
  dashboard=duetright/dashboard:v1.2.0 \
  --record

# Monitor rollout
kubectl rollout status deployment/duetright-dashboard

# Rollback if needed
kubectl rollout undo deployment/duetright-dashboard
```

---

## Troubleshooting Runbooks

### Application Won't Start

1. **Check Logs**
```bash
# Docker logs
docker-compose logs dashboard | tail -100

# System logs
sudo journalctl -u duetright-dashboard -n 100

# Application logs
tail -f /opt/duetright-dashboard/logs/app.log
```

2. **Check Environment Variables**
```bash
# Verify .env file exists
ls -la .env.production

# Check required variables
grep -E "FIREBASE_|PORT" .env.production

# Test environment loading
docker-compose run --rm dashboard env | grep NODE_ENV
```

3. **Check Port Availability**
```bash
# Check if port is in use
sudo lsof -i :5001
sudo netstat -tulpn | grep 5001

# Kill process using port (if needed)
sudo kill -9 $(sudo lsof -t -i:5001)
```

### High Memory Usage

1. **Identify Memory Usage**
```bash
# Docker stats
docker stats --no-stream

# Process memory
ps aux | grep node | head -5

# Detailed memory info
cat /proc/$(pgrep -f "node dist/index.js")/status | grep -E "Vm|Rss"
```

2. **Analyze Heap Dump**
```bash
# Generate heap dump
docker exec duetright-dashboard \
  kill -USR2 $(docker exec duetright-dashboard pgrep -f "node")

# Copy heap dump
docker cp duetright-dashboard:/tmp/heapdump.heapsnapshot ./

# Analyze with Chrome DevTools
```

3. **Restart with Increased Memory**
```bash
# Docker
docker-compose down
export NODE_OPTIONS="--max-old-space-size=4096"
docker-compose up -d

# Systemd
sudo systemctl edit duetright-dashboard
# Add: Environment="NODE_OPTIONS=--max-old-space-size=4096"
sudo systemctl restart duetright-dashboard
```

### Database Connection Issues

1. **Test Redis Connection**
```bash
# Test connection
redis-cli ping

# Check Redis logs
docker-compose logs redis

# Test from application container
docker exec duetright-dashboard redis-cli -h redis ping
```

2. **Reset Redis Connection**
```bash
# Restart Redis
docker-compose restart redis

# Clear Redis cache (WARNING: deletes all data)
redis-cli FLUSHALL

# Restore from backup
./scripts/restore.sh --redis-only /backups/latest.tar.gz
```

### API Errors (5xx)

1. **Check Error Logs**
```bash
# Application errors
grep "ERROR" /opt/duetright-dashboard/logs/app.log | tail -50

# Nginx errors
sudo tail -f /var/log/nginx/error.log
```

2. **Check Service Health**
```bash
# Detailed health check
curl http://localhost:5001/api/health/detailed | jq .

# Check specific services
curl http://localhost:5001/api/health/services | jq .
```

3. **Enable Debug Mode**
```bash
# Temporarily enable debug logging
export LOG_LEVEL=debug
docker-compose restart dashboard

# Watch debug logs
docker-compose logs -f dashboard | grep -E "DEBUG|ERROR"
```

---

## Emergency Procedures

### Service Outage

1. **Immediate Response**
```bash
# Check if service is responding
curl -I http://localhost:5001/api/health

# Quick restart
docker-compose restart dashboard

# If not responding, force restart
docker-compose kill dashboard
docker-compose up -d dashboard
```

2. **Failover to Backup**
```bash
# Switch to backup instance
sudo cp /etc/nginx/sites-available/duetright-backup \
       /etc/nginx/sites-available/duetright-dashboard
sudo systemctl reload nginx
```

### Data Corruption

1. **Stop Services**
```bash
docker-compose down
```

2. **Restore from Backup**
```bash
# Find latest backup
ls -lt /var/backups/duetright-dashboard/

# Restore
./scripts/restore.sh /var/backups/duetright-dashboard/latest.tar.gz
```

3. **Verify Data**
```bash
# Start services
docker-compose up -d

# Run integrity checks
curl http://localhost:5001/api/health/detailed
```

### Security Breach

1. **Isolate System**
```bash
# Block all traffic except SSH
sudo ufw --force reset
sudo ufw allow 22/tcp
sudo ufw --force enable
```

2. **Preserve Evidence**
```bash
# Create forensic copy
sudo tar -czf /tmp/evidence-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/duetright-dashboard/logs \
  /var/log/nginx \
  /var/log/auth.log
```

3. **Reset Credentials**
```bash
# Generate new Firebase service account
# Update all API keys in .env.production
# Restart services with new credentials
```

---

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks
```bash
# Check service health
curl http://localhost:5001/api/health

# Check disk space
df -h

# Review error logs
grep ERROR /opt/duetright-dashboard/logs/app.log | tail -20
```

#### Weekly Tasks
```bash
# Update dependencies
cd /opt/duetright-dashboard
npm audit
npm update

# Clean old logs
find /opt/duetright-dashboard/logs -name "*.log" -mtime +30 -delete

# Backup
./scripts/backup.sh
```

#### Monthly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Certificate renewal check
sudo certbot certificates

# Performance review
docker stats --no-stream > /tmp/monthly-stats.txt
```

### Database Maintenance

1. **Redis Optimization**
```bash
# Check memory usage
redis-cli INFO memory

# Optimize memory
redis-cli MEMORY DOCTOR

# Persist to disk
redis-cli BGSAVE
```

2. **Firestore Cleanup**
```bash
# Run via scheduled job
node scripts/cleanup-old-data.js

# Export for archival
gcloud firestore export gs://duetright-backups/archive-$(date +%Y%m)
```

### Log Rotation

```bash
# Configure logrotate
cat > /etc/logrotate.d/duetright << EOF
/opt/duetright-dashboard/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        docker-compose exec dashboard kill -USR2 1
    endscript
}
EOF

# Test configuration
sudo logrotate -d /etc/logrotate.d/duetright
```

---

## Performance Tuning

### Node.js Optimization

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable heap snapshots
export NODE_OPTIONS="$NODE_OPTIONS --heapsnapshot-signal=SIGUSR2"

# CPU profiling
export NODE_OPTIONS="$NODE_OPTIONS --cpu-prof"
```

### Nginx Optimization

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Enable caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g;
    
    # Connection optimizations
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
}
```

### Redis Optimization

```bash
# Update Redis configuration
cat >> /etc/redis/redis.conf << EOF
# Performance optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300

# Persistence settings
save 900 1
save 300 10
save 60 10000
EOF

# Restart Redis
sudo systemctl restart redis
```

### Monitoring Performance

```bash
# Real-time monitoring
htop -p $(pgrep -f "node dist/index.js")

# Network monitoring
iftop -i eth0

# Disk I/O monitoring
iotop -o

# Application metrics
curl http://localhost:5001/api/metrics
```

---

**Last Updated**: July 2025
**Next Review**: Monthly
**Contact**: ops@duetright.com