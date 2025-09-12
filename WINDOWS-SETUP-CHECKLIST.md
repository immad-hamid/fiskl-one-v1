# 🚀 FISKL One Windows Setup Checklist

## Pre-Installation Requirements

### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS version recommended)
- ✅ Ensure "Add to PATH" is checked during installation
- ✅ Restart Command Prompt after installation
- Test: `node --version` and `npm --version`

### 2. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- ✅ Remember the password you set for the `postgres` user
- ✅ Default port should be `5432`
- ✅ Ensure PostgreSQL service is running

### 3. Create Database (if needed)
Open PostgreSQL command line (psql) or pgAdmin:
```sql
CREATE DATABASE invoice_db;
```

## Installation Steps

### 1. Navigate to Project Directory
```cmd
cd path\to\fiskl-one
```

### 2. Update Database Configuration (if needed)
Edit `backend\.env` file with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/invoice_db?schema=public"
PORT=3000
NODE_ENV=development
```

### 3. Run Setup Script
```cmd
setup-pm2.bat
```

**Important:** Run as Administrator if you get permission errors with PM2 installation.

### 4. Verify Installation
After setup completes:
- ✅ Frontend: http://localhost:4200
- ✅ Backend: http://localhost:3000
- ✅ Check PM2 status: `pm2 status`

## Daily Usage

### Start/Stop Applications
```cmd
start-app.bat
```

### Quick Commands
```cmd
# Start apps
start-app.bat start

# Check status
start-app.bat status

# View logs
start-app.bat logs

# Stop apps
start-app.bat stop
```

## Troubleshooting

### PM2 Installation Issues
```cmd
# Run as Administrator
npm install -g pm2 --force

# Clear npm cache
npm cache clean --force
```

### Database Connection Issues
1. Check PostgreSQL is running:
   - Services → PostgreSQL (should be "Running")
2. Test connection:
   ```cmd
   cd backend
   npm run db:generate
   npm run db:push
   ```

### Port Already in Use
```cmd
# Kill processes on port 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Kill processes on port 4200
netstat -ano | findstr :4200
taskkill /PID [PID_NUMBER] /F
```

### Angular Build Issues
```cmd
cd frontend
npx ng cache clean
npm install
```

## Windows Firewall
If prompted, allow Node.js through Windows Firewall for both private and public networks.

## Auto-Startup Verification
After setup, restart your computer to test auto-startup:
1. Reboot Windows
2. Wait 2-3 minutes after login
3. Check: `pm2 status`
4. Verify apps are accessible

## Emergency Reset
If something goes wrong:
```cmd
# Stop all PM2 processes
pm2 kill

# Delete PM2 startup
pm2 unstartup

# Re-run setup
setup-pm2.bat
```

## Success Indicators ✅

After successful setup you should see:
- ✅ `pm2 status` shows both apps running
- ✅ http://localhost:4200 loads the frontend
- ✅ http://localhost:3000 shows API response
- ✅ No error logs in `logs/` directory
- ✅ Apps restart automatically after Windows reboot

## Need Help?
Check `README-PM2.md` for detailed documentation and troubleshooting guide.