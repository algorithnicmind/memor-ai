# Memorai 1-Click Launcher (Online + Offline Ready)
Clear-Host
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     __  __                                 _ " -ForegroundColor Cyan
Write-Host "    |  \/  | ___ _ __ ___   ___  _ __ __ _(_)" -ForegroundColor Cyan
Write-Host "    | |\/| |/ _ \ '_ ` _ \ / _ \| '__/ _` | |" -ForegroundColor Cyan
Write-Host "    | |  | |  __/ | | | | | (_) | | | (_| | |" -ForegroundColor Cyan
Write-Host "    |_|  |_|\___|_| |_| |_|\___/|_|  \__,_|_|" -ForegroundColor Cyan
Write-Host ""
Write-Host "          PERSISTENT MEMORY & HYBRID AI PLATFORM (ONLINE / OFFLINE)" -ForegroundColor DarkCyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Check & Ensure Ollama is active in background
Write-Host "[1/3] Checking Ollama Background Service..." -ForegroundColor Yellow
$ollamaActive = $false
try {
    $ver = (Invoke-RestMethod -Uri "http://localhost:11434/api/version" -TimeoutSec 1).version
    if ($ver) { $ollamaActive = $true }
} catch {
    $ollamaActive = $false
}

if ($ollamaActive) {
    Write-Host "      [OK] Ollama is active and listening on port 11434." -ForegroundColor Green
} else {
    Write-Host "      [+] Launching Ollama in the background..." -ForegroundColor Magenta
    $ollamaInPath = Get-Command "ollama" -ErrorAction SilentlyContinue
    $localOllamaApp = "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"
    $localOllamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
    
    if ($ollamaInPath) {
        Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", "ollama serve"
    } elseif (Test-Path $localOllamaApp) {
        Start-Process $localOllamaApp -WindowStyle Hidden
    } elseif (Test-Path $localOllamaExe) {
        Start-Process $localOllamaExe -ArgumentList "serve" -WindowStyle Hidden
    }
    Start-Sleep -Seconds 2
    Write-Host "      [OK] Ollama background process started." -ForegroundColor Green
}

# 2. Start Backend API
Write-Host ""
Write-Host "[2/3] Launching Memorai Backend API (FastAPI)..." -ForegroundColor Yellow
$backendVenv = Join-Path $root "backend\.venv\Scripts\python.exe"
$pythonExe = if (Test-Path $backendVenv) { $backendVenv } else { "python" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '$pythonExe' run.py"

Start-Sleep -Seconds 3

# 3. Start Frontend Next.js
Write-Host ""
Write-Host "[3/3] Launching Memorai Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3

# 4. Open Browser
Write-Host ""
Write-Host "[+] Opening browser at http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  🚀 MEMORAI IS RUNNING!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Web UI:         http://localhost:3000" -ForegroundColor White
Write-Host "  ⚙️  Backend API:    http://localhost:8005" -ForegroundColor White
Write-Host "  📄 API Docs:       http://localhost:8005/docs" -ForegroundColor White
Write-Host "  💻 Local Ollama:   http://localhost:11434 (Active in background)" -ForegroundColor White
Write-Host ""
Write-Host "  You can switch between Cloud and Local Ollama anytime in the web header!" -ForegroundColor Magenta
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
