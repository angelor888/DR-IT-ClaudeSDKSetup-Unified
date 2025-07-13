#!/bin/bash
set -euo pipefail

# Rollback Script for DuetRight Dashboard
# Quickly reverts to previous deployment in case of issues

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ROLLBACK_TYPE="${ROLLBACK_TYPE:-auto}"
TARGET_VERSION="${TARGET_VERSION:-}"
SKIP_CONFIRMATION="${SKIP_CONFIRMATION:-false}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Detect deployment type
detect_deployment_type() {
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]] && docker-compose ps 2>/dev/null | grep -q "duetright"; then
        echo "docker"
    elif kubectl get deployment duetright-dashboard &>/dev/null; then
        echo "kubernetes"
    elif [[ -L "$PROJECT_ROOT/current" ]]; then
        echo "blue-green"
    else
        echo "traditional"
    fi
}

# Get rollback history
get_rollback_options() {
    log "Available rollback options:"
    
    case $(detect_deployment_type) in
        docker)
            info "Docker image history:"
            docker images duetright/dashboard --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -10
            ;;
        kubernetes)
            info "Kubernetes rollout history:"
            kubectl rollout history deployment/duetright-dashboard
            ;;
        blue-green)
            info "Available deployments:"
            ls -la "$PROJECT_ROOT" | grep -E "blue|green|backup-"
            ;;
        traditional)
            info "Backup directories:"
            ls -la "$PROJECT_ROOT" | grep "backup-"
            ;;
    esac
}

# Confirm rollback
confirm_rollback() {
    if [[ "$SKIP_CONFIRMATION" == "true" ]]; then
        return 0
    fi
    
    echo -e "\n${YELLOW}⚠️  WARNING: You are about to rollback the deployment${NC}"
    echo "This action will:"
    echo "  - Stop current deployment"
    echo "  - Restore previous version"
    echo "  - Clear caches"
    echo "  - May cause temporary downtime"
    
    read -p "Are you sure you want to continue? (yes/no) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback cancelled"
        exit 0
    fi
}

# Docker rollback
rollback_docker() {
    log "Performing Docker rollback..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -n "$TARGET_VERSION" ]]; then
        # Rollback to specific version
        log "Rolling back to version: $TARGET_VERSION"
        
        # Update docker-compose to use specific version
        sed -i.bak "s|image: duetright/dashboard:.*|image: duetright/dashboard:$TARGET_VERSION|g" docker-compose.yml
        
        # Deploy specific version
        docker-compose pull
        docker-compose up -d
    else
        # Rollback to previous version
        log "Rolling back to previous version..."
        
        # Get current and previous image
        CURRENT_IMAGE=$(docker-compose images -q dashboard)
        PREVIOUS_IMAGE=$(docker images duetright/dashboard --format "{{.ID}}" | sed -n 2p)
        
        if [[ -z "$PREVIOUS_IMAGE" ]]; then
            error "No previous image found for rollback"
        fi
        
        # Tag previous as rollback
        docker tag "$PREVIOUS_IMAGE" duetright/dashboard:rollback
        
        # Update compose file
        sed -i.bak "s|image: duetright/dashboard:.*|image: duetright/dashboard:rollback|g" docker-compose.yml
        
        # Deploy rollback
        docker-compose up -d
    fi
    
    # Restore compose file
    mv docker-compose.yml.bak docker-compose.yml
}

# Kubernetes rollback
rollback_kubernetes() {
    log "Performing Kubernetes rollback..."
    
    if [[ -n "$TARGET_VERSION" ]]; then
        # Rollback to specific revision
        kubectl rollout undo deployment/duetright-dashboard --to-revision="$TARGET_VERSION"
    else
        # Rollback to previous revision
        kubectl rollout undo deployment/duetright-dashboard
    fi
    
    # Monitor rollback
    kubectl rollout status deployment/duetright-dashboard
    
    # Verify rollback
    READY=$(kubectl get deployment duetright-dashboard -o jsonpath='{.status.readyReplicas}')
    DESIRED=$(kubectl get deployment duetright-dashboard -o jsonpath='{.spec.replicas}')
    
    if [[ "$READY" != "$DESIRED" ]]; then
        error "Rollback failed: $READY/$DESIRED replicas ready"
    fi
}

