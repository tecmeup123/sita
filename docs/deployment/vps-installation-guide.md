# SiTa Minter VPS Installation Guide

This guide provides detailed instructions for deploying the SiTa Minter application on an external VPS (Virtual Private Server) server. Following these steps and best practices will help ensure a secure, reliable, and performant deployment.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Installing Dependencies](#installing-dependencies)
4. [Setting Up PostgreSQL Database](#setting-up-postgresql-database)
5. [Application Deployment](#application-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Setting Up HTTPS](#setting-up-https)
8. [Application Monitoring](#application-monitoring)
9. [Backup Strategy](#backup-strategy)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

## Server Requirements

For optimal performance, your VPS should meet or exceed these specifications:

- **CPU**: 2+ cores (4+ recommended for production)
- **Memory**: 4GB RAM minimum (8GB+ recommended)
- **Storage**: 30GB SSD minimum (preferably SSD for better performance)
- **Operating System**: Ubuntu 22.04 LTS (recommended)
- **Network**: Stable connection with at least 100 Mbps

## Initial Server Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Create a Non-Root User with Sudo Privileges

```bash
sudo adduser sitaminter
sudo usermod -aG sudo sitaminter
```

### 3. Configure SSH

Edit the SSH configuration for enhanced security:

```bash
sudo nano /etc/ssh/sshd_config
```

Make the following changes:
- Change the default SSH port (e.g., from 22 to another port like 2222)
- Disable root login: `PermitRootLogin no`
- Allow only your new user: `AllowUsers sitaminter`
- Enable key-based authentication and disable password authentication

Restart SSH service:

```bash
sudo systemctl restart sshd
```

### 4. Set Up Firewall (UFW)

```bash
sudo apt install ufw
sudo ufw allow [your-ssh-port]/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Installing Dependencies

### 1. Install Node.js and NPM

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version   # Should show compatible npm version
```

### 2. Install Git

```bash
sudo apt install git
```

### 3. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 5. Install Nginx

```bash
sudo apt install nginx
```

## Setting Up PostgreSQL Database

### 1. Create Database and User

```bash
sudo -i -u postgres
psql
```

In the PostgreSQL shell:

```sql
CREATE DATABASE sitaminter;
CREATE USER sitaminter_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sitaminter TO sitaminter_user;
\q
```

### 2. Configure PostgreSQL for Remote Access (If Needed)

If your application runs on a different server than the database:

Edit the PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Uncomment and modify:
```
listen_addresses = '*'
```

Edit the pg_hba.conf file:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line (replace with your application server's IP):
```
host    sitaminter    sitaminter_user    your_app_server_ip/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Application Deployment

### 1. Clone the Repository

```bash
sudo mkdir -p /var/www
sudo chown sitaminter:sitaminter /var/www
cd /var/www
git clone https://github.com/your-repo/sita-minter.git sitaminter
cd sitaminter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Run database migrations:

```bash
npm run db:push
```

### 4. Build the Application

```bash
npm run build
```

## Environment Configuration

### 1. Create Environment File

```bash
nano .env
```

Add the following variables (adjust as needed):

```
NODE_ENV=production
DATABASE_URL=postgresql://sitaminter_user:your_secure_password@localhost:5432/sitaminter
PORT=5000
```

### 2. Set Up PM2 Configuration

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: "sitaminter",
    script: "server/index.ts",
    interpreter: "node",
    interpreter_args: "--require=ts-node/register",
    env: {
      NODE_ENV: "production",
    },
    max_memory_restart: "1G",
    instances: 1,
    exec_mode: "fork"
  }]
};
```

### 3. Start the Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Setting Up HTTPS

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Configure Nginx

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/sitaminter
```

Add the following configuration (modify domain name):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-XSS-Protection "1; mode=block";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.binance.com;";
    }
    
    # Set client max body size to allow for larger uploads
    client_max_body_size 5M;
    
    # Optimize for caching static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sitaminter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

After running this command, Certbot will update your Nginx configuration to handle HTTPS.

### 4. Set Up Automatic Certificate Renewal

Certbot installs a timer and service that will renew your certificates automatically. Verify it's active:

```bash
sudo systemctl status certbot.timer
```

## Application Monitoring

### 1. Monitor Application Logs

```bash
pm2 logs sitaminter
```

### 2. Set Up Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Monitor Application Status

```bash
pm2 monit
```

### 4. Set Up System Monitoring (Optional)

Install Netdata for real-time system monitoring:

```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Access the dashboard at `http://your-server-ip:19999`.

## Backup Strategy

### 1. Database Backups

Create a backup script:

```bash
nano /home/sitaminter/backup.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/home/sitaminter/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U sitaminter_user -h localhost sitaminter > $BACKUP_DIR/sitaminter_db_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/sitaminter_db_$TIMESTAMP.sql

# Remove backups older than 7 days
find $BACKUP_DIR -name "sitaminter_db_*.sql.gz" -type f -mtime +7 -delete
```

Make the script executable:

```bash
chmod +x /home/sitaminter/backup.sh
```

Set up a cron job to run the backup:

```bash
crontab -e
```

Add:

```
0 2 * * * /home/sitaminter/backup.sh
```

### 2. Application Backup

Create a script for application backups:

```bash
nano /home/sitaminter/app-backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/sitaminter/backups/app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Application backup
cd /var/www
tar -czf $BACKUP_DIR/sitaminter_app_$TIMESTAMP.tar.gz sitaminter

# Remove backups older than 7 days
find $BACKUP_DIR -name "sitaminter_app_*.tar.gz" -type f -mtime +7 -delete
```

Make executable and schedule:

```bash
chmod +x /home/sitaminter/app-backup.sh
```

Add to cron (weekly backup):

```
0 3 * * 0 /home/sitaminter/app-backup.sh
```

## Security Best Practices

### 1. Keep Systems Updated

```bash
sudo apt update && sudo apt upgrade -y
```

Set up automatic security updates:

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Configure Fail2Ban

```bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Add configuration:

```ini
[sshd]
enabled = true
port = [your-ssh-port]
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
```

Restart fail2ban:

```bash
sudo systemctl restart fail2ban
```

### 3. Enhance Nginx Security

Create a file with stronger SSL parameters:

```bash
sudo nano /etc/nginx/snippets/ssl-params.conf
```

Add:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

Include this file in your site's configuration:

```bash
sudo nano /etc/nginx/sites-available/sitaminter
```

Add to the server block after SSL is set up:

```nginx
include snippets/ssl-params.conf;
```

### 4. Secure PostgreSQL

Modify PostgreSQL authentication:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure local access is properly restricted:

```
# "local" is for Unix domain socket connections only
local   all             all                                     peer
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
```

### 5. Implement File System Integrity Monitoring

Install AIDE:

```bash
sudo apt install aide
sudo aideinit
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

Create a cron job to run regular checks:

```bash
echo "0 3 * * * /usr/bin/aide.wrapper --check" | sudo tee -a /etc/crontab
```

## Troubleshooting

### Connection Issues

- **Problem**: Cannot connect to server
  - **Solution**: Check firewall settings: `sudo ufw status`
  
- **Problem**: Cannot connect to PostgreSQL
  - **Solution**: Verify PostgreSQL is running: `sudo systemctl status postgresql`
  - Check database configuration: `sudo nano /etc/postgresql/14/main/postgresql.conf`

### Application Startup Problems

- **Problem**: Application won't start
  - **Solution**: Check logs: `pm2 logs sitaminter`
  - Verify environment variables: `cat .env`
  - Check if port is in use: `sudo lsof -i :5000`

- **Problem**: Database migration errors
  - **Solution**: Run migration manually: `npm run db:push -- --verbose`
  - Check database connection: `psql -U sitaminter_user -h localhost sitaminter`

### SSL Certificate Issues

- **Problem**: Certificate renewal failures
  - **Solution**: Test renewal: `sudo certbot renew --dry-run`
  - Check certbot logs: `sudo cat /var/log/letsencrypt/letsencrypt.log`

- **Problem**: Invalid certificate errors
  - **Solution**: Verify certificate: `sudo certbot certificates`
  - Check Nginx configuration: `sudo nginx -t`

### Performance Problems

- **Problem**: Slow response times
  - **Solution**: Check system resources: `htop`
  - Optimize Nginx configuration: Enable gzip compression
  
- **Problem**: Memory issues
  - **Solution**: Check memory usage: `free -m`
  - Adjust PM2 memory limit: Edit ecosystem.config.js

## Maintaining Your Installation

### Updating the Application

1. Stop the application:
   ```bash
   pm2 stop sitaminter
   ```

2. Pull latest changes:
   ```bash
   cd /var/www/sitaminter
   git pull
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Restart the application:
   ```bash
   pm2 restart sitaminter
   ```

### Regular Maintenance Tasks

1. **Daily Checks**:
   - Monitor application logs
   - Check system resource usage

2. **Weekly Tasks**:
   - Apply security updates
   - Verify backup integrity
   - Check disk space usage

3. **Monthly Tasks**:
   - Database optimization
   - Review security logs
   - Test disaster recovery procedures

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

This guide provides a comprehensive approach to deploying the SiTa Minter application on a VPS. Adjust the configurations according to your specific requirements and server environment. For any issues or questions, consult the application's support resources or contact your server administrator.