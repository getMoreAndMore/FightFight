const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// 导入路由
const userRoutes = require('./routes/userRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const skillRoutes = require('./routes/skillRoutes');
const sceneRoutes = require('./routes/sceneRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const questRoutes = require('./routes/questRoutes');

// 导入服务
const SocketService = require('./services/SocketService');
const DatabaseService = require('./services/DatabaseService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// 初始化并启动服务器
async function startServer() {
  try {
    console.log('🔄 正在初始化服务...');
    
    // 初始化数据库服务
    const db = new DatabaseService();
    
    // 等待数据库连接完成
    console.log('⏳ 等待数据库连接...');
    await db.waitForReady();
    console.log('✅ 数据库连接完成');
    
    const socketService = new SocketService(io, db);

    // 将服务添加到请求对象
    app.use((req, res, next) => {
      req.db = db;
      req.io = io;
      req.socketService = socketService;
      next();
    });

    // API 路由
    app.use('/api/user', userRoutes);
    app.use('/api/attribute', attributeRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/skill', skillRoutes);
    app.use('/api/scene', sceneRoutes);
    app.use('/api/ranking', rankingRoutes);
    app.use('/api/achievement', achievementRoutes);
    app.use('/api/quest', questRoutes);

    // 健康检查
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 生产环境路由
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
      });
    }

    // Socket.io 连接处理
    socketService.initialize();

    // 错误处理
    app.use((err, req, res, next) => {
      console.error('❌ 服务器错误:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message || '服务器错误' 
      });
    });

    const PORT = process.env.PORT || 3001;

    server.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 Socket.io 已就绪`);
      console.log(`🎮 游戏服务器启动成功！`);
      console.log(`📍 访问: http://localhost:${PORT}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

