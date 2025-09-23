# 🚀 Ghid Complet de Configurare - React Notificări

## 📋 Cuprins
- [Start Rapid](#start-rapid)
- [Configurare Detaliată](#configurare-detaliat)
- [Configurarea Serviciilor](#configurarea-serviciilor)
- [Scripturi Disponibile](#scripturi-disponibile)
- [Troubleshooting](#troubleshooting)

## ⚡ Start Rapid

### Un singur click (recomandat):
```bash
# Universal (funcționează pe orice sistem)
npm run start-app

# Sau direct
npm run dev
```

### Pentru diferite sisteme de operare:
```bash
# Unix/Linux/macOS
./start-app.sh

# Windows PowerShell
.\CLEAN_START.ps1

# Windows Cmd
START_APP.bat
```

## 🔧 Configurare Detaliată

### 1. Cerințe de Sistem
- **Node.js**: versiunea 16 sau mai nouă
- **npm**: versiunea 8 sau mai nouă
- **Port-uri libere**: 3000 (frontend) și 3001 (backend)

### 2. Instalare Dependențe
```bash
# Instalare automată (recommended)
npm install  # Instalează și backend automat

# Sau manual
npm install              # Frontend
cd backend && npm install  # Backend
```

### 3. Configurarea Environment-ului

#### Copiați și configurați .env:
```bash
cd backend
cp .env.example .env
```

#### Editați fișierul `.env` cu valorile voastre:
```bash
# Email Configuration (SMTP)
EMAIL_PASSWORD=parola-voastra-smtp

# SMS API Configuration  
SMS_API_TOKEN=token-api-sms-vostru

# JWT Secret (OBLIGATORIU pentru producție)
JWT_SECRET=un-secret-foarte-secret-si-lung-pentru-jwt

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🔐 Configurarea Serviciilor

### 📧 Email SMTP
Pentru a activa trimiterea de emailuri:
1. Obțineți credentialele SMTP de la furnizorul vostru
2. Setați `EMAIL_PASSWORD` în `.env`
3. Verificați configurația în `backend/config/email.js`

### 📱 SMS API
Pentru a activa trimiterea de SMS-uri:
1. Creați cont la smsadvert.ro sau alt furnizor
2. Obțineți token-ul API
3. Setați `SMS_API_TOKEN` în `.env`

### 🔑 JWT Secret
**IMPORTANT pentru producție:**
```bash
# Generați un secret puternic
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Setați în .env
JWT_SECRET=secretul-generat-mai-sus
```

## 📜 Scripturi Disponibile

### Pornirea Aplicației
```bash
npm run start-app    # Universal, detectează OS-ul
npm run dev          # Alias pentru start-app
npm run start-full   # Forțează folosirea bash script-ului
./start-app.sh       # Direct bash (Unix/Linux/macOS)
```

### Oprirea Aplicației
```bash
npm run stop-app     # Folosește script-ul de oprire
./stop-app.sh        # Direct bash
```

### Dezvoltare Separată
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm start
```

### Build pentru Producție
```bash
npm run build        # Build frontend
cd backend           # Backend se rulează cu node server.js
```

### Testing
```bash
# Frontend tests
npm test

# Backend tests (dacă există)
cd backend && npm test
```

## 🔍 Verificare Configurație

### Health Check Endpoints
```bash
# Backend health cu detalii configurație
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000
```

### Output Exemplu - Configurație Validă:
```json
{
  "status": "OK",
  "configuration": {
    "environment": "development",
    "emailConfigured": true,
    "smsConfigured": true,
    "jwtConfigured": true
  }
}
```

## 🐛 Troubleshooting

### ❌ Port-urile sunt ocupate
```bash
# Găsește procesele care folosesc port-urile
lsof -ti:3000,3001

# Oprește toate procesele Node.js
killall node

# Sau folosește script-ul de oprire
./stop-app.sh
```

### ❌ Backend nu pornește - erori configurație
```bash
# Verificați fișierul .env
ls -la backend/.env

# Verificați log-urile
tail -f backend.log

# Testați configurația
cd backend && node -e "require('./config/env-validator')"
```

### ❌ Frontend nu se compilează
```bash
# Curățați cache-ul
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Verificați versiunea Node.js
node --version  # trebuie să fie >= 16
```

### ❌ CORS Errors
Verificați că:
- Backend rulează pe portul 3001
- `proxy` în `package.json` este setat la `http://localhost:3001`
- CORS este configurat pentru `http://localhost:3000`

### ❌ Email/SMS nu funcționează
```bash
# Testați configurația email
cd backend && node test-email.js

# Testați configurația SMS  
cd backend && node test-sms.js

# Verificați .env
cat backend/.env | grep -E 'EMAIL_PASSWORD|SMS_API_TOKEN'
```

## 🔧 Configurații Avansate

### Environment Variables Complete
```bash
# .env pentru dezvoltare
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-schimbati-in-productie

# Email SMTP
EMAIL_PASSWORD=parola-smtp
EMAIL_HOST=mail.example.com
EMAIL_PORT=465

# SMS API  
SMS_API_TOKEN=token-api
SMS_API_URL=https://api.sms-provider.com

# Database (pentru viitor)
DB_PATH=./data/accounts.json

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Variabile pentru Producție
```bash
# Setați în sistemul de hosting (Heroku, Vercel, etc.)
NODE_ENV=production
JWT_SECRET=secret-foarte-puternic-pentru-productie
EMAIL_PASSWORD=parola-smtp-productie
SMS_API_TOKEN=token-productie
```

### Docker Support (opțional)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000 3001
CMD ["npm", "run", "start-app"]
```

## 📞 Suport

Dacă întâmpinați probleme:

1. **Verificați log-urile**: `tail -f backend.log frontend.log`
2. **Resetați aplicația**: `./stop-app.sh && ./start-app.sh`
3. **Curățați cache-ul**: `rm -rf node_modules && npm install`
4. **Verificați configurația**: `curl http://localhost:3001/api/health`

---

**✨ Aplicația React Notificări cu backend Node.js este acum configurată și gata de utilizare!**