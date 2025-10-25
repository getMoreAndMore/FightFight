const express = require('express');
const router = express.Router();

// 获取排行榜
router.get('/get', (req, res) => {
  try {
    const { userId, type } = req.query;
    
    // 更新排行榜
    req.db.updateRankings();
    
    const ranking = req.db.getRanking(userId, type || 'global');
    
    // 查找用户排名
    let userRank = null;
    if (userId) {
      const index = ranking.findIndex(entry => entry.userId === userId);
      if (index !== -1) {
        userRank = {
          rank: index + 1,
          ...ranking[index]
        };
      }
    }
    
    res.json({
      success: true,
      ranking,
      userRank,
      type: type || 'global'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 获取周排行榜
router.get('/weekly', (req, res) => {
  try {
    const { userId } = req.query;
    
    // 这里可以实现周排行榜逻辑
    // 简化版本返回全局排行榜
    req.db.updateRankings();
    const ranking = req.db.getRanking(userId, 'global');
    
    res.json({
      success: true,
      ranking,
      period: 'weekly'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

