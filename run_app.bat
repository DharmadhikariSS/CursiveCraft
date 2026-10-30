@echo off
title CursiveCraft Studio (A4 Adult Cursive Workbook)
cd /d "%~dp0"
python app.py
if errorlevel 1 (
    echo.
    echo Python was not found in PATH or failed to start.
    echo Opening index.html directly in your default browser...
    start "" "index.html"
)
pause

