# Quick Fix for "production build not found" Error

If you're seeing the error: `Could not find a production build in the '.next' directory`, follow these steps:

## Option 1: Re-deploy with updated scripts (Recommended)

```bash
# Stop the current PM2 process
pm2 stop wallet-app
pm2 delete wallet-app

# Pull latest changes (if using git)
git pull

# Clean previous builds
rm -rf .next node_modules

# Install dependencies
npm install

# Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

## Option 2: Manual deployment steps

```bash
# 1. Stop the app
pm2 stop wallet-app
pm2 delete wallet-app

# 2. Clean build directories
rm -rf .next

# 3. Install dependencies
npm ci --production=false

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate deploy

# 6. Build the application
npm run build

# 7. Verify standalone build exists
ls -la .next/standalone/

# 8. Copy necessary files
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/
cp server.js .next/standalone/server.js
cp -r prisma .next/standalone/
cp .env.production .next/standalone/.env

# 9. Install production dependencies in standalone
cd .next/standalone
npm ci --production --ignore-scripts
cd ../..

# 10. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Option 3: Quick test without PM2

```bash
# Build the app
npm run build

# Test the standalone server directly
cd .next/standalone
NODE_ENV=production PORT=3000 node server.js
```

## Verify the deployment

After deployment, check:

```bash
# Check if PM2 is running
pm2 status

# Check logs for errors
pm2 logs wallet-app --lines 50

# Test the endpoint
curl http://localhost:3000

# Or visit in browser
# http://your-server-ip:3000
```

## Common Issues

### Issue: "Cannot find module"
**Solution**: Make sure you ran `npm ci --production` inside the `.next/standalone` directory

### Issue: "EADDRINUSE: address already in use"
**Solution**: Port 3000 is already in use. Either:
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Change the PORT in `.env.production`

### Issue: Database connection errors
**Solution**: Check your DATABASE_URL in `.env.production` and ensure PostgreSQL is running

## Environment Variables

Make sure `.next/standalone/.env` exists with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```
