# Fix: npm ci requires package-lock.json

## The Issue

You're seeing this error:
```
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1.
```

This happens because `npm ci` requires a `package-lock.json` file to be present.

## Quick Fix on VPS

Run these commands on your VPS:

```bash
cd ~/wallet-management  # or your project directory

# Pull the latest fix
git pull origin master

# Make sure package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "Generating package-lock.json..."
    npm install
fi

# Run deployment
chmod +x deploy.sh
./deploy.sh
```

## Alternative: Manual Fix if Git Pull Doesn't Work

```bash
cd ~/wallet-management

# Ensure package-lock.json exists
npm install

# Then manually run the build steps
npx prisma generate
npx prisma migrate deploy
npm run build

# Copy files to standalone
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/
cp server.js .next/standalone/server.js
cp -r prisma .next/standalone/
cp package.json .next/standalone/
cp package-lock.json .next/standalone/
cp .env.production .next/standalone/.env

# Install production dependencies
cd .next/standalone
npm ci --omit=dev --ignore-scripts
cd ../..

# Start with PM2
pm2 delete wallet-app 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
```

## What Was Fixed

The updated `deploy.sh` now:
1. ✅ Checks if `package-lock.json` exists
2. ✅ Copies it to the standalone directory
3. ✅ Uses `npm ci --omit=dev` (modern npm syntax)
4. ✅ Falls back to `npm install` if lock file is missing

## Verify the Fix

After deployment:

```bash
# Check if app is running
pm2 status

# View logs
pm2 logs wallet-app --lines 50

# Test the application
curl http://localhost:3000
```

## Preventing This Issue

To avoid this in the future:

1. **Always commit package-lock.json:**
   ```bash
   git add package-lock.json
   git commit -m "Add package-lock.json"
   git push
   ```

2. **Check .gitignore** - Make sure it doesn't ignore package-lock.json

3. **Use npm ci locally** before deploying:
   ```bash
   rm -rf node_modules
   npm ci
   npm run build
   ```

## Still Having Issues?

### Error: "package-lock.json not found"

Generate it:
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Error: "version mismatch"

Update npm:
```bash
npm install -g npm@latest
```

### Error: "permission denied"

Fix permissions:
```bash
sudo chown -R $USER:$USER ~/wallet-management
chmod +x deploy.sh
```
