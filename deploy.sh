#!/bin/bash

# deploy.sh - Deployment script for VPS
# This script automates the deployment process on your VPS

set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️  Building application..."
npm run build

# Copy necessary files to standalone directory
echo "📋 Copying files to standalone directory..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp server.js .next/standalone/
cp -r prisma .next/standalone/
cp package.json .next/standalone/

# Copy environment file
if [ -f .env.production ]; then
    cp .env.production .next/standalone/.env
fi

# Create logs directory
mkdir -p logs

# Stop existing PM2 process
echo "🛑 Stopping existing process..."
pm2 stop wallet-app 2>/dev/null || true
pm2 delete wallet-app 2>/dev/null || true

# Start the application with PM2
echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup

echo "✅ Deployment completed successfully!"
echo "📊 View logs with: pm2 logs wallet-app"
echo "📈 View status with: pm2 status"
