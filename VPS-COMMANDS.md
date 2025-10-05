# VPS Quick Commands

Copy and paste these commands on your VPS to fix the deployment issue.

## Solution 1: Stash and Update (Safe - Keeps Your Changes)

```bash
cd /path/to/wallet-management
git stash
git pull origin master
git stash pop
chmod +x deploy.sh update-deployment.sh
./deploy.sh
```

## Solution 2: Reset and Update (Discards Local Changes)

```bash
cd /path/to/wallet-management
git reset --hard origin/master
git pull origin master
chmod +x deploy.sh update-deployment.sh
./deploy.sh
```

## Solution 3: Use the Update Helper Script

```bash
cd /path/to/wallet-management
git pull origin master
chmod +x update-deployment.sh
./update-deployment.sh
```

## After Successful Update

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs wallet-app --lines 50

# If it's running, test it
curl http://localhost:3000
```

## If PM2 Shows Errors

```bash
# View detailed logs
pm2 logs wallet-app

# Restart the app
pm2 restart wallet-app

# Or delete and redeploy
pm2 delete wallet-app
./deploy.sh
```

## Common Issues After Update

### "Permission denied: ./deploy.sh"
```bash
chmod +x deploy.sh
```

### "Command not found: pm2"
```bash
npm install -g pm2
```

### "Cannot find module"
```bash
cd .next/standalone
npm ci --production
cd ../..
pm2 restart wallet-app
```

### Port already in use
```bash
# Find what's using port 3000
lsof -ti:3000

# Kill it
lsof -ti:3000 | xargs kill -9

# Restart your app
pm2 restart wallet-app
```
