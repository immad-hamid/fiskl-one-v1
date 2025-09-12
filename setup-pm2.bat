@echo off
echo =====================================
echo      FISKL One PM2 Setup Script
echo =====================================
echo.
echo This script will:
echo   1. Check Node.js installation
echo   2. Install PM2 globally
echo   3. Install backend dependencies
echo   4. Install frontend dependencies
echo   5. Set up database
echo   6. Start applications
echo   7. Configure Windows startup
echo.

set /p continue="Do you want to continue? (y/n): "
if /i not "%continue%"=="y" goto exit

echo.
echo =====================================
echo Step 1: Checking Node.js installation
echo =====================================
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Make sure to add Node.js to your PATH
    pause
    goto exit
) else (
    echo ✓ Node.js is installed
    node --version
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ npm is not available
    echo Please reinstall Node.js with npm included
    pause
    goto exit
) else (
    echo ✓ npm is available
    npm --version
)

echo.
echo =====================================
echo Step 2: Installing PM2 globally
echo =====================================
echo Installing PM2...
npm install -g pm2
if %errorlevel% neq 0 (
    echo ✗ Failed to install PM2
    echo Please run this script as Administrator
    pause
    goto exit
) else (
    echo ✓ PM2 installed successfully
)

echo.
echo =====================================
echo Step 3: Installing backend dependencies
echo =====================================
cd /d "%~dp0\backend"
if not exist package.json (
    echo ✗ backend/package.json not found
    echo Please ensure you're running this script from the fiskl-one root directory
    pause
    goto exit
)

echo Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ✗ Failed to install backend dependencies
    pause
    goto exit
) else (
    echo ✓ Backend dependencies installed
)

echo.
echo =====================================
echo Step 4: Installing frontend dependencies
echo =====================================
cd /d "%~dp0\frontend"
if not exist package.json (
    echo ✗ frontend/package.json not found
    echo Please ensure you're running this script from the fiskl-one root directory
    pause
    goto exit
)

echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ✗ Failed to install frontend dependencies
    pause
    goto exit
) else (
    echo ✓ Frontend dependencies installed
)

echo Checking Angular CLI...
npx ng version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Angular CLI not found in local dependencies
    echo This is normal - Angular CLI is included in devDependencies
) else (
    echo ✓ Angular CLI is available
)

echo.
echo =====================================
echo Step 5: Setting up database
echo =====================================
cd /d "%~dp0\backend"

echo.
echo Database setup notes:
echo - Ensure PostgreSQL is installed and running
echo - Default connection: postgresql://postgres:admin@localhost:5432/invoice_db
echo - Update backend/.env file with your database credentials if different
echo.

set /p setupDb="Do you want to set up the database now? (y/n): "
if /i "%setupDb%"=="y" (
    echo.
    echo Generating Prisma client...
    npm run db:generate
    if %errorlevel% neq 0 (
        echo ⚠ Warning: Failed to generate Prisma client
        echo This might be because PostgreSQL is not running
    ) else (
        echo ✓ Prisma client generated
        
        echo.
        echo Creating database tables...
        npm run db:push
        if %errorlevel% neq 0 (
            echo ⚠ Warning: Failed to create database tables
            echo Please check your PostgreSQL connection
        ) else (
            echo ✓ Database tables created successfully
        )
    )
) else (
    echo Skipping database setup.
    echo You can run the following commands manually later:
    echo   cd backend
    echo   npm run db:generate
    echo   npm run db:push
)

echo.
echo =====================================
echo Step 6: Starting applications
echo =====================================
cd /d "%~dp0"

echo Starting FISKL One applications with PM2...
pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo ✗ Failed to start applications
    echo Check the logs using: pm2 logs
    pause
    goto exit
) else (
    echo ✓ Applications started successfully!
    echo.
    echo Application URLs:
    echo   - Backend API: http://localhost:3000
    echo   - Frontend: http://localhost:4200
)

echo.
echo =====================================
echo Step 7: Configuring Windows startup
echo =====================================
echo.
set /p setupStartup="Do you want to configure PM2 to start automatically on Windows startup? (y/n): "
if /i "%setupStartup%"=="y" (
    echo Setting up PM2 startup...
    
    REM Save current PM2 processes
    pm2 save
    
    REM Generate startup script
    pm2 startup
    if %errorlevel% equ 0 (
        echo.
        echo ✓ PM2 startup configured!
        echo Your applications will now start automatically when Windows boots.
        echo.
        echo IMPORTANT: PM2 has generated a startup command that you may need to run as Administrator.
        echo If you see a command above starting with "pm2 startup", please:
        echo   1. Copy that command
        echo   2. Open Command Prompt as Administrator
        echo   3. Paste and run the command
    ) else (
        echo ⚠ Warning: Could not configure automatic startup
        echo You may need to run this as Administrator
    )
) else (
    echo Skipping startup configuration.
    echo You can configure it later by running: pm2 startup
)

echo.
echo =====================================
echo           Setup Complete!
echo =====================================
echo.
echo ✓ PM2 installed and configured
echo ✓ Dependencies installed
echo ✓ Applications running
echo.
echo Next steps:
echo   1. Open http://localhost:4200 to access the frontend
echo   2. API is available at http://localhost:3000
echo   3. Use 'start-app.bat' to manage your applications
echo   4. Check 'README-PM2.md' for detailed instructions
echo.
echo Useful commands:
echo   pm2 status          - Check application status
echo   pm2 logs            - View logs
echo   pm2 restart all     - Restart applications
echo   start-app.bat       - Use the management interface
echo.

pause
goto end

:exit
echo.
echo Setup cancelled by user.
goto end

:end
echo.
echo Press any key to exit...
pause >nul