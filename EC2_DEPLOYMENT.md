# EC2 Deployment Guide

## Prerequisites

1. **EC2 Instance Setup**
   - Launch an EC2 instance (t3.micro or higher recommended)
   - Use Ubuntu 22.04 LTS AMI
   - Security group rules:
     - Port 22 (SSH) - for your IP
     - Port 80 (HTTP) - for public access
     - Port 443 (HTTPS) - for public access (if using SSL)

2. **Install Required Tools**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y docker.io docker-compose git curl
   sudo usermod -aG docker $USER
   newgrp docker
   ```

## Deployment Steps

1. **Clone your repository**
   ```bash
   git clone https://your-repo-url.git
   cd sqs_demo
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your actual AWS credentials and configuration
   nano .env
   ```

3. **Build and start services**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Verify services are running**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
PORT=3000
NODE_ENV=production
```

## Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# Remove everything
docker-compose down -v

# Update and redeploy
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Health Checks

Both services have health checks configured:
- Backend: `http://localhost:3000/health` (every 10s)
- Frontend: `http://localhost/` (every 10s)

If a service fails health checks, it will automatically restart.

## SSL/HTTPS Setup (Optional)

Install Certbot for free SSL certificates:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use SSL
```

## Monitoring & Logs

```bash
# View container logs
docker-compose logs backend
docker-compose logs frontend

# Real-time logs
docker-compose logs -f

# Check resource usage
docker stats
```

## Troubleshooting

### Backend won't start
- Check logs: `docker-compose logs backend`
- Verify AWS credentials in `.env`
- Check SQS queue names and permissions

### Frontend returns 502
- Ensure backend is healthy: `docker-compose ps`
- Check backend logs for errors
- Verify CORS settings in backend

### Port already in use
```bash
# Find process using port 80 or 3000
sudo lsof -i :80
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

## Backup & Disaster Recovery

```bash
# Backup images and volumes
docker-compose down
tar -czf backup.tar.gz .

# Restore
tar -xzf backup.tar.gz
docker-compose up -d
```

## Auto-restart on EC2 reboot

Services are configured with `restart: unless-stopped`, so they will automatically restart if:
- The docker daemon restarts
- The EC2 instance reboots

To ensure docker starts on boot:
```bash
sudo systemctl enable docker
```
