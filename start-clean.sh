#!/bin/bash

# Script pentru pornirea aplicației fără deprecation warnings
echo "🚀 Pornind aplicația React Notificări..."

# Oprește procese existente
echo "🔄 Oprind procese existente..."
pkill -f "react-scripts\|webpack\|node.*start" 2>/dev/null || true
pkill -f "node.*server\.js" 2>/dev/null || true

# Curăță cache-ul webpack dacă există probleme
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules lipsește! Rulează: npm install"
    exit 1
fi

# Pornește backend în background
echo "🖥️  Pornind backend server..."
cd backend
NODE_OPTIONS="--no-deprecation" nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend pornit cu PID $BACKEND_PID"

# Așteaptă să pornească backend-ul
sleep 3

# Verifică dacă backend-ul rulează
if curl -s http://localhost:3001/api/auth/session > /dev/null; then
    echo "✅ Backend funcționează pe http://localhost:3001"
else
    echo "⚠️  Backend nu răspunde, dar continuăm cu frontend-ul"
fi

cd ..

# Pornește frontend fără deprecation warnings
echo "📱 Pornind frontend server..."
NODE_OPTIONS="--no-deprecation" npm start

echo "👋 Aplicația s-a oprit"