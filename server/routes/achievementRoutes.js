const express = require('express');
const router = express.Router();

// 获取成就列表
router.get('/get', (req, res) => {
  try {
    const { userId } = req.query;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const allAchievements = require('../data/achievements.json');
    
    res.json({
      success: true,
      allAchievements,
      completedAchievements: user.achievements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 领取成就奖励
router.post('/claim', (req, res) => {
  try {
    const { userId, achievementId } = req.body;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const achievement = user.achievements.find(a => a.id === achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: '成就不存在'
      });
    }
    
    if (achievement.claimed) {
      return res.status(400).json({
        success: false,
        message: '奖励已领取'
      });
    }
    
    // 发放奖励
    const allAchievements = require('../data/achievements.json');
    const achievementConfig = allAchievements.find(a => a.id === achievementId);
    let levelUpInfo = { leveled: false };
    
    if (achievementConfig && achievementConfig.rewards) {
      if (achievementConfig.rewards.exp) {
        levelUpInfo = req.db.addExperience(userId, achievementConfig.rewards.exp);
      }
      if (achievementConfig.rewards.attributePoints) {
        user.attributePoints += achievementConfig.rewards.attributePoints;
      }
    }
    
    achievement.claimed = true;
    achievement.claimedAt = Date.now();
    
    // 获取最新的用户数据
    const finalUser = req.db.findUserById(userId);
    
    // 更新排行榜
    req.db.updateRankings();
    
    res.json({
      success: true,
      user: req.db.getSafeUser(finalUser),
      rewards: achievementConfig.rewards,
      ...levelUpInfo,
      message: '奖励已领取'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

