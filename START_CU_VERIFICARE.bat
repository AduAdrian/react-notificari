@echo off
TITLE Restart React Notificari (Verificare Porturi)

echo ===================================== 
echo  OPRIRE PORTURI SI PORNIRE APLICATIE
echo ===================================== 
echo.

REM Pasul 1: Verificare și oprire porturi
echo [1/3] Inchidere porturi ocupate... 
echo.

REM Oprire port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Inchidere proces cu PID: %%a de pe portul 3000
    taskkill /F /PID %%a >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo OK: Proces %%a oprit cu succes
    ) else (
        echo EROARE: Nu s-a putut opri procesul %%a
    )
)

REM Oprire port 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo Inchidere proces cu PID: %%a de pe portul 3001
    taskkill /F /PID %%a >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo OK: Proces %%a oprit cu succes
    ) else (
        echo EROARE: Nu s-a putut opri procesul %%a
    )
)

REM Așteptăm 2 secunde pentru eliberarea completă a porturilor
timeout /t 2 /nobreak > nul

echo.
echo [2/3] Pornire server backend...

REM Folosește calea absolută pentru backend
cd /d "C:\Users\adrian\ad\react-notificari\backend"
start "Backend Server" cmd /c node server.js

REM Așteptăm să pornească backend-ul
timeout /t 3 /nobreak > nul

echo.
echo [3/3] Pornire frontend React...

REM Folosește calea absolută pentru frontend
cd /d "C:\Users\adrian\ad\react-notificari"
start "Frontend React" cmd /c npm start

REM Așteptăm să pornească frontend-ul
timeout /t 5 /nobreak > nul

echo.
echo ============================================
echo    APLICATIE PORNITA CU SUCCES!
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo.