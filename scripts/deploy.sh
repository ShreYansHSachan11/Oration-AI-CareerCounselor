#!/bin/bash

# Production Deployment Script for Career Counseling Chat Application
# This script handles the complete deployment process including health checks

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please copy .env.production.example to $ENV_FILE and configure it"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Build Docker images
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    log_success "Application built successfully"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    cd "$PROJECT_DIR"
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Application deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        # Check if all services are healthy
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy\|starting"; then
            log_warning "Services are still starting up..."
            sleep 10
            ((attempt++))
        else
            log_success "All services are healthy"
            return 0
        fi
    done
    
    log_error "Services failed to become healthy within timeout"
    return 1
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_DIR"
    
    # Run migrations inside the app container
    docker-compose -f "$COMPOSE_FILE" exec -T app node scripts/production-setup.js
    
    log_success "Database migrations completed"
}

# Perform health checks
health_check() {
    log_info "Performing application health check..."
    
    local app_url="${NEXTAUTH_URL:-http://localhost:3000}"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$app_url/api/health" > /dev/null; then
            log_success "Application health check passed"
            return 0
        else
            log_warning "Health check attempt $attempt/$max_attempts failed"
            sleep 5
            ((attempt++))
        fi
    done
    
    log_error "Application health check failed"
    return 1
}

# Backup database (optional)
backup_database() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        log_info "Creating database backup..."
        
        local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres career_counseling_chat > "$backup_file"
        
        log_success "Database backup created: $backup_file"
    fi
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    cd "$PROJECT_DIR"
    
    # Stop current deployment
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        log_info "Restoring database from backup..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d career_counseling_chat < "$BACKUP_FILE"
    fi
    
    log_error "Deployment rolled back"
    exit 1
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting production deployment..."
    
    # Set trap for rollback on error
    trap rollback ERR
    
    # Load environment variables
    if [ -f "$PROJECT_DIR/$ENV_FILE" ]; then
        source "$PROJECT_DIR/$ENV_FILE"
    fi
    
    # Run deployment steps
    check_prerequisites
    backup_database
    build_application
    deploy_application
    wait_for_services
    run_migrations
    health_check
    cleanup
    
    log_success "Production deployment completed successfully!"
    log_info "Application is available at: ${NEXTAUTH_URL:-http://localhost:3000}"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|cleanup}"
        exit 1
        ;;
esac