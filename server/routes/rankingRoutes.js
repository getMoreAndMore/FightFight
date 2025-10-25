const express = require('express');
const router = express.Router();

// 获取排行榜
router.get('/get', async (req, res) => {
  try {
    const { userId, type } = req.query;
    
    // 更新排行榜
    await req.db.updateRankings();
    
    // 使用MySQL版本的方法获取排行榜
    const ranking = await req.db.getGlobalRankings(100);
    
    // 查找用户排名
    let userRank = null;
    if (userId) {
      const index = ranking.findIndex(entry => entry.user_id === userId || entry.userId === userId);
      if (index !== -1) {
        userRank = {
          rank: ranking[index].rank || index + 1,
          userId: ranking[index].user_id || ranking[index].userId,
          username: ranking[index].username,
          level: ranking[index].level,
          power: ranking[index].power
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
router.get('/weekly', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 这里可以实现周排行榜逻辑
    // 简化版本返回全局排行榜
    await req.db.updateRankings();
    
    // 使用MySQL版本的方法
    const rankings = await req.db.getGlobalRankings(100);
    
    // 格式化为旧格式兼容
    const ranking = rankings;
    
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

