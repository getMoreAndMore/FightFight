const express = require('express');
const router = express.Router();

// 获取任务列表
router.get('/get', async (req, res) => {
  try {
    const { userId, type } = req.query;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    let quests = [];
    if (type === 'daily') {
      quests = user.quests.daily;
    } else if (type === 'weekly') {
      quests = user.quests.weekly;
    } else if (type === 'main') {
      quests = user.quests.main;
    } else if (type === 'side') {
      quests = user.quests.side;
    } else {
      quests = {
        daily: user.quests.daily,
        weekly: user.quests.weekly,
        main: user.quests.main,
        side: user.quests.side
      };
    }
    
    res.json({
      success: true,
      quests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 完成任务
router.post('/complete', async (req, res) => {
  try {
    const { userId, questId } = req.body;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查找任务
    let quest = null;
    let questType = null;
    
    for (const type of ['daily', 'weekly', 'main', 'side']) {
      const found = user.quests[type].find(q => q.id === questId);
      if (found) {
        quest = found;
        questType = type;
        break;
      }
    }
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    if (quest.completed) {
      return res.status(400).json({
        success: false,
        message: '任务已完成'
      });
    }
    
    // 检查完成条件
    if (!quest.progress || quest.progress < quest.requirement) {
      return res.status(400).json({
        success: false,
        message: '任务未完成'
      });
    }
    
    // 发放奖励
    const rewards = quest.rewards || {};
    let levelUpInfo = { leveled: false };
    
    if (rewards.exp) {
      levelUpInfo = await req.db.addExperienceAsync(userId, rewards.exp);
    }
    
    if (rewards.attributePoints) {
      user.attributePoints += rewards.attributePoints;
    }
    
    if (rewards.items) {
      for (const item of rewards.items) {
        req.db.addItem(userId, item);
      }
    }
    
    quest.completed = true;
    quest.completedAt = Date.now();
    
    // 获取最新的用户数据
    const finalUser = await req.db.findUserByIdAsync(userId);
    
    // 更新排行榜
    await req.db.updateRankings();
    
    res.json({
      success: true,
      user: req.db.getSafeUser(finalUser),
      rewards,
      ...levelUpInfo,
      message: '任务完成！'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 刷新每日任务
router.post('/refresh-daily', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await req.db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 生成每日任务
    const dailyQuests = [
      {
        id: `daily_1_${Date.now()}`,
        name: '完成3次小游戏',
        type: 'daily',
        requirement: 3,
        progress: 0,
        rewards: { exp: 100, attributePoints: 1 },
        completed: false
      },
      {
        id: `daily_2_${Date.now()}`,
        name: '进行1次PVP对战',
        type: 'daily',
        requirement: 1,
        progress: 0,
        rewards: { exp: 150 },
        completed: false
      },
      {
        id: `daily_3_${Date.now()}`,
        name: '收集5个道具',
        type: 'daily',
        requirement: 5,
        progress: 0,
        rewards: { exp: 80 },
        completed: false
      }
    ];
    
    user.quests.daily = dailyQuests;
    
    res.json({
      success: true,
      quests: dailyQuests,
      message: '每日任务已刷新'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

