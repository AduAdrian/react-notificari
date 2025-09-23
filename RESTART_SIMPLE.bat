@echo off
TITLE Restart React Notificari

echo ===================================
echo  OPRIRE PORTURI SI PORNIRE APLICATIE
echo ===================================

REM Opreste toate procesele de pe porturile 3000 si 3001
echo [1/3] Inchidere porturi ocupate...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Inchidere proces cu PID: %%a de pe portul 3000
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo Inchidere proces cu PID: %%a de pe portul 3001
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak > nul

echo [2/3] Pornire server backend...
start "Backend Server" /B cmd /c "cd backend && node server.js"

timeout /t 3 /nobreak > nul

echo [3/3] Pornire frontend React...
start "Frontend React" /B cmd /c "set BROWSER=none&& npm start"

timeout /t 5 /nobreak > nul

echo.
echo ============================================
echo    APLICATIE PORNITA CU SUCCES!
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.

REM Deschide browser-ul
start http://localhost:3000