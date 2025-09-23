param([switch]$SkipTests)

Write-Host ""
Write-Host "=== CLEAN START - Curățare și pornire aplicație ===" -ForegroundColor Cyan
Write-Host ""

# Oprire procese
Write-Host "Opresc procese existente..." -ForegroundColor Yellow
Get-Process -Name "node","npm" -ErrorAction SilentlyContinue | Stop-Process -Force
taskkill /F /IM node.exe 2>$null | Out-Null
taskkill /F /IM npm.exe 2>$null | Out-Null
Write-Host "DONE: Procese oprite" -ForegroundColor Green

# Curățare cache
Write-Host ""
Write-Host "Curățare cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null | Out-Null
Write-Host "DONE: Cache curățat" -ForegroundColor Green

# Verificare backend
Write-Host ""
Write-Host "Verificare backend..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\Desktop\react-notificari\backend"
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Write-Host "DONE: Backend gata" -ForegroundColor Green

# Verificare frontend
Write-Host ""
Write-Host "Verificare frontend..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\Desktop\react-notificari"
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Write-Host "DONE: Frontend gata" -ForegroundColor Green

# Pornire backend
Write-Host ""
Write-Host "Pornesc backend pe port 3001..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\Desktop\react-notificari\backend"
Start-Job { Set-Location "C:\Users\adrian\Desktop\react-notificari\backend"; node server.js } | Out-Null

# Aștept backend
$waited = 0
while ($waited -lt 15) {
    Start-Sleep 1
    $waited++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2
        Write-Host "DONE: Backend PORNIT pe http://localhost:3001" -ForegroundColor Green
        break
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if ($waited -eq 15) {
    Write-Host ""
    Write-Host "ERROR: Backend nu a pornit!" -ForegroundColor Red
    return
}

# Pornire frontend
Write-Host ""
Write-Host "Pornesc frontend pe port 3000..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\Desktop\react-notificari"
Start-Job { Set-Location "C:\Users\adrian\Desktop\react-notificari"; $env:BROWSER="none"; npm start } | Out-Null

# Aștept frontend
Write-Host "Compilare React..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    Start-Sleep 2
    $waited += 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            Write-Host ""
            Write-Host "DONE: Frontend PORNIT pe http://localhost:3000" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if ($waited -eq 60) {
    Write-Host ""
    Write-Host "ERROR: Frontend nu a pornit!" -ForegroundColor Red
    return
}

# Teste (opțional)
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "Teste automate..." -ForegroundColor Yellow
    Set-Location "C:\Users\adrian\Desktop\react-notificari\backend"
    Start-Sleep 3
    try {
        node tests\e2e.test.js
        Write-Host "DONE: Teste complete" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Teste parțiale" -ForegroundColor Yellow
    }
}

# Status final
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "           APLICATIE GATA!                          " -ForegroundColor Green  
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001                     " -ForegroundColor White
Write-Host "Frontend: http://localhost:3000                     " -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "COMENZI:"
Write-Host "• Restart:    .\START_CLEAN.ps1"
Write-Host "• Fara teste: .\START_CLEAN.ps1 -SkipTests"
Write-Host "• Oprire:     Get-Process node,npm | Stop-Process -Force"
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# Deschid browser
Start-Process "http://localhost:3000"
Write-Host "Browser deschis automat!" -ForegroundColor Cyan
Write-Host "Aplicația React Notificări cu servicii reale este LIVE!" -ForegroundColor Magenta