@echo off
:: Pull latest images
docker pull farazsarwar113/fiskl-one-api:latest
docker pull farazsarwar113/fiskl-one-frontend:latest

:: Restart containers
docker-compose down
docker-compose up -d

:: Schedule weekly updates
schtasks /create /tn "MyApp Auto-Update" /tr "%~dp0update.bat" /sc weekly /d SUN /st 02:00