#!/bin/bash
set -euo pipefail

# DuetRight Dashboard Deployment Script
# This script handles the deployment process for the dashboard

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
NODE_ENV="${NODE_ENV:-production}"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_requirements() {
    log "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check for .env file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        error "Missing .env.production file"
    fi
    
    log "All requirements met ✓"
}

run_tests() {
    log "Running tests..."
    cd "$PROJECT_ROOT"
    
    # Run backend tests
    if ! npm test; then
        error "Backend tests failed"
    fi
    
    log "All tests passed ✓"
}

build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    npm ci --production=false
    
    # Run build
    if ! npm run build; then
        error "Frontend build failed"
    fi
    
    log "Frontend built successfully ✓"
}

build_backend() {
    log "Building backend..."
    cd "$PROJECT_ROOT"
    
    # Install production dependencies
    npm ci --production
    
    # Compile TypeScript
    if ! npm run build; then
        error "Backend build failed"
    fi
    
    log "Backend built successfully ✓"
}

deploy_files() {
    log "Deploying files..."
    
    # Create deployment directory
    DEPLOY_DIR="$PROJECT_ROOT/deploy"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy backend files
    cp -r "$PROJECT_ROOT/dist" "$DEPLOY_DIR/"
    cp -r "$PROJECT_ROOT/node_modules" "$DEPLOY_DIR/"
    cp "$PROJECT_ROOT/package.json" "$DEPLOY_DIR/"
    cp "$PROJECT_ROOT/package-lock.json" "$DEPLOY_DIR/"
    cp "$PROJECT_ROOT/.env.production" "$DEPLOY_DIR/.env"
    
    # Copy frontend build
    mkdir -p "$DEPLOY_DIR/public"
    cp -r "$FRONTEND_DIR/dist/"* "$DEPLOY_DIR/public/"
    
    # Create start script
    cat > "$DEPLOY_DIR/start.sh" << 'EOF'
#!/bin/bash
export NODE_ENV=production
node dist/index.js
EOF
    chmod +x "$DEPLOY_DIR/start.sh"
    
    log "Files deployed to $DEPLOY_DIR ✓"
}

create_health_check() {
    log "Creating health check script..."
    
    cat > "$DEPLOY_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Health check script for DuetRight Dashboard

HEALTH_URL="${HEALTH_URL:-http://localhost:5001/api/health}"
MAX_RETRIES=5
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "Health check passed"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Health check failed, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
EOF
    chmod +x "$DEPLOY_DIR/health-check.sh"
    
    log "Health check script created ✓"
}

create_systemd_service() {
    log "Creating systemd service file..."
    
    cat > "$DEPLOY_DIR/duetright-dashboard.service" << EOF
[Unit]
Description=DuetRight IT Dashboard
After=network.target

[Service]
Type=simple
User=duetright
WorkingDirectory=/opt/duetright-dashboard
ExecStart=/opt/duetright-dashboard/start.sh
Restart=always
RestartSec=10
StandardOutput=append:/var/log/duetright/dashboard.log
StandardError=append:/var/log/duetright/dashboard-error.log
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF
    
    log "Systemd service file created ✓"
}

print_deployment_instructions() {
    cat << EOF

${GREEN}=== Deployment Complete ===${NC}

The application has been built and prepared for deployment in:
${YELLOW}$DEPLOY_DIR${NC}

${GREEN}Next Steps:${NC}

1. Copy deployment files to server:
   ${YELLOW}rsync -avz $DEPLOY_DIR/ user@server:/opt/duetright-dashboard/${NC}

2. On the server, install the systemd service:
   ${YELLOW}sudo cp /opt/duetright-dashboard/duetright-dashboard.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable duetright-dashboard
   sudo systemctl start duetright-dashboard${NC}

3. Set up nginx reverse proxy (example):
   ${YELLOW}server {
       listen 80;
       server_name dashboard.duetright.com;
       
       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }${NC}

4. Run health check:
   ${YELLOW}/opt/duetright-dashboard/health-check.sh${NC}

5. Monitor logs:
   ${YELLOW}sudo journalctl -u duetright-dashboard -f${NC}

EOF
}

# Main deployment process
main() {
    log "Starting DuetRight Dashboard deployment..."
    
    check_requirements
    run_tests
    build_backend
    build_frontend
    deploy_files
    create_health_check
    create_systemd_service
    
    log "Deployment preparation complete! 🚀"
    print_deployment_instructions
}

# Run main function
main "$@"