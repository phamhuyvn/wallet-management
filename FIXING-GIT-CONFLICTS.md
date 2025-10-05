# Fixing "local changes would be overwritten" Error

When you see this error on your VPS:
```
error: Your local changes to the following files would be overwritten by merge:
        deploy.sh
Please commit your changes or stash them before you merge.
```

## Quick Solutions

### Option 1: Keep your local changes and merge (Recommended)

```bash
# Stash your local changes
git stash

# Pull the latest changes
git pull origin master

# Reapply your local changes
git stash pop

# If there are conflicts, Git will tell you which files
# Edit those files to resolve conflicts, then:
git add .
git stash drop

# Now deploy
./deploy.sh
```

### Option 2: Discard local changes and use new files

⚠️ **Warning**: This will DELETE your local modifications!

```bash
# Discard all local changes
git reset --hard origin/master

# Pull latest
git pull origin master

# Make deploy script executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

### Option 3: Use the update script

```bash
# Make the update script executable
chmod +x update-deployment.sh

# Run it
./update-deployment.sh
```

### Option 4: Manual file update (if not using git)

If you're not using git on your VPS, you can manually update files:

```bash
# Backup your current files
cp deploy.sh deploy.sh.backup
cp ecosystem.config.js ecosystem.config.js.backup
cp server.js server.js.backup

# Then copy the new files from your local machine to VPS
# Using scp:
scp deploy.sh user@your-vps:/path/to/wallet-management/
scp ecosystem.config.js user@your-vps:/path/to/wallet-management/
scp server.js user@your-vps:/path/to/wallet-management/

# On VPS, make executable
chmod +x deploy.sh
```

## What Changed in deploy.sh?

The new `deploy.sh` includes:
- Better error handling
- Verification that standalone build exists
- Proper copying of files to standalone directory
- Installation of production dependencies in standalone
- Better logging and status messages

## After Updating

Once you've updated the files, run:

```bash
# Clean previous build
rm -rf .next

# Deploy with new script
./deploy.sh
```

## Still Having Issues?

If you continue to have problems:

1. **Check what changed locally:**
   ```bash
   git diff deploy.sh
   ```

2. **See the incoming changes:**
   ```bash
   git fetch origin
   git diff origin/master deploy.sh
   ```

3. **Manually merge if needed:**
   ```bash
   # Open the file and manually combine changes
   nano deploy.sh
   
   # Then commit
   git add deploy.sh
   git commit -m "Merge local changes with updates"
   ```

4. **Ask for help:**
   - Check the differences and decide what to keep
   - You can always restore from backup: `cp deploy.sh.backup deploy.sh`
