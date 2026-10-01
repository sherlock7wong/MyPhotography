@echo off
setlocal

cd /d "%~dp0"

if not exist "Home\index.html" (
  echo Cannot find Home\index.html in:
  echo %CD%
  echo.
  pause
  exit /b 1
)

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/Home/index.html"

where node >nul 2>nul
if not errorlevel 1 (
  echo Starting local web server at %URL%
  echo Close the server window to stop it.
  start "Local Web Server - %PORT%" node "%CD%\start-server.js"
  timeout /t 1 /nobreak >nul
  start "" "%URL%"
  exit /b 0
)

where py >nul 2>nul
if not errorlevel 1 (
  echo Starting local web server at %URL%
  echo Close the server window to stop it.
  start "Local Web Server - %PORT%" py -3 -m http.server %PORT%
  timeout /t 1 /nobreak >nul
  start "" "%URL%"
  exit /b 0
)

where python >nul 2>nul
if not errorlevel 1 (
  echo Starting local web server at %URL%
  echo Close the server window to stop it.
  start "Local Web Server - %PORT%" python -m http.server %PORT%
  timeout /t 1 /nobreak >nul
  start "" "%URL%"
  exit /b 0
)

echo Node.js and Python were not found. Opening Home\index.html directly instead.
start "" "%CD%\Home\index.html"
