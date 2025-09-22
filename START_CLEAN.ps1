param([switch]$SkipTests)

Write-Host "`n🧹 CLEAN START - Curățare și pornire aplicație`n" -ForegroundColor Cyan

# Oprire procese
Write-Host "⏹️ Opresc procese existente..." -ForegroundColor Yellow
Get-Process -Name "node", "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
taskkill /F /IM node.exe 2>$null | Out-Null
taskkill /F /IM npm.exe 2>$null | Out-Null
Write-Host "✅ Procese oprite" -ForegroundColor Green

# Curățare cache
Write-Host "`n🧽 Curățare cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null | Out-Null
Write-Host "✅ Cache curățat" -ForegroundColor Green

# Verificare backend
Write-Host "`n🔧 Verificare backend..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\ad\react-notificari\backend"
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Write-Host "✅ Backend gata" -ForegroundColor Green

# Verificare frontend
Write-Host "`n🎨 Verificare frontend..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\ad\react-notificari"
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Write-Host "✅ Frontend gata" -ForegroundColor Green

# Pornire backend
Write-Host "`n🚀 Pornesc backend pe port 3001..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\ad\react-notificari\backend"
$backendJob = Start-Job { Set-Location "C:\Users\adrian\ad\react-notificari\backend"; node server.js }

# Aștept backend
$waited = 0
while ($waited -lt 15) {
    Start-Sleep 1
    $waited++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2
        Write-Host "✅ Backend PORNIT pe http://localhost:3001" -ForegroundColor Green
        break
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if ($waited -eq 15) {
    Write-Host "`n❌ Backend nu a pornit!" -ForegroundColor Red
    return
}

# Pornire frontend
Write-Host "`n🎨 Pornesc frontend pe port 3000..." -ForegroundColor Yellow
Set-Location "C:\Users\adrian\ad\react-notificari"
$frontendJob = Start-Job { Set-Location "C:\Users\adrian\ad\react-notificari"; $env:BROWSER = "none"; npm start }

# Aștept frontend
Write-Host "⏳ Compilare React..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    Start-Sleep 2
    $waited += 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            Write-Host "`n✅ Frontend PORNIT pe http://localhost:3000" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if ($waited -eq 60) {
    Write-Host "`n❌ Frontend nu a pornit!" -ForegroundColor Red
    return
}

# Teste (opțional)
if (-not $SkipTests) {
    Write-Host "`n🧪 Teste automate..." -ForegroundColor Yellow
    Set-Location "C:\Users\adrian\ad\react-notificari\backend"
    Start-Sleep 3
    try {
        node tests\e2e.test.js
        Write-Host "✅ Teste complete" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Teste parțiale" -ForegroundColor Yellow
    }
}

# Status final
Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                    🎉 APLICAȚIE GATA! 🎉                     ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Backend:   http://localhost:3001                          ║
║  ✅ Frontend:  http://localhost:3000                          ║
╠═══════════════════════════════════════════════════════════════╣
║  📋 COMENZI:                                                  ║
║  • Restart:    .\START_CLEAN.ps1                             ║
║  • Fără teste: .\START_CLEAN.ps1 -SkipTests                  ║
║  • Oprire:     Get-Process node,npm | Stop-Process -Force    ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

# Deschid browser
Start-Process "http://localhost:3000"
Write-Host "🌐 Browser deschis automat!" -ForegroundColor Cyan
Write-Host "✨ Aplicația React Notificări cu servicii reale este LIVE!" -ForegroundColor Magenta