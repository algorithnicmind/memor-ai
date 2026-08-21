@echo off
title Memorai - 1-Click Launch (Online + Offline Ready)
cls

echo ===============================================================================
echo     __  __                                 _ 
echo    ^|  \/  ^| ___ _ __ ___   ___  _ __ __ _(_)
echo    ^| ^|\/^| ^|/ _ \ '_ ` _ \ / _ \^| '__/ _` ^| ^|
echo    ^| ^|  ^| ^|  __/ ^| ^| ^| ^| ^| (_) ^| ^| ^| (_^| ^| ^|
echo    ^|_^|  ^|_^|\___^|_^| ^|_^| ^|_^|\___/^_^|  \__,_^|_^|
echo.
echo           PERSISTENT MEMORY AND HYBRID AI PLATFORM (ONLINE / OFFLINE)
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Ensure Local Ollama is active in the background
echo [1/3] Checking Ollama Background Service...
powershell -Command "$v = try { (Invoke-RestMethod -Uri http://localhost:11434/api/version -TimeoutSec 1).version } catch { $null }; if ($v) { exit 0 } else { exit 1 }" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       [OK] Ollama is active and listening on port 11434.
) else (
    echo       [+] Launching Ollama in background...
    where ollama >nul 2>nul
    if "%ERRORLEVEL%"=="0" (
        start "" /min ollama serve
    ) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" (
        start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        start "" /min "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    )
    timeout /t 2 >nul
    echo       [OK] Ollama background process started.
)

:: 2. Launch FastAPI Backend
echo.
echo [2/3] Launching Memorai Backend API (FastAPI)...
start "Memorai Backend (Port 8005)" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe run.py) else (python run.py)"

timeout /t 3 >nul

:: 3. Launch Next.js Frontend
echo.
echo [3/3] Launching Memorai Web App (Next.js)...
start "Memorai Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 >nul

:: 4. Auto Open Browser
echo.
echo [+] Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ===============================================================================
echo   🚀 MEMORAI IS RUNNING!
echo.
echo   🌐 Web App:        http://localhost:3000
echo   ⚙️  Backend API:    http://localhost:8005
echo   📄 API Docs:       http://localhost:8005/docs
echo   💻 Local Ollama:   http://localhost:11434 (Active in background)
echo.
echo   You can switch between Cloud and Local Ollama anytime in the web header!
echo ===============================================================================
echo.
pause
