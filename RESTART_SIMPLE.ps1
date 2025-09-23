## Script pentru închiderea porturilor și pornirea aplicației React Notificări

# Porturile utilizate de aplicație
$FRONTEND_PORT = 3000
$BACKEND_PORT = 3001

Write-Host "Închidere porturi ocupate și pornire aplicație..." -ForegroundColor Cyan

# Închide procesele care folosesc portul 3000 (frontend)
Write-Host "Închidere procese pe portul $FRONTEND_PORT..." -ForegroundColor Yellow
$netstatOutput = netstat -ano | findstr ":$FRONTEND_PORT"
$netstatOutput | ForEach-Object {
    $line = $_ -replace '\s+', ' ' -replace '^\s', ''
    $columns = $line -split ' '
    $processPID = $columns[-1]
    
    if ($processPID -match '^\d+$') {
        try {
            $processInfo = Get-Process -Id $processPID -ErrorAction SilentlyContinue
            if ($processInfo) {
                Write-Host "Închidere proces $($processInfo.ProcessName) (PID: $processPID)" -ForegroundColor Yellow
                Stop-Process -Id $processPID -Force
            }
        } catch {
            Write-Host "Eroare: $_" -ForegroundColor Red
        }
    }
}

# Închide procesele care folosesc portul 3001 (backend)
Write-Host "Închidere procese pe portul $BACKEND_PORT..." -ForegroundColor Yellow
$netstatOutput = netstat -ano | findstr ":$BACKEND_PORT"
$netstatOutput | ForEach-Object {
    $line = $_ -replace '\s+', ' ' -replace '^\s', ''
    $columns = $line -split ' '
    $processPID = $columns[-1]
    
    if ($processPID -match '^\d+$') {
        try {
            $processInfo = Get-Process -Id $processPID -ErrorAction SilentlyContinue
            if ($processInfo) {
                Write-Host "Închidere proces $($processInfo.ProcessName) (PID: $processPID)" -ForegroundColor Yellow
                Stop-Process -Id $processPID -Force
            }
        } catch {
            Write-Host "Eroare: $_" -ForegroundColor Red
        }
    }
}

# Așteaptă pentru a ne asigura că procesele s-au închis
Start-Sleep -Seconds 2
Write-Host "Porturile au fost eliberate" -ForegroundColor Green

# Pornește backend-ul
Write-Host "`nPornire server backend..." -ForegroundColor Cyan
$backendPath = Join-Path -Path (Get-Location) -ChildPath "backend"
Set-Location -Path $backendPath
Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow

# Așteaptă pornirea backend-ului
Start-Sleep -Seconds 3
Write-Host "Server backend pornit la http://localhost:$BACKEND_PORT" -ForegroundColor Green

# Revino la directorul principal și pornește frontend-ul folosind batch-ul existent
Write-Host "`nPornire frontend..." -ForegroundColor Cyan
Set-Location -Path (Split-Path -Parent $backendPath)
cmd /c START_APP.bat

# Așteaptă câteva secunde și apoi deschide aplicația în browser
Start-Sleep -Seconds 5
Write-Host "`nAplicația a fost pornită cu succes!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Green
Write-Host "Backend: http://localhost:$BACKEND_PORT" -ForegroundColor Green

# Deschide browser-ul
Start-Process "http://localhost:$FRONTEND_PORT"

Write-Host "`nApăsați orice tastă pentru a închide această fereastră..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")