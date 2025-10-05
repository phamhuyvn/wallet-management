# Deployment Summary

## What Has Been Configured

Your Next.js wallet application is now ready for standalone deployment on a Node.js VPS.

### Files Created/Modified

1. **`server.js`** - Custom server for standalone Next.js build
2. **`ecosystem.config.js`** - PM2 process manager configuration
3. **`deploy.sh`** - Automated deployment script
4. **`.env.production.example`** - Production environment template
5. **`package.json`** - Updated with production build scripts
6. **`DEPLOYMENT.md`** - Complete deployment guide
7. **`QUICKFIX.md`** - Troubleshooting guide
8. **`README.md`** - Updated with deployment instructions

### Configuration Changes

- ✅ Removed `--turbopack` from production build (not needed for standalone)
- ✅ Added `build:production` script with Prisma migrations
- ✅ Added `start:standalone` script for custom server
- ✅ Configured PM2 to run from `.next/standalone` directory
- ✅ Set up cluster mode with 2 instances by default

## How It Works

### Build Process

When you run `npm run build`:
1. Next.js creates a standalone build in `.next/standalone/`
2. This includes all necessary Node.js dependencies
3. Server is self-contained and portable

### Deployment Process

The `deploy.sh` script:
1. Installs dependencies
2. Generates Prisma client
3. Runs database migrations
4. Builds the application in standalone mode
5. Copies public files, static assets, and custom server
6. Installs production dependencies in standalone directory
7. Starts the app with PM2 in cluster mode

### PM2 Process Management

- **Cluster Mode**: Runs 2 instances for high availability
- **Auto-restart**: Restarts on crashes
- **Memory Limit**: Restarts if memory exceeds 500MB
- **Logging**: Centralized logs in `logs/` directory
- **Graceful Reload**: Zero-downtime deployments

## On Your VPS

### First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/phamhuyvn/wallet-management.git
cd wallet-management

# 2. Setup environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Deploy
chmod +x deploy.sh
./deploy.sh
```

### Updates

```bash
# Pull latest changes
git pull origin master

# Redeploy
./deploy.sh
```

## Environment Variables Required

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## Port Configuration

- **Default Port**: 3000
- **Change Port**: Update `PORT` in `.env.production`
- **With Nginx**: Set up reverse proxy (see DEPLOYMENT.md)
- **With SSL**: Use Let's Encrypt (see DEPLOYMENT.md)

## Common Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs wallet-app

# Restart
pm2 restart wallet-app

# Stop
pm2 stop wallet-app

# Monitor
pm2 monit

# Delete from PM2
pm2 delete wallet-app
```

## Troubleshooting

If you encounter the "production build not found" error:

1. **Stop the app**: `pm2 delete wallet-app`
2. **Clean build**: `rm -rf .next`
3. **Rebuild**: `npm run build`
4. **Check standalone**: `ls -la .next/standalone/`
5. **Redeploy**: `./deploy.sh`

See `QUICKFIX.md` for detailed troubleshooting steps.

## Architecture

```
Your VPS
├── Application files
├── .next/standalone/          # Standalone build
│   ├── server.js             # Custom server
│   ├── .next/                # Next.js build
│   ├── public/               # Static files
│   ├── node_modules/         # Production deps
│   └── .env                  # Environment
├── logs/                     # PM2 logs
└── ecosystem.config.js       # PM2 config

PM2 Process Manager (Cluster Mode)
├── Instance 1 (Port 3000)
└── Instance 2 (Port 3000)

Nginx (Optional Reverse Proxy)
└── Forwards :80/:443 → :3000
```

## Security Checklist

- [ ] Use strong database passwords
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Enable firewall (UFW)
- [ ] Set up SSL with Let's Encrypt
- [ ] Keep system updated
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use non-root user for deployment

## Performance Tips

1. **Adjust PM2 instances**: Based on CPU cores
2. **Enable Nginx caching**: For static assets
3. **Use CDN**: For public files
4. **Database indexing**: For frequently queried fields
5. **Monitor memory**: Adjust `max_memory_restart` if needed

## Next Steps

1. Set up Nginx reverse proxy (see DEPLOYMENT.md)
2. Configure SSL with Let's Encrypt
3. Set up automated backups
4. Configure monitoring (PM2 Plus or custom)
5. Set up CI/CD pipeline (optional)

## Support

- Read `DEPLOYMENT.md` for complete guide
- Check `QUICKFIX.md` for common issues
- View logs: `pm2 logs wallet-app`
- Check PM2 status: `pm2 status`
