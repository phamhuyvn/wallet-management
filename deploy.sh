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

# Verify build was successful
if [ ! -d ".next/standalone" ]; then
    echo "❌ Error: Standalone build not found. Build may have failed."
    exit 1
fi

# Copy necessary files to standalone directory
echo "📋 Copying files to standalone directory..."

# Copy public directory
if [ -d "public" ]; then
    cp -r public .next/standalone/ 2>/dev/null || true
fi

# Copy static files
if [ -d ".next/static" ]; then
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/
fi

# Copy custom server.js (overwrite the generated one)
cp server.js .next/standalone/server.js

# Copy prisma directory
if [ -d "prisma" ]; then
    cp -r prisma .next/standalone/
fi

# Copy package files
cp package.json .next/standalone/
if [ -f "package-lock.json" ]; then
    cp package-lock.json .next/standalone/
fi

# Install production dependencies in standalone
echo "📦 Installing production dependencies in standalone..."
cd .next/standalone

# Use npm ci if package-lock.json exists, otherwise npm install
if [ -f "package-lock.json" ]; then
    echo "Using npm ci with package-lock.json..."
    npm ci --omit=dev --ignore-scripts
else
    echo "Warning: package-lock.json not found, using npm install..."
    npm install --omit=dev --ignore-scripts
fi

cd ../..

# Copy environment file
if [ -f .env.production ]; then
    cp .env.production .next/standalone/.env
    echo "✅ Copied .env.production to standalone directory"
fi

echo "✅ Build completed successfully"

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
