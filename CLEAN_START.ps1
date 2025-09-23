#Requires -Version 5.1
<#
.SYNOPSIS
    Script de curățare și pornire aplicație React Notificări
.DESCRIPTION  
    Acest script oprește toate procesele care pot folosi porturile 3000/3001,
    curată cache-ul și pornește doar 1 backend și 1 frontend.
.AUTHOR
    React Notificări Team
#>

param(
    [switch]$SkipTests,
    [switch]$Verbose
)

# Funcții utile
function Write-StatusMessage {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "`n🔧 $Message" -ForegroundColor $Color
}

function Write-SuccessMessage {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Variabile globale
$PROJECT_ROOT = "C:\Users\adrian\Desktop\react-notificari"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_PORTS = @(3000, 3002, 3003, 8000, 8080)
$BACKEND_PORTS = @(3001, 5000, 5001, 8001)
$ALL_PORTS = $FRONTEND_PORTS + $BACKEND_PORTS

Clear-Host
Write-Host @"
╔═══════════════════════════════════════════════════════════════╗
║                🧹 CLEAN START SCRIPT 🧹                      ║
║           Curățare completă și restart aplicație             ║
╚═══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# PASUL 1: Oprire procese existente
Write-StatusMessage "Opresc toate procesele Node.js, npm și aplicațiile pe porturi..."

# Oprire procese Node.js și npm
$nodeProcesses = Get-Process -Name "node", "npm", "nodemon" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-SuccessMessage "$($nodeProcesses.Count) procese Node.js/npm oprite"
}
else {
    Write-SuccessMessage "Nu sunt procese Node.js/npm de oprit"
}

# Oprire procese pe porturile noastre
foreach ($port in $ALL_PORTS) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        try {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                $process | Stop-Process -Force -ErrorAction SilentlyContinue
                if ($Verbose) {
                    Write-Host "  └─ Oprit proces $($process.ProcessName) (PID: $($process.Id)) pe portul $port"
                }
            }
        }
        catch {
            # Ignoră erorile - procesul poate fi deja oprit
        }
    }
}

# Utilizare taskkill ca backup
taskkill /F /IM node.exe /T 2>$null | Out-Null
taskkill /F /IM npm.exe /T 2>$null | Out-Null

# PASUL 2: Curățare cache și fișiere temporare
Write-StatusMessage "Curățare cache și fișiere temporare..."

try {
    npm cache clean --force 2>$null | Out-Null
    Write-SuccessMessage "Cache npm curățat"
}
catch {
    Write-Host "  └─ Warning: Nu s-a putut curăța cache-ul npm" -ForegroundColor Yellow
}

# PASUL 3: Verificare dependențe
Write-StatusMessage "Verificare dependențe backend..."

Push-Location $BACKEND_DIR
if (-not (Test-Path "node_modules")) {
    Write-Host "  └─ Instalez dependențe backend..." -ForegroundColor Yellow
    npm install --silent
    Write-SuccessMessage "Dependențe backend instalate"
}
else {
    Write-SuccessMessage "Dependențe backend OK"
}
Pop-Location

Write-StatusMessage "Verificare dependențe frontend..."
Push-Location $PROJECT_ROOT
if (-not (Test-Path "node_modules")) {
    Write-Host "  └─ Instalez dependențe frontend..." -ForegroundColor Yellow
    npm install --silent
    Write-SuccessMessage "Dependențe frontend instalate"
}
else {
    Write-SuccessMessage "Dependențe frontend OK"
}
Pop-Location

# PASUL 4: Verificare configurație
Write-StatusMessage "Verificare configurație..."

$envFile = Join-Path $BACKEND_DIR ".env"
if (Test-Path $envFile) {
    Write-SuccessMessage "Fișier .env găsit"
}
else {
    Write-ErrorMessage "Fișier .env lipsește! Aplicația nu va funcționa corect."
    return
}

# PASUL 5: Pornire backend
Write-StatusMessage "Pornesc backend server (port 3001)..."

Push-Location $BACKEND_DIR
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:BACKEND_DIR
    node server.js
}

