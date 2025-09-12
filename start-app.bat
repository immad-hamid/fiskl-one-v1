@echo off
echo =====================================
echo       FISKL One Application Manager
echo =====================================
echo.

REM Function to check PM2 installation
:checkPM2
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ PM2 is not installed or not found in PATH
    echo Please run setup-pm2.bat first to install PM2
    echo.
    pause
    goto end
)
goto :eof

if "%1"=="" goto menu

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="help" goto help

:menu
echo Available commands:
echo   1. Start applications
echo   2. Stop applications  
echo   3. Restart applications
echo   4. Show status
echo   5. View logs
echo   6. Help
echo   0. Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto help
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
echo.
goto menu

:start
echo Starting FISKL One applications...
echo.
cd /d "%~dp0"
call :checkPM2

pm2 start ecosystem.config.js
if %errorlevel% equ 0 (
    echo.
    echo ✓ Applications started successfully!
    echo   - Backend: http://localhost:3000
    echo   - Frontend: http://localhost:4200
    echo.
    echo Use 'pm2 status' to check application status
) else (
    echo.
    echo ✗ Failed to start applications. Check the logs for details.
    echo Run 'start-app.bat logs' to view logs.
)
echo.
pause
goto end

:stop
echo Stopping FISKL One applications...
echo.
call :checkPM2

pm2 stop ecosystem.config.js
if %errorlevel% equ 0 (
    echo ✓ Applications stopped successfully!
) else (
    echo ✗ Failed to stop applications.
)
echo.
pause
goto end

:restart
echo Restarting FISKL One applications...
echo.
call :checkPM2

pm2 restart ecosystem.config.js
if %errorlevel% equ 0 (
    echo ✓ Applications restarted successfully!
    echo   - Backend: http://localhost:3000  
    echo   - Frontend: http://localhost:4200
) else (
    echo ✗ Failed to restart applications. Check the logs for details.
)
echo.
pause
goto end

:status
echo FISKL One Application Status:
echo =============================
echo.
call :checkPM2

pm2 status
echo.
pm2 info fiskl-backend
echo.
pm2 info fiskl-frontend
echo.
pause
goto end

:logs
echo Application Logs:
echo =================
echo.
echo Choose log to view:
echo   1. Backend logs
echo   2. Frontend logs
echo   3. All logs (real-time)
echo   4. Error logs only
echo   0. Back to menu
echo.
set /p logChoice="Enter your choice (0-4): "

if "%logChoice%"=="1" (
    echo Showing backend logs (press Ctrl+C to exit)...
    pm2 logs fiskl-backend
)
if "%logChoice%"=="2" (
    echo Showing frontend logs (press Ctrl+C to exit)...
    pm2 logs fiskl-frontend
)
if "%logChoice%"=="3" (
    echo Showing all logs in real-time (press Ctrl+C to exit)...
    pm2 logs
)
if "%logChoice%"=="4" (
    echo Showing error logs...
    echo.
    echo Backend errors:
    type logs\backend-error.log 2>nul || echo No backend errors found.
    echo.
    echo Frontend errors:
    type logs\frontend-error.log 2>nul || echo No frontend errors found.
    echo.
    pause
)
if "%logChoice%"=="0" goto menu

goto menu

:help
echo FISKL One Application Manager Help
echo ==================================
echo.
echo Command line usage:
echo   start-app.bat [command]
echo.
echo Available commands:
echo   start    - Start both backend and frontend applications
echo   stop     - Stop both applications
echo   restart  - Restart both applications
echo   status   - Show application status and information
echo   logs     - View application logs
echo   help     - Show this help message
echo.
echo Examples:
echo   start-app.bat start
echo   start-app.bat status
echo   start-app.bat logs
echo.
echo Interactive mode:
echo   Run 'start-app.bat' without arguments to use the interactive menu
echo.
echo Applications will be available at:
echo   - Backend API: http://localhost:3000
echo   - Frontend: http://localhost:4200
echo.
echo Troubleshooting:
echo   - If applications fail to start, check Windows Task Manager for Node.js processes
echo   - Check logs using the logs command
echo   - Ensure ports 3000 and 4200 are not in use by other applications
echo   - Make sure PostgreSQL is running and accessible
echo.
pause
goto end

:exit
echo Goodbye!
goto end

:end
if "%1"=="" goto menu