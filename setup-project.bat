@echo off
setlocal EnableExtensions
cd /d "%~dp0"
 
echo =====================================
echo      FISKL One PM2 Setup Script
echo =====================================
echo This script will:
echo   1. Check Node.js installation
echo   2. Install PM2 globally
echo   3. Install backend dependencies
echo   4. Install frontend dependencies
echo   5. Set up database
echo   6. Start applications
echo   7. Configure Windows startup
 
REM ---- Confirm to continue ----
choice /C YN /M "Do you want to continue?"
if errorlevel 2 goto exit
 
echo =====================================
echo Step 1: Checking Node.js and npm
echo =====================================
 
REM ---- Check Node ----
node --version >nul 2>&1
if errorlevel 1 (
    echo [x] Node.js is not installed or not in PATH.
    echo     Download: https://nodejs.org/ and ensure it is in PATH.
    pause
    goto exit
)
echo [v] Node.js is installed:
node --version
 
REM ---- Check npm ----
call npm --version >nul 2>&1
if errorlevel 1 (
    echo [x] npm is not available.
    echo     Please reinstall Node.js with npm included.
    pause
    goto exit
)
echo [v] npm is available:
call npm --version
 
echo =====================================
echo Step 2: Installing PM2 globally
echo =====================================
echo Installing PM2 (this may take a moment)...
call npm install -g pm2
 
REM ---- Verify PM2 regardless of npm exit code ----
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [x] PM2 not found after install. Try running this script as Administrator.
    echo     Or install manually: npm i -g pm2
    pause
    goto exit
)
echo [v] PM2 installed successfully
 
echo =====================================
echo Step 3: Installing backend dependencies
echo =====================================
 
cd /d "%~dp0backend"
echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo [x] Failed to install backend dependencies.
    cd /d "%~dp0"
    pause
    goto exit
)
echo [v] Backend dependencies installed.
cd /d "%~dp0"
 
echo =====================================
echo Step 4: Installing frontend dependencies
echo =====================================
 
cd /d "%~dp0frontend"
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [x] Failed to install frontend dependencies.
    cd /d "%~dp0"
    pause
    goto exit
)
echo [v] Frontend dependencies installed.
 
echo =====================================
echo Step 4.5: Building frontend for production
echo =====================================
echo Building Angular application...
call npm run build:prod
if errorlevel 1 (
    echo [x] Failed to build frontend application.
    cd /d "%~dp0"
    pause
    goto exit
)
echo [v] Frontend built successfully.
 
cd /d "%~dp0"
 
echo =====================================
echo Step 5: Installing serve package globally
echo =====================================
echo Installing 'serve' package to host static files...
call npm install -g serve
if errorlevel 1 (
    echo [!] Warning: Failed to install serve package globally.
    echo You may need to run as Administrator or install manually: npm i -g serve
) else (
    echo [v] Serve package installed.
)
 
echo =====================================
echo Step 6: Setting up database
echo =====================================
cd /d "%~dp0backend"
echo Database setup notes:
echo - Ensure PostgreSQL is installed and running.
echo - Default connection: postgresql://postgres:admin@localhost:5432/invoice_db
echo - Update backend/.env with your database credentials if different.
 
choice /C YN /M "Do you want to set up the database now?"
if errorlevel 2 goto db_skip
 
echo Generating Prisma client...
call npm run "db:generate"
if errorlevel 1 (
    echo [!] Warning: Failed to generate Prisma client (is PostgreSQL running? is .env correct?)
) else (
    echo [v] Prisma client generated.
    echo Creating database tables...
    call npm run "db:push"
)
cd /d "%~dp0"
echo back to root dir.
:db_skip
REM Ensure we're back in the root directory
cd /d "%~dp0"
 
echo =====================================
echo Setup Complete!
echo =====================================
echo Your FISKL One environment is now set up and ready.
 
echo Next steps:
echo 1. Once confirmed working, run start-pm2.bat to:
echo    - Start applications with PM2
echo    - Configure Windows startup (optional)
echo
echo Manual testing commands:
echo   Backend API test: http://localhost:3000
echo   Frontend test: http://localhost:4200
echo
pause
 
:exit
echo Exiting setup script.
pause