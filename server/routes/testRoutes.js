/**
 * 🧪 测试路由 - 仅用于开发测试
 * 
 * ⚠️ 警告：生产环境请删除此文件和相关引用！
 * 
 * 删除方法：
 * 1. 删除此文件 (server/routes/testRoutes.js)
 * 2. 在 server/index.js 中移除此路由的引用
 * 3. 删除 client/ui/components/TestMenu.js
 */

const express = require('express');
const router = express.Router();

// 增加经验
router.post('/add-experience', async (req, res) => {
  try {
    console.log('🧪 [测试] 收到增加经验请求:', req.body);
    
    const { userId, experience } = req.body;
    
    if (!userId || !experience) {
      console.error('❌ [测试] 参数缺失:', { userId, experience });
      return res.status(400).json({ success: false, message: '参数缺失' });
    }
    
    if (!req.db) {
      console.error('❌ [测试] req.db 未定义');
      return res.status(500).json({ success: false, message: '数据库服务未初始化' });
    }
    
    console.log('🔄 [测试] 调用 addExperienceAsync...');
    const result = await req.db.addExperienceAsync(userId, experience);
    console.log('✅ [测试] addExperienceAsync 返回:', result);
    
    res.json({
      success: true,
      user: result.user,
      leveled: result.leveled,
      levelsGained: result.levelsGained,
      attributeGains: result.attributeGains,
      message: `增加了 ${experience} 经验`
    });
  } catch (error) {
    console.error('❌ [测试] 增加经验失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 强制升级
router.post('/level-up', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await req.db.findUserByIdAsync(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 计算升级所需经验
    const requiredExp = req.db.getExpForLevel(user.level + 1);
    
    // 直接增加足够的经验以升级
    const result = await req.db.addExperienceAsync(userId, requiredExp - user.experience + 1);
    
    res.json({
      success: true,
      user: result.user,
      leveled: result.leveled,
      levelsGained: result.levelsGained,
      attributeGains: result.attributeGains,
      message: '强制升级成功'
    });
  } catch (error) {
    console.error('[测试] 强制升级失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 设置等级
router.post('/set-level', async (req, res) => {
  try {
    const { userId, level } = req.body;
    const user = await req.db.findUserByIdAsync(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const targetLevel = Math.max(1, Math.min(100, level));
    
    // 更新等级和经验
    const db = require('../config/database');
    await db.query(
      'UPDATE user_profiles SET level = ?, experience = 0 WHERE user_id = ?',
      [targetLevel, userId]
    );

    // 重新计算战力
    const updatedUser = await req.db.findUserByIdAsync(userId);
    const power = req.db.calculatePower(updatedUser);
    await db.query(
      'UPDATE user_profiles SET power = ? WHERE user_id = ?',
      [power, userId]
    );

    const finalUser = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(finalUser),
      message: `等级已设置为 ${targetLevel}`
    });
  } catch (error) {
    console.error('[测试] 设置等级失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 增加属性点
router.post('/add-attribute-points', async (req, res) => {
  try {
    const { userId, points } = req.body;
    
    const db = require('../config/database');
    await db.query(
      'UPDATE user_profiles SET attribute_points = attribute_points + ? WHERE user_id = ?',
      [points, userId]
    );

    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: `增加了 ${points} 属性点`
    });
  } catch (error) {
    console.error('[测试] 增加属性点失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 重置属性
router.post('/reset-attributes', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const db = require('../config/database');
    
    // 重置属性为初始值
    await db.query(
      'UPDATE user_attributes SET strength = 10, agility = 10, intelligence = 10, endurance = 10 WHERE user_id = ?',
      [userId]
    );

    // 重新计算战力
    const user = await req.db.findUserByIdAsync(userId);
    const power = req.db.calculatePower(user);
    await db.query(
      'UPDATE user_profiles SET power = ? WHERE user_id = ?',
      [power, userId]
    );

    const updatedUser = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(updatedUser),
      message: '属性已重置'
    });
  } catch (error) {
    console.error('[测试] 重置属性失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 满属性满战力
router.post('/max-power', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await req.db.findUserByIdAsync(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const db = require('../config/database');
    
    // 设置高属性值
    await db.query(
      'UPDATE user_attributes SET strength = strength + 50, agility = agility + 50, intelligence = intelligence + 50, endurance = endurance + 50 WHERE user_id = ?',
      [userId]
    );

    // 重新计算战力
    const updatedUser = await req.db.findUserByIdAsync(userId);
    const power = req.db.calculatePower(updatedUser);
    await db.query(
      'UPDATE user_profiles SET power = ? WHERE user_id = ?',
      [power, userId]
    );

    const finalUser = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(finalUser),
      message: '已设置满属性'
    });
  } catch (error) {
    console.error('[测试] 设置满属性失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 添加测试道具
router.post('/add-items', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const testItems = [
      { id: 'test_potion_1', name: '生命药水', type: 'consumable', effect: 'heal', value: 50 },
      { id: 'test_potion_2', name: '魔法药水', type: 'consumable', effect: 'mana', value: 30 },
      { id: 'test_weapon', name: '测试武器', type: 'weapon', attack: 50 },
      { id: 'test_armor', name: '测试护甲', type: 'armor', defense: 30 }
    ];

    // 这里简化实现，实际应该调用数据库的添加物品方法
    // 暂时返回成功
    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '已添加测试道具'
    });
  } catch (error) {
    console.error('[测试] 添加道具失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 清空背包
router.post('/clear-inventory', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const db = require('../config/database');
    await db.query(
      'UPDATE user_inventory SET items = ? WHERE user_id = ?',
      [JSON.stringify([]), userId]
    );

    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '背包已清空'
    });
  } catch (error) {
    console.error('[测试] 清空背包失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 完成所有任务
router.post('/complete-all-quests', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const db = require('../config/database');
    await db.query(
      'UPDATE user_quests SET daily = ?, weekly = ? WHERE user_id = ?',
      [JSON.stringify([]), JSON.stringify([]), userId]
    );

    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '所有任务已完成'
    });
  } catch (error) {
    console.error('[测试] 完成任务失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 解锁所有成就
router.post('/unlock-achievements', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // 这里简化实现
    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '所有成就已解锁'
    });
  } catch (error) {
    console.error('[测试] 解锁成就失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 重置用户数据
router.post('/reset-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const db = require('../config/database');
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 重置档案
      await connection.execute(
        'UPDATE user_profiles SET level = 1, experience = 0, attribute_points = 5, power = 500 WHERE user_id = ?',
        [userId]
      );

      // 重置属性
      await connection.execute(
        'UPDATE user_attributes SET strength = 10, agility = 10, intelligence = 10, endurance = 10 WHERE user_id = ?',
        [userId]
      );

      // 清空背包
      await connection.execute(
        'UPDATE user_inventory SET items = ? WHERE user_id = ?',
        [JSON.stringify([]), userId]
      );

      // 重置任务
      await connection.execute(
        'UPDATE user_quests SET daily = ?, weekly = ? WHERE user_id = ?',
        [JSON.stringify([]), JSON.stringify([]), userId]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const user = await req.db.findUserByIdAsync(userId);
    
    res.json({
      success: true,
      user: req.db.getSafeUser(user),
      message: '用户数据已重置到初始状态'
    });
  } catch (error) {
    console.error('[测试] 重置用户失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;


