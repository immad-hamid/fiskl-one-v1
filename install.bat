@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Check if Docker is installed

echo Installing Docker Desktop...
curl -L -o "Docker Desktop Installer.exe" "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe"

:: Run installer silently
start /wait "" "Docker Desktop Installer.exe" install

:: Add Docker to PATH temporarily
setx PATH "%PATH%;C:\Program Files\Docker\Docker\resources\bin"

:: Wait for Docker service to initialize
echo Waiting for Docker to start...
timeout /t 30 >nul
sc query DockerDesktopService | find "RUNNING" >nul
IF %ERRORLEVEL% NEQ 0 (
    echo Docker failed to start automatically. Please start Docker Desktop manually and rerun this script.
    pause
    exit /b 1
)


:: Verify Docker is operational
echo Verifying Docker...
docker ps >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Docker is installed but not running. Please start Docker Desktop and rerun this script.
    pause
    exit /b 1
)

:: Rest of the script continues here
echo Pulling latest application images...
docker pull farazsarwar113/fiskl-one-api:latest
docker pull farazsarwar113/fiskl-one-frontend:latest

echo Creating startup script...
echo @echo off > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\myapp_startup.bat"
echo docker-compose -f "%~dp0docker-compose.yml" up --detach >> "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\myapp_startup.bat"

echo Starting application...
docker-compose up -d

echo Installation complete! The app will auto-start on system boot.
pause
