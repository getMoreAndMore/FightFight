const express = require('express');
const router = express.Router();

// 获取技能列表
router.get('/list', (req, res) => {
  try {
    const { userId } = req.query;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 返回所有可用技能和用户已解锁的技能
    const allSkills = require('../data/skills.json');
    
    res.json({
      success: true,
      allSkills,
      unlockedSkills: user.skills.unlocked,
      equippedSkills: user.skills.equipped
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 解锁技能
router.post('/unlock', (req, res) => {
  try {
    const { userId, skillId } = req.body;
    
    const user = req.db.unlockSkill(userId, skillId);
    
    res.json({
      success: true,
      user,
      message: '技能解锁成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 装备技能
router.post('/equip', (req, res) => {
  try {
    const { userId, skillId, slotIndex } = req.body;
    
    if (slotIndex === undefined || slotIndex === null) {
      return res.status(400).json({
        success: false,
        message: '请指定技能槽位'
      });
    }
    
    const user = req.db.equipSkill(userId, skillId, slotIndex);
    
    res.json({
      success: true,
      user,
      message: '技能装备成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 卸下技能
router.post('/unequip', (req, res) => {
  try {
    const { userId, slotIndex } = req.body;
    
    const user = req.db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (slotIndex < 0 || slotIndex >= user.skills.equipped.length) {
      return res.status(400).json({
        success: false,
        message: '无效的技能槽位'
      });
    }
    
    user.skills.equipped[slotIndex] = null;
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '技能已卸下'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

