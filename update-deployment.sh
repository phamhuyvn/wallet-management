#!/bin/bash

# update-deployment.sh
# Script to update deployment files on VPS when there are local changes

echo "🔄 Updating deployment configuration..."

# Option 1: Stash local changes, pull, and reapply
echo "📦 Stashing local changes..."
git stash

echo "⬇️  Pulling latest changes..."
git pull origin master

echo "📋 Reapplying your local changes..."
git stash pop

echo ""
echo "✅ Update complete!"
echo ""
echo "If there are merge conflicts, resolve them and then run:"
echo "  ./deploy.sh"
echo ""
echo "Or if you want to discard your local changes and use the new files:"
echo "  git reset --hard origin/master"
echo "  ./deploy.sh"
