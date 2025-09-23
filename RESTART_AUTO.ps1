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
                    } catch {
                        Write-LogMessage "Eroare la închiderea procesului: $_" "Red"
                    }
                }
            }
        } else {
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
                    } catch {
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
    Write-SectionHeader "PORNIRE BACKEND"
    
    $backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"
    Push-Location -Path $backendPath
    
    try {
        # Pornește serverul cu flag pentru a evita prompts
        $env:NODE_NO_WARNINGS = 1
        $env:FORCE_COLOR = 1
        
        # Pornește procesul fără fereastră, capturând output-ul
        $processInfo = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru
        
        Write-LogMessage "Proces backend pornit cu PID: $($processInfo.Id)" "Gray"
        
        # Așteaptă câteva secunde pentru a permite serverului să pornească
        Write-LogMessage "Așteptare inițializare backend..." "Gray"
        Start-Sleep -Seconds 3
        
        # Verifică dacă serverul rulează
        $backendRunning = netstat -ano | findstr ":$BACKEND_PORT "
        if ($backendRunning) {
            Write-LogMessage "Server backend pornit cu succes!" "Green"
            Write-LogMessage "Backend URL: http://localhost:$BACKEND_PORT" "Green"
            return $true
        } else {
            Write-LogMessage "Eroare: Backend-ul nu a pornit. Verificați log-urile pentru detalii." "Red"
            return $false
        }
    } catch {
        Write-LogMessage "Eroare la pornirea backend-ului: $_" "Red"
        return $false
    } finally {
        Pop-Location
    }
}

# Pornește frontend-ul
function Start-Frontend {
    Write-SectionHeader "PORNIRE FRONTEND"
    
    try {
        # Evităm prompt-urile și comenzile interactive
        Write-LogMessage "Pornire React frontend..." "Gray"
        
        # Setează variabile de mediu pentru a evita prompts
        $env:BROWSER = "none"  # Previne deschiderea browser-ului automat
        $env:FORCE_COLOR = 1   # Forțează output color
        
        # Folosim o abordare modificată pentru a porni aplicația React
        # Încercăm să pornim direct cu react-scripts pentru a evita interacțiunea
        Push-Location -Path $PSScriptRoot
        
        # Opțiunea 1: Pornește cu npx react-scripts
        $process = Start-Process -FilePath "npx" -ArgumentList "react-scripts --openssl-legacy-provider start" -NoNewWindow -PassThru
        
        Write-LogMessage "Proces frontend pornit cu PID: $($process.Id)" "Gray"
        Write-LogMessage "Așteptare inițializare frontend..." "Gray"
        
        # Așteaptă ca portul să devină activ
        $maxAttempts = 30  # Oferim mai mult timp (30 secunde)
        $attempts = 0
        $frontendRunning = $false
        
        while (-not $frontendRunning -and $attempts -lt $maxAttempts) {
            Start-Sleep -Seconds 1
            $attempts++
            
            $check = netstat -ano | findstr ":$FRONTEND_PORT "
            if ($check) {
                $frontendRunning = $true
            } else {
                if ($attempts % 5 -eq 0) {
                    Write-LogMessage "Încă se așteaptă pornirea frontend-ului... ($attempts/$maxAttempts)" "Yellow"
                }
            }
        }
        
        if ($frontendRunning) {
            Write-LogMessage "Frontend React pornit cu succes!" "Green"
            Write-LogMessage "Frontend URL: http://localhost:$FRONTEND_PORT" "Green"
            
            # Deschide browser-ul
            Start-Process "http://localhost:$FRONTEND_PORT"
            return $true
        } else {
            Write-LogMessage "Frontend-ul nu a pornit în timpul alocat. Încercăm abordarea alternativă..." "Yellow"
            
            # Încercăm o abordare alternativă dacă prima a eșuat
            # Folosim cmd pentru a executa comanda direct, evitând prompt-urile
            $process.Kill()
            Start-Process -FilePath "cmd" -ArgumentList "/c SET BROWSER=none && npm start" -NoNewWindow
            
            # Așteptăm din nou
            $attempts = 0
            while (-not $frontendRunning -and $attempts -lt $maxAttempts) {
                Start-Sleep -Seconds 1
                $attempts++
                
                $check = netstat -ano | findstr ":$FRONTEND_PORT "
                if ($check) {
                    $frontendRunning = $true
                }
            }
            
            if ($frontendRunning) {
                Write-LogMessage "Frontend React pornit cu succes (metoda alternativă)!" "Green"
                Write-LogMessage "Frontend URL: http://localhost:$FRONTEND_PORT" "Green"
                
                # Deschide browser-ul
                Start-Process "http://localhost:$FRONTEND_PORT"
                return $true
            } else {
                Write-LogMessage "Eroare: Frontend-ul nu a pornit în timpul alocat." "Red"
                return $false
            }
        }
    } catch {
        Write-LogMessage "Eroare la pornirea frontend-ului: $_" "Red"
        return $false
    } finally {
        Pop-Location
    }
}

# Funcția principală care orchestrează tot procesul
function Restart-Application {
    Write-SectionHeader "RESTART APLICAȚIE REACT NOTIFICĂRI"
    
    # Pasul 1: Închide toate porturile
    Close-AllPorts
    
    # Pasul 2: Pornește backend-ul
    $backendSuccess = Start-Backend
    
    # Pasul 3: Pornește frontend-ul dacă backend-ul a pornit cu succes
    if ($backendSuccess) {
        $frontendSuccess = Start-Frontend
        
        if ($frontendSuccess) {
            Write-SectionHeader "APLICAȚIE PORNITĂ CU SUCCES"
            Write-LogMessage "Frontend: http://localhost:$FRONTEND_PORT" "Green"
            Write-LogMessage "Backend: http://localhost:$BACKEND_PORT" "Green"
            Write-LogMessage "`nReact Notificări rulează acum. Poți folosi aplicația în browser." "Green"
        } else {
            Write-LogMessage "Aplicația a pornit parțial - doar backend-ul funcționează." "Yellow"
        }
    } else {
        Write-LogMessage "Aplicația nu a putut fi pornită din cauza erorilor la backend." "Red"
    }
}

# Execută funcția principală
Restart-Application