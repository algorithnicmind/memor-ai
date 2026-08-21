@echo off
title Memorai - AI That Remembers You
echo ========================================================
echo   Starting Memorai (Frontend + Backend)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend API...
start "Memorai Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe run.py) else (python run.py)"

timeout /t 2 >nul

echo [2/2] Launching Frontend Web App (Next.js)...
start "Memorai Frontend (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   Memorai is running!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8005
echo ========================================================
