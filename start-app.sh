#!/bin/bash

# =======================================================
# REACT NOTIFICĂRI - UNIVERSAL STARTUP SCRIPT
# =======================================================
# Acest script poate fi rulat pe Unix/Linux/macOS
# Pentru Windows, rulează CLEAN_START.ps1

set -e # Exit on any error

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funcții pentru output colorat
print_status() {
    echo -e "${CYAN}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "🚀 REACT NOTIFICĂRI - STARTUP SCRIPT"
    echo "=================================================="
    echo -e "${NC}"
}

# Verifică dacă comanda există
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verifică și oprește procese existente
stop_existing_processes() {
    print_status "Opresc procese existente pe porturile 3000 și 3001..."
    
    # Folosesc lsof pentru a găsi procesele care folosesc porturile
    for port in 3000 3001; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_success "Proces oprit pe portul $port (PID: $pid)"
        fi
    done
}

# Verifică dependențele
check_dependencies() {
    print_status "Verificare dependențe..."
    
    if ! command_exists node; then
        print_error "Node.js nu este instalat! Instalează Node.js v16+ și încearcă din nou."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm nu este instalat! Instalează npm și încearcă din nou."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_warning "Node.js versiunea $NODE_VERSION detectată. Recomandăm versiunea 16+."
    fi
    
    print_success "Node.js $(node --version) și npm $(npm --version) sunt instalate"
}

# Instalează dependențe
install_dependencies() {
    print_status "Instalare dependențe backend..."
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install --silent
    fi
    cd ..
    
    print_status "Instalare dependențe frontend..."
    if [ ! -d "node_modules" ]; then
        npm install --silent
    fi
    
    print_success "Dependențe instalate"
}

# Verifică configurația
check_configuration() {
    print_status "Verificare configurație..."
    
    if [ ! -f "backend/.env" ]; then
        print_warning ".env nu există. Creez unul pentru dezvoltare..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "Fișier .env creat din .env.example"
        else
            print_error ".env.example nu există! Verifică repository-ul."
            exit 1
        fi
    else
        print_success "Fișier .env găsit"
    fi
}

# Pornește backend
start_backend() {
    print_status "Pornesc backend (port 3001)..."
    cd backend
    
    # Pornește backend în background
    nohup node server.js > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # Așteaptă să pornească
    print_status "Aștept ca backend-ul să pornească..."
    for i in {1..15}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            print_success "Backend pornit cu succes pe http://localhost:3001"
            return 0
        fi
        printf "."
        sleep 1
    done
    
    print_error "Backend nu a pornit în 15 secunde!"
    return 1
}

# Pornește frontend
start_frontend() {
    print_status "Pornesc frontend (port 3000)..."
    
    # Setează BROWSER=none pentru a nu deschide browser automat
    export BROWSER=none
    
    # Pornește frontend în background
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Așteaptă să pornească
    print_status "Aștept ca frontend-ul să compileze..."
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend pornit cu succes pe http://localhost:3000"
            return 0
        fi
        printf "."
        sleep 2
    done
    
    print_error "Frontend nu a pornit în 60 secunde!"
    return 1
}

# Verifică statusul serviciilor
check_services() {
    print_status "Verificare finală a serviciilor..."
    
    BACKEND_STATUS="❌ OFFLINE"
    FRONTEND_STATUS="❌ OFFLINE"
    
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        BACKEND_STATUS="✅ ONLINE"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_STATUS="✅ ONLINE"
    fi
    
    echo -e "${GREEN}"
    echo "╔═════════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 APLICAȚIE GATA! 🎉                      ║"
    echo "╠═════════════════════════════════════════════════════════════════╣"
    echo -e "║  Backend:   ${BACKEND_STATUS}     http://localhost:3001               ║"
    echo -e "║  Frontend:  ${FRONTEND_STATUS}     http://localhost:3000               ║"
    echo "╠═════════════════════════════════════════════════════════════════╣"
    echo "║  📋 COMENZI UTILE:                                              ║"
    echo "║  • Oprire:     ./stop-app.sh                                   ║"
    echo "║  • Restart:    ./start-app.sh                                  ║"
    echo "║  • Loguri:     tail -f backend.log frontend.log                ║"
    echo "╚═════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Creează script de oprire
create_stop_script() {
    cat > stop-app.sh << 'EOF'
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
EOF
    chmod +x stop-app.sh
}

# Main execution
main() {
    print_header
    
    stop_existing_processes
    check_dependencies
    install_dependencies
    check_configuration
    create_stop_script
    
    if start_backend && start_frontend; then
        check_services
        
        print_success "Aplicația React Notificări rulează cu succes!"
        echo ""
        echo -e "${CYAN}📱 Deschide browser la: ${YELLOW}http://localhost:3000${NC}"
        echo -e "${CYAN}🔧 API disponibil la: ${YELLOW}http://localhost:3001${NC}"
        echo ""
        echo -e "${YELLOW}Pentru a opri aplicația, rulează: ${GREEN}./stop-app.sh${NC}"
    else
        print_error "Eroare la pornirea aplicației! Verifică logurile:"
        echo "  - Backend: tail -f backend.log"
        echo "  - Frontend: tail -f frontend.log"
        exit 1
    fi
}

# Rulează main doar dacă scriptul este executat direct
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi