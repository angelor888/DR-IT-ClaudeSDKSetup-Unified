#!/bin/bash
set -euo pipefail

# Automated Deployment Script for DuetRight Dashboard
# Supports blue-green, rolling, and canary deployments

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-blue-green}"
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-latest}"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=5

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if deployment is allowed
    if [[ -f "$PROJECT_ROOT/.deployment-lock" ]]; then
        error "Deployment locked. Another deployment may be in progress."
    fi
    
    # Create deployment lock
    echo "$$" > "$PROJECT_ROOT/.deployment-lock"
    trap 'rm -f "$PROJECT_ROOT/.deployment-lock"' EXIT
    
    # Verify environment
    if [[ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h /opt | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -gt 80 ]]; then
        warning "Disk usage is high: ${DISK_USAGE}%"
    fi
    
    # Backup current deployment
    if [[ -d "$PROJECT_ROOT/current" ]]; then
        log "Backing up current deployment..."
        cp -r "$PROJECT_ROOT/current" "$PROJECT_ROOT/backup-$(date +%Y%m%d-%H%M%S)"
    fi
    
    log "Pre-deployment checks passed ✓"
}

# Health check function
health_check() {
    local url=$1
    local retries=$2
    
    log "Running health checks on $url..."
    
    for i in $(seq 1 $retries); do
        if curl -sf "$url/api/health" > /dev/null; then
            log "Health check passed ✓"
            return 0
        fi
        
        if [[ $i -lt $retries ]]; then
            info "Health check failed, retrying in ${HEALTH_CHECK_DELAY}s... ($i/$retries)"
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    error "Health check failed after $retries attempts"
}

# Blue-Green Deployment
blue_green_deployment() {
    log "Starting Blue-Green deployment..."
    
    # Determine current color
    if [[ -L "$PROJECT_ROOT/current" ]]; then
        CURRENT=$(readlink "$PROJECT_ROOT/current" | xargs basename)
        if [[ "$CURRENT" == "blue" ]]; then
            NEW="green"
        else
            NEW="blue"
        fi
    else
        NEW="blue"
    fi
    
    log "Deploying to $NEW environment..."
    
    # Prepare new environment
    rm -rf "$PROJECT_ROOT/$NEW"
    mkdir -p "$PROJECT_ROOT/$NEW"
    
    # Deploy to new environment
    cd "$PROJECT_ROOT/$NEW"
    
    # Copy application files
    cp -r "$PROJECT_ROOT/dist" .
    cp -r "$PROJECT_ROOT/public" .
    cp "$PROJECT_ROOT/package.json" .
    cp "$PROJECT_ROOT/package-lock.json" .
    cp "$PROJECT_ROOT/.env.$ENVIRONMENT" .env
    
    # Install production dependencies
    npm ci --production
    
    # Start new environment
    PORT=$([[ "$NEW" == "blue" ]] && echo "5001" || echo "5002")
    export PORT
    nohup node dist/index.js > "$PROJECT_ROOT/logs/$NEW.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/$NEW.pid"
    
    # Health check new environment
    health_check "http://localhost:$PORT" $HEALTH_CHECK_RETRIES
    
    # Run smoke tests
    if ! BASE_URL="http://localhost:$PORT" "$SCRIPT_DIR/../tests/smoke-test.sh"; then
        error "Smoke tests failed on $NEW environment"
    fi
    
    # Switch traffic
    log "Switching traffic to $NEW environment..."
    ln -sfn "$PROJECT_ROOT/$NEW" "$PROJECT_ROOT/current"
    
    # Update nginx
    sudo sed -i "s/localhost:500[12]/localhost:$PORT/g" /etc/nginx/sites-available/duetright-dashboard
    sudo nginx -t && sudo systemctl reload nginx
    
    # Stop old environment
    if [[ -f "$PROJECT_ROOT/$CURRENT.pid" ]]; then
        log "Stopping $CURRENT environment..."
        kill $(cat "$PROJECT_ROOT/$CURRENT.pid") || true
        rm -f "$PROJECT_ROOT/$CURRENT.pid"
    fi
    
    log "Blue-Green deployment completed successfully! ✓"
}