# Blue-Green rollback
rollback_blue_green() {
    log "Performing Blue-Green rollback..."
    
    # Get current deployment
    if [[ ! -L "$PROJECT_ROOT/current" ]]; then
        error "No current deployment found"
    fi
    
    CURRENT=$(readlink "$PROJECT_ROOT/current" | xargs basename)
    PREVIOUS=$([[ "$CURRENT" == "blue" ]] && echo "green" || echo "blue")
    
    if [[ ! -d "$PROJECT_ROOT/$PREVIOUS" ]]; then
        error "Previous deployment not found: $PREVIOUS"
    fi
    
    # Check if previous is running
    if [[ -f "$PROJECT_ROOT/$PREVIOUS.pid" ]]; then
        PID=$(cat "$PROJECT_ROOT/$PREVIOUS.pid")
        if ! kill -0 "$PID" 2>/dev/null; then
            warning "Previous deployment not running, starting it..."
            
            cd "$PROJECT_ROOT/$PREVIOUS"
            PORT=$([[ "$PREVIOUS" == "blue" ]] && echo "5001" || echo "5002")
            export PORT
            nohup node dist/index.js > "$PROJECT_ROOT/logs/$PREVIOUS.log" 2>&1 &
            echo $! > "$PROJECT_ROOT/$PREVIOUS.pid"
            
            # Wait for startup
            sleep 10
        fi
    fi
    
    # Switch traffic
    log "Switching traffic to $PREVIOUS..."
    ln -sfn "$PROJECT_ROOT/$PREVIOUS" "$PROJECT_ROOT/current"
    
    # Update nginx
    PORT=$([[ "$PREVIOUS" == "blue" ]] && echo "5001" || echo "5002")
    sudo sed -i "s/localhost:500[12]/localhost:$PORT/g" /etc/nginx/sites-available/duetright-dashboard
    sudo nginx -t && sudo systemctl reload nginx
    
    # Stop failed deployment
    if [[ -f "$PROJECT_ROOT/$CURRENT.pid" ]]; then
        kill $(cat "$PROJECT_ROOT/$CURRENT.pid") || true
        rm -f "$PROJECT_ROOT/$CURRENT.pid"
    fi
}

# Traditional rollback
rollback_traditional() {
    log "Performing traditional rollback..."
    
    # Find latest backup
    if [[ -n "$TARGET_VERSION" ]]; then
        BACKUP_DIR="$PROJECT_ROOT/backup-$TARGET_VERSION"
    else
        BACKUP_DIR=$(ls -dt "$PROJECT_ROOT"/backup-* 2>/dev/null | head -1)
    fi
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to: $(basename "$BACKUP_DIR")"
    
    # Stop current service
    if systemctl is-active --quiet duetright-dashboard; then
        sudo systemctl stop duetright-dashboard
    fi
    
    # Backup current (failed) deployment
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        mv "$PROJECT_ROOT/dist" "$PROJECT_ROOT/dist.failed.$(date +%Y%m%d-%H%M%S)"
    fi
    
    # Restore from backup
    cp -r "$BACKUP_DIR"/* "$PROJECT_ROOT/"
    
    # Start service
    sudo systemctl start duetright-dashboard
}

# Post-rollback tasks
post_rollback() {
    log "Running post-rollback tasks..."
    
    # Clear caches
    redis-cli FLUSHDB || warning "Failed to clear Redis cache"
    
    # Health check
    sleep 5
    if ! curl -sf "http://localhost:5001/api/health" > /dev/null; then
        error "Health check failed after rollback"
    fi
    
    # Run smoke tests
    if [[ -f "$SCRIPT_DIR/../tests/smoke-test.sh" ]]; then
        if ! "$SCRIPT_DIR/../tests/smoke-test.sh"; then
            warning "Smoke tests failed after rollback"
        fi
    fi
    
    # Notify team
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"⚠️ Deployment rolled back\",
                \"attachments\": [{
                    \"color\": \"warning\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"${ENVIRONMENT:-production}\", \"short\": true},
                        {\"title\": \"Rollback Type\", \"value\": \"$(detect_deployment_type)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"Initiated By\", \"value\": \"$(whoami)\", \"short\": true}
                    ]
                }]
            }"
    fi
    
    # Create incident report
    cat > "$PROJECT_ROOT/logs/rollback-$(date +%Y%m%d-%H%M%S).log" << EOF
Rollback Report
===============
Date: $(date)
User: $(whoami)
Type: $(detect_deployment_type)
Target Version: ${TARGET_VERSION:-previous}
Reason: Manual rollback initiated

Actions Taken:
1. Deployment rolled back
2. Caches cleared
3. Health checks performed
4. Team notified

Next Steps:
1. Investigate root cause
2. Fix issues
3. Plan re-deployment
EOF
    
    log "Post-rollback tasks completed ✓"
}

# Main rollback flow
main() {
    log "🔄 Starting rollback procedure..."
    
    # Detect deployment type
    DEPLOYMENT_TYPE=$(detect_deployment_type)
    log "Detected deployment type: $DEPLOYMENT_TYPE"
    
    # Show rollback options
    get_rollback_options
    
    # Confirm rollback
    confirm_rollback
    
    # Create rollback lock
    echo "$$" > "$PROJECT_ROOT/.rollback-lock"
    trap 'rm -f "$PROJECT_ROOT/.rollback-lock"' EXIT
    
    # Perform rollback based on type
    case $DEPLOYMENT_TYPE in
        docker)
            rollback_docker
            ;;
        kubernetes)
            rollback_kubernetes
            ;;
        blue-green)
            rollback_blue_green
            ;;
        traditional)
            rollback_traditional
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac
    
    # Post-rollback tasks
    post_rollback
    
    log "✅ Rollback completed successfully!"
    warning "Please investigate the issue before attempting another deployment"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            TARGET_VERSION="$2"
            shift 2
            ;;
        --force)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --type)
            ROLLBACK_TYPE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --version VERSION  Rollback to specific version"
            echo "  --force           Skip confirmation prompt"
            echo "  --type TYPE       Force rollback type"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Run main rollback
main "$@"