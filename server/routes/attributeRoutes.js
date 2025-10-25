const express = require('express');
const router = express.Router();

// 添加属性点
router.post('/add', (req, res) => {
  try {
    const { userId, attribute, points } = req.body;
    
    if (!userId || !attribute || !points) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }
    
    const validAttributes = ['strength', 'agility', 'intelligence', 'endurance'];
    if (!validAttributes.includes(attribute)) {
      return res.status(400).json({
        success: false,
        message: '无效的属性类型'
      });
    }
    
    const user = req.db.addAttribute(userId, attribute, points);
    
    // 更新排行榜
    req.db.updateRankings();
    
    res.json({
      success: true,
      user,
      message: '属性添加成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 重置属性点（需要消耗道具或货币）
router.post('/reset', (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 计算总属性点
    const totalPoints = Object.values(user.attributes).reduce((sum, val) => sum + val, 0);
    const basePoints = 40; // 4个属性 * 初始10点
    const addedPoints = totalPoints - basePoints;
    
    // 重置属性
    user.attributes = {
      strength: 10,
      agility: 10,
      intelligence: 10,
      endurance: 10
    };
    
    user.attributePoints += addedPoints;
    user.power = req.db.calculatePower(user);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '属性重置成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

