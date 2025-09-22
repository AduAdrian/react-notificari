#!/bin/bash

# React Notificari - Simple Development Starter
# Starts both services and returns immediately for development

echo ""
echo "🚀 React Notificari - Quick Development Start"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Get directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Clean up any existing processes
print_info "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# Ensure .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_info "Creating development .env file..."
    cat > "$BACKEND_DIR/.env" << EOF
# Development configuration
EMAIL_PASSWORD=development-fallback-mode
SMS_API_TOKEN=development-fallback-mode
JWT_SECRET=development-jwt-secret-key-change-for-production
PORT=3001
NODE_ENV=development
EOF
    print_success "Development .env file created"
fi

# Start backend
print_info "Starting backend server..."
cd "$BACKEND_DIR"
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!

# Wait briefly for backend
sleep 3

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend started on http://localhost:3001"
else
    print_warning "Backend may still be starting..."
fi

# Start frontend
print_info "Starting frontend React app..."
cd "$PROJECT_ROOT"
export BROWSER=none
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

print_info "Frontend is compiling (this may take 30-60 seconds)..."

echo ""
echo "🎉 Services Started!"
echo "===================="
echo "• Backend:  http://localhost:3001 (should be ready now)"
echo "• Frontend: http://localhost:3000 (compiling...)"
echo "• Health:   http://localhost:3001/api/health"
echo ""
echo "📋 Next Steps:"
echo "• Wait 30-60 seconds for React to compile"
echo "• Open http://localhost:3000 in your browser"
echo "• Check logs: tail -f backend/backend.log frontend.log"
echo "• Stop with: ./stop-app.sh"
echo ""
print_warning "Email/SMS are in development simulation mode"
print_success "Ready for development!"