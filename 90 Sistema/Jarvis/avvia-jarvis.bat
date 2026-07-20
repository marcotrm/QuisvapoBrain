@echo off
title J.A.R.V.I.S.
cd /d "%~dp0"
rem chiude eventuali server Jarvis rimasti attivi sulla porta 8766
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8766" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
start "" http://127.0.0.1:8766
node server.js
pause
