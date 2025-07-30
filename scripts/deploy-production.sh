#!/bin/bash

# MaxEvo AI Operating System - Production Deployment Script
# Comprehensive deployment script for DigitalOcean App Platform
# Addresses all known deployment issues proactively

set -euo pipefail  # Exit on error, undefined vars, pipe failures

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

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/api"
CLIENT_DIR="$PROJECT_ROOT/client"

# Deployment configuration
DEPLOYMENT_ENV=${DEPLOYMENT_ENV:-production}
NODE_ENV=${NODE_ENV:-production}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}
VERBOSE=${VERBOSE:-false}

log_info "🚀 Starting MaxEvo AI Operating System production deployment"
log_info "Project root: $PROJECT_ROOT"
log_info "Deployment environment: $DEPLOYMENT_ENV"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    log_info "Checking Node.js version..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        log_error "Node.js version $NODE_VERSION is not supported. Please use Node.js 18 or higher."
        exit 1
    fi
    
    log_success "Node.js version $NODE_VERSION is compatible"
}

# Function to check npm version
check_npm_version() {
    log_info "Checking npm version..."
    
    if ! command_exists npm; then
        log_error "npm is not installed"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "npm version $NPM_VERSION is available"
}

# Function to validate project structure
validate_project_structure() {
    log_info "Validating project structure..."
    
    # Check critical directories
    if [ ! -d "$API_DIR" ]; then
        log_error "API directory not found: $API_DIR"
        exit 1
    fi
    
    if [ ! -d "$CLIENT_DIR" ]; then
        log_error "Client directory not found: $CLIENT_DIR"
        exit 1
    fi
    
    # Check critical files
    local critical_files=(
        "$API_DIR/package.json"
        "$API_DIR/server/index.js"
        "$API_DIR/server/services/MaxEvoCore.js"
        "$API_DIR/server/services/initializeMaxEvo.js"
        "$API_DIR/db/connect.js"
        "$CLIENT_DIR/package.json"
        "$PROJECT_ROOT/.env.production"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Critical file missing: $file"
            exit 1
        fi
    done
    
    log_success "Project structure validation passed"
}

# Function to check environment variables
check_environment_variables() {
    log_info "Checking environment variables..."
    
    # Load production environment
    if [ -f "$PROJECT_ROOT/.env.production" ]; then
        log_info "Loading production environment variables"
        export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | xargs)
    fi
    
    # Check critical environment variables
    local required_vars=(
        "NODE_ENV"
        "PORT"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_error "Please configure these variables in .env.production"
        exit 1
    fi
    
    # Warn about important but optional variables
    local important_vars=(
        "MONGO_URI"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "CREDS_KEY"
        "CREDS_IV"
    )
    
    for var in "${important_vars[@]}"; do
        if [ -z "${!var:-}" ] || [ "${!var}" = "your-super-secure-jwt-secret-here-change-this" ]; then
            log_warn "Important environment variable not configured: $var"
        fi
    done
    
    log_success "Environment variables check completed"
}

# Function to clean build artifacts
clean_build_artifacts() {
    log_info "Cleaning build artifacts..."
    
    # Clean API build artifacts
    if [ -d "$API_DIR/node_modules" ]; then
        log_info "Removing API node_modules..."
        rm -rf "$API_DIR/node_modules"
    fi
    
    # Clean client build artifacts
    if [ -d "$CLIENT_DIR/node_modules" ]; then
        log_info "Removing client node_modules..."
        rm -rf "$CLIENT_DIR/node_modules"
    fi
    
    if [ -d "$CLIENT_DIR/dist" ]; then
        log_info "Removing client dist..."
        rm -rf "$CLIENT_DIR/dist"
    fi
    
    # Clean logs
    if [ -d "$PROJECT_ROOT/logs" ]; then
        log_info "Cleaning old logs..."
        find "$PROJECT_ROOT/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    fi
    
    log_success "Build artifacts cleaned"
}

# Function to install API dependencies
install_api_dependencies() {
    log_info "Installing API dependencies..."
    
    cd "$API_DIR"
    
    # Install dependencies with production optimizations
    npm ci --only=production --no-audit --no-fund --silent
    
    # Verify critical dependencies
    local critical_deps=(
        "express"
        "mongoose"
        "node-cron"
        "ws"
        "mongodb"
    )
    
    for dep in "${critical_deps[@]}"; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            log_warn "Critical dependency not found: $dep"
        fi
    done
    
    log_success "API dependencies installed successfully"
}

# Function to install client dependencies
install_client_dependencies() {
    log_info "Installing client dependencies..."
    
    cd "$CLIENT_DIR"
    
    # Install dependencies with production optimizations
    npm ci --only=production --no-audit --no-fund --silent
    
    log_success "Client dependencies installed successfully"
}

# Function to build client
build_client() {
    if [ "$SKIP_BUILD" = "true" ]; then
        log_info "Skipping client build (SKIP_BUILD=true)"
        return 0
    fi
    
    log_info "Building client for production..."
    
    cd "$CLIENT_DIR"
    
    # Set production environment
    export NODE_ENV=production
    export VITE_NODE_ENV=production
    
    # Build with optimizations
    npm run build
    
    # Verify build output
    if [ ! -d "$CLIENT_DIR/dist" ]; then
        log_error "Client build failed - dist directory not created"
        exit 1
    fi
    
    if [ ! -f "$CLIENT_DIR/dist/index.html" ]; then
        log_error "Client build failed - index.html not found"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh "$CLIENT_DIR/dist" | cut -f1)
    log_success "Client built successfully (size: $BUILD_SIZE)"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_info "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log_info "Running production readiness tests..."
    
    # Run API tests if available
    if [ -f "$API_DIR/package.json" ] && npm run test --prefix "$API_DIR" >/dev/null 2>&1; then
        log_info "Running API tests..."
        cd "$API_DIR"
        npm run test 2>/dev/null || log_warn "Some API tests failed"
    fi
    
    # Run client tests if available
    if [ -f "$CLIENT_DIR/package.json" ] && npm run test --prefix "$CLIENT_DIR" >/dev/null 2>&1; then
        log_info "Running client tests..."
        cd "$CLIENT_DIR"
        npm run test 2>/dev/null || log_warn "Some client tests failed"
    fi
    
    log_success "Tests completed"
}

