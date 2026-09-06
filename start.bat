@echo off
title CollabBoard Starter
echo ===================================================
echo             Starting CollabBoard System
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server (Port 5000)...
start "CollabBoard Backend" cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/3] Starting Frontend Server (Vite Port 5173)...
start "CollabBoard Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ===================================================
echo  CollabBoard is running!
echo  - Backend:  http://localhost:5000
echo  - Frontend: http://localhost:5173
echo ===================================================
echo.
pause
