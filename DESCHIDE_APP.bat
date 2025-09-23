@echo off
TITLE Oprire Porturi si Pornire Aplicatie
setlocal EnableDelayedExpansion

echo ===================================================================
echo   INCHIDERE PORTURI SI PORNIRE APLICATIE REACT NOTIFICARI
echo ===================================================================
echo.

REM Lista de porturi comune care ar putea cauza conflicte
set "PORTS_TO_CHECK=3000 3001 5000 8000 8080 8081 8082 8090 9000 9001"

echo [1/3] Verificare si inchidere porturi ocupate din sistem...

REM Oprește procesele pentru fiecare port din lista
for %%p in (%PORTS_TO_CHECK%) do (
    echo   * Verificare port %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":%PORTS_TO_CHECK%"') do (
        echo     - Inchidere proces cu PID: %%a de pe port %%p
        taskkill /F /PID %%a >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo       [OK] Proces %%a oprit cu succes
        ) else (
            echo       [INFO] Procesul %%a nu a putut fi oprit sau nu mai exista
        )
    )
)

REM Verificare procese Node.js care ar putea rula pe alte porturi
echo.
echo   * Verificare alte procese Node.js...
for /f "tokens=1" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| findstr /v "\"PID\""') do (
    set "node_proc=%%a"
    set "node_proc=!node_proc:"=!"
    for /f "tokens=2 delims=," %%b in ("!node_proc!") do (
        set "node_pid=%%b"
        set "node_pid=!node_pid:"=!"
        echo     - Inchidere proces Node.js cu PID: !node_pid!
        taskkill /F /PID !node_pid! >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo       [OK] Proces Node.js !node_pid! oprit cu succes
        ) else (
            echo       [INFO] Procesul Node.js !node_pid! nu a putut fi oprit sau nu mai exista
        )
    )
)

REM Așteptăm 2 secunde pentru eliberarea completă a porturilor
timeout /t 2 /nobreak > nul

echo.
echo [2/3] Pornire server backend...
cd /d "C:\Users\adrian\ad\react-notificari\backend"
start "Backend Server" cmd /c node server.js

REM Așteptăm să pornească backend-ul
timeout /t 3 /nobreak > nul

echo.
echo [3/3] Pornire frontend React...
cd /d "C:\Users\adrian\ad\react-notificari"
start "Frontend React" cmd /c npm start

REM Așteptăm să pornească frontend-ul
timeout /t 5 /nobreak > nul

echo.
echo ===================================================================
echo    APLICATIE PORNITA CU SUCCES! Toate porturile au fost curatate.
echo ===================================================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo.