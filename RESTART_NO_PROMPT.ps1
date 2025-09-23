## Script de restart automat pentru aplicația React Notificări
## Oprește toate porturile și pornește aplicația fără solicitări Y/N

# Porturile utilizate de aplicație
$FRONTEND_PORT = 3000
$BACKEND_PORT = 3001
$ALL_PORTS = @($FRONTEND_PORT, $BACKEND_PORT)

# Funcții de logging
function Write-LogMessage {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-SectionHeader {
    param (
        [string]$Title
    )
    Write-LogMessage "`n===================================" "Cyan"
    Write-LogMessage "  $Title" "Cyan"
    Write-LogMessage "===================================" "Cyan"
}

# Închide toate procesele care folosesc porturile specificate
function Close-AllPorts {
    Write-SectionHeader "ÎNCHIDERE PORTURI"
    
    foreach ($port in $ALL_PORTS) {
        Write-LogMessage "Verificare port $port..." "Gray"
        $netstatOutput = netstat -ano | findstr ":$port "
        
        if ($netstatOutput) {
            Write-LogMessage "Porturi ocupate găsite, se închid procesele..." "Yellow"
            
            $netstatOutput | ForEach-Object {
                $line = $_ -replace '\s+', ' ' -replace '^\s', ''
                $parts = $line -split ' '
                $processPID = $parts[-1]
                
                if ($processPID -match '^\d+$') {
                    try {
                        $process = Get-Process -Id $processPID -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-LogMessage "Închidere proces $($process.ProcessName) (PID: $processPID) de pe portul $port" "Yellow"
                            Stop-Process -Id $processPID -Force -ErrorAction SilentlyContinue
                        }
                    }
                    catch {
                        Write-LogMessage "Eroare la închiderea procesului: $_" "Red"
                    }
                }
            }
        }
        else {
            Write-LogMessage "Portul $port este liber" "Green"
        }
    }
    
    # Acordă timp pentru a se închide toate procesele
    Start-Sleep -Seconds 2
    Write-LogMessage "Verificare finală porturi..." "Gray"
    
    # Încă o rundă pentru a ne asigura că totul este închis
    $stillRunning = $false
    foreach ($port in $ALL_PORTS) {
        $check = netstat -ano | findstr ":$port "
        if ($check) {
            $stillRunning = $true
            Write-LogMessage "Portul $port încă ocupat, încercare forțată de închidere..." "Red"
            
            $check | ForEach-Object {
                $line = $_ -replace '\s+', ' ' -replace '^\s', ''
                $parts = $line -split ' '
                $processPID = $parts[-1]
                
                if ($processPID -match '^\d+$') {
                    try {
                        Stop-Process -Id $processPID -Force -ErrorAction SilentlyContinue
                    }
                    catch {
                        # Ignorăm erorile în a doua încercare
                    }
                }
            }
        }
    }
    
    if ($stillRunning) {
        Start-Sleep -Seconds 2
    }
    
    Write-LogMessage "Toate porturile sunt acum libere" "Green"
}

# Pornește backend-ul
function Start-Backend {
    Log-Section "PORNIRE BACKEND"
    
    $backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"
    Push-Location -Path $backendPath
    
    try {
        # Pornește serverul cu flag pentru a evita prompts
        $env:NODE_NO_WARNINGS = 1
        $env:FORCE_COLOR = 1
        
        # Pornește procesul fără fereastră, capturând output-ul
        $processInfo = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru
        
        Log-Message "Proces backend pornit cu PID: $($processInfo.Id)" "Gray"
        
        # Așteaptă câteva secunde pentru a permite serverului să pornească
        Log-Message "Așteptare inițializare backend..." "Gray"
        Start-Sleep -Seconds 3
        
        # Verifică dacă serverul rulează
        $backendRunning = netstat -ano | findstr ":$BACKEND_PORT "
        if ($backendRunning) {
            Log-Message "Server backend pornit cu succes!" "Green"
            Log-Message "Backend URL: http://localhost:$BACKEND_PORT" "Green"
            return $true
        }
        else {
            Log-Message "Eroare: Backend-ul nu a pornit. Verificați log-urile pentru detalii." "Red"
            return $false
        }
    }
    catch {
        Log-Message "Eroare la pornirea backend-ului: $_" "Red"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Pornește frontend-ul 
function Start-Frontend {
    Write-SectionHeader "PORNIRE FRONTEND"
    
    try {
        # Înlocuim START_APP.bat cu comenzi care nu necesită interacțiune
        Write-LogMessage "Pornire React frontend..." "Gray"
        
        # Setează variabile de mediu pentru a evita prompts
        $env:BROWSER = "none"  # Previne deschiderea browser-ului automat
        $env:FORCE_COLOR = 1   # Forțează output color
        
        # Pornește frontend-ul React
        Push-Location -Path $PSScriptRoot
        $process = Start-Process -FilePath "npx" -ArgumentList "react-scripts start" -NoNewWindow -PassThru
        
        Write-LogMessage "Proces frontend pornit cu PID: $($process.Id)" "Gray"
        Write-LogMessage "Așteptare inițializare frontend..." "Gray"
        
        # Așteaptă câteva secunde pentru a permite frontend-ului să pornească
        $maxAttempts = 20
        $attempts = 0
        $frontendRunning = $false
        
        while (-not $frontendRunning -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 1
            $attempts++
            
            $check = netstat -ano | findstr ":$FRONTEND_PORT "
            if ($check) {
                $frontendRunning = $true
            }
            else {
                if ($attempts % 5 -eq 0) {
                    Log-Message "Încă se așteaptă pornirea frontend-ului... ($attempts/$maxAttempts)" "Yellow"
                }
            }
        }
        
        if ($frontendRunning) {
            Log-Message "Frontend React pornit cu succes!" "Green"
            Log-Message "Frontend URL: http://localhost:$FRONTEND_PORT" "Green"
            
            # Deschide browser-ul
            Start-Process "http://localhost:$FRONTEND_PORT"
            return $true
        }
        else {
            Log-Message "Eroare: Frontend-ul nu a pornit în timpul alocat." "Red"
            return $false
        }
    }
    catch {
        Log-Message "Eroare la pornirea frontend-ului: $_" "Red"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Funcția principală care orchestrează tot procesul
function Restart-Application {
    Log-Section "RESTART APLICAȚIE REACT NOTIFICĂRI"
    
    # Pasul 1: Închide toate porturile
    Close-AllPorts
    
    # Pasul 2: Pornește backend-ul
    $backendSuccess = Start-Backend
    
    # Pasul 3: Pornește frontend-ul dacă backend-ul a pornit cu succes
    if ($backendSuccess) {
        $frontendSuccess = Start-Frontend
        
        if ($frontendSuccess) {
            Log-Section "APLICAȚIE PORNITĂ CU SUCCES"
            Log-Message "Frontend: http://localhost:$FRONTEND_PORT" "Green"
            Log-Message "Backend: http://localhost:$BACKEND_PORT" "Green"
            Log-Message "`nReact Notificări rulează acum. Poți folosi aplicația în browser." "Green"
        }
        else {
            Log-Message "Aplicația a pornit parțial - doar backend-ul funcționează." "Yellow"
        }
    }
    else {
        Log-Message "Aplicația nu a putut fi pornită din cauza erorilor la backend." "Red"
    }
}

# Execută funcția principală
Restart-Application