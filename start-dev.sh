#!/bin/bash

# Script pentru pornirea aplicației React Notificări
echo "🚀 Pornire aplicație React Notificări..."

# Asigură-te că suntem în directorul corect
cd /workspaces/codespaces-react

# Verifică dacă backend-ul rulează
if ! pgrep -f "node server.js" > /dev/null; then
    echo "📡 Pornire backend..."
    cd backend && node server.js &
    BACKEND_PID=$!
    cd ..
    sleep 3
else
    echo "✅ Backend-ul rulează deja"
fi

# Curăță cache-ul webpack dacă există probleme
if [ -d "node_modules/.cache" ]; then
    echo "🧹 Curățare cache webpack..."
    rm -rf node_modules/.cache
fi

# Pornește frontend-ul cu configurații optimizate
echo "🎨 Pornire frontend..."
FAST_REFRESH=false \
GENERATE_SOURCEMAP=false \
BROWSER=none \
npm start

# Cleanup la ieșire
cleanup() {
    echo "🛑 Oprire servere..."
    pkill -f "node server.js" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM
wait