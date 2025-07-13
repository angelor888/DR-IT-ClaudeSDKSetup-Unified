#!/bin/bash
set -euo pipefail

# DuetRight Dashboard Restore Script
# This script restores the dashboard from a backup

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/duetright-dashboard}"
RESTORE_DIR="/tmp/duetright-restore-$$"

# Colors for output
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
    cleanup
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

cleanup() {
    if [[ -d "$RESTORE_DIR" ]]; then
        rm -rf "$RESTORE_DIR"
    fi
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] BACKUP_FILE

Restore DuetRight Dashboard from backup

Options:
    -h, --help              Show this help message
    -f, --force             Force restore without confirmation
    -r, --redis-only        Restore only Redis data
    -u, --uploads-only      Restore only uploads
    -c, --config-only       Restore only configuration
    -s, --skip-services     Don't stop/start services
    --dry-run               Show what would be restored without doing it

Examples:
    $0 /var/backups/duetright-dashboard/duetright-backup-20240115_120000.tar.gz
    $0 --redis-only backup.tar.gz
    $0 --dry-run backup.tar.gz

EOF
    exit 0
}

# Parse arguments
BACKUP_FILE=""
FORCE=false
REDIS_ONLY=false
UPLOADS_ONLY=false
CONFIG_ONLY=false
SKIP_SERVICES=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -r|--redis-only)
            REDIS_ONLY=true
            shift
            ;;
        -u|--uploads-only)
            UPLOADS_ONLY=true
            shift
            ;;
        -c|--config-only)
            CONFIG_ONLY=true
            shift
            ;;
        -s|--skip-services)
            SKIP_SERVICES=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Validate backup file
validate_backup() {
    if [[ -z "$BACKUP_FILE" ]]; then
        error "No backup file specified. Use -h for help."
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        error "Backup file not found: $BACKUP_FILE"
    fi
    
    log "Validating backup file: $BACKUP_FILE"
}

# Extract backup
extract_backup() {
    log "Extracting backup..."
    
    mkdir -p "$RESTORE_DIR"
    tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
    
    # Find the extracted directory
    BACKUP_TIMESTAMP=$(ls "$RESTORE_DIR" | head -1)
    EXTRACTED_DIR="$RESTORE_DIR/$BACKUP_TIMESTAMP"
    
    if [[ ! -d "$EXTRACTED_DIR" ]]; then
        error "Failed to extract backup"
    fi
    
    # Read manifest
    if [[ -f "$EXTRACTED_DIR/manifest.json" ]]; then
        info "Backup manifest:"
        cat "$EXTRACTED_DIR/manifest.json" | jq '.' 2>/dev/null || cat "$EXTRACTED_DIR/manifest.json"
    fi
    
    log "Backup extracted successfully ✓"
}

