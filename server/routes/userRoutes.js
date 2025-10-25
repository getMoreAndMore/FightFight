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
    
    const user = await req.db.createUser(username, password, email);
    
    res.json({
      success: true,
      user,
      message: '注册成功'
    });
  } catch (error) {
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
    
    const user = req.db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const isValid = await req.db.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const sessionId = req.db.createSession(user.id, null);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      sessionId,
      message: '登录成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 获取个人信息
router.get('/profile', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }
    
    const user = req.db.findUserById(userId);
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
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 每日签到
router.post('/checkin', (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const now = Date.now();
    const lastCheckin = user.dailyCheckin.lastCheckin;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // 检查是否已签到
    if (now - lastCheckin < oneDayMs) {
      return res.status(400).json({
        success: false,
        message: '今日已签到'
      });
    }
    
    // 连续签到检查
    if (now - lastCheckin < 2 * oneDayMs) {
      user.dailyCheckin.consecutiveDays++;
    } else {
      user.dailyCheckin.consecutiveDays = 1;
    }
    
    user.dailyCheckin.lastCheckin = now;
    
    // 签到奖励
    const rewards = {
      exp: 50 + user.dailyCheckin.consecutiveDays * 10,
      attributePoints: Math.floor(user.dailyCheckin.consecutiveDays / 7)
    };
    
    req.db.addExperience(userId, rewards.exp);
    if (rewards.attributePoints > 0) {
      user.attributePoints += rewards.attributePoints;
    }
    
    res.json({
      success: true,
      consecutiveDays: user.dailyCheckin.consecutiveDays,
      rewards,
      message: `连续签到 ${user.dailyCheckin.consecutiveDays} 天！`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

