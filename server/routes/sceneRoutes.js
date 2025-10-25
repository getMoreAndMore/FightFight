const express = require('express');
const router = express.Router();

// 获取场景列表
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const allScenes = require('../data/scenes.json');
    
    res.json({
      success: true,
      allScenes,
      unlockedScenes: user.scenes.unlocked,
      currentScene: user.scenes.current
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 进入场景
router.post('/enter', async (req, res) => {
  try {
    const { userId, sceneId } = req.body;
    
    const user = req.db.enterScene(userId, sceneId);
    
    res.json({
      success: true,
      user,
      message: '进入场景成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 完成小游戏
router.post('/complete', async (req, res) => {
  try {
    const { userId, sceneId, minigameId, score } = req.body;
    
    let user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 根据得分计算奖励
    const baseExp = 50;
    const bonusExp = Math.floor(score / 10);
    const totalExp = baseExp + bonusExp;
    
    // 添加经验
    const levelUpInfo = await req.db.addExperienceAsync(userId, totalExp);
    
    // 随机掉落道具
    const rewards = {
      exp: totalExp,
      items: []
    };
    
    // 30% 概率掉落道具
    if (Math.random() < 0.3) {
      const randomItem = {
        id: `item_${Date.now()}`,
        name: '神秘宝箱',
        type: 'consumable',
        quality: 'uncommon',
        stackable: false,
        effects: { exp: 100 }
      };
      
      req.db.addItem(userId, randomItem);
      rewards.items.push(randomItem);
    }
    
    // 更新统计数据
    user.stats.minigamesCompleted = (user.stats.minigamesCompleted || 0) + 1;
    
    // 获取最新的用户数据
    const finalUser = await req.db.findUserByIdAsync(userId);
    
    // 更新排行榜
    await req.db.updateRankings();
    
    res.json({
      success: true,
      user: req.db.getSafeUser(finalUser),
      rewards,
      ...levelUpInfo,
      message: '小游戏完成！'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

