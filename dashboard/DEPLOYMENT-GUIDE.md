# DuetRight Dashboard - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the DuetRight IT Dashboard to production environments using various deployment methods.

## Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose (for containerized deployment)
- Redis 7.x
- SSL certificates for HTTPS
- Domain name configured with DNS

## Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install nginx
sudo apt install nginx -y
sudo systemctl enable nginx
```

#### 2. Deploy Application

```bash
# Clone or copy the application
cd /opt
sudo git clone https://github.com/duetright/dashboard.git duetright-dashboard
cd duetright-dashboard

# Run deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Copy files to production location
sudo cp -r deploy/* /opt/duetright-dashboard/
```

#### 3. Configure Systemd Service

```bash
# Copy service file
sudo cp /opt/duetright-dashboard/duetright-dashboard.service /etc/systemd/system/

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable duetright-dashboard
sudo systemctl start duetright-dashboard

# Check status
sudo systemctl status duetright-dashboard
```

#### 4. Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/duetright-dashboard

# Add the following configuration:
server {
    listen 80;
    server_name dashboard.duetright.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dashboard.duetright.com;

    ssl_certificate /etc/ssl/certs/duetright.crt;
    ssl_certificate_key /etc/ssl/private/duetright.key;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/duetright-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Method 2: Docker Deployment

#### 1. Build and Run with Docker Compose

```bash
# Clone repository
git clone https://github.com/duetright/dashboard.git
cd dashboard

# Create .env.production file
cp .env.example .env.production
# Edit .env.production with your configuration

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

#### 2. Using Pre-built Image

```bash
# Pull the image
docker pull duetright/dashboard:latest

# Run with environment file
docker run -d \
  --name duetright-dashboard \
  --restart unless-stopped \
  -p 5001:5001 \
  --env-file .env.production \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  duetright/dashboard:latest
```

### Method 3: Kubernetes Deployment

#### 1. Create Kubernetes Resources

```yaml
# dashboard-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: duetright-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: duetright-dashboard
  template:
    metadata:
      labels:
        app: duetright-dashboard
    spec:
      containers:
      - name: dashboard
        image: duetright/dashboard:latest
        ports:
        - containerPort: 5001
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        envFrom:
        - secretRef:
            name: dashboard-secrets
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5001
          initialDelaySeconds: 5
          periodSeconds: 5
```

```bash
# Apply configuration
kubectl apply -f dashboard-deployment.yaml
kubectl apply -f dashboard-service.yaml
kubectl apply -f dashboard-ingress.yaml
```

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=5001

# Firebase (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Redis
REDIS_URL=redis://localhost:6379

# Integrations
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_SIGNING_SECRET=your-slack-signing-secret

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

JOBBER_CLIENT_ID=your-jobber-client-id
JOBBER_CLIENT_SECRET=your-jobber-client-secret

# Optional
SENDGRID_API_KEY=your-sendgrid-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### SSL Certificate Setup

#### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d dashboard.duetright.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Using Custom Certificates

```bash
# Copy certificates to server
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.crt /etc/nginx/ssl/cert.pem
sudo cp your-key.key /etc/nginx/ssl/key.pem
sudo chmod 600 /etc/nginx/ssl/*
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check application health
curl https://dashboard.duetright.com/api/health

# Check logs
# Traditional: sudo journalctl -u duetright-dashboard -f
# Docker: docker-compose logs -f dashboard
# Kubernetes: kubectl logs -f deployment/duetright-dashboard
```

### 2. Configure Monitoring

```bash
# Set up monitoring alerts for:
- Application health endpoint
- Memory usage > 80%
- CPU usage > 80%
- Error rate > 1%
- Response time > 1s
```

### 3. Set Up Backups

```bash
# Create backup script
cat > /opt/duetright-dashboard/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/duetright-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Redis data
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/duetright-dashboard/uploads

# Backup logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /opt/duetright-dashboard/logs

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete
EOF

chmod +x /opt/duetright-dashboard/backup.sh

# Add to crontab
echo "0 2 * * * /opt/duetright-dashboard/backup.sh" | sudo crontab -
```

### 4. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Set up fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
sudo journalctl -u duetright-dashboard -n 100

# Verify environment variables
sudo -u nodejs env | grep -E "(NODE_ENV|PORT|FIREBASE)"

# Check port availability
sudo lsof -i :5001
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo journalctl -u redis-server -n 50
```

#### SSL Certificate Issues
```bash
# Test SSL configuration
openssl s_client -connect dashboard.duetright.com:443

# Verify nginx configuration
sudo nginx -t
```

### Performance Optimization

1. **Enable Redis Persistence**
   ```bash
   sudo nano /etc/redis/redis.conf
   # Set: appendonly yes
   sudo systemctl restart redis-server
   ```

2. **Configure Node.js Memory**
   ```bash
   # In systemd service or Docker:
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

3. **Enable HTTP/2 and Compression**
   - Already configured in provided nginx.conf

## Maintenance

### Regular Tasks

- **Daily**: Check application logs and health
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update SSL certificates

### Update Procedure

```bash
# 1. Backup current deployment
./backup.sh

# 2. Deploy new version
git pull origin main
./scripts/deploy.sh

# 3. Restart service
sudo systemctl restart duetright-dashboard

# 4. Verify deployment
curl https://dashboard.duetright.com/api/health
```

## Support

For deployment support or issues:
- Check logs first: `journalctl -u duetright-dashboard -f`
- Review this guide and troubleshooting section
- Contact support with logs and error messages

---

Last Updated: July 2025