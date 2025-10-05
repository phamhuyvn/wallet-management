# Nginx Reverse Proxy Setup Guide

Your wallet application runs on **Port 3000** by default. Nginx will act as a reverse proxy to forward HTTP (port 80) and HTTPS (port 443) traffic to your Node.js application.

## 📋 Port Configuration

- **Application Port**: 3000 (Node.js/Next.js)
- **Nginx HTTP**: 80 (public facing)
- **Nginx HTTPS**: 443 (public facing with SSL)

## 🚀 Quick Setup

### 1. Install Nginx

```bash
# Update system
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 2. Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'

# Or manually allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

### 3. Create Nginx Configuration

Create a new configuration file:

```bash
sudo nano /etc/nginx/sites-available/wallet-app
```

**Basic Configuration (HTTP only):**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name yourdomain.com www.yourdomain.com;
    
    # Increase client body size for file uploads (if needed)
    client_max_body_size 10M;
    
    # Logging
    access_log /var/log/nginx/wallet-app-access.log;
    error_log /var/log/nginx/wallet-app-error.log;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable buffering for real-time responses
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static assets
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
    
    # Optimize images
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 24h;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Replace** `yourdomain.com` with your actual domain or server IP.

### 4. Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/wallet-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 5. Test the Setup

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Test from command line
curl http://yourdomain.com

# Or open in browser
# http://yourdomain.com
```

## 🔒 SSL/HTTPS Setup with Let's Encrypt

### 1. Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate

```bash
# Get certificate (it will auto-configure Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)
```

### 3. Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### 4. Updated Configuration (After Certbot)

After running Certbot, your config will look like this:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    
    client_max_body_size 10M;
    
    access_log /var/log/nginx/wallet-app-access.log;
    error_log /var/log/nginx/wallet-app-error.log;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
    
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 24h;
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.yourdomain.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = yourdomain.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 404;
}
```

## 🔧 Update Environment Variables

After setting up Nginx with your domain, update `.env.production`:

```bash
# Edit environment file
nano .env.production
```

Update `NEXTAUTH_URL`:
```env
NEXTAUTH_URL=https://yourdomain.com
```

Restart the application:
```bash
pm2 restart wallet-app
```

## 📊 Nginx Management Commands

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/wallet-app-access.log
```

## 🎯 Using Different Ports

If you want to change the application port from 3000:

### Option 1: Change in Environment File

Edit `.env.production`:
```env
PORT=8080
```

Update Nginx config:
```nginx
location / {
    proxy_pass http://localhost:8080;  # Change port here
    ...
}
```

Restart:
```bash
pm2 restart wallet-app
sudo systemctl reload nginx
```

### Option 2: Run Multiple Apps

You can run multiple instances on different ports:

**App 1** on port 3000:
```env
PORT=3000
```

**App 2** on port 3001:
```env
PORT=3001
```

**Nginx** load balancing:
```nginx
upstream wallet_backend {
    server localhost:3000;
    server localhost:3001;
}

server {
    location / {
        proxy_pass http://wallet_backend;
        ...
    }
}
```

## 🔍 Troubleshooting

### Issue: 502 Bad Gateway

**Causes:**
- Application not running
- Wrong port in Nginx config
- Firewall blocking connections

**Solutions:**
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs wallet-app

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test port connection
curl http://localhost:3000

# Restart everything
pm2 restart wallet-app
sudo systemctl restart nginx
```

### Issue: 504 Gateway Timeout

**Solution:** Increase timeouts in Nginx:
```nginx
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

### Issue: SSL Certificate Errors

**Solutions:**
```bash
# Renew certificates
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Issue: Permission Denied

**Solution:**
```bash
# Check SELinux (if enabled)
sudo setsebool -P httpd_can_network_connect 1

# Or temporarily disable
sudo setenforce 0
```

## 📈 Performance Optimization

### Enable Gzip Compression

Add to Nginx config:
```nginx
# Gzip Settings
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Rate Limiting

Protect against DDoS:
```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

server {
    # Apply rate limit
    location / {
        limit_req zone=mylimit burst=20 nodelay;
        proxy_pass http://localhost:3000;
        ...
    }
}
```

### Caching

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

location /_next/static/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

## 🔐 Security Best Practices

1. **Keep Nginx Updated**
   ```bash
   sudo apt update && sudo apt upgrade nginx
   ```

2. **Hide Nginx Version**
   ```nginx
   http {
       server_tokens off;
   }
   ```

3. **Add Security Headers**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Strict-Transport-Security "max-age=31536000" always;
   ```

4. **Restrict Access** (if needed)
   ```nginx
   location /admin {
       allow 192.168.1.0/24;
       deny all;
       proxy_pass http://localhost:3000;
   }
   ```

## 📝 Complete Setup Checklist

- [ ] Install Nginx
- [ ] Configure firewall (ports 80, 443)
- [ ] Create Nginx configuration file
- [ ] Enable site configuration
- [ ] Test Nginx configuration
- [ ] Install SSL certificate with Certbot
- [ ] Update NEXTAUTH_URL in .env.production
- [ ] Restart application with PM2
- [ ] Test HTTP and HTTPS access
- [ ] Set up auto-renewal for SSL
- [ ] Configure logging and monitoring

## 🎉 Final Test

```bash
# Check everything is running
pm2 status
sudo systemctl status nginx

# Test endpoints
curl https://yourdomain.com
curl http://yourdomain.com  # Should redirect to HTTPS

# Check SSL
curl -I https://yourdomain.com
```

Your wallet application should now be accessible via your domain with SSL! 🚀
