@echo off
setlocal EnableExtensions
 
echo =====================================
echo      FISKL One PM2 Startup Script
echo =====================================
echo This script will:
echo   1. Create logs directory
echo   2. Stop existing PM2 processes
echo   3. Start applications with PM2
echo   4. Configure Windows startup (optional)
 
REM ---- Check PM2 installation ----
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [!] PM2 is not installed or not found in PATH.
    echo Please run setup-project.bat first to install PM2.
    pause
    goto exit
)
echo [v] PM2 is installed and available.
 
REM ---- Confirm to continue ----
choice /C YN /M "Do you want to start the applications with PM2?"
if errorlevel 2 goto exit
 
echo =====================================
echo Step 1: Preparing environment
echo =====================================
echo Creating logs directory...
if not exist logs mkdir logs
echo [v] Logs directory ready.
 
echo =====================================
echo Step 2: Starting applications
echo =====================================
echo Stopping any existing PM2 processes...
REM Skip cleanup if it causes hanging - just start fresh
echo [v] Skipping cleanup - will start fresh PM2 processes.
 
echo Starting applications with PM2 using ecosystem.config.js...
REM Wait a moment for PM2 daemon to initialize
timeout /t 2 /nobreak >nul
pm2 start ecosystem.config.js
echo [v] Applications started with PM2.
 
REM Show current PM2 status regardless of startup success
echo.
echo Current PM2 status:
pm2 status
 
echo Saving PM2 configuration...
pm2 save
echo [v] PM2 configuration saved.
 
echo =====================================
echo Step 3: Windows startup (optional)
echo =====================================
choice /C YN /M "Do you want PM2 to start automatically with Windows?"
if errorlevel 2 goto startup_skip
 
echo Installing pm2-windows-startup...
call npm install -g pm2-windows-startup
pm2-startup install
if errorlevel 1 (
    echo [!] Warning: Failed to configure Windows startup. You may need to run as Administrator.
) else (
    echo [v] PM2 configured to start with Windows.
)
 
:startup_skip
 
echo =====================================
echo Startup Complete!
echo =====================================
echo Your FISKL One applications are now running with PM2.
 
echo PM2 Status:
pm2 status
echo
 
echo Access your applications:
echo - Backend API: http://localhost:3000
echo - Frontend: http://localhost:4200
echo
 
echo PM2 Commands:
echo   pm2 status       - View running processes
echo   pm2 logs         - View logs
echo   pm2 restart all  - Restart all processes
echo   pm2 stop all     - Stop all processes
echo   pm2 delete all   - Delete all processes
 
pause
 
:exit
echo Exiting startup script.
pause