# Quick Nginx Setup Commands

## Port Information
- **Application Port**: 3000 (Node.js app on localhost)
- **Nginx HTTP**: 80 (public)
- **Nginx HTTPS**: 443 (public with SSL)

## 🚀 Quick Setup (5 minutes)

### 1. Install Nginx
```bash
sudo apt update && sudo apt install nginx -y
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full'
```

### 2. Create Config File
```bash
sudo nano /etc/nginx/sites-available/wallet-app
```

**Paste this (replace yourdomain.com):**
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

### 3. Enable and Test
```bash
sudo ln -s /etc/nginx/sites-available/wallet-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Add SSL (Optional but Recommended)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Update Your App
```bash
nano .env.production
# Change: NEXTAUTH_URL=https://yourdomain.com
pm2 restart wallet-app
```

## ✅ Test
```bash
curl http://yourdomain.com
# or visit in browser
```

## 📋 Common Commands

```bash
# Test config
sudo nginx -t

# Reload (no downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log

# Check status
sudo systemctl status nginx
```

## 🔧 Change Port

If you want to use a different port than 3000:

1. **Edit .env.production:**
   ```env
   PORT=8080
   ```

2. **Edit Nginx config:**
   ```nginx
   proxy_pass http://localhost:8080;
   ```

3. **Restart:**
   ```bash
   pm2 restart wallet-app
   sudo systemctl reload nginx
   ```

## 🆘 Troubleshooting

**502 Bad Gateway?**
```bash
pm2 status  # Check if app is running
pm2 logs wallet-app  # Check app logs
curl http://localhost:3000  # Test direct connection
```

**Can't access from browser?**
```bash
sudo ufw status  # Check firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**SSL not working?**
```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

## 📚 Full Documentation
See `NGINX-SETUP.md` for detailed guide with security, caching, and performance optimization.
