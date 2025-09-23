# Pornire aplicație React Notificari cu verificare avansată a porturilor
# Script PowerShell îmbunătățit

function Write-ColoredMessage {
    param(
        [string]$Message,
        [string]$ForegroundColor = "White"
    )
    Write-Host $Message -ForegroundColor $ForegroundColor
}

Clear-Host
Write-ColoredMessage "==================================================" -ForegroundColor Cyan
Write-ColoredMessage "  VERIFICARE PORTURI SI PORNIRE APLICATIE SECURIZATA" -ForegroundColor Cyan
Write-ColoredMessage "==================================================" -ForegroundColor Cyan
Write-Host ""

# Pasul 1: Verificare porturi ocupate
Write-ColoredMessage "[1/4] Verificare porturi ocupate..." -ForegroundColor Yellow

$port3000Occupied = $false
$port3001Occupied = $false
$portCheck3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$portCheck3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($portCheck3000) {
    $port3000Occupied = $true
    Write-ColoredMessage "[ATENTIE] Portul 3000 este ocupat de procesul cu PID: $($portCheck3000[0].OwningProcess)" -ForegroundColor Yellow
} else {
    Write-ColoredMessage "[OK] Portul 3000 este liber" -ForegroundColor Green
}

if ($portCheck3001) {
    $port3001Occupied = $true
    Write-ColoredMessage "[ATENTIE] Portul 3001 este ocupat de procesul cu PID: $($portCheck3001[0].OwningProcess)" -ForegroundColor Yellow
} else {
    Write-ColoredMessage "[OK] Portul 3001 este liber" -ForegroundColor Green
}

# Pasul 2: Eliberare porturi ocupate
Write-Host ""
Write-ColoredMessage "[2/4] Eliberare porturi ocupate..." -ForegroundColor Yellow
$errors = 0

if ($port3000Occupied) {
    Write-ColoredMessage "Eliberare port 3000..." -ForegroundColor Yellow
    foreach ($connection in $portCheck3000) {
        $procesId = $connection.OwningProcess
        try {
            $process = Get-Process -Id $procesId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Oprire proces $($process.ProcessName) (PID: $procesId) de pe portul 3000"
                Stop-Process -Id $procesId -Force
                Write-ColoredMessage "[OK] Procesul cu PID $procesId a fost oprit cu succes" -ForegroundColor Green
            }
        } catch {
            $errors++
            Write-ColoredMessage "[EROARE] Nu s-a putut opri procesul cu PID $procesId" -ForegroundColor Red
        }
    }
    
    # Verificare dacă portul a fost eliberat
    Start-Sleep -Seconds 1
    $portCheck3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($portCheck3000) {
        $errors++
        Write-ColoredMessage "[EROARE] Portul 3000 este încă ocupat după încercarea de eliberare" -ForegroundColor Red
    } else {
        Write-ColoredMessage "[OK] Portul 3000 a fost eliberat cu succes" -ForegroundColor Green
    }
}

if ($port3001Occupied) {
    Write-ColoredMessage "Eliberare port 3001..." -ForegroundColor Yellow
    foreach ($connection in $portCheck3001) {
        $procesId = $connection.OwningProcess
        try {
            $process = Get-Process -Id $procesId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Oprire proces $($process.ProcessName) (PID: $procesId) de pe portul 3001"
                Stop-Process -Id $procesId -Force
                Write-ColoredMessage "[OK] Procesul cu PID $procesId a fost oprit cu succes" -ForegroundColor Green
            }
        } catch {
            $errors++
            Write-ColoredMessage "[EROARE] Nu s-a putut opri procesul cu PID $procesId" -ForegroundColor Red
        }
    }
    
    # Verificare dacă portul a fost eliberat
    Start-Sleep -Seconds 1
    $portCheck3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($portCheck3001) {
        $errors++
        Write-ColoredMessage "[EROARE] Portul 3001 este încă ocupat după încercarea de eliberare" -ForegroundColor Red
    } else {
        Write-ColoredMessage "[OK] Portul 3001 a fost eliberat cu succes" -ForegroundColor Green
    }
}

if ($errors -gt 0) {
    Write-ColoredMessage "[ATENTIE] Au apărut $errors erori la eliberarea porturilor. Continuăm oricum..." -ForegroundColor Red
    Start-Sleep -Seconds 2
}

# Pasul 3: Pornirea backend-ului
Write-Host ""
Write-ColoredMessage "[3/4] Pornire server backend..." -ForegroundColor Yellow

$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path "$using:PWD\backend"
    node server.js
}

# Așteaptă ca backend-ul să pornească
Start-Sleep -Seconds 4

# Verificare dacă backend-ul rulează
$portCheck3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if (-not $portCheck3001) {
    Write-ColoredMessage "[EROARE] Backend-ul nu a pornit corect. Portul 3001 nu este activ!" -ForegroundColor Red
} else {
    Write-ColoredMessage "[OK] Backend-ul rulează pe portul 3001" -ForegroundColor Green
}

# Pasul 4: Pornirea frontend-ului
Write-Host ""
Write-ColoredMessage "[4/4] Pornire frontend React..." -ForegroundColor Yellow

$frontendJob = Start-Job -ScriptBlock {
    Set-Location -Path "$using:PWD"
    $env:BROWSER = "none"
    npm start
}

# Așteaptă ca frontend-ul să pornească
Start-Sleep -Seconds 5

# Verificare dacă frontend-ul rulează
$portCheck3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $portCheck3000) {
    Write-ColoredMessage "[EROARE] Frontend-ul nu a pornit corect. Portul 3000 nu este activ!" -ForegroundColor Red
} else {
    Write-ColoredMessage "[OK] Frontend-ul rulează pe portul 3000" -ForegroundColor Green
}

Write-Host ""
Write-ColoredMessage "============================================" -ForegroundColor Green
Write-ColoredMessage "   APLICATIE PORNITA CU SUCCES!" -ForegroundColor Green
Write-ColoredMessage "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:3001"
Write-Host ""

Write-Host "Apăsați Ctrl+C pentru a opri procesele și a închide această fereastră."
try {
    Wait-Job -Job $backendJob, $frontendJob -Timeout 86400 | Out-Null
} finally {
    # Cleanup la ieșire
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
}