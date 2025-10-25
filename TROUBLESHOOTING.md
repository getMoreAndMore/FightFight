# 🔧 故障排除指南

## 常见错误和解决方案

### 1. ❌ 500 Internal Server Error + "Unexpected end of JSON input"

#### 症状
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
NetworkManager.js:36 请求错误: SyntaxError: Unexpected end of JSON input
```

#### 原因
1. 数据库未连接或连接失败
2. 数据库表未创建
3. .env配置错误
4. 服务器在数据库初始化完成前就接收了请求

#### 解决步骤

**步骤1: 检查配置**
```bash
npm run check
```

**步骤2: 确认.env文件存在并配置正确**

打开 `.env` 文件，确认以下配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password  # 改成你的MySQL密码
DB_DATABASE=fightfight_game
```

**步骤3: 检查MySQL服务**
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl status mysql

# macOS
brew services list
```

**步骤4: 创建数据库**
```bash
npm run db:setup
```

应该看到：
```
✅ 连接成功!
✅ 数据库 "fightfight_game" 创建成功!
✅ 数据表创建成功!
✅ 成功创建 12 个表
```

**步骤5: 测试数据库**
```bash
npm run db:test
```

应该看到所有测试通过：
```
🧪 开始测试数据库...
✅ 数据库连接成功!
✅ DatabaseService初始化成功
✅ 用户创建成功
...
🎉 所有测试通过！
```

**步骤6: 重启服务器**
```bash
# 停止当前服务器 (Ctrl + C)
# 重新启动
npm run dev:server
```

应该看到：
```
🔄 正在初始化服务...
⏳ 等待数据库连接...
✅ 数据库连接成功!
✅ DatabaseService (MySQL) 初始化完成
✅ 数据库连接完成
==================================================
🚀 服务器运行在端口 3001
📡 Socket.io 已就绪
🎮 游戏服务器启动成功！
📍 访问: http://localhost:3001
==================================================
```

---

### 2. ❌ 数据库连接被拒绝

#### 症状
```
Error: connect ECONNREFUSED 127.0.0.1:3306
❌ 数据库连接失败
```

#### 解决方法

**A. 检查MySQL服务是否启动**

Windows:
```bash
net start MySQL80
```

Linux:
```bash
sudo systemctl start mysql
```

macOS:
```bash
brew services start mysql
```

**B. 检查端口是否正确**

MySQL默认端口是3306。检查 `.env` 中的 `DB_PORT` 配置。

**C. 检查防火墙**

确保3306端口未被防火墙阻止。

---

### 3. ❌ 用户名或密码错误

#### 症状
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

#### 解决方法

**方法1: 重置MySQL密码**

Windows:
```sql
-- 以管理员身份运行MySQL
mysql -u root

-- 修改密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

**方法2: 创建新用户**

```sql
-- 登录MySQL
mysql -u root -p

-- 创建专用用户
CREATE USER 'fightfight'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON fightfight_game.* TO 'fightfight'@'localhost';
FLUSH PRIVILEGES;
```

然后修改 `.env`:
```env
DB_USER=fightfight
DB_PASSWORD=strong_password
```

---

### 4. ❌ 数据库不存在

#### 症状
```
Error: ER_BAD_DB_ERROR: Unknown database 'fightfight_game'
```

#### 解决方法

运行数据库安装脚本：
```bash
npm run db:setup
```

或手动创建：
```sql
mysql -u root -p
CREATE DATABASE fightfight_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 5. ❌ 端口被占用

#### 症状
```
Error: listen EADDRINUSE: address already in use :::3001
```

#### 解决方法

**方法1: 修改端口**

编辑 `.env`:
```env
PORT=3002  # 改为其他端口
```

**方法2: 关闭占用端口的进程**

Windows:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程 (替换PID)
taskkill /F /PID <PID>
```

Linux/macOS:
```bash
# 查找并结束进程
lsof -ti:3001 | xargs kill -9
```

---

### 6. ❌ 依赖包缺失

#### 症状
```
Error: Cannot find module 'mysql2'
Error: Cannot find module 'dotenv'
```

#### 解决方法

```bash
# 删除旧依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

### 7. ❌ 表不存在

#### 症状
```
Error: ER_NO_SUCH_TABLE: Table 'fightfight_game.users' doesn't exist
```

#### 解决方法

重新运行建表脚本：
```bash
npm run db:setup
```

或手动执行：
```bash
mysql -u root -p fightfight_game < database/schema.sql
```

---

### 8. ❌ Socket.io 连接失败

#### 症状
前端显示"连接失败"或控制台显示 WebSocket 错误

#### 解决方法

1. 确认后端服务器正在运行
2. 检查防火墙设置
3. 清除浏览器缓存并刷新

---

### 9. ❌ 前端无法连接后端

#### 症状
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

#### 解决方法

1. 确认后端服务器已启动
2. 检查后端运行端口（默认3001）
3. 检查前端配置的API地址

如果使用不同端口，修改 `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 改为你的后端端口
        changeOrigin: true
      }
    }
  }
});
```

---

## 🔍 调试技巧

### 1. 查看详细日志

服务器端会输出详细的错误信息，注意查看：

```bash
npm run dev:server
```

### 2. 测试单个功能

```bash
# 测试数据库连接
npm run db:test

# 检查配置
npm run check
```

### 3. 使用浏览器开发者工具

1. 打开浏览器（F12）
2. 切换到 **Network** 标签
3. 查看失败的请求
4. 点击请求查看详细信息

### 4. 查看MySQL日志

Windows:
```
C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
```

Linux:
```bash
sudo tail -f /var/log/mysql/error.log
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. 查看完整的错误堆栈
2. 运行 `npm run check` 获取诊断信息
3. 运行 `npm run db:test` 测试数据库
4. 检查MySQL错误日志
5. 查看 `DATABASE_SETUP.md` 获取更多信息

---

## ✅ 健康检查清单

在报告问题前，请确认：

- [ ] MySQL服务已启动
- [ ] `.env` 文件存在且配置正确
- [ ] 运行了 `npm install`
- [ ] 运行了 `npm run db:setup`
- [ ] `npm run db:test` 全部通过
- [ ] 服务器启动无错误
- [ ] 防火墙允许3001和3306端口
- [ ] 浏览器控制台无错误

---

## 🚀 快速重置

如果一切混乱，完全重置：

```bash
# 1. 停止所有服务
Ctrl + C

# 2. 删除数据库
mysql -u root -p
DROP DATABASE IF EXISTS fightfight_game;
EXIT;

# 3. 重新安装
npm install
npm run db:setup
npm run db:test

# 4. 启动服务器
npm run dev:server
```

---

**🎉 祝你游戏顺利！**

