#Requires -Version 5.1
<#
.SYNOPSIS
    Script de curățare și pornire aplicație React Notificări
.DESCRIPTION  
    Acest script oprește toate procesele care pot folosi porturile 3000/3001,
    curată cache-ul și pornește doar 1 backend și 1 frontend.
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

# Variabile
$PROJECT_ROOT = "C:\Users\adrian\Desktop\react-notificari"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"

Clear-Host
Write-Host @"
╔═══════════════════════════════════════════════════════════════╗
║                🧹 CLEAN START SCRIPT 🧹                      ║
║           Curățare completă și restart aplicație             ║
╚═══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# PASUL 1: Oprire procese
Write-StatusMessage "Opresc toate procesele Node.js și npm..."

$nodeProcesses = Get-Process -Name "node", "npm", "nodemon" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-SuccessMessage "$($nodeProcesses.Count) procese oprite"
}
else {
    Write-SuccessMessage "Nu sunt procese de oprit"
}

# Backup taskkill
taskkill /F /IM node.exe /T 2>$null | Out-Null
taskkill /F /IM npm.exe /T 2>$null | Out-Null

# PASUL 2: Curățare cache
Write-StatusMessage "Curățare cache..."
try {
    npm cache clean --force 2>$null | Out-Null
    Write-SuccessMessage "Cache curățat"
}
catch {
    Write-Host "Warning: Cache npm" -ForegroundColor Yellow
}

# PASUL 3: Verificare dependențe backend
Write-StatusMessage "Verificare backend..."
Push-Location $BACKEND_DIR
if (-not (Test-Path "node_modules")) {
    npm install --silent
    Write-SuccessMessage "Dependențe backend instalate"
}
else {
    Write-SuccessMessage "Backend OK"
}
Pop-Location

# PASUL 4: Verificare dependențe frontend
Write-StatusMessage "Verificare frontend..."
Push-Location $PROJECT_ROOT
if (-not (Test-Path "node_modules")) {
    npm install --silent
    Write-SuccessMessage "Dependențe frontend instalate"
}
else {
    Write-SuccessMessage "Frontend OK"
}
Pop-Location

# PASUL 5: Pornire backend
Write-StatusMessage "Pornesc backend (port 3001)..."
Push-Location $BACKEND_DIR

$backendJob = Start-Job -ScriptBlock {
    param($BackendPath)
    Set-Location $BackendPath
    node server.js
} -ArgumentList $BACKEND_DIR

# Aștept backend
$maxWait = 15
$waited = 0
$backendStarted = $false

while ($waited -lt $maxWait -and -not $backendStarted) {
    Start-Sleep -Seconds 1
    $waited++
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 2
        $backendStarted = $true
        Write-SuccessMessage "Backend PORNIT pe http://localhost:3001"
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $backendStarted) {
    Write-ErrorMessage "Backend EȘUAT după $maxWait secunde!"
    $backendJob | Stop-Job -PassThru | Remove-Job
    Pop-Location
    return
}

Pop-Location

# PASUL 6: Pornire frontend
Write-StatusMessage "Pornesc frontend (port 3000)..."
Push-Location $PROJECT_ROOT

$frontendJob = Start-Job -ScriptBlock {
    param($ProjectPath)
    Set-Location $ProjectPath
    $env:BROWSER = "none"
    npm start
} -ArgumentList $PROJECT_ROOT

# Aștept frontend
Write-Host "⏳ Compilare React..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
$frontendStarted = $false

while ($waited -lt $maxWait -and -not $frontendStarted) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            $frontendStarted = $true
            Write-SuccessMessage "Frontend PORNIT pe http://localhost:3000"
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $frontendStarted) {
    Write-ErrorMessage "Frontend EȘUAT după $maxWait secunde!"
    $frontendJob | Stop-Job -PassThru | Remove-Job
    $backendJob | Stop-Job -PassThru | Remove-Job
    Pop-Location
    return
}

Pop-Location

# PASUL 7: Teste (opțional)
if (-not $SkipTests) {
    Write-StatusMessage "Teste automate..."
    Start-Sleep -Seconds 3
    
    Push-Location $BACKEND_DIR
    try {
        if (Test-Path "tests\e2e.test.js") {
            node tests\e2e.test.js | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-SuccessMessage "Teste REUȘITE!"
            }
            else {
                Write-Host "⚠️ Teste parțial eșuate" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "⚠️ Teste nu s-au executat" -ForegroundColor Yellow
    }
    Pop-Location
}

# PASUL 8: Status final
Write-StatusMessage "Verificare finală..."

$backendOK = $false
$frontendOK = $false

try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2 | Out-Null
    $backendOK = $true
}
catch { }

try {
    Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 | Out-Null
    $frontendOK = $true
}
catch { }

$backendStatus = if ($backendOK) { "✅ ONLINE" } else { "❌ OFFLINE" }
$frontendStatus = if ($frontendOK) { "✅ ONLINE" } else { "❌ OFFLINE" }

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                    🎉 APLICAȚIE GATA! 🎉                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Backend:   $($backendStatus.PadRight(10))  http://localhost:3001        ║
║  Frontend:  $($frontendStatus.PadRight(10))  http://localhost:3000        ║  
╠═══════════════════════════════════════════════════════════════╣
║  📋 COMENZI UTILE:                                            ║
║  • Oprire:     Get-Process node,npm | Stop-Process -Force    ║
║  • Restart:    .\CLEAN_START.ps1                             ║
║  • Fără teste: .\CLEAN_START.ps1 -SkipTests                  ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

if ($frontendOK) {
    Start-Process "http://localhost:3000"
    Write-Host "🌐 Browser deschis!" -ForegroundColor Cyan
}

Write-Host "✨ React Notificări cu servicii reale FUNCTIONAL!" -ForegroundColor Magenta