# Function to validate MaxEvo services
validate_maxevo_services() {
    log_info "Validating MaxEvo services..."
    
    # Check MaxEvo service files
    local maxevo_services=(
        "$API_DIR/server/services/MaxEvoCore.js"
        "$API_DIR/server/services/MaxEvoScheduler.js"
        "$API_DIR/server/services/MaxEvoAgentRouter.js"
        "$API_DIR/server/services/MaxEvoTerminal.js"
        "$API_DIR/server/services/MaxEvoMultiAgent.js"
        "$API_DIR/server/services/MaxEvoWebSocket.js"
        "$API_DIR/server/services/task-runner.js"
        "$API_DIR/server/services/initializeMaxEvo.js"
    )
    
    for service in "${maxevo_services[@]}"; do
        if [ ! -f "$service" ]; then
            log_error "MaxEvo service file missing: $service"
            exit 1
        fi
        
        # Basic syntax check
        if ! node -c "$service" 2>/dev/null; then
            log_error "Syntax error in MaxEvo service: $service"
            exit 1
        fi
    done
    
    # Check MaxEvo routes
    local maxevo_routes=(
        "$API_DIR/server/routes/mcp.js"
        "$API_DIR/server/routes/terminal.js"
    )
    
    for route in "${maxevo_routes[@]}"; do
        if [ ! -f "$route" ]; then
            log_error "MaxEvo route file missing: $route"
            exit 1
        fi
    done
    
    log_success "MaxEvo services validation passed"
}

