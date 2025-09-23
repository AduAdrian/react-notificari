@echo off
TITLE Restart React Notificari cu Verificare Avansata Porturi

echo ==================================================
echo  VERIFICARE PORTURI SI PORNIRE APLICATIE SECURIZATA
echo ==================================================

REM Definim culori pentru output
set "RED=91"
set "GREEN=92"
set "YELLOW=93"
set "BLUE=94"

REM Functie pentru afisarea mesajelor colorate
call :printColored %BLUE% "[INFO] Verificare porturi si procese..."

REM Pasul 1: Verifică dacă porturile 3000 și 3001 sunt ocupate
echo [1/4] Verificare porturi ocupate...
set "port3000_occupied=false"
set "port3001_occupied=false"

REM Verificare port 3000
netstat -ano | findstr ":3000" > nul
if %ERRORLEVEL% EQU 0 (
    set "port3000_occupied=true"
    call :printColored %YELLOW% "[ATENTIE] Portul 3000 este ocupat"
) else (
    call :printColored %GREEN% "[OK] Portul 3000 este liber"
)

REM Verificare port 3001
netstat -ano | findstr ":3001" > nul
if %ERRORLEVEL% EQU 0 (
    set "port3001_occupied=true"
    call :printColored %YELLOW% "[ATENTIE] Portul 3001 este ocupat"
) else (
    call :printColored %GREEN% "[OK] Portul 3001 este liber"
)

REM Pasul 2: Eliberează porturile dacă sunt ocupate
echo [2/4] Eliberare porturi ocupate...
set "errors=0"

REM Eliberare port 3000 dacă este ocupat
if "%port3000_occupied%"=="true" (
    call :printColored %YELLOW% "Eliberare port 3000..."
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        echo Inchidere proces cu PID: %%a de pe portul 3000
        taskkill /F /PID %%a 2>nul
        if ERRORLEVEL 1 (
            set /a "errors+=1"
            call :printColored %RED% "[EROARE] Nu s-a putut opri procesul %%a de pe portul 3000"
        ) else (
            call :printColored %GREEN% "[OK] Procesul %%a oprit cu succes"
        )
    )
    
    REM Verifică din nou dacă portul a fost eliberat
    timeout /t 1 /nobreak > nul
    netstat -ano | findstr ":3000" > nul
    if %ERRORLEVEL% EQU 0 (
        call :printColored %RED% "[EROARE] Portul 3000 este inca ocupat dupa incercarea de eliberare"
        set /a "errors+=1"
    ) else (
        call :printColored %GREEN% "[OK] Portul 3000 a fost eliberat cu succes"
    )
)

REM Eliberare port 3001 dacă este ocupat
if "%port3001_occupied%"=="true" (
    call :printColored %YELLOW% "Eliberare port 3001..."
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        echo Inchidere proces cu PID: %%a de pe portul 3001
        taskkill /F /PID %%a 2>nul
        if ERRORLEVEL 1 (
            set /a "errors+=1"
            call :printColored %RED% "[EROARE] Nu s-a putut opri procesul %%a de pe portul 3001"
        ) else (
            call :printColored %GREEN% "[OK] Procesul %%a oprit cu succes"
        )
    )
    
    REM Verifică din nou dacă portul a fost eliberat
    timeout /t 1 /nobreak > nul
    netstat -ano | findstr ":3001" > nul
    if %ERRORLEVEL% EQU 0 (
        call :printColored %RED% "[EROARE] Portul 3001 este inca ocupat dupa incercarea de eliberare"
        set /a "errors+=1"
    ) else (
        call :printColored %GREEN% "[OK] Portul 3001 a fost eliberat cu succes"
    )
)

REM Verifică dacă au apărut erori la eliberarea porturilor
if %errors% GTR 0 (
    call :printColored %RED% "[ATENTIE] Au aparut %errors% erori la eliberarea porturilor. Continuam oricum..."
    timeout /t 2 /nobreak > nul
)

REM Pasul 3: Pornirea backend-ului
echo [3/4] Pornire server backend...
start "Backend Server" /B cmd /c "cd backend && node server.js"

REM Așteaptă ca backend-ul să pornească
timeout /t 4 /nobreak > nul

REM Verificare dacă backend-ul rulează
netstat -ano | findstr ":3001" > nul
if %ERRORLEVEL% NEQ 0 (
    call :printColored %RED% "[EROARE] Backend-ul nu a pornit corect. Portul 3001 nu este activ!"
) else (
    call :printColored %GREEN% "[OK] Backend-ul ruleaza pe portul 3001"
)

REM Pasul 4: Pornirea frontend-ului
echo [4/4] Pornire frontend React...
start "Frontend React" /B cmd /c "set BROWSER=none&& npm start"

REM Așteaptă ca frontend-ul să pornească
timeout /t 5 /nobreak > nul

REM Verificare dacă frontend-ul rulează
netstat -ano | findstr ":3000" > nul
if %ERRORLEVEL% NEQ 0 (
    call :printColored %RED% "[EROARE] Frontend-ul nu a pornit corect. Portul 3000 nu este activ!"
) else (
    call :printColored %GREEN% "[OK] Frontend-ul ruleaza pe portul 3000"
)

echo.
call :printColored %GREEN% "============================================"
call :printColored %GREEN% "   APLICATIE PORNITA CU SUCCES!"
call :printColored %GREEN% "============================================"
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.

echo Apasati orice tasta pentru a inchide...
pause > nul
exit /b 0

:printColored
echo [%1m%~2[0m
exit /b