# Aștept să pornească backend-ul
$maxWait = 10
$waited = 0
$backendStarted = $false

while ($waited -lt $maxWait -and -not $backendStarted) {
    Start-Sleep -Seconds 1
    $waited++
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($response) {
            $backendStarted = $true
            Write-SuccessMessage "Backend pornit cu succes pe http://localhost:3001"
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $backendStarted) {
    Write-ErrorMessage "Backend nu a pornit în $maxWait secunde!"
    $backendJob | Stop-Job -PassThru | Remove-Job
    return
}

Pop-Location

# PASUL 6: Pornire frontend  
Write-StatusMessage "Pornesc frontend React (port 3000)..."

Push-Location $PROJECT_ROOT
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PROJECT_ROOT
    $env:BROWSER = "none"  # Nu deschide browser automat
    npm start
}

# Aștept să pornească frontend-ul
Write-Host "⏳ Așteptare compilare React..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
$frontendStarted = $false

while ($waited -lt $maxWait -and -not $frontendStarted) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendStarted = $true
            Write-SuccessMessage "Frontend pornit cu succes pe http://localhost:3000"
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $frontendStarted) {
    Write-ErrorMessage "Frontend nu a pornit în $maxWait secunde!"
    $frontendJob | Stop-Job -PassThru | Remove-Job
    $backendJob | Stop-Job -PassThru | Remove-Job
    return
}

Pop-Location

# PASUL 7: Teste automate (opțional)
if (-not $SkipTests) {
    Write-StatusMessage "Rulez teste automate..."
    Start-Sleep -Seconds 3  # Dau timp să se stabilizeze
    
    Push-Location $BACKEND_DIR
    try {
        if (Test-Path "tests\e2e.test.js") {
            $testResult = node tests\e2e.test.js
            if ($LASTEXITCODE -eq 0) {
                Write-SuccessMessage "Toate testele au trecut!"
            }
            else {
                Write-Host "⚠️ Unele teste au eșuat, dar aplicația rulează" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "⚠️ Nu s-au putut rula testele" -ForegroundColor Yellow
    }
    Pop-Location
}

# PASUL 8: Status final
Write-StatusMessage "Verificare status final..."

$finalStatus = @()
$finalStatus += [PSCustomObject]@{Service = "Backend"; Port = 3001; Status = ""; URL = "http://localhost:3001" }
$finalStatus += [PSCustomObject]@{Service = "Frontend"; Port = 3000; Status = ""; URL = "http://localhost:3000" }

foreach ($service in $finalStatus) {
    try {
        $response = if ($service.Port -eq 3001) {
            Invoke-RestMethod -Uri "$($service.URL)/api/health" -Method Get -TimeoutSec 2
        }
        else {
            Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 2
        }
        $service.Status = "✅ ONLINE"
    }
    catch {
        $service.Status = "❌ OFFLINE"
    }
}

# Afișare rezultat final
Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                    🎉 APLICAȚIE GATA! 🎉                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Backend:   $($finalStatus[0].Status.PadRight(20)) $($finalStatus[0].URL.PadRight(20)) ║
║  Frontend:  $($finalStatus[1].Status.PadRight(20)) $($finalStatus[1].URL.PadRight(20)) ║  
╠═══════════════════════════════════════════════════════════════╣
║  📋 COMENZI UTILE:                                            ║
║  • Oprire:     Get-Process node,npm | Stop-Process -Force    ║
║  • Restart:    .\CLEAN_START.ps1                             ║
║  • Teste:      .\CLEAN_START.ps1 -SkipTests                  ║
║  • Verbose:    .\CLEAN_START.ps1 -Verbose                    ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

# Deschid browser automat
if ($frontendStarted) {
    Start-Process "http://localhost:3000"
    Write-Host "🌐 Browser deschis automat la aplicația ta!" -ForegroundColor Cyan
}

Write-Host "`n✨ Aplicația React Notificări rulează cu servicii reale!" -ForegroundColor Magenta
Write-Host "📧 Email: noreply@misedainspectsrl.ro | 📱 SMS: 0756596565" -ForegroundColor Gray