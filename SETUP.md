# React Notificari - Application Startup Guide

## Overview

This guide explains how to start and configure the React Notificari application, which consists of:
- **Frontend**: React application (port 3000)
- **Backend**: Node.js/Express API server (port 3001)

## Quick Start

### For Development (Linux/macOS/Unix)

```bash
# Quick start (recommended for development)
./start-dev.sh

# View application
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# Health: http://localhost:3001/api/health

# Stop when done
./stop-app.sh
```

### For Windows

```powershell
# Use existing PowerShell scripts
.\CLEAN_START.ps1

# Or for simple start
.\START_CLEAN_SIMPLE.ps1
```

## Detailed Setup

### 1. Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning repository)

### 2. Installation

```bash
# Clone repository (if not already done)
git clone https://github.com/AduAdrian/react-notificari.git
cd react-notificari

# Install dependencies (done automatically by scripts)
npm install
cd backend && npm install && cd ..
```

### 3. Configuration

#### Automatic Configuration (Development)
The startup scripts automatically create a `.env` file for development with:
- Email simulation fallback enabled
- SMS simulation fallback enabled  
- Development JWT secret
- Port 3001 for backend

#### Manual Configuration (Production)
For production deployment:

1. Copy the environment template:
```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` with real credentials:
```bash
# Production SMTP settings
EMAIL_PASSWORD=your-real-email-password
SMS_API_TOKEN=your-real-sms-api-token
JWT_SECRET=your-secure-jwt-secret-key
```

### 4. Available Scripts

#### Linux/macOS/Unix Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `./start-dev.sh` | Quick development start | Starts both services and returns immediately |
| `./start-app.sh` | Full startup with monitoring | Starts services and keeps monitoring (Ctrl+C to stop) |
| `./stop-app.sh` | Stop all services | Cleanly stops backend and frontend |

#### Windows Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `CLEAN_START.ps1` | Full featured startup | Comprehensive startup with health checks |
| `START_CLEAN_SIMPLE.ps1` | Simple startup | Quick startup without advanced features |

## Service Details

### Backend Server (Port 3001)

**Endpoints:**
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email/SMS verification
- `POST /api/auth/login` - User login

**Features:**
- JWT authentication
- Email verification (SMTP with fallback)
- SMS verification (API with fallback)
- CORS enabled for frontend communication

### Frontend App (Port 3000)

**Features:**
- React 19+ with TypeScript
- React Router for navigation
- Responsive design
- Real-time form validation
- Integration with backend API

## Development Mode

### Email & SMS Simulation

In development mode, the application uses simulation fallbacks:

```
📧 Email: Console logging + simulation response
📱 SMS: Console logging + simulation response
🔐 Authentication: Works with simulated verifications
```

### Real Email/SMS Testing

To test with real services, configure valid credentials in `backend/.env`:

```bash
EMAIL_PASSWORD=actual-smtp-password
SMS_API_TOKEN=actual-sms-api-token
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   ./stop-app.sh  # Stop existing processes
   ./start-dev.sh  # Restart
   ```

2. **Backend Not Starting**
   ```bash
   # Check logs
   tail -f backend/backend.log
   
   # Check .env file exists
   ls -la backend/.env
   ```

3. **Frontend Not Loading**
   ```bash
   # Check React compilation
   tail -f frontend.log
   
   # Wait for compilation (30-60 seconds)
   ```

4. **Email/SMS Not Working**
   - In development: This is expected (simulation mode)
   - In production: Check `.env` credentials

### Manual Process Management

If scripts don't work, you can start services manually:

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
npm start
```

### Checking Service Status

```bash
# Check if services are running
curl http://localhost:3001/api/health  # Backend health
curl http://localhost:3000             # Frontend

# Check processes
ps aux | grep -E "(node|npm)"

# Check ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
```

## Production Deployment

### Environment Setup

1. Create production `.env` with real credentials
2. Set `NODE_ENV=production`
3. Use process manager (PM2, systemd, etc.)
4. Configure reverse proxy (nginx, apache)
5. Set up SSL/TLS certificates

### Build for Production

```bash
# Build frontend
npm run build

# Serve with backend
cd backend
NODE_ENV=production node server.js
```

## Security Considerations

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Configure SMTP/SMS credentials securely
- Enable HTTPS in production
- Implement rate limiting for API endpoints

## Support

For issues:
1. Check this documentation
2. Review application logs
3. Test with simulation mode first
4. Verify network connectivity for real services