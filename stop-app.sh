#!/bin/bash

print_status() {
    echo -e "\033[0;36m🔧 $1\033[0m"
}

print_success() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

print_status "Opresc aplicația React Notificări..."

# Oprește prin PID files
if [ -f backend.pid ]; then
    kill -9 $(cat backend.pid) 2>/dev/null || true
    rm backend.pid
fi

if [ -f frontend.pid ]; then
    kill -9 $(cat frontend.pid) 2>/dev/null || true
    rm frontend.pid
fi

# Oprește prin porturi
for port in 3000 3001; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null || true
        print_success "Proces oprit pe portul $port"
    fi
done

print_success "Aplicația a fost oprită"
