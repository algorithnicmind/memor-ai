@echo off
title Memorai Database Viewer
cd /d "%~dp0"
if exist backend\.venv\Scripts\python.exe (
    backend\.venv\Scripts\python.exe view_db.py
) else (
    python view_db.py
)
pause