# Rolling Deployment (for Kubernetes)
rolling_deployment() {
    log "Starting Rolling deployment..."
    
    # Update image
    kubectl set image deployment/duetright-dashboard \
        dashboard="$DOCKER_REGISTRY/duetright-dashboard:$VERSION" \
        --record
    
    # Monitor rollout
    kubectl rollout status deployment/duetright-dashboard
    
    # Verify deployment
    READY_REPLICAS=$(kubectl get deployment duetright-dashboard -o jsonpath='{.status.readyReplicas}')
    DESIRED_REPLICAS=$(kubectl get deployment duetright-dashboard -o jsonpath='{.spec.replicas}')
    
    if [[ "$READY_REPLICAS" != "$DESIRED_REPLICAS" ]]; then
        error "Deployment failed: $READY_REPLICAS/$DESIRED_REPLICAS replicas ready"
    fi
    
    log "Rolling deployment completed successfully! ✓"
}

# Canary Deployment
canary_deployment() {
    log "Starting Canary deployment..."
    
    # Deploy canary version
    CANARY_REPLICAS=1
    STABLE_REPLICAS=4
    
    # Create canary deployment
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: duetright-dashboard-canary
spec:
  replicas: $CANARY_REPLICAS
  selector:
    matchLabels:
      app: duetright-dashboard
      version: canary
  template:
    metadata:
      labels:
        app: duetright-dashboard
        version: canary
    spec:
      containers:
      - name: dashboard
        image: $DOCKER_REGISTRY/duetright-dashboard:$VERSION
        ports:
        - containerPort: 5001
EOF
    
    # Wait for canary to be ready
    kubectl rollout status deployment/duetright-dashboard-canary
    
    # Monitor canary metrics
    log "Monitoring canary deployment for 5 minutes..."
    sleep 300
    
    # Check canary health
    CANARY_ERRORS=$(curl -s http://prometheus:9090/api/v1/query \
        --data-urlencode 'query=rate(http_requests_total{job="dashboard",version="canary",status=~"5.."}[5m])' \
        | jq -r '.data.result[0].value[1]' || echo "0")
    
    if (( $(echo "$CANARY_ERRORS > 0.05" | bc -l) )); then
        warning "High error rate detected in canary: $CANARY_ERRORS"
        log "Rolling back canary deployment..."
        kubectl delete deployment duetright-dashboard-canary
        error "Canary deployment failed"
    fi
    
    # Promote canary
    log "Promoting canary to stable..."
    kubectl set image deployment/duetright-dashboard \
        dashboard="$DOCKER_REGISTRY/duetright-dashboard:$VERSION"
    
    # Scale down canary
    kubectl scale deployment duetright-dashboard-canary --replicas=0
    
    # Delete canary deployment
    kubectl delete deployment duetright-dashboard-canary
    
    log "Canary deployment completed successfully! ✓"
}

# Docker Compose Deployment
docker_deployment() {
    log "Starting Docker Compose deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    docker-compose pull
    
    # Deploy with zero downtime
    docker-compose up -d --no-deps --scale dashboard=2 dashboard
    
    # Wait for new containers
    sleep 10
    
    # Health check
    health_check "http://localhost:5001" $HEALTH_CHECK_RETRIES
    
    # Remove old containers
    docker-compose up -d --no-deps --remove-orphans dashboard
    
    log "Docker deployment completed successfully! ✓"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Clear cache
    redis-cli FLUSHDB
    
    # Run database migrations
    cd "$PROJECT_ROOT"
    npm run migrate || true
    
    # Warm up cache
    curl -s "$BASE_URL/api/health/detailed" > /dev/null
    
    # Send notification
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"✅ Deployment completed successfully!\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"$VERSION\", \"short\": true},
                        {\"title\": \"Type\", \"value\": \"$DEPLOYMENT_TYPE\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }"
    fi
    
    # Update status page
    if command -v statuspage-cli &> /dev/null; then
        statuspage-cli update --component dashboard --status operational
    fi
    
    log "Post-deployment tasks completed ✓"
}

# Main deployment flow
main() {
    log "Starting automated deployment..."
    log "Environment: $ENVIRONMENT"
    log "Deployment Type: $DEPLOYMENT_TYPE"
    log "Version: $VERSION"
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Execute deployment based on type
    case $DEPLOYMENT_TYPE in
        blue-green)
            blue_green_deployment
            ;;
        rolling)
            rolling_deployment
            ;;
        canary)
            canary_deployment
            ;;
        docker)
            docker_deployment
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac
    
    # Post-deployment tasks
    post_deployment
    
    log "Deployment completed successfully! 🎉"
    
    # Remove deployment lock
    rm -f "$PROJECT_ROOT/.deployment-lock"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --type TYPE       Deployment type (blue-green, rolling, canary, docker)"
            echo "  --env ENV         Environment (production, staging)"
            echo "  --version VERSION Version to deploy"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Run main deployment
main "$@"