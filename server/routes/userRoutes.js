const express = require('express');
const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const { userId, sessionId } = await req.db.createUser(username, password, email);
    
    // 获取完整用户信息
    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      sessionId,
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    // 验证用户凭证
    const result = await req.db.validateCredentials(username, password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const { userId, sessionId } = result;
    
    // 获取完整用户信息
    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      sessionId,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 获取个人信息
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user)
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 每日签到
router.post('/checkin', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }
    
    const result = await req.db.dailyCheckin(userId);
    
    res.json({
      success: true,
      consecutiveDays: result.consecutiveDays,
      reward: result.reward,
      message: result.message
    });
  } catch (error) {
    console.error('签到错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

