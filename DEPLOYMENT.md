# Deployment Guide for VPS (Node.js)

This guide will help you deploy the Wallet Management application on a VPS with Node.js.

## Prerequisites

Before deploying, ensure your VPS has:

- **Node.js** (v20 or higher) - [Installation Guide](https://nodejs.org/)
- **PostgreSQL** (v14 or higher)
- **PM2** (Process Manager) - Install with: `npm install -g pm2`
- **Git** (for cloning the repository)

## Server Setup

### 1. Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE wallet_production;
CREATE USER wallet_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wallet_production TO wallet_user;
\q
```

### 3. Configure Firewall (Optional but Recommended)

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Application Deployment

### 1. Clone the Repository

```bash
# Navigate to your apps directory
cd /var/www

# Clone the repository
git clone https://github.com/phamhuyvn/wallet-management.git
cd wallet-management
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.production.example .env.production

# Edit the environment file with your production values
nano .env.production
```

Update the following values in `.env.production`:

```env
DATABASE_URL=postgresql://wallet_user:your_secure_password@localhost:5432/wallet_production
NEXTAUTH_SECRET=generate-a-random-secret-key-here
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**Generate a secure `NEXTAUTH_SECRET`:**
```bash
openssl rand -base64 32
```

### 3. Deploy the Application

Make the deploy script executable:
```bash
chmod +x deploy.sh
```

Run the deployment:
```bash
./deploy.sh
```

This script will:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Build the Next.js application in standalone mode
- Copy necessary files
- Start the application with PM2

### 4. Verify Deployment

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs wallet-app

# Monitor application
pm2 monit
```

Your application should now be running on `http://your-vps-ip:3000`

## Setting up Nginx Reverse Proxy (Recommended)

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Configure Nginx

Create a new Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/wallet-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/wallet-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certificate will auto-renew, but you can test renewal with:
sudo certbot renew --dry-run
```

## Management Commands

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Stop application
pm2 stop wallet-app

# Restart application
pm2 restart wallet-app

# Delete application from PM2
pm2 delete wallet-app

# View logs
pm2 logs wallet-app

# View real-time logs
pm2 logs wallet-app --lines 100

# Monitor CPU and Memory
pm2 monit

# Save PM2 configuration
pm2 save

# List all applications
pm2 list
```

### Application Updates

When you need to update the application:

```bash
# Pull latest changes
git pull origin master

# Run deployment script
./deploy.sh
```

### Database Management

```bash
# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Access Prisma Studio (for development only)
npx prisma studio
```

## Monitoring and Logs

### View Application Logs

```bash
# PM2 logs
pm2 logs wallet-app

# Application log files
tail -f logs/out.log    # Standard output
tail -f logs/err.log    # Error logs
tail -f logs/combined.log  # Combined logs
```

### Monitor Server Resources

```bash
# Using PM2
pm2 monit

# System resources
htop

# Disk usage
df -h

# Memory usage
free -h
```

## Troubleshooting

### Application won't start

1. Check PM2 logs: `pm2 logs wallet-app`
2. Verify environment variables: `cat .env.production`
3. Check database connection: `npx prisma db pull`
4. Ensure port 3000 is not in use: `sudo lsof -i :3000`

### Database connection issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL in `.env.production`
3. Test connection: `psql $DATABASE_URL`

### Build failures

1. Clear Next.js cache: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be v20+)

## Security Best Practices

1. **Use strong passwords** for database and environment variables
2. **Enable firewall** and only allow necessary ports
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Use SSL/TLS** with Let's Encrypt
5. **Regular backups** of database and application data
6. **Monitor logs** regularly for suspicious activity
7. **Limit SSH access** to specific IP addresses if possible
8. **Use non-root user** for running the application

## Backup and Restore

### Backup Database

```bash
# Backup database
pg_dump -U wallet_user -d wallet_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using Prisma
npx prisma db pull > schema_backup.sql
```

### Restore Database

```bash
# Restore from backup
psql -U wallet_user -d wallet_production < backup_file.sql
```

## Performance Optimization

1. **Adjust PM2 instances** based on CPU cores: Edit `PM2_INSTANCES` in `.env.production`
2. **Enable Nginx caching** for static assets
3. **Use CDN** for static files if needed
4. **Monitor memory usage** and adjust `max_memory_restart` in `ecosystem.config.js`
5. **Database optimization**: Create indexes for frequently queried fields

## Support

For issues or questions:
- Check the logs: `pm2 logs wallet-app`
- Review environment variables
- Ensure all prerequisites are met
- Check GitHub issues: [Repository Issues](https://github.com/phamhuyvn/wallet-management/issues)
