# FISKL One PM2 Setup Guide

This guide will help you set up PM2 process manager to automatically run both the frontend (Angular) and backend (Node.js/Express) applications on Windows startup.

## 🚀 Quick Start

### First-Time Setup

1. **Run the automated setup script:**
   ```cmd
   setup-pm2.bat
   ```
   This script will handle everything automatically including installing PM2, dependencies, and starting your applications.

2. **Access your applications:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

### Manual Management

Use the management script for day-to-day operations:
```cmd
start-app.bat
```

This provides an interactive menu with options to start, stop, restart, check status, and view logs.

## 📋 Prerequisites

- **Node.js 18.x or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** - Ensure it's running and accessible
- **Windows** (this guide is Windows-specific)

## 🔧 Manual Installation

If you prefer to set up PM2 manually:

### 1. Install PM2 Globally
```cmd
npm install -g pm2
```

### 2. Install Dependencies
```cmd
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
```

### 3. Set Up Database
```cmd
cd backend
npm run db:generate
npm run db:push
```

### 4. Start Applications
```cmd
cd ..
pm2 start ecosystem.config.js
```

### 5. Configure Auto-Startup (Optional)
```cmd
pm2 save
pm2 startup
# Follow the instructions provided by PM2
```

## 📁 Project Structure

```
fiskl-one/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── ...
├── frontend/               # Angular application
│   ├── src/
│   ├── package.json
│   └── ...
├── logs/                   # PM2 log files
├── ecosystem.config.js     # PM2 configuration
├── setup-pm2.bat          # Automated setup script
├── start-app.bat          # Application management script
└── README-PM2.md          # This file
```

## ⚙️ Configuration

### Environment Variables

The ecosystem configuration uses these environment variables:

**Development:**
- `NODE_ENV=development`
- `PORT=3000`
- `DATABASE_URL=postgresql://postgres:admin@localhost:5432/invoice_db?schema=public`

**Production:**
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=postgresql://postgres:admin@localhost:5432/invoice_db?schema=public`

### Database Configuration

Update the `backend/.env` file with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
PORT=3000
NODE_ENV=development
```

## 📊 PM2 Commands Reference

### Application Management
```cmd
# Start applications
pm2 start ecosystem.config.js

# Stop applications
pm2 stop ecosystem.config.js

# Restart applications
pm2 restart ecosystem.config.js

# Delete applications from PM2
pm2 delete ecosystem.config.js
```

### Monitoring
```cmd
# View status of all applications
pm2 status

# View logs (real-time)
pm2 logs

# View logs for specific app
pm2 logs fiskl-backend
pm2 logs fiskl-frontend

# View application information
pm2 info fiskl-backend
pm2 info fiskl-frontend
```

### Advanced Commands
```cmd
# Monitor applications with live dashboard
pm2 monit

# Save current PM2 configuration
pm2 save

# Reload applications (zero-downtime)
pm2 reload ecosystem.config.js

# View log files location
pm2 logs --lines 0
```

### Startup Configuration
```cmd
# Generate startup script
pm2 startup

# Save current processes for startup
pm2 save

# Remove startup configuration
pm2 unstartup
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Applications Won't Start
**Symptoms:** PM2 shows apps as "errored" or "stopped"

**Solutions:**
- Check if ports 3000 and 4200 are available:
  ```cmd
  netstat -ano | findstr :3000
  netstat -ano | findstr :4200
  ```
- Ensure PostgreSQL is running
- Check logs: `pm2 logs` or `start-app.bat logs`
- Verify Node.js version: `node --version`

#### 2. Database Connection Issues
**Symptoms:** Backend fails to start with database connection errors

**Solutions:**
- Verify PostgreSQL is running
- Check database credentials in `backend/.env`
- Test connection manually:
  ```cmd
  cd backend
  npm run db:generate
  ```

#### 3. Frontend Build Issues
**Symptoms:** Frontend app shows compilation errors

**Solutions:**
- Clear Angular cache:
  ```cmd
  cd frontend
  npx ng cache clean
  ```
- Reinstall dependencies:
  ```cmd
  rm -rf node_modules package-lock.json
  npm install
  ```

#### 4. PM2 Installation Issues
**Symptoms:** `pm2` command not found

**Solutions:**
- Run Command Prompt as Administrator
- Install PM2 globally: `npm install -g pm2`
- Add npm global directory to PATH
- Restart Command Prompt after installation

#### 5. Auto-Startup Not Working
**Symptoms:** Applications don't start after Windows reboot

**Solutions:**
- Ensure you ran the startup command as Administrator
- Re-run startup configuration:
  ```cmd
  pm2 startup
  pm2 save
  ```
- Check Windows Task Scheduler for PM2 entry

### Log File Locations

PM2 stores logs in the `logs/` directory:
- `backend-out.log` - Backend standard output
- `backend-error.log` - Backend errors
- `frontend-out.log` - Frontend standard output  
- `frontend-error.log` - Frontend errors
- `*-combined.log` - Combined output and errors

### Performance Monitoring

#### Memory Usage
```cmd
# Check memory usage
pm2 status
```

#### CPU Usage
```cmd
# Monitor with real-time dashboard
pm2 monit
```

#### Restart on High Memory Usage
The ecosystem configuration automatically restarts apps if they exceed 1GB (backend) or 2GB (frontend) memory usage.

## 🚦 Verification Checklist

After setup, verify everything works:

- [ ] PM2 is installed: `pm2 --version`
- [ ] Applications are running: `pm2 status`
- [ ] Backend is accessible: http://localhost:3000
- [ ] Frontend is accessible: http://localhost:4200
- [ ] Database connection works
- [ ] Logs are being generated in `logs/` directory
- [ ] Auto-startup is configured (if enabled)

## 🔄 Production Deployment

For production deployment:

1. **Use production environment:**
   ```cmd
   pm2 start ecosystem.config.js --env production
   ```

2. **Build frontend for production:**
   ```cmd
   cd frontend
   npm run build:prod
   ```

3. **Set up nginx/IIS as reverse proxy** (recommended for production)

4. **Configure SSL/TLS certificates**

5. **Set up monitoring and alerts**

## 📞 Support

### Getting Help

1. **Check logs first:** `pm2 logs` or use `start-app.bat logs`
2. **Verify system status:** `pm2 status`
3. **Check this troubleshooting guide**
4. **Review PM2 documentation:** [pm2.keymetrics.io](https://pm2.keymetrics.io/)

### Useful Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Angular CLI Documentation](https://angular.io/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 📝 Notes

- This setup is optimized for Windows development environments
- For Linux/macOS, adapt the `.bat` files to shell scripts (`.sh`)
- PM2 cluster mode is not enabled by default but can be configured for production
- Regular backups of your database are recommended
- Monitor disk space as logs can accumulate over time

---

**Happy coding! 🎉**