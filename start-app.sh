#!/bin/bash

# React Notificari - Universal Startup Script
# Works on Linux, macOS, and Unix systems

echo ""
echo "🚀 Starting React Notificari Application"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill existing processes
cleanup_processes() {
    print_info "Cleaning up existing processes..."
    
    # Kill any existing node processes on our ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    # Kill any npm/node processes (be careful not to kill system processes)
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    
    print_success "Process cleanup completed"
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Node.js and npm are available"
    echo "  Node version: $(node --version)"
    echo "  npm version: $(npm --version)"
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Frontend dependencies
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        print_info "Installing frontend dependencies..."
        cd "$PROJECT_ROOT"
        npm install --silent
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
    
    # Backend dependencies
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        print_info "Installing backend dependencies..."
        cd "$BACKEND_DIR"
        npm install --silent
        print_success "Backend dependencies installed"
    else
        print_success "Backend dependencies already installed"
    fi
}

# Function to check configuration
check_configuration() {
    print_info "Checking configuration..."
    
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_success ".env file found in backend"
    else
        print_warning ".env file not found, creating development version..."
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_success "Development .env file created from template"
        else
            print_error "No .env.example file found. Please check backend configuration."
        fi
    fi
}

# Function to start backend
start_backend() {
    print_info "Starting backend server (port 3001)..."
    cd "$BACKEND_DIR"
    
    # Start backend in background
    nohup node server.js > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    print_info "Waiting for backend to start..."
    for i in {1..15}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            print_success "Backend started successfully on http://localhost:3001"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo ""
    print_error "Backend failed to start within 15 seconds"
    print_info "Check backend.log for details:"
    tail -n 10 "$BACKEND_DIR/backend.log" 2>/dev/null || true
    return 1
}

# Function to start frontend
start_frontend() {
    print_info "Starting frontend React app (port 3000)..."
    cd "$PROJECT_ROOT"
    
    # Set environment to prevent browser from opening automatically
    export BROWSER=none
    
    # Start frontend in background
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to compile and start
    print_info "Waiting for React app to compile..."
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend started successfully on http://localhost:3000"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    echo ""
    print_error "Frontend failed to start within 2 minutes"
    print_info "Check frontend.log for details:"
    tail -n 10 "$PROJECT_ROOT/frontend.log" 2>/dev/null || true
    return 1
}

# Function to display final status
display_status() {
    echo ""
    echo "======================================================="
    print_success "           APPLICATION READY!                      "
    echo "======================================================="
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:3000"
    echo "  Health:   http://localhost:3001/api/health"
    echo "======================================================="
    echo ""
    echo "📋 COMMANDS:"
    echo "  • Restart:    ./start-app.sh"
    echo "  • Stop:       ./stop-app.sh (or Ctrl+C)"
    echo "  • Logs:       tail -f backend/backend.log frontend.log"
    echo "======================================================="
    echo ""
    
    print_info "Email and SMS are running in development mode (simulation fallback)"
    print_info "The application is ready for development and testing!"
}

# Function to handle cleanup on exit
cleanup_on_exit() {
    echo ""
    print_info "Shutting down application..."
    cleanup_processes
    print_success "Application stopped"
    exit 0
}

# Main execution
main() {
    # Handle Ctrl+C gracefully
    trap cleanup_on_exit INT TERM
    
    # Check if we should skip cleanup (for development)
    if [[ "$1" != "--no-cleanup" ]]; then
        cleanup_processes
    fi
    
    check_dependencies
    install_dependencies
    check_configuration
    
    # Start services
    if start_backend && start_frontend; then
        display_status
        
        # Keep script running and monitor services
        print_info "Application is running. Press Ctrl+C to stop."
        while true; do
            sleep 5
            # Optional: Add health checks here
        done
    else
        print_error "Failed to start application"
        cleanup_processes
        exit 1
    fi
}

# Run main function
main "$@"