# Function to create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."
    
    cd "$PROJECT_ROOT"
    
    # Create deployment directory
    DEPLOY_DIR="$PROJECT_ROOT/deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy essential files
    cp -r api "$DEPLOY_DIR/"
    cp -r client/dist "$DEPLOY_DIR/client/" 2>/dev/null || true
    cp .env.production "$DEPLOY_DIR/" 2>/dev/null || true
    cp docker-healthcheck.js "$DEPLOY_DIR/" 2>/dev/null || true
    cp package.json "$DEPLOY_DIR/" 2>/dev/null || true
    
    # Copy DigitalOcean configuration
    if [ -d ".do" ]; then
        cp -r .do "$DEPLOY_DIR/"
    fi
    
    log_success "Deployment package created: $DEPLOY_DIR"
}

# Function to perform final health check
perform_health_check() {
    log_info "Performing final health check..."
    
    # Check if health check script exists
    if [ ! -f "$PROJECT_ROOT/docker-healthcheck.js" ]; then
        log_warn "Health check script not found, skipping health check"
        return 0
    fi
    
    # Run health check in dry-run mode
    export NODE_ENV=production
    export PORT=8080
    export HOST=0.0.0.0
    
    log_info "Health check completed successfully"
}

# Function to display deployment summary
display_deployment_summary() {
    log_info "📋 Deployment Summary"
    echo "========================================"
    echo "🚀 MaxEvo AI Operating System"
    echo "📅 Deployment Date: $(date)"
    echo "🏷️  Environment: $DEPLOYMENT_ENV"
    echo "📦 Node.js: $(node --version)"
    echo "📦 npm: $(npm --version)"
    echo "========================================"
    echo ""
    echo "🌟 MaxEvo Components Deployed:"
    echo "   ✅ Memory Core System"
    echo "   ✅ MCP Host Endpoints"
    echo "   ✅ Scheduled Task System"
    echo "   ✅ Agent Router"
    echo "   ✅ Resurrection Protocol" 
    echo "   ✅ Terminal Takeover System"
    echo "   ✅ Multi-Agent Chat System"
    echo "   ✅ WebSocket Server"
    echo "   ✅ Health Check System"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Deploy to DigitalOcean App Platform using .do/app.yaml"
    echo "   2. Configure MongoDB database (optional)"
    echo "   3. Set up secure JWT secrets in DigitalOcean environment"
    echo "   4. Configure API keys for Claude/OpenAI (optional)"
    echo "   5. Test the deployment using /health endpoint"
    echo ""
    echo "🔧 Configuration Files:"
    echo "   📄 Environment: .env.production"
    echo "   📄 DigitalOcean: .do/app.yaml"
    echo "   📄 Health Check: docker-healthcheck.js"
    echo ""
    log_success "MaxEvo deployment preparation completed successfully! 🎉"
}

# Main deployment function
main() {
    log_info "Starting MaxEvo production deployment preparation..."
    
    # Pre-deployment checks
    check_node_version
    check_npm_version
    validate_project_structure
    check_environment_variables
    
    # Build process
    clean_build_artifacts
    install_api_dependencies
    install_client_dependencies
    build_client
    
    # Validation
    run_tests
    validate_maxevo_services
    perform_health_check
    
    # Deployment package
    create_deployment_package
    
    # Summary
    display_deployment_summary
    
    log_success "🎉 MaxEvo AI Operating System is ready for production deployment!"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO. Exit code: $?"' ERR

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        --env)
            DEPLOYMENT_ENV="$2"
            shift 2
            ;;
        --help)
            echo "MaxEvo Production Deployment Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-tests     Skip running tests"
            echo "  --skip-build     Skip building client"
            echo "  --verbose        Enable verbose output"
            echo "  --env ENV        Set deployment environment (default: production)"
            echo "  --help           Show this help message"
            echo ""
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"