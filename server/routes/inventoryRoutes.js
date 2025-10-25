const express = require('express');
const router = express.Router();

// 获取背包
router.get('/get', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      inventory: user.inventory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 使用物品
router.post('/use', async (req, res) => {
  try {
    const { userId, instanceId } = req.body;
    
    const result = req.db.useItem(userId, instanceId);
    
    res.json({
      success: true,
      ...result,
      message: '物品使用成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 丢弃物品
router.post('/drop', async (req, res) => {
  try {
    const { userId, instanceId, quantity } = req.body;
    
    const user = req.db.removeItem(userId, instanceId, quantity || 1);
    
    res.json({
      success: true,
      user,
      message: '物品已丢弃'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 整理背包
router.post('/sort', async (req, res) => {
  try {
    const { userId, sortBy } = req.body;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 排序逻辑
    if (sortBy === 'type') {
      user.inventory.items.sort((a, b) => a.type.localeCompare(b.type));
    } else if (sortBy === 'quality') {
      const qualityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
      user.inventory.items.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));
    } else if (sortBy === 'name') {
      user.inventory.items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    res.json({
      success: true,
      inventory: user.inventory,
      message: '背包整理完成'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

