# 部署指南

本文档介绍如何将 FightFight RPG 游戏部署到生产环境。

## 目录
- [准备工作](#准备工作)
- [本地构建](#本地构建)
- [服务器部署](#服务器部署)
- [Docker 部署](#docker-部署)
- [性能优化](#性能优化)
- [监控与维护](#监控与维护)

---

## 准备工作

### 系统要求

**最低配置**：
- CPU: 1 核
- 内存: 512MB
- 硬盘: 1GB
- 操作系统: Linux/Windows/macOS

**推荐配置**（100+ 在线用户）：
- CPU: 2 核+
- 内存: 2GB+
- 硬盘: 5GB+
- 操作系统: Linux (Ubuntu 20.04+)

### 软件依赖

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- PM2（进程管理器，推荐）
- Nginx（反向代理，可选）

---

## 本地构建

### 1. 克隆代码

```bash
git clone <repository-url>
cd FightFight
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

创建 `.env` 文件：

```bash
PORT=3001
NODE_ENV=production
```

### 4. 构建前端

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 5. 测试运行

```bash
npm start
```

访问 `http://localhost:3001` 测试。

---

## 服务器部署

### 方案1: 使用 PM2

#### 安装 PM2

```bash
npm install -g pm2
```

#### 创建 PM2 配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'fightfight-rpg',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
```

#### 启动应用

```bash
# 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启
pm2 restart fightfight-rpg

# 停止
pm2 stop fightfight-rpg
```

#### 开机自启

```bash
pm2 startup
pm2 save
```

### 方案2: 使用 systemd (Linux)

创建 `/etc/systemd/system/fightfight.service`:

```ini
[Unit]
Description=FightFight RPG Game Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/fightfight
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable fightfight
sudo systemctl start fightfight
sudo systemctl status fightfight
```

### 使用 Nginx 反向代理

#### 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 配置 Nginx

创建 `/etc/nginx/sites-available/fightfight`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 静态文件
    location / {
        root /var/www/fightfight/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io 代理
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 日志
    access_log /var/log/nginx/fightfight_access.log;
    error_log /var/log/nginx/fightfight_error.log;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/fightfight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL 证书（HTTPS）

使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Docker 部署

### Dockerfile

创建 `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "server/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  fightfight:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

---

## 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 使用 CDN

将静态资源（JS、CSS、图片）托管到 CDN：

```javascript
// vite.config.js
export default defineConfig({
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'socket.io': ['socket.io-client']
        }
      }
    }
  }
});
```

### 3. 数据库优化

如果使用数据库，建议：
- 使用 Redis 缓存热数据
- 定期清理过期数据
- 使用索引优化查询

### 4. 负载均衡

使用多个服务器实例：

```nginx
upstream fightfight_backend {
    least_conn;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location /api {
        proxy_pass http://fightfight_backend;
    }
}
```

---

## 监控与维护

### 日志管理

使用 PM2 日志轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 监控指标

**关键指标**：
- CPU 使用率
- 内存使用率
- 在线用户数
- 响应时间
- 错误率

**推荐工具**：
- PM2 Plus (应用监控)
- Grafana + Prometheus (系统监控)
- Sentry (错误追踪)

### 备份策略

定期备份：
- 用户数据
- 游戏配置
- 日志文件

```bash
# 每日备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup_$DATE.tar.gz /var/www/fightfight/data
```

### 更新部署

零停机更新：

```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 构建
npm run build

# 重启（PM2 会平滑重启）
pm2 reload ecosystem.config.js
```

---

## 安全建议

1. **使用 HTTPS**
2. **限制 API 请求频率**
3. **定期更新依赖包**
4. **使用环境变量存储敏感信息**
5. **配置防火墙规则**
6. **定期备份数据**

---

## 故障排查

### 应用无法启动

1. 检查端口是否被占用
2. 查看日志文件
3. 验证环境变量
4. 检查文件权限

### Socket.io 连接失败

1. 检查 Nginx 配置
2. 验证 WebSocket 支持
3. 检查防火墙规则
4. 查看浏览器控制台错误

### 性能问题

1. 检查 CPU/内存使用
2. 优化数据库查询
3. 启用缓存
4. 增加服务器实例

---

## 技术支持

如有问题，请查看：
- [GitHub Issues](链接)
- [API 文档](./API.md)
- [游戏指南](./GAME_GUIDE.md)

