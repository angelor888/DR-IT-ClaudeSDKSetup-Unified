#!/bin/bash
set -euo pipefail

# DuetRight Dashboard Backup Script
# This script creates backups of the dashboard data

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/duetright-dashboard}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

# Colors for output
GREEN='\033[0;32m'
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

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Create subdirectories
    mkdir -p "$BACKUP_DIR"/{redis,uploads,logs,config,firestore}
}

# Backup Redis data
backup_redis() {
    log "Backing up Redis data..."
    
    if command -v redis-cli &> /dev/null; then
        # Trigger background save
        redis-cli BGSAVE
        
        # Wait for background save to complete
        while [ $(redis-cli LASTSAVE) -eq $(redis-cli LASTSAVE) ]; do
            sleep 1
        done
        
        # Find Redis dump file
        REDIS_DIR=$(redis-cli CONFIG GET dir | tail -1)
        REDIS_DUMP="$REDIS_DIR/dump.rdb"
        
        if [[ -f "$REDIS_DUMP" ]]; then
            cp "$REDIS_DUMP" "$BACKUP_DIR/redis/dump.rdb"
            log "Redis backup completed ✓"
        else
            warning "Redis dump file not found at $REDIS_DUMP"
        fi
    else
        warning "Redis CLI not found, skipping Redis backup"
    fi
}

# Backup uploads directory
backup_uploads() {
    log "Backing up uploads..."
    
    UPLOADS_DIR="$PROJECT_ROOT/uploads"
    if [[ -d "$UPLOADS_DIR" ]]; then
        tar -czf "$BACKUP_DIR/uploads/uploads_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT" uploads
        log "Uploads backup completed ✓"
    else
        warning "Uploads directory not found at $UPLOADS_DIR"
    fi
}

# Backup logs
backup_logs() {
    log "Backing up logs..."
    
    LOGS_DIR="$PROJECT_ROOT/logs"
    if [[ -d "$LOGS_DIR" ]]; then
        tar -czf "$BACKUP_DIR/logs/logs_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT" logs
        log "Logs backup completed ✓"
    else
        warning "Logs directory not found at $LOGS_DIR"
    fi
}

# Backup configuration files
backup_config() {
    log "Backing up configuration files..."
    
    # Copy environment files (without sensitive data in filename)
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        cp "$PROJECT_ROOT/.env.production" "$BACKUP_DIR/config/env.production"
    fi
    
    # Copy other config files
    for config_file in nginx.conf docker-compose.yml package.json; do
        if [[ -f "$PROJECT_ROOT/$config_file" ]]; then
            cp "$PROJECT_ROOT/$config_file" "$BACKUP_DIR/config/"
        fi
    done
    
    log "Configuration backup completed ✓"
}

# Export Firestore data (requires gcloud CLI)
backup_firestore() {
    log "Backing up Firestore data..."
    
    if command -v gcloud &> /dev/null; then
        # Get project ID from environment or config
        PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
        
        if [[ -n "$PROJECT_ID" ]]; then
            FIRESTORE_BACKUP_BUCKET="gs://${PROJECT_ID}-backups/firestore/$TIMESTAMP"
            
            # Export Firestore data
            gcloud firestore export "$FIRESTORE_BACKUP_BUCKET" \
                --project="$PROJECT_ID" \
                --async
            
            # Save backup location reference
            echo "$FIRESTORE_BACKUP_BUCKET" > "$BACKUP_DIR/firestore/backup-location.txt"
            
            log "Firestore export initiated to $FIRESTORE_BACKUP_BUCKET ✓"
        else
            warning "FIREBASE_PROJECT_ID not set, skipping Firestore backup"
        fi
    else
        warning "gcloud CLI not found, skipping Firestore backup"
    fi
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "components": {
    "redis": $(ls -la "$BACKUP_DIR/redis" 2>/dev/null | wc -l),
    "uploads": $(ls -la "$BACKUP_DIR/uploads" 2>/dev/null | wc -l),
    "logs": $(ls -la "$BACKUP_DIR/logs" 2>/dev/null | wc -l),
    "config": $(ls -la "$BACKUP_DIR/config" 2>/dev/null | wc -l),
    "firestore": $(ls -la "$BACKUP_DIR/firestore" 2>/dev/null | wc -l)
  },
  "size": "$(du -sh "$BACKUP_DIR" | cut -f1)",
  "hostname": "$(hostname)",
  "created_by": "$(whoami)"
}
EOF
    
    log "Manifest created ✓"
}

# Compress backup
compress_backup() {
    log "Compressing backup..."
    
    cd "$BACKUP_ROOT"
    tar -czf "duetright-backup-$TIMESTAMP.tar.gz" "$TIMESTAMP"
    
    # Remove uncompressed directory
    rm -rf "$TIMESTAMP"
    
    log "Backup compressed: duetright-backup-$TIMESTAMP.tar.gz ✓"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $BACKUP_RETENTION_DAYS days)..."
    
    find "$BACKUP_ROOT" -name "duetright-backup-*.tar.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    
    log "Cleanup completed ✓"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    UPLOAD_TO_S3="${UPLOAD_TO_S3:-false}"
    S3_BUCKET="${S3_BUCKET:-}"
    
    if [[ "$UPLOAD_TO_S3" == "true" ]] && [[ -n "$S3_BUCKET" ]]; then
        log "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_ROOT/duetright-backup-$TIMESTAMP.tar.gz" \
                "s3://$S3_BUCKET/backups/duetright-backup-$TIMESTAMP.tar.gz"
            
            log "S3 upload completed ✓"
        else
            warning "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Send notification
send_notification() {
    # You can implement email/Slack notification here
    log "Backup completed successfully!"
    log "Location: $BACKUP_ROOT/duetright-backup-$TIMESTAMP.tar.gz"
    log "Size: $(ls -lh "$BACKUP_ROOT/duetright-backup-$TIMESTAMP.tar.gz" | awk '{print $5}')"
}

# Main backup process
main() {
    log "Starting DuetRight Dashboard backup..."
    
    # Check if running as root (not recommended)
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root is not recommended"
    fi
    
    # Create backup directory
    create_backup_dir
    
    # Perform backups
    backup_redis
    backup_uploads
    backup_logs
    backup_config
    backup_firestore
    
    # Create manifest
    create_manifest
    
    # Compress backup
    compress_backup
    
    # Clean old backups
    cleanup_old_backups
    
    # Upload to cloud (if configured)
    upload_to_cloud
    
    # Send notification
    send_notification
    
    log "Backup process completed! 🎉"
}

# Run main function
main "$@"