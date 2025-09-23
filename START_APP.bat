@echo off
cls
echo ============================================
echo    PORNIRE APLICATIE REACT NOTIFICARI
echo ============================================
echo.

REM Kill old processes
taskkill /F /IM node.exe 2>nul >nul

REM Start Backend
echo [1/2] Pornire Backend Server...
cd /d "c:\Users\adrian\Desktop\react-notificari\backend"
start /B cmd /c "node server.js"
timeout /t 3 >nul

REM Start Frontend  
echo [2/2] Pornire Frontend React...
cd /d "c:\Users\adrian\Desktop\react-notificari"
start cmd /c "npm start"

echo.
echo ============================================
echo    APLICATIE PORNITA CU SUCCES!
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Apasati orice tasta pentru a inchide...
pause >nul
