#!/bin/bash

# React Notificari - Stop Application Script

echo "🛑 Stopping React Notificari Application..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${RED}🛑 $1${NC}"
}

# Kill processes on specific ports
print_info "Stopping services on ports 3000 and 3001..."

# Kill processes using ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "  Stopped service on port 3000" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "  Stopped service on port 3001" || true

# Kill specific processes
pkill -f "react-scripts start" 2>/dev/null && echo "  Stopped React development server" || true
pkill -f "node server.js" 2>/dev/null && echo "  Stopped Node.js backend server" || true

print_success "All React Notificari processes stopped"

# Clean up log files
if [ -f "frontend.log" ]; then
    rm frontend.log
    echo "  Cleaned up frontend.log"
fi

if [ -f "backend/backend.log" ]; then
    rm backend/backend.log
    echo "  Cleaned up backend.log"
fi

echo ""
echo "Application stopped successfully. You can restart with ./start-app.sh"