# Deployment & Operations Guide

## 1. Environment Overview

The **MITRA Employability Portal** can be deployed locally for development, on traditional Linux VPS servers (Ubuntu 22.04 LTS), or containerized via Docker.

---

## 2. Local Setup Guide

1. Clone repository:
   ```bash
   git clone https://github.com/your-org/MITRA-Employability-Portal.git
   cd MITRA-Employability-Portal
   ```

2. Setup Backend:
   ```bash
   cd server
   npm install
   cp .env.example .env
   npm run seed:admin
   npm run dev
   ```

3. Setup Frontend:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## 3. Production Linux VPS Setup (PM2 + Nginx)

### Server Node.js Process Management (PM2)
```bash
cd /var/www/MITRA-Employability-Portal/server
npm install --production
npm run seed:admin
pm2 start server.js --name "mitra-backend"
pm2 save
pm2 startup
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name portal.mitra-employability.edu;

    location / {
        root /var/www/MITRA-Employability-Portal/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Docker Deployment

```bash
# Build and run container stack
docker-compose up -d --build

# View logs
docker-compose logs -f
```
