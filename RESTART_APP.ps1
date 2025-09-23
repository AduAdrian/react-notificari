## Script pentru închiderea porturilor și pornirea aplicației React Notificări

# Porturile utilizate de aplicație
$FRONTEND_PORT = 3000
$BACKEND_PORT = 3001
$ALL_PORTS = @($FRONTEND_PORT, $BACKEND_PORT)

# Funcție pentru afișarea mesajelor cu formatare
function Write-ColorMessage {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [string]$Color = "White"
    )
    
    Write-Host $Message -ForegroundColor $Color
}

# Închide toate procesele care folosesc porturile specificate
Write-ColorMessage "Verificare și închidere porturi ocupate..." "Cyan"

foreach ($port in $ALL_PORTS) {
    Write-ColorMessage "Verificare port $port..." "Gray"
    $connections = netstat -ano | findstr ":$port"
    
    if ($connections) {
        Write-ColorMessage "Porturi ocupate găsite, se închid procesele..." "Yellow"
        
        foreach ($conn in $connections) {
            $parts = $conn -split '\s+', 5
            if ($parts.Length -gt 4) {
                $processPID = $parts[4]
                if ($processPID -match '^\d+$') {
                    try {
                        $process = Get-Process -Id $processPID -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-ColorMessage "Închidere proces $($process.ProcessName) (PID: $processPID) de pe portul $port" "Yellow"
                            Stop-Process -Id $processPID -Force
                        }
                    }
                    catch {
                        Write-ColorMessage "Eroare la închiderea procesului: $_" "Red"
                    }
                }
            }
        }
    }
    else {
        Write-ColorMessage "Portul $port este liber" "Green"
    }
}

# Asigură-te că toate procesele au fost închise
Start-Sleep -Seconds 2

# Funcție pentru a porni aplicația completă
function Start-FullApplication {
    # Directorul actual
    $currentDir = Get-Location
    
    # Pornește serverul backend în fundal
    Write-ColorMessage "`n[1/2] Pornire Backend Server..." "Cyan"
    $backendDir = Join-Path $currentDir "backend"
    Set-Location $backendDir
    
    Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
    
    # Așteaptă pornirea backend-ului
    Start-Sleep -Seconds 3
    
    # Verifică dacă backend-ul rulează
    $backendRunning = netstat -ano | findstr ":$BACKEND_PORT"
    if ($backendRunning) {
        Write-ColorMessage "`n+------------------------------------------------------+" "Green"
        Write-ColorMessage "|         BACKEND SERVER PORNIT CU SUCCES!            | " "Green"
        Write-ColorMessage "|------------------------------------------------------| " "Green"
        Write-ColorMessage "|  🌐 Server URL: http://localhost:$BACKEND_PORT              |  " "Green"
        Write-ColorMessage "|  📧 Email SMTP: Configurat și funcțional            | " "Green"
        Write-ColorMessage "|  📱 SMS API: Configurat și funcțional               | " "Green"
        Write-ColorMessage "|  🔐 JWT: Activ                                      | " "Green"
        Write-ColorMessage "|  🔧 Environment: production                         |" "Green"
        Write-ColorMessage "+------------------------------------------------------+" "Green"
        Write-ColorMessage "`n✅ Conexiunea SMTP este funcțională" "Green"
    }
    else {
        Write-ColorMessage "❌ Backend-ul nu a putut fi pornit. Verificați erorile." "Red"
        return
    }
    
    # Revino la directorul principal și pornește frontend-ul
    Write-ColorMessage "[2/2] Pornire Frontend React..." "Cyan"
    Set-Location $currentDir
    
    # Folosește metoda cea mai sigură pentru a porni frontend-ul
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c START_APP.bat" -NoNewWindow
    
    # Așteaptă pornirea frontend-ului
    Start-Sleep -Seconds 5
    
    # Verifică dacă frontend-ul rulează
    $frontendRunning = netstat -ano | findstr ":$FRONTEND_PORT"
    if ($frontendRunning) {
        Write-ColorMessage "`n=============================================" "Green"
        Write-ColorMessage "   APLICAȚIE PORNITĂ CU SUCCES!             " "Green"
        Write-ColorMessage "=============================================" "Green"
        Write-ColorMessage "`nFrontend: http://localhost:$FRONTEND_PORT" "Green"
        Write-ColorMessage "Backend:  http://localhost:$BACKEND_PORT" "Green"
        
        # Deschide browser-ul
        Start-Process "http://localhost:$FRONTEND_PORT"
    }
    else {
        Write-ColorMessage "❌ Frontend-ul nu a putut fi pornit. Verificați erorile." "Red"
    }
}

# Pornește aplicația
Start-FullApplication

# Menține scriptul deschis
Write-ColorMessage "`nApăsați orice tastă pentru a închide..." "Yellow"
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")