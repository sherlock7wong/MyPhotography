@echo off
cd /d "%~dp0"
if "%ADMIN_USER%"=="" set "ADMIN_USER=admin"
if "%ADMIN_PASSWORD%"=="" (
  set /p ADMIN_PASSWORD=Set local admin password: 
)
echo SherlockWonG site starting at http://localhost:8080/
echo Admin panel: http://localhost:8080/admin/
echo.
if exist "C:\Users\Administrator\nodejs\node-v22.16.0-win-x64\node.exe" (
  "C:\Users\Administrator\nodejs\node-v22.16.0-win-x64\node.exe" server.js
) else (
  node server.js
)
pause