# Stop services
stop_services() {
    if [[ "$SKIP_SERVICES" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Stopping services..."
    
    # Try systemd first
    if systemctl is-active --quiet duetright-dashboard; then
        sudo systemctl stop duetright-dashboard
        log "Stopped duetright-dashboard service ✓"
    fi
    
    # Try Docker
    if command -v docker &> /dev/null; then
        if docker ps | grep -q duetright-dashboard; then
            docker-compose down || docker stop duetright-dashboard
            log "Stopped Docker containers ✓"
        fi
    fi
}

# Restore Redis data
restore_redis() {
    if [[ "$UPLOADS_ONLY" == "true" ]] || [[ "$CONFIG_ONLY" == "true" ]]; then
        return
    fi
    
    log "Restoring Redis data..."
    
    if [[ -f "$EXTRACTED_DIR/redis/dump.rdb" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            info "Would restore Redis dump.rdb"
        else
            # Get Redis directory
            REDIS_DIR=$(redis-cli CONFIG GET dir 2>/dev/null | tail -1 || echo "/var/lib/redis")
            
            # Stop Redis
            sudo systemctl stop redis-server 2>/dev/null || true
            
            # Backup current dump
            if [[ -f "$REDIS_DIR/dump.rdb" ]]; then
                sudo mv "$REDIS_DIR/dump.rdb" "$REDIS_DIR/dump.rdb.bak"
            fi
            
            # Copy new dump
            sudo cp "$EXTRACTED_DIR/redis/dump.rdb" "$REDIS_DIR/dump.rdb"
            sudo chown redis:redis "$REDIS_DIR/dump.rdb"
            
            # Start Redis
            sudo systemctl start redis-server 2>/dev/null || true
            
            log "Redis data restored ✓"
        fi
    else
        warning "No Redis backup found"
    fi
}

# Restore uploads
restore_uploads() {
    if [[ "$REDIS_ONLY" == "true" ]] || [[ "$CONFIG_ONLY" == "true" ]]; then
        return
    fi
    
    log "Restoring uploads..."
    
    UPLOADS_BACKUP=$(find "$EXTRACTED_DIR/uploads" -name "uploads_*.tar.gz" -type f | head -1)
    
    if [[ -f "$UPLOADS_BACKUP" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            info "Would restore uploads from $UPLOADS_BACKUP"
        else
            # Backup current uploads
            if [[ -d "$PROJECT_ROOT/uploads" ]]; then
                mv "$PROJECT_ROOT/uploads" "$PROJECT_ROOT/uploads.bak"
            fi
            
            # Extract uploads
            tar -xzf "$UPLOADS_BACKUP" -C "$PROJECT_ROOT"
            
            log "Uploads restored ✓"
        fi
    else
        warning "No uploads backup found"
    fi
}

# Restore configuration
restore_config() {
    if [[ "$REDIS_ONLY" == "true" ]] || [[ "$UPLOADS_ONLY" == "true" ]]; then
        return
    fi
    
    log "Restoring configuration files..."
    
    if [[ -d "$EXTRACTED_DIR/config" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            info "Would restore configuration files:"
            ls -la "$EXTRACTED_DIR/config/"
        else
            # Prompt for env file restore
            if [[ -f "$EXTRACTED_DIR/config/env.production" ]]; then
                if [[ "$FORCE" == "true" ]] || confirm "Restore .env.production file?"; then
                    cp "$EXTRACTED_DIR/config/env.production" "$PROJECT_ROOT/.env.production"
                    log "Environment file restored ✓"
                fi
            fi
            
            # Restore other config files
            for config_file in nginx.conf docker-compose.yml; do
                if [[ -f "$EXTRACTED_DIR/config/$config_file" ]]; then
                    cp "$EXTRACTED_DIR/config/$config_file" "$PROJECT_ROOT/$config_file.restored"
                    info "Restored $config_file as $config_file.restored"
                fi
            done
        fi
    else
        warning "No configuration backup found"
    fi
}

# Restore Firestore data
restore_firestore() {
    if [[ "$REDIS_ONLY" == "true" ]] || [[ "$UPLOADS_ONLY" == "true" ]] || [[ "$CONFIG_ONLY" == "true" ]]; then
        return
    fi
    
    log "Checking Firestore backup..."
    
    if [[ -f "$EXTRACTED_DIR/firestore/backup-location.txt" ]]; then
        FIRESTORE_LOCATION=$(cat "$EXTRACTED_DIR/firestore/backup-location.txt")
        info "Firestore backup location: $FIRESTORE_LOCATION"
        
        if [[ "$DRY_RUN" == "true" ]]; then
            info "Would restore Firestore from $FIRESTORE_LOCATION"
        else
            if command -v gcloud &> /dev/null; then
                warning "To restore Firestore data, run:"
                echo "gcloud firestore import $FIRESTORE_LOCATION"
            else
                warning "gcloud CLI not found. Install it to restore Firestore data."
            fi
        fi
    else
        info "No Firestore backup reference found"
    fi
}

# Start services
start_services() {
    if [[ "$SKIP_SERVICES" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Starting services..."
    
    # Try systemd first
    if systemctl is-enabled --quiet duetright-dashboard 2>/dev/null; then
        sudo systemctl start duetright-dashboard
        log "Started duetright-dashboard service ✓"
    fi
    
    # Try Docker
    if command -v docker &> /dev/null && [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        cd "$PROJECT_ROOT"
        docker-compose up -d
        log "Started Docker containers ✓"
    fi
}

# Confirm action
confirm() {
    local prompt="$1"
    local response
    
    read -p "$prompt [y/N] " -n 1 -r response
    echo
    [[ "$response" =~ ^[Yy]$ ]]
}

# Verify restore
verify_restore() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Verifying restore..."
    
    # Check service health
    sleep 5
    if curl -s http://localhost:5001/api/health > /dev/null; then
        log "Service health check passed ✓"
    else
        warning "Service health check failed - please check logs"
    fi
}

# Main restore process
main() {
    log "Starting DuetRight Dashboard restore..."
    
    # Validate backup
    validate_backup
    
    # Extract backup
    extract_backup
    
    # Confirm restore
    if [[ "$FORCE" != "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        if ! confirm "Are you sure you want to restore from this backup?"; then
            log "Restore cancelled"
            cleanup
            exit 0
        fi
    fi
    
    # Stop services
    stop_services
    
    # Restore components
    restore_redis
    restore_uploads
    restore_config
    restore_firestore
    
    # Start services
    start_services
    
    # Verify restore
    verify_restore
    
    # Cleanup
    cleanup
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "Dry run completed - no changes were made"
    else
        log "Restore completed successfully! 🎉"
        warning "Please verify that all services are working correctly"
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"