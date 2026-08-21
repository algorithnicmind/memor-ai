# Memorai PowerShell launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Memorai (Frontend + Backend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend
Write-Host "[1/2] Launching Backend API..." -ForegroundColor Yellow
$backendVenv = Join-Path $root "backend\.venv\Scripts\python.exe"
$pythonExe = if (Test-Path $backendVenv) { $backendVenv } else { "python" }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '$pythonExe' run.py"

Start-Sleep -Seconds 2

# 2. Start Frontend
Write-Host "[2/2] Launching Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Memorai is running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8005